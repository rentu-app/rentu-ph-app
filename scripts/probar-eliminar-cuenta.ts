/**
 * Prueba de extremo a extremo de "Eliminar mi cuenta" con datos DESECHABLES:
 * crea sus propios usuarios y copropiedades (correos únicos por ejecución),
 * ejecuta `eliminarCuentaAdministrador`, comprueba el resultado, verifica que
 * nada más cambió (incluida la demo) y limpia lo que creó.
 *
 * Uso:  pnpm tsx scripts/probar-eliminar-cuenta.ts
 *
 * Escribe en la base solo filas que él mismo crea (y las borra al final).
 */
import { existsSync } from "node:fs";
import { EstadoCuenta, RolUsuario } from "@prisma/client";

for (const archivo of [".env", ".env.local"]) {
  if (existsSync(archivo)) process.loadEnvFile(archivo);
}

import { prisma } from "../src/lib/prisma";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { hashPassword } from "../src/lib/password";
import { EMAIL_DEMO_ADMIN, esCuentaDemo } from "../src/lib/demo";
import { eliminarCuentaAdministrador } from "../src/lib/eliminar-cuenta";

let fallos = 0;
function comprobar(nombre: string, ok: boolean, detalle = "") {
  if (!ok) fallos++;
  console.log(`${ok ? "✓" : "✗"} ${nombre}${detalle ? ` — ${detalle}` : ""}`);
}

async function main() {
  const auth = createSupabaseAdminClient().auth.admin;
  const etiqueta = `prueba-elim-${Date.now()}`;
  const emailA = `${etiqueta}-a@example.com`;
  const emailB = `${etiqueta}-b@example.com`;
  const password = `Pr!${etiqueta}`;
  const hash = hashPassword(password);

  const creados = { usuarios: [] as string[], copropiedades: [] as string[], auth: [] as string[] };

  // Foto de "todo lo demás" antes de empezar (la demo incluida).
  const foto = async () => {
    const [copropiedades, inmuebles, cuentas, usuarios, demo] = await Promise.all([
      prisma.copropiedad.count({ where: { deletedAt: null, id: { notIn: creados.copropiedades } } }),
      prisma.inmueble.count({ where: { deletedAt: null, copropiedadId: { notIn: creados.copropiedades } } }),
      prisma.cuentaDeCobro.count({
        where: { deletedAt: null, inmueble: { copropiedadId: { notIn: creados.copropiedades } } },
      }),
      prisma.usuario.count({ where: { deletedAt: null, id: { notIn: creados.usuarios } } }),
      prisma.usuario.findFirst({
        where: { email: EMAIL_DEMO_ADMIN, deletedAt: null },
        select: { id: true, updatedAt: true },
      }),
    ]);
    return JSON.stringify({ copropiedades, inmuebles, cuentas, usuarios, demo });
  };

  try {
    const [{ data: a, error: errA }, { data: b, error: errB }] = await Promise.all([
      auth.createUser({ email: emailA, password, email_confirm: true }),
      auth.createUser({ email: emailB, password, email_confirm: true }),
    ]);
    if (errA || errB || !a.user || !b.user) throw new Error(`createUser: ${errA?.message ?? errB?.message}`);
    creados.auth.push(a.user.id, b.user.id);

    const usuarioA = await prisma.usuario.create({
      data: { nombre: "Prueba A", email: emailA, passwordHash: hash, rol: RolUsuario.ADMINISTRADOR },
    });
    const usuarioB = await prisma.usuario.create({
      data: { nombre: "Prueba B", email: emailB, passwordHash: hash, rol: RolUsuario.ADMINISTRADOR },
    });
    creados.usuarios.push(usuarioA.id, usuarioB.id);

    const sola = await prisma.copropiedad.create({
      data: {
        nombre: `${etiqueta} sola`,
        direccion: "Calle 1",
        administradores: { create: { usuarioId: usuarioA.id } },
        zonasComunes: { create: { nombre: "Salón", aforo: 10 } },
        prestadores: { create: { nombre: "Aseo SAS" } },
        inmuebles: {
          create: [
            { identificador: "101", coeficiente: "0.5", torre: "" },
            { identificador: "102", coeficiente: "0.5", torre: "" },
          ],
        },
      },
      include: { inmuebles: true },
    });
    const compartida = await prisma.copropiedad.create({
      data: {
        nombre: `${etiqueta} compartida`,
        direccion: "Calle 2",
        administradores: { create: [{ usuarioId: usuarioA.id }, { usuarioId: usuarioB.id }] },
        zonasComunes: { create: { nombre: "BBQ", aforo: 5 } },
        inmuebles: { create: { identificador: "201", coeficiente: "1", torre: "" } },
      },
      include: { inmuebles: true },
    });
    creados.copropiedades.push(sola.id, compartida.id);
    await prisma.cuentaDeCobro.create({
      data: {
        inmuebleId: sola.inmuebles[0].id,
        periodo: "2026-10",
        montoAdministracion: "1000",
        totalAPagar: "1000",
        fechaLimitePago: new Date(),
        estado: EstadoCuenta.PENDIENTE,
      },
    });

    const antes = await foto();

    console.log("\n--- Eliminar cuenta (datos desechables) ---");
    const resultado = await eliminarCuentaAdministrador(usuarioA.id, a.user.id);

    const [uA, copSola, copComp, vinculos, inmSola, inmComp, cuentasSola, zonasSola, prestSola, zonasComp] =
      await Promise.all([
        prisma.usuario.findUniqueOrThrow({ where: { id: usuarioA.id } }),
        prisma.copropiedad.findUniqueOrThrow({ where: { id: sola.id } }),
        prisma.copropiedad.findUniqueOrThrow({ where: { id: compartida.id } }),
        prisma.administradorCopropiedad.findMany({ where: { copropiedadId: compartida.id } }),
        prisma.inmueble.findMany({ where: { copropiedadId: sola.id } }),
        prisma.inmueble.findMany({ where: { copropiedadId: compartida.id } }),
        prisma.cuentaDeCobro.findMany({ where: { inmueble: { copropiedadId: sola.id } } }),
        prisma.zonaComun.findMany({ where: { copropiedadId: sola.id } }),
        prisma.prestador.findMany({ where: { copropiedadId: sola.id } }),
        prisma.zonaComun.findMany({ where: { copropiedadId: compartida.id } }),
      ]);

    comprobar("usuario: soft delete + inactivo", !!uA.deletedAt && uA.activo === false);
    comprobar("usuario: correo liberado", uA.email === `deleted+${usuarioA.id}@rentu.invalid`, uA.email);
    comprobar("copropiedad única: soft delete", !!copSola.deletedAt);
    comprobar(
      "copropiedad única: sus datos también",
      inmSola.every((i) => i.deletedAt) &&
        cuentasSola.every((c) => c.deletedAt) &&
        zonasSola.every((z) => z.deletedAt) &&
        prestSola.every((p) => p.deletedAt),
      `${inmSola.length} unidades, ${cuentasSola.length} cuenta, ${zonasSola.length} zona`
    );
    comprobar("copropiedad compartida: sigue viva", !copComp.deletedAt);
    comprobar(
      "compartida: solo se desvinculó a A",
      vinculos.find((v) => v.usuarioId === usuarioA.id)?.deletedAt !== null &&
        vinculos.find((v) => v.usuarioId === usuarioB.id)?.deletedAt === null
    );
    comprobar(
      "compartida: sus unidades y zonas intactas",
      inmComp.every((i) => !i.deletedAt) && zonasComp.every((z) => !z.deletedAt)
    );
    comprobar(
      "resultado reportado",
      resultado.copropiedadesEliminadas.length === 1 && resultado.copropiedadesDesvinculadas.length === 1
    );

    const { data: authA } = await auth.getUserById(a.user.id);
    const { data: authB } = await auth.getUserById(b.user.id);
    comprobar("Supabase Auth: usuario A borrado", resultado.authEliminado && !authA.user);
    comprobar("Supabase Auth: usuario B intacto", !!authB.user);

    const despues = await foto();
    comprobar("nada más cambió (incluida la demo)", antes === despues);

    // Volver a registrarse con el mismo correo (Auth + tabla usuarios).
    const { data: nuevo, error: errNuevo } = await auth.createUser({
      email: emailA,
      password,
      email_confirm: true,
    });
    if (nuevo.user) creados.auth.push(nuevo.user.id);
    comprobar("re-registro: Auth acepta el mismo correo", !errNuevo, errNuevo?.message ?? "");
    const reRegistrado = await prisma.usuario
      .create({ data: { nombre: "Prueba A2", email: emailA, passwordHash: hash, rol: RolUsuario.ADMINISTRADOR } })
      .catch((e: Error) => e);
    comprobar("re-registro: tabla usuarios acepta el mismo correo", !(reRegistrado instanceof Error));
    if (!(reRegistrado instanceof Error)) creados.usuarios.push(reRegistrado.id);

    // El bloqueo de la demo vive en la Server Action (necesita sesión); aquí
    // se comprueba la regla que usa.
    comprobar("demo reconocida como bloqueada", esCuentaDemo(EMAIL_DEMO_ADMIN) && esCuentaDemo(" ADMIN.demo@example.com "));
  } finally {
    // Limpieza: solo lo que creó este script.
    const ids = creados.copropiedades;
    const inmuebles = { inmuebleId: { in: (await prisma.inmueble.findMany({ where: { copropiedadId: { in: ids } }, select: { id: true } })).map((i) => i.id) } };
    await prisma.cuentaDeCobro.deleteMany({ where: inmuebles });
    await prisma.inmueble.deleteMany({ where: { copropiedadId: { in: ids } } });
    await prisma.zonaComun.deleteMany({ where: { copropiedadId: { in: ids } } });
    await prisma.prestador.deleteMany({ where: { copropiedadId: { in: ids } } });
    await prisma.administradorCopropiedad.deleteMany({ where: { copropiedadId: { in: ids } } });
    await prisma.copropiedad.deleteMany({ where: { id: { in: ids } } });
    await prisma.usuario.deleteMany({ where: { id: { in: creados.usuarios } } });
    for (const id of creados.auth) await auth.deleteUser(id).catch(() => undefined);
    console.log("\n(limpieza: filas y usuarios de prueba eliminados)");
  }

  console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} comprobación(es) FALLARON`);
  await prisma.$disconnect();
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
