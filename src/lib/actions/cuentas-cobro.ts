"use server";

import { revalidatePath } from "next/cache";
import { EstadoCuenta, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getContextoAdministrador } from "@/lib/session";
import { generarCuentasDeCobroSchema } from "@/lib/validations/cuentas-cobro";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

export type EstadoAccionGeneracion = EstadoAccionFormulario;

/**
 * Genera una cuenta de cobro por cada unidad activa de la copropiedad para
 * el `periodo` indicado, repartiendo `montoAdministracionTotal`
 * proporcionalmente al `coeficiente` de cada unidad (Ley 675).
 *
 * La copropiedad se resuelve desde la sesión (`getContextoAdministrador`),
 * no desde el formulario.
 *
 * Cada cuota es INDEPENDIENTE: no se arrastra el saldo de periodos anteriores
 * al `totalAPagar` del nuevo. La versión anterior sí lo hacía, y eso rompía
 * los agregados de cartera: la cuenta de agosto seguía pendiente con su
 * saldo Y la de septiembre incluía ese mismo saldo como `saldoAnterior`, así
 * que sumar los saldos pendientes contaba la misma deuda dos veces (una
 * unidad con seis cuotas impagas llegaba a mostrar ~8 millones cuando debía
 * 2,3). Con cuotas independientes, "cartera de la unidad" = suma de sus
 * cuotas no pagadas, que es lo que calcula `calcularSaldoPendiente` y lo que
 * el administrador puede verificar cuota por cuota.
 *
 * `CuentaDeCobro.saldoAnterior` se conserva en el schema (queda en 0) para no
 * hacer una migración destructiva y porque un estado de cuenta impreso sí
 * suele mostrar ese renglón; si algún día se imprime, se calcula al momento
 * de generar el PDF, no se persiste duplicado.
 *
 * Se aplica a TODAS las unidades activas, estén OCUPADO o DESOCUPADO: la
 * cuota de administración es una obligación del inmueble/coeficiente, no de
 * la ocupación.
 *
 * Idempotente: si ya existe una cuenta para `[inmuebleId, periodo]` (índice
 * único en el schema) se omite esa unidad en vez de duplicar o sobrescribir.
 */
export async function generarCuentasDeCobroMensual(
  _prevState: EstadoAccionGeneracion,
  formData: FormData
): Promise<EstadoAccionGeneracion> {
  const validado = generarCuentasDeCobroSchema.safeParse({
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
    periodo,
    montoAdministracionTotal,
    montoExpensasPorInmueble,
    fechaLimitePago,
  } = validado.data;

  try {
    const { copropiedad } = await getContextoAdministrador();

    if (!copropiedad) {
      return {
        status: "error",
        message: "No tienes una copropiedad asignada todavía.",
      };
    }

    const unidades = await prisma.inmueble.findMany({
      where: { copropiedadId: copropiedad.id, deletedAt: null },
      select: {
        id: true,
        identificador: true,
        coeficiente: true,
        cuentasDeCobro: {
          where: { deletedAt: null, periodo },
          select: { id: true },
        },
      },
    });

    if (unidades.length === 0) {
      return { status: "error", message: "Esta copropiedad no tiene unidades activas." };
    }

    const totalAdministracion = new Prisma.Decimal(montoAdministracionTotal);
    const expensas = new Prisma.Decimal(montoExpensasPorInmueble);

    const unidadesAGenerar = unidades.filter(
      (unidad) => unidad.cuentasDeCobro.length === 0
    );
    const omitidos = unidades.length - unidadesAGenerar.length;

    if (unidadesAGenerar.length === 0) {
      return {
        status: "error",
        message: `Ya existe una cuenta de cobro para el periodo ${periodo} en todas las unidades.`,
      };
    }

    await prisma.$transaction(
      unidadesAGenerar.map((unidad) => {
        const montoAdministracion = totalAdministracion
          .times(unidad.coeficiente)
          .toDecimalPlaces(2);
        const totalAPagar = montoAdministracion.plus(expensas);

        return prisma.cuentaDeCobro.create({
          data: {
            inmuebleId: unidad.id,
            periodo,
            montoAdministracion,
            montoExpensas: expensas,
            saldoAnterior: new Prisma.Decimal(0),
            totalAPagar,
            fechaLimitePago: new Date(fechaLimitePago),
            estado: EstadoCuenta.PENDIENTE,
          },
        });
      })
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/cartera");

    const mensajeOmitidos =
      omitidos > 0 ? ` (${omitidos} ya tenían cuenta para ese periodo)` : "";
    return {
      status: "success",
      message: `${unidadesAGenerar.length} cuenta(s) de cobro generada(s) para ${periodo}${mensajeOmitidos}.`,
    };
  } catch (error) {
    console.error("generarCuentasDeCobroMensual", error);
    return { status: "error", message: "No se pudieron generar las cuentas de cobro." };
  }
}
