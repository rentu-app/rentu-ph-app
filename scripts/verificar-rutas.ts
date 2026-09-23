/**
 * Prueba de humo de rutas CON sesión: inicia sesión contra Supabase Auth,
 * arma la cookie que espera `@supabase/ssr` y pide cada página protegida para
 * comprobar que responde 200 y que su contenido clave está presente.
 *
 * Uso:
 *   pnpm build && pnpm start        (en otra terminal)
 *   BASE=http://localhost:3000 pnpm verify:rutas
 *
 * Requiere que el seed y `pnpm provision:auth` se hayan ejecutado (usa las
 * cuentas demo con la contraseña `Rentu2026*`).
 *
 * Un caso se espera "en rojo" a propósito y se rotula como tal: un residente
 * que entra a /dashboard debe ser redirigido a /portal.
 *
 * Una sección inexistente responde 200 (no 404) porque el límite de carga
 * (`loading.tsx`) ya envió las cabeceras antes de que la página llame a
 * `notFound()`; se verifica el contenido del not-found en su lugar.
 */
import { prisma } from "../src/lib/prisma";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PASSWORD = process.env.PASSWORD_DEMO ?? "Rentu2026*";

if (!SUPABASE_URL || !ANON) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Ejecuta con las variables de .env cargadas."
  );
}

const REF = new URL(SUPABASE_URL).hostname.split(".")[0];

/** `@supabase/ssr` guarda la sesión como `base64-<json>` y la parte en trozos. */
async function cookieDeSesion(email: string): Promise<string> {
  const respuesta = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON!, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });

  if (!respuesta.ok) {
    throw new Error(
      `Login falló para ${email}: ${respuesta.status} ${await respuesta.text()}`
    );
  }

  const sesion = await respuesta.json();
  const valor = `base64-${Buffer.from(JSON.stringify(sesion)).toString("base64")}`;
  const TAMANIO = 3180;
  const trozos: string[] = [];
  for (let i = 0; i < valor.length; i += TAMANIO) trozos.push(valor.slice(i, i + TAMANIO));

  return trozos.length === 1
    ? `sb-${REF}-auth-token=${trozos[0]}`
    : trozos.map((trozo, i) => `sb-${REF}-auth-token.${i}=${trozo}`).join("; ");
}

let fallos = 0;

async function revisar(ruta: string, cookie: string, esperados: string[]) {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    headers: { cookie, "User-Agent": "Mozilla/5.0" },
    redirect: "manual",
  });
  const html = respuesta.status === 200 ? await respuesta.text() : "";
  const faltantes = esperados.filter((texto) => !html.includes(texto));
  const ok = respuesta.status === 200 && faltantes.length === 0;
  if (!ok) fallos += 1;

  console.log(
    `${ok ? "✓" : "✗"} ${ruta.padEnd(52)} ${respuesta.status}` +
      (respuesta.status !== 200
        ? ` → ${respuesta.headers.get("location") ?? ""}`
        : faltantes.length > 0
          ? `  falta: ${faltantes.join(" | ")}`
          : "")
  );
}

async function main() {
  console.log(`\nBase: ${BASE}`);

  console.log("\n== Administrador ==");
  const admin = await cookieDeSesion("admin.demo@example.com");
  await revisar("/dashboard", admin, [
    "Altos de Salitre",
    "Cartera por antigüedad",
    "Distribución por torre",
    "Unidades para gestionar hoy",
    "Más de 90 días",
  ]);
  await revisar("/dashboard/cartera", admin, ["Torre C", "Apto C201", "Todas las torres"]);
  await revisar("/dashboard/cartera?torre=Torre+C&situacion=en-mora", admin, ["Apto C201"]);
  await revisar("/dashboard/reservas", admin, ["Salón social", "Agenda", "paz y salvo"]);
  await revisar("/dashboard/pqrs", admin, ["PQRS-DEMO-0001", "PQRS y convivencia"]);
  await revisar("/dashboard/residentes", admin, ["Marcela Aguirre", "Historial de vínculos"]);
  await revisar("/dashboard/prestadores", admin, [
    "Vigilancia Andina",
    "Órdenes de servicio",
    "Reparar fuga",
  ]);
  await revisar("/dashboard/documentos", admin, ["Copiloto Administrativo"]);

  const unidad = await prisma.inmueble.findFirstOrThrow({
    where: { identificador: "Apto C201" },
    select: { id: true },
  });
  await revisar(`/dashboard/cartera?unidad=${unidad.id}`, admin, [
    "Apto C201",
    "Bitácora de gestión",
    "Estado de cuenta",
    "Reservas bloqueadas",
    "Simulación MVP",
  ]);

  console.log("\n== Residente con cuotas vencidas (Apto A401) ==");
  const enMora = await cookieDeSesion("sandra.orozco@example.com");
  await revisar("/portal", enMora, ["Tienes cuotas vencidas", "Saldo pendiente"]);
  await revisar("/portal/cartera", enMora, ["Mi cartera", "Saldo pendiente"]);
  await revisar("/portal/reservas", enMora, [
    "Por ahora no puedes radicar reservas",
    "Ver mi cartera",
  ]);
  await revisar("/portal/pqrs", enMora, ["Radicar PQRS"]);

  console.log("\n== Residente a paz y salvo (Apto A101) ==");
  const alDia = await cookieDeSesion("marcela.aguirre@example.com");
  await revisar("/portal", alDia, ["Estás a paz y salvo"]);
  await revisar("/portal/reservas", alDia, ["Radicar una reserva", "Salón social"]);

  console.log("\n== Casos borde ==");
  // Con un límite de carga (`loading.tsx`) en un segmento dinámico, Next ya
  // envió las cabeceras cuando la página llama a `notFound()`, así que el
  // status queda en 200 y el not-found llega dentro del stream. Lo que importa
  // es lo que ve la persona, así que se verifica el contenido.
  await revisar("/dashboard/no-existe", admin, ["could not be found"]);
  // Este sí debe quedar en rojo: un residente en /dashboard se redirige.
  await revisar("/dashboard", alDia, []);

  await prisma.$disconnect();

  console.log(
    `\n${fallos === 1 ? "✓" : "⚠"} ${fallos} ruta(s) en rojo (se espera exactamente 1: el control de rol que redirige al portal).`
  );
  process.exitCode = fallos === 1 ? 0 : 1;
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
