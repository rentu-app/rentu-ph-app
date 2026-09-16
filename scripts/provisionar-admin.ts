/**
 * Provisiona un administrador en Prisma y Supabase Auth.
 *
 * Uso:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NOMBRE=... pnpm provision:admin
 *
 * El usuario queda vinculado a todas las copropiedades activas. Las
 * credenciales se reciben por variables de entorno y nunca se guardan en git.
 */
import { RolUsuario, PrismaClient } from "@prisma/client";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { hashPassword } from "../src/lib/password";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const nombre = process.env.ADMIN_NOMBRE?.trim();

if (!email || !password || !nombre) {
  throw new Error("Define ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_NOMBRE.");
}

const adminEmail = email;
const adminPassword = password;
const adminNombre = nombre;

const prisma = new PrismaClient();

async function main() {
  const copropiedades = await prisma.copropiedad.findMany({
    where: { deletedAt: null },
    select: { id: true, nombre: true },
  });

  if (copropiedades.length === 0) {
    throw new Error("No hay copropiedades activas para asignar al administrador.");
  }

  const usuario = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      nombre: adminNombre,
      passwordHash: hashPassword(adminPassword),
      rol: RolUsuario.ADMINISTRADOR,
    },
    create: {
      email: adminEmail,
      nombre: adminNombre,
      passwordHash: hashPassword(adminPassword),
      rol: RolUsuario.ADMINISTRADOR,
    },
  });

  await prisma.administradorCopropiedad.createMany({
    data: copropiedades.map((copropiedad) => ({
      usuarioId: usuario.id,
      copropiedadId: copropiedad.id,
    })),
    skipDuplicates: true,
  });

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: listado, error: errorListado } = await supabaseAdmin.auth.admin.listUsers();

  if (errorListado) {
    throw new Error(`No se pudieron listar usuarios de Supabase Auth: ${errorListado.message}`);
  }

  const usuarioAuth = listado.users.find(
    (usuarioExistente) => usuarioExistente.email === adminEmail
  );

  if (usuarioAuth) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(usuarioAuth.id, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: { nombre: adminNombre },
    });

    if (error) throw new Error(`No se pudo actualizar Supabase Auth: ${error.message}`);
  } else {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { nombre: adminNombre },
    });

    if (error) throw new Error(`No se pudo crear Supabase Auth: ${error.message}`);
  }

  console.log(`Administrador ${adminEmail} listo.`);
  console.log(`Copropiedades asignadas: ${copropiedades.map(({ nombre }) => nombre).join(", ")}`);
}

main()
  .catch((error) => {
    console.error("Error provisionando administrador:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
