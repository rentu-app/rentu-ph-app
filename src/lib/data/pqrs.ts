import { cache } from "react";
import { EstadoPQRS } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * PQRS de UNA copropiedad. El `copropiedadId` lo resuelve siempre el
 * servidor (`getCopropiedadActiva`) a partir de la sesión del
 * administrador, nunca llega del cliente.
 */
export const getPqrsDeCopropiedad = cache(
  async (copropiedadId: string, estado?: EstadoPQRS) => {
    return prisma.pqrs.findMany({
    relationLoadStrategy: "join",
      where: {
        deletedAt: null,
        ...(estado ? { estado } : {}),
        inmueble: { copropiedadId, deletedAt: null },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        codigoRadicado: true,
        tipo: true,
        titulo: true,
        descripcion: true,
        estado: true,
        urlFoto: true,
        respuestaAdmin: true,
        respondidoEn: true,
        fechaCierre: true,
        createdAt: true,
        inmueble: { select: { identificador: true, torre: true } },
        radicadoPor: { select: { nombre: true } },
        dirigidoA: { select: { nombre: true } },
        ordenesServicio: {
          where: { deletedAt: null },
          select: {
            id: true,
            estado: true,
            prestador: { select: { nombre: true } },
          },
        },
      },
    });
  }
);

export type PqrsConDetalle = Awaited<ReturnType<typeof getPqrsDeCopropiedad>>[number];

/** PQRS propias del residente: las que él mismo radicó y las que el Administrador dirigió hacia él. */
export const getPqrsDeResidente = cache(async (usuarioId: string, inmuebleId: string) => {
  return prisma.pqrs.findMany({
    relationLoadStrategy: "join",
    where: {
      deletedAt: null,
      inmuebleId,
      OR: [{ radicadoPorId: usuarioId }, { dirigidoAId: usuarioId }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      codigoRadicado: true,
      tipo: true,
      titulo: true,
      descripcion: true,
      estado: true,
      respuestaAdmin: true,
      respondidoEn: true,
      createdAt: true,
      radicadoPorId: true,
      dirigidoAId: true,
      radicadoPor: { select: { nombre: true } },
    },
  });
});

export type PqrsDeResidente = Awaited<ReturnType<typeof getPqrsDeResidente>>[number];

/** Conteo de PQRS por estado, para las tarjetas de KPI y las pestañas de filtro. */
export const getResumenPqrs = cache(async (copropiedadId: string) => {
  const filas = await prisma.pqrs.groupBy({
    by: ["estado"],
    where: {
      deletedAt: null,
      inmueble: { copropiedadId, deletedAt: null },
    },
    _count: { _all: true },
  });

  const conteos: Record<EstadoPQRS, number> = {
    ABIERTO: 0,
    EN_PROCESO: 0,
    CERRADO: 0,
  };
  for (const fila of filas) conteos[fila.estado] = fila._count._all;

  return {
    ...conteos,
    total: conteos.ABIERTO + conteos.EN_PROCESO + conteos.CERRADO,
  };
});

/**
 * Unidades con sus residentes activos, para los selects en cascada del
 * formulario de radicar PQRS (unidad → residente al que va dirigida). Al
 * haber una sola copropiedad, ya no hay un nivel de anidamiento extra.
 */
export const getUnidadesConResidentes = cache(async (copropiedadId: string) => {
  return prisma.inmueble.findMany({
    relationLoadStrategy: "join",
    where: { copropiedadId, deletedAt: null },
    orderBy: [{ torre: "asc" }, { identificador: "asc" }],
    select: {
      id: true,
      identificador: true,
      torre: true,
      residentes: {
        where: { activo: true, deletedAt: null },
        select: {
          usuarioId: true,
          rol: true,
          usuario: { select: { nombre: true } },
        },
      },
    },
  });
});

export type UnidadConResidentes = Awaited<
  ReturnType<typeof getUnidadesConResidentes>
>[number];
