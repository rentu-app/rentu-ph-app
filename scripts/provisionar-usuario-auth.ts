/**
 * Crea en Supabase Auth un usuario por cada `Usuario` sembrado en Prisma que
 * todavía no exista ahí, con la misma contraseña demo del seed
 * (`SEED_DEFAULT_PASSWORD`). Idempotente: si el email ya existe en
 * Supabase Auth, se omite.
 *
 * Uso:  pnpm provision:auth
 *
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.
 */
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { prisma } from "../src/lib/prisma";

const PASSWORD_DEMO = process.env.SEED_DEFAULT_PASSWORD;
if (!PASSWORD_DEMO) {
  throw new Error("Define SEED_DEFAULT_PASSWORD en .env (ver .env.example).");
}

async function main() {
  const supabaseAdmin = createSupabaseAdminClient();

  const usuarios = await prisma.usuario.findMany({
    where: { deletedAt: null },
    select: { email: true, nombre: true },
  });

  const { data: listado, error: errorListado } = await supabaseAdmin.auth.admin.listUsers();
  if (errorListado) {
    throw new Error(`No se pudo listar usuarios de Supabase Auth: ${errorListado.message}`);
  }
  const emailsExistentes = new Set(listado.users.map((u) => u.email));

  for (const usuario of usuarios) {
    if (emailsExistentes.has(usuario.email)) {
      console.log(`↷ ${usuario.email} ya existe en Supabase Auth, se omite.`);
      continue;
    }

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: usuario.email,
      password: PASSWORD_DEMO,
      email_confirm: true,
      user_metadata: { nombre: usuario.nombre },
    });

    if (error) {
      console.error(`✗ Error creando ${usuario.email}:`, error.message);
    } else {
      console.log(`✓ ${usuario.email} creado en Supabase Auth.`);
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Error provisionando usuarios:", error);
  process.exit(1);
});
