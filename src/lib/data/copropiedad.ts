import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Un administrador puede gestionar varias copropiedades (relación N:M
 * `AdministradorCopropiedad`), pero la app opera sobre UNA a la vez: la
 * "activa". Cuál es la activa lo decide la cookie httpOnly de selección
 * (ver `getContextoAdministrador` en `src/lib/session.ts`), y el valor de esa
 * cookie NUNCA se acepta sin validarlo aquí contra los vínculos reales del
 * administrador.
 *
 * UNA sola consulta trae todas sus copropiedades con el conteo por torre:
 * cada ida y vuelta a Postgres cuesta ~85–180 ms desde Colombia contra
 * us-east-1, y el conteo y el agrupado se hacen en memoria sobre filas de
 * una columna.
 */
export const getCopropiedadesDeAdministrador = cache(async (administradorId: string) => {
  const copropiedades = await prisma.copropiedad.findMany({
    relationLoadStrategy: "join",
    where: {
      deletedAt: null,
      administradores: {
        some: { usuarioId: administradorId, deletedAt: null },
      },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nombre: true,
      nit: true,
      direccion: true,
      ciudad: true,
      inmuebles: {
        where: { deletedAt: null },
        select: { torre: true },
      },
    },
  });

  return copropiedades.map((copropiedad) => {
    const porTorre = new Map<string, number>();
    for (const unidad of copropiedad.inmuebles) {
      porTorre.set(unidad.torre, (porTorre.get(unidad.torre) ?? 0) + 1);
    }

    return {
      id: copropiedad.id,
      nombre: copropiedad.nombre,
      nit: copropiedad.nit,
      direccion: copropiedad.direccion,
      ciudad: copropiedad.ciudad,
      totalUnidades: copropiedad.inmuebles.length,
      torres: [...porTorre.entries()]
        .map(([nombre, unidades]) => ({ nombre, unidades }))
        // "Sin torre" ("") siempre al final.
        .sort((a, b) => Number(a.nombre === "") - Number(b.nombre === "") || a.nombre.localeCompare(b.nombre)),
    };
  });
});

export type CopropiedadActiva = Awaited<
  ReturnType<typeof getCopropiedadesDeAdministrador>
>[number];

/**
 * Resuelve la copropiedad activa a partir del id que dice la cookie.
 *   - Cookie válida (el administrador está vinculado) → esa.
 *   - Cookie ausente, vieja o manipulada → se ignora.
 *   - Sin cookie válida: con 1 copropiedad es esa; con 2 o más hay que
 *     elegir (`requiereSeleccion`), no se adivina.
 */
export async function resolverCopropiedadActiva(
  administradorId: string,
  idCookie: string | undefined
) {
  const copropiedades = await getCopropiedadesDeAdministrador(administradorId);
  const deCookie = idCookie
    ? copropiedades.find((copropiedad) => copropiedad.id === idCookie)
    : undefined;

  if (deCookie) {
    return { copropiedad: deCookie, copropiedades, requiereSeleccion: false };
  }
  if (copropiedades.length === 1) {
    return { copropiedad: copropiedades[0], copropiedades, requiereSeleccion: false };
  }
  return {
    copropiedad: null,
    copropiedades,
    requiereSeleccion: copropiedades.length > 1,
  };
}

/**
 * Verifica que `copropiedadId` pertenezca al administrador autenticado.
 * Las Server Actions y las rutas de API lo usan para no confiar en un id
 * que llegue del cliente.
 */
export async function getCopropiedadPorId(
  copropiedadId: string,
  administradorId: string
) {
  return prisma.copropiedad.findFirst({
    where: {
      id: copropiedadId,
      deletedAt: null,
      administradores: {
        some: { usuarioId: administradorId, deletedAt: null },
      },
    },
    select: { id: true, nombre: true },
  });
}
