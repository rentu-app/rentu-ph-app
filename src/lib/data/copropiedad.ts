import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Rentu opera sobre UNA copropiedad a la vez.
 *
 * El modelo de datos sigue soportando la relación N:M
 * `AdministradorCopropiedad` (un administrador delegado puede llevar varios
 * conjuntos, y quitar esa tabla sería una migración destructiva sin
 * beneficio hoy), pero el producto ya no se navega así: toda la experiencia
 * cuelga de la copropiedad activa, que es la primera asignada al
 * administrador autenticado. Si más adelante se necesita alternar entre
 * conjuntos, el cambio se hace aquí (ej. leyendo una cookie de selección)
 * sin tocar las pantallas.
 */
export const getCopropiedadActiva = cache(async (administradorId: string) => {
  // UNA sola consulta: antes eran tres (findFirst + count + groupBy) y cada
  // ida y vuelta a Postgres cuesta ~85–180 ms desde Colombia contra
  // us-east-1. El conteo de unidades y el agrupado por torre se hacen en
  // memoria sobre la misma lectura: son decenas de filas de dos columnas.
  const copropiedad = await prisma.copropiedad.findFirst({
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

  if (!copropiedad) return null;

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
      .sort((a, b) => a.nombre.localeCompare(b.nombre)),
  };
});

export type CopropiedadActiva = NonNullable<
  Awaited<ReturnType<typeof getCopropiedadActiva>>
>;

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
