"use server";

import { revalidatePath } from "next/cache";
import { EstadoCuenta, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdministradorActual } from "@/lib/session";
import { generarCuentasDeCobroSchema } from "@/lib/validations/cuentas-cobro";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

export type EstadoAccionGeneracion = EstadoAccionFormulario;

/**
 * Genera una cuenta de cobro por cada inmueble activo (no eliminado) de la
 * copropiedad para el `periodo` indicado, repartiendo `montoAdministracionTotal`
 * proporcionalmente al `coeficiente` de cada inmueble (Ley 675) y arrastrando
 * como `saldoAnterior` el saldo pendiente de cuentas previas no pagadas.
 *
 * Se aplica a TODOS los inmuebles activos, estén OCUPADO o DESOCUPADO: la
 * cuota de administración es una obligación del inmueble/coeficiente, no de
 * la ocupación.
 *
 * Idempotente: si ya existe una cuenta para `[inmuebleId, periodo]` (índice
 * único en el schema) se omite ese inmueble en vez de duplicar o sobrescribir.
 */
export async function generarCuentasDeCobroMensual(
  _prevState: EstadoAccionGeneracion,
  formData: FormData
): Promise<EstadoAccionGeneracion> {
  const validado = generarCuentasDeCobroSchema.safeParse({
    copropiedadId: formData.get("copropiedadId"),
    periodo: formData.get("periodo"),
    montoAdministracionTotal: formData.get("montoAdministracionTotal"),
    montoExpensasPorInmueble: formData.get("montoExpensasPorInmueble") ?? "0",
    fechaLimitePago: formData.get("fechaLimitePago"),
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const {
    copropiedadId,
    periodo,
    montoAdministracionTotal,
    montoExpensasPorInmueble,
    fechaLimitePago,
  } = validado.data;

  try {
    const administrador = await getAdministradorActual();

    const copropiedad = await prisma.copropiedad.findFirst({
      where: {
        id: copropiedadId,
        deletedAt: null,
        administradores: {
          some: { usuarioId: administrador.id, deletedAt: null },
        },
      },
      include: {
        inmuebles: {
          where: { deletedAt: null },
          select: {
            id: true,
            identificador: true,
            coeficiente: true,
            cuentasDeCobro: {
              where: { deletedAt: null, periodo },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!copropiedad) {
      return {
        status: "error",
        message: "La copropiedad no existe o no tienes acceso a ella.",
      };
    }

    if (copropiedad.inmuebles.length === 0) {
      return { status: "error", message: "Esta copropiedad no tiene inmuebles activos." };
    }

    const totalAdministracion = new Prisma.Decimal(montoAdministracionTotal);
    const expensas = new Prisma.Decimal(montoExpensasPorInmueble);

    const inmueblesAGenerar = copropiedad.inmuebles.filter(
      (inmueble) => inmueble.cuentasDeCobro.length === 0
    );
    const omitidos = copropiedad.inmuebles.length - inmueblesAGenerar.length;

    if (inmueblesAGenerar.length === 0) {
      return {
        status: "error",
        message: `Ya existe una cuenta de cobro para el periodo ${periodo} en todos los inmuebles de esta copropiedad.`,
      };
    }

    // El saldo pendiente de periodos previos se calcula por fuera de la
    // transacción de escritura (solo lectura) y se recalcula tomando
    // totalAPagar + recargos - montoPagado de cualquier cuenta anterior no
    // saldada, para arrastrar mora acumulada de varios periodos si aplica.
    const saldosAnteriores = await Promise.all(
      inmueblesAGenerar.map(async (inmueble) => {
        const cuentasPendientes = await prisma.cuentaDeCobro.findMany({
          where: {
            inmuebleId: inmueble.id,
            deletedAt: null,
            estado: { not: EstadoCuenta.PAGADA },
          },
          include: { recargosMora: { where: { deletedAt: null } } },
        });

        const saldo = cuentasPendientes.reduce((total, cuenta) => {
          const recargos = cuenta.recargosMora.reduce(
            (suma, recargo) => suma.plus(recargo.monto),
            new Prisma.Decimal(0)
          );
          const exigible = cuenta.totalAPagar.plus(recargos).minus(cuenta.montoPagado);
          return total.plus(exigible.greaterThan(0) ? exigible : new Prisma.Decimal(0));
        }, new Prisma.Decimal(0));

        return [inmueble.id, saldo] as const;
      })
    );
    const saldoPorInmueble = new Map(saldosAnteriores);

    await prisma.$transaction(
      inmueblesAGenerar.map((inmueble) => {
        const montoAdministracion = totalAdministracion
          .times(inmueble.coeficiente)
          .toDecimalPlaces(2);
        const saldoAnterior = saldoPorInmueble.get(inmueble.id) ?? new Prisma.Decimal(0);
        const totalAPagar = montoAdministracion.plus(expensas).plus(saldoAnterior);

        return prisma.cuentaDeCobro.create({
          data: {
            inmuebleId: inmueble.id,
            periodo,
            montoAdministracion,
            montoExpensas: expensas,
            saldoAnterior,
            totalAPagar,
            fechaLimitePago: new Date(fechaLimitePago),
            estado: EstadoCuenta.PENDIENTE,
          },
        });
      })
    );

    revalidatePath("/dashboard");

    const mensajeOmitidos = omitidos > 0 ? ` (${omitidos} ya tenían cuenta para ese periodo)` : "";
    return {
      status: "success",
      message: `${inmueblesAGenerar.length} cuenta(s) de cobro generada(s) para ${periodo}${mensajeOmitidos}.`,
    };
  } catch (error) {
    console.error("generarCuentasDeCobroMensual", error);
    return { status: "error", message: "No se pudieron generar las cuentas de cobro." };
  }
}
