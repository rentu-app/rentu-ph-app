import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Residentes activos vinculados a unidades de la copropiedad. */
export const getResidentesDeCopropiedad = cache(async (copropiedadId: string) => {
  return prisma.usuarioInmueble.findMany({
    relationLoadStrategy: "join",
    where: {
      deletedAt: null,
      activo: true,
      inmueble: { copropiedadId, deletedAt: null },
    },
    orderBy: [
      { inmueble: { torre: "asc" } },
      { inmueble: { identificador: "asc" } },
    ],
    select: {
      id: true,
      rol: true,
      fechaInicio: true,
      usuario: { select: { id: true, nombre: true, email: true, telefono: true } },
      inmueble: { select: { id: true, identificador: true, torre: true } },
    },
  });
});

export type ResidenteConDetalle = Awaited<
  ReturnType<typeof getResidentesDeCopropiedad>
>[number];

/**
 * Vínculos históricos ya revocados (offboarding). Se listan aparte porque la
 * fila nunca se borra — la trazabilidad de quién vivió en cada unidad es una
 * exigencia de la Ley 675 y es información que el consejo pide.
 */
export const getResidentesHistoricos = cache(async (copropiedadId: string) => {
  return prisma.usuarioInmueble.findMany({
    relationLoadStrategy: "join",
    where: {
      deletedAt: null,
      activo: false,
      inmueble: { copropiedadId, deletedAt: null },
    },
    orderBy: { fechaFin: "desc" },
    take: 20,
    select: {
      id: true,
      rol: true,
      fechaInicio: true,
      fechaFin: true,
      usuario: { select: { nombre: true, email: true } },
      inmueble: { select: { identificador: true, torre: true } },
    },
  });
});

export type ResidenteHistorico = Awaited<
  ReturnType<typeof getResidentesHistoricos>
>[number];

/** Unidades de la copropiedad para el select del formulario de invitación. */
export const getUnidadesParaInvitar = cache(async (copropiedadId: string) => {
  return prisma.inmueble.findMany({
    where: { copropiedadId, deletedAt: null },
    orderBy: [{ torre: "asc" }, { identificador: "asc" }],
    select: { id: true, identificador: true, torre: true },
  });
});

export type UnidadParaInvitar = Awaited<
  ReturnType<typeof getUnidadesParaInvitar>
>[number];
