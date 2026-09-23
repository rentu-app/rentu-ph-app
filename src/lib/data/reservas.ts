import { cache } from "react";
import { EstadoCuenta, EstadoReserva } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calcularSaldoPendiente } from "@/lib/data/cartera";

/** Zonas comunes de la copropiedad, con su conteo de reservas vigentes. */
export const getZonasComunes = cache(async (copropiedadId: string) => {
  const zonas = await prisma.zonaComun.findMany({
    where: { copropiedadId, deletedAt: null },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      aforo: true,
      costo: true,
      activa: true,
      _count: {
        select: {
          reservas: {
            where: { deletedAt: null, estado: { not: EstadoReserva.CANCELADA } },
          },
        },
      },
    },
  });

  return zonas.map((zona) => ({ ...zona, costo: Number(zona.costo) }));
});

export type ZonaComunResumen = Awaited<ReturnType<typeof getZonasComunes>>[number];

export const getReservasDeCopropiedad = cache(
  async (copropiedadId: string, estado?: EstadoReserva) => {
    return prisma.reserva.findMany({
    relationLoadStrategy: "join",
      where: {
        deletedAt: null,
        ...(estado ? { estado } : {}),
        zonaComun: { copropiedadId },
      },
      orderBy: { fechaInicio: "asc" },
      select: {
        id: true,
        fechaInicio: true,
        fechaFin: true,
        estado: true,
        observaciones: true,
        createdAt: true,
        zonaComun: { select: { nombre: true } },
        inmueble: { select: { id: true, identificador: true, torre: true } },
        solicitadaPor: { select: { nombre: true } },
      },
    });
  }
);

export type ReservaConDetalle = Awaited<
  ReturnType<typeof getReservasDeCopropiedad>
>[number];

/**
 * Zonas comunes activas de la copropiedad del residente, para elegir al
 * radicar una reserva. `costo` se convierte a `number` porque un `Decimal`
 * de Prisma no es un objeto plano y Next.js no permite pasarlo de un Server
 * Component a un Client Component.
 */
export const getZonasComunesDeCopropiedad = cache(async (copropiedadId: string) => {
  const zonas = await prisma.zonaComun.findMany({
    where: { copropiedadId, deletedAt: null, activa: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, descripcion: true, aforo: true, costo: true },
  });

  return zonas.map((zona) => ({ ...zona, costo: Number(zona.costo) }));
});

export type ZonaComunParaResidente = Awaited<
  ReturnType<typeof getZonasComunesDeCopropiedad>
>[number];

/** Reservas propias de un inmueble, para la vista "Mis reservas" del residente. */
export const getReservasDeResidente = cache(async (inmuebleId: string) => {
  return prisma.reserva.findMany({
    relationLoadStrategy: "join",
    where: { inmuebleId, deletedAt: null },
    orderBy: { fechaInicio: "desc" },
    select: {
      id: true,
      fechaInicio: true,
      fechaFin: true,
      estado: true,
      observaciones: true,
      createdAt: true,
      zonaComun: { select: { nombre: true } },
    },
  });
});

export type ReservaDeResidente = Awaited<ReturnType<typeof getReservasDeResidente>>[number];

/**
 * true si el inmueble tiene alguna cuenta de cobro VENCIDA o EN_MORA con
 * saldo (no está a paz y salvo). Ambos estados bloquean reservas — no solo
 * la mora ya escalada. Es la única fuente de verdad de esa regla: la usan
 * `crearReservaResidente`, `actualizarEstadoReserva` y la tarjeta de estado
 * del portal, para que el bloqueo y lo que ve el residente nunca se
 * contradigan.
 */
export async function inmuebleNoEstaAPazYSalvo(inmuebleId: string): Promise<boolean> {
  const cuentasCriticas = await prisma.cuentaDeCobro.findMany({
    relationLoadStrategy: "join",
    where: {
      inmuebleId,
      deletedAt: null,
      estado: { in: [EstadoCuenta.VENCIDA, EstadoCuenta.EN_MORA] },
    },
    select: {
      totalAPagar: true,
      montoPagado: true,
      recargosMora: { where: { deletedAt: null }, select: { monto: true } },
    },
  });

  return cuentasCriticas.some((cuenta) =>
    calcularSaldoPendiente(cuenta).greaterThan(0)
  );
}
/** true si ya existe una reserva PENDIENTE/CONFIRMADA que se cruza en el tiempo. */
export async function existeCruceDeHorario(params: {
  zonaComunId: string;
  fechaInicio: Date;
  fechaFin: Date;
  excluirReservaId?: string;
}): Promise<boolean> {
  const cruce = await prisma.reserva.findFirst({
    where: {
      zonaComunId: params.zonaComunId,
      deletedAt: null,
      estado: { in: [EstadoReserva.PENDIENTE, EstadoReserva.CONFIRMADA] },
      id: params.excluirReservaId ? { not: params.excluirReservaId } : undefined,
      fechaInicio: { lt: params.fechaFin },
      fechaFin: { gt: params.fechaInicio },
    },
    select: { id: true },
  });
  return cruce !== null;
}
