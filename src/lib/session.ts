import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RolUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCopropiedadActiva } from "@/lib/data/copropiedad";

export const COOKIE_INMUEBLE_ACTIVO = "rentu_inmueble_activo";

/**
 * Identidad = Supabase Auth (email/password); autorización = el registro de
 * `Usuario` en Prisma con ese mismo email, sin filtrar por rol. Los wrappers
 * `getAdministradorActual`/`getResidenteActual` deciden qué hacer con cada
 * rol. El Proxy (`src/proxy.ts`) ya redirige a `/login` a quien no tenga
 * sesión antes de llegar aquí, pero se revalida por si esta función se
 * invoca desde algún contexto que el Proxy no cubra.
 */
const getUsuarioActual = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findFirst({
    where: { email: user.email, deletedAt: null },
  });

  if (!usuario) {
    redirect("/login");
  }

  return usuario;
});

/**
 * Si el usuario autenticado no es ADMINISTRADOR, se manda a `/portal` en vez
 * de `/login`: ya tiene una sesión válida, solo está en el área que no le
 * corresponde.
 */
export const getAdministradorActual = cache(async () => {
  const usuario = await getUsuarioActual();

  if (usuario.rol !== RolUsuario.ADMINISTRADOR) {
    redirect("/portal");
  }

  return usuario;
});

/**
 * Contexto de trabajo del administrador: su usuario + la copropiedad activa.
 *
 * Es el único punto donde las Server Actions resuelven "sobre qué
 * copropiedad estoy operando". Nunca se acepta un `copropiedadId` que venga
 * del formulario: si el cliente lo mandara, un administrador podría escribir
 * sobre un conjunto que no administra.
 */
export async function getContextoAdministrador() {
  const administrador = await getAdministradorActual();
  const copropiedad = await getCopropiedadActiva(administrador.id);
  return { administrador, copropiedad };
}

/**
 * Sesión de un residente (PROPIETARIO/INQUILINO): además del `Usuario`,
 * resuelve sus vínculos activos a inmuebles (`UsuarioInmueble`) y cuál de
 * ellos está "activo" ahora mismo — relevante solo si tiene más de uno —
 * usando la cookie `COOKIE_INMUEBLE_ACTIVO` (ver
 * `src/lib/actions/portal.ts` → `seleccionarInmuebleActivo`). Si no tiene
 * ningún vínculo activo no se redirige: se deja que cada página del portal
 * muestre su propio mensaje.
 */
export const getResidenteActual = cache(async () => {
  const usuario = await getUsuarioActual();

  if (usuario.rol === RolUsuario.ADMINISTRADOR) {
    redirect("/dashboard");
  }

  const vinculos = await prisma.usuarioInmueble.findMany({
    relationLoadStrategy: "join",
    where: { usuarioId: usuario.id, activo: true, deletedAt: null },
    orderBy: { fechaInicio: "asc" },
    select: {
      id: true,
      rol: true,
      inmueble: {
        select: {
          id: true,
          identificador: true,
          copropiedad: { select: { id: true, nombre: true } },
        },
      },
    },
  });

  const cookieStore = await cookies();
  const inmuebleIdCookie = cookieStore.get(COOKIE_INMUEBLE_ACTIVO)?.value;
  const inmuebleActivo =
    vinculos.find((vinculo) => vinculo.inmueble.id === inmuebleIdCookie) ?? vinculos[0];

  return { usuario, vinculos, inmuebleActivo };
});

export type VinculoResidente = Awaited<ReturnType<typeof getResidenteActual>>["vinculos"][number];
