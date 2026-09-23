import { cache } from "react";
import { EstadoCuenta, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calcularSaldoPendiente } from "@/lib/data/cartera";

/**
 * Cartera de la unidad del residente. Devuelve montos como `number` y el
 * saldo ya calculado, para que el portal no tenga que repetir la aritmética
 * de `totalAPagar + recargos - pagos` en la vista.
 */
export const getCarteraDeResidente = cache(async (inmuebleId: string) => {
  const cuentas = await prisma.cuentaDeCobro.findMany({
    relationLoadStrategy: "join",
    where: { inmuebleId, deletedAt: null },
    orderBy: { periodo: "desc" },
    select: {
      id: true,
      periodo: true,
      montoAdministracion: true,
      montoExpensas: true,
      saldoAnterior: true,
      totalAPagar: true,
      montoPagado: true,
      estado: true,
      fechaLimitePago: true,
      recargosMora: {
        where: { deletedAt: null },
        select: { monto: true, motivo: true, congelado: true },
      },
      pagos: {
        where: { deletedAt: null },
        orderBy: { fechaPago: "desc" },
        select: { id: true, monto: true, metodo: true, fechaPago: true },
      },
    },
  });

  let saldoTotal = new Prisma.Decimal(0);
  let bloqueaReserva = false;

  const detalle = cuentas.map((cuenta) => {
    const saldo = calcularSaldoPendiente(cuenta);
    if (saldo.greaterThan(0)) {
      saldoTotal = saldoTotal.plus(saldo);
      if (
        cuenta.estado === EstadoCuenta.VENCIDA ||
        cuenta.estado === EstadoCuenta.EN_MORA
      ) {
        bloqueaReserva = true;
      }
    }

    return {
      id: cuenta.id,
      periodo: cuenta.periodo,
      cuotaAdministracion: Number(cuenta.montoAdministracion),
      expensas: Number(cuenta.montoExpensas),
      saldoAnterior: Number(cuenta.saldoAnterior),
      totalAPagar: Number(cuenta.totalAPagar),
      montoPagado: Number(cuenta.montoPagado),
      recargosMora: Number(
        cuenta.recargosMora.reduce(
          (suma, recargo) => suma.plus(recargo.monto),
          new Prisma.Decimal(0)
        )
      ),
      saldoPendiente: Number(saldo),
      estado: cuenta.estado,
      fechaLimitePago: cuenta.fechaLimitePago,
      pagos: cuenta.pagos.map((pago) => ({
        id: pago.id,
        monto: Number(pago.monto),
        metodo: pago.metodo,
        fechaPago: pago.fechaPago,
      })),
    };
  });

  return {
    cuentas: detalle,
    saldoTotal: Number(saldoTotal),
    /** Misma regla que aplica `inmuebleNoEstaAPazYSalvo` al radicar la reserva. */
    aPazYSalvo: !bloqueaReserva,
  };
});

export type CarteraDeResidente = Awaited<ReturnType<typeof getCarteraDeResidente>>;
export type CuentaDeResidente = CarteraDeResidente["cuentas"][number];
