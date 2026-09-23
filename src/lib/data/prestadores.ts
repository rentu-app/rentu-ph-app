import { cache } from "react";
import { EstadoOrdenServicio, EstadoPQRS } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Prestadores externos y órdenes de servicio de UNA copropiedad.
 *
 * En este MVP los prestadores no tienen cuenta ni inician sesión: son un
 * directorio que mantiene el administrador. La orden de servicio es el
 * puente explícito entre una PQRS de mantenimiento y el prestador que la
 * atiende — nunca se crea sola a partir de una PQRS.
 */
export const getPrestadores = cache(async (copropiedadId: string) => {
  const prestadores = await prisma.prestador.findMany({
    relationLoadStrategy: "join",
    where: { copropiedadId, deletedAt: null },
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      tipo: true,
      contacto: true,
      telefono: true,
      email: true,
      notas: true,
      activo: true,
      ordenes: {
        where: { deletedAt: null },
        select: { id: true, estado: true },
      },
    },
  });

  return prestadores.map(({ ordenes, ...prestador }) => ({
    ...prestador,
    ordenesAbiertas: ordenes.filter(
      (orden) =>
        orden.estado === EstadoOrdenServicio.ABIERTA ||
        orden.estado === EstadoOrdenServicio.EN_PROCESO
    ).length,
    ordenesTotales: ordenes.length,
  }));
});

export type PrestadorConOrdenes = Awaited<
  ReturnType<typeof getPrestadores>
>[number];

export const getOrdenesServicio = cache(
  async (copropiedadId: string, estado?: EstadoOrdenServicio) => {
    return prisma.ordenServicio.findMany({
    relationLoadStrategy: "join",
      where: {
        copropiedadId,
        deletedAt: null,
        ...(estado ? { estado } : {}),
      },
      orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        estado: true,
        fechaProgramada: true,
        costoEstimado: true,
        createdAt: true,
        prestador: { select: { id: true, nombre: true, tipo: true } },
        pqrs: {
          select: { id: true, codigoRadicado: true, titulo: true },
        },
      },
    });
  }
);

export type OrdenServicioConDetalle = Awaited<
  ReturnType<typeof getOrdenesServicio>
>[number];

/**
 * PQRS que todavía se pueden escalar a una orden de servicio: abiertas o en
 * proceso y sin orden vigente. Alimenta el formulario "crear orden a partir
 * de una PQRS".
 */
export const getPqrsEscalables = cache(async (copropiedadId: string) => {
  const pqrs = await prisma.pqrs.findMany({
    relationLoadStrategy: "join",
    where: {
      deletedAt: null,
      estado: { in: [EstadoPQRS.ABIERTO, EstadoPQRS.EN_PROCESO] },
      inmueble: { copropiedadId, deletedAt: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      codigoRadicado: true,
      titulo: true,
      tipo: true,
      inmueble: { select: { identificador: true } },
      ordenesServicio: {
        where: {
          deletedAt: null,
          estado: { in: [EstadoOrdenServicio.ABIERTA, EstadoOrdenServicio.EN_PROCESO] },
        },
        select: { id: true },
      },
    },
  });

  // Solo las PQRS sin orden vigente son "escalables"; el arreglo de órdenes se
  // usó para filtrar y no se devuelve.
  return pqrs
    .filter((item) => item.ordenesServicio.length === 0)
    .map((item) => ({
      id: item.id,
      codigoRadicado: item.codigoRadicado,
      titulo: item.titulo,
      tipo: item.tipo,
      inmueble: item.inmueble,
    }));
});

export type PqrsEscalable = Awaited<ReturnType<typeof getPqrsEscalables>>[number];
