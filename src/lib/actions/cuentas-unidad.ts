"use server";

import { revalidatePath } from "next/cache";
import { EstadoCuenta, Prisma, TipoGestionCobro } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { formatearPeriodo } from "@/lib/formatters";
import { getContextoAdministrador } from "@/lib/session";
import { calcularSaldoPendiente } from "@/lib/data/cartera";
import {
  actualizarCuentaSchema,
  generarCuentaUnidadSchema,
} from "@/lib/validations/cuenta-unidad";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

function revalidarCartera() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cartera");
  revalidatePath("/portal");
  revalidatePath("/portal/cartera");
}

/** Genera la cuenta de UN periodo para UNA unidad de la copropiedad activa. */
export async function generarCuentaUnidad(
  _prevState: EstadoAccionFormulario,
  formData: FormData
): Promise<EstadoAccionFormulario> {
  const validado = generarCuentaUnidadSchema.safeParse({
    inmuebleId: formData.get("inmuebleId"),
    periodo: formData.get("periodo"),
    montoAdministracion: formData.get("montoAdministracion"),
    montoExpensas: formData.get("montoExpensas") || "0",
    fechaLimitePago: formData.get("fechaLimitePago"),
  });
  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }
  const { inmuebleId, periodo, montoAdministracion, montoExpensas, fechaLimitePago } =
    validado.data;

  try {
    const { copropiedad } = await getContextoAdministrador();
    if (!copropiedad) {
      return { status: "error", message: "No tienes una copropiedad asignada todavía." };
    }

    const unidad = await prisma.inmueble.findFirst({
      where: { id: inmuebleId, copropiedadId: copropiedad.id, deletedAt: null },
      select: { id: true, identificador: true },
    });
    if (!unidad) {
      return { status: "error", message: "La unidad no existe en esta copropiedad." };
    }

    const existente = await prisma.cuentaDeCobro.findFirst({
      where: { inmuebleId, periodo, deletedAt: null },
      select: { id: true },
    });
    if (existente) {
      return {
        status: "error",
        message: `${unidad.identificador} ya tiene cuenta de ${formatearPeriodo(periodo)}.`,
      };
    }

    const admin = new Prisma.Decimal(montoAdministracion);
    const expensas = new Prisma.Decimal(montoExpensas);
    await prisma.cuentaDeCobro.create({
      data: {
        inmuebleId,
        periodo,
        montoAdministracion: admin,
        montoExpensas: expensas,
        saldoAnterior: new Prisma.Decimal(0),
        totalAPagar: admin.plus(expensas),
        fechaLimitePago: new Date(fechaLimitePago),
        estado: EstadoCuenta.PENDIENTE,
      },
    });

    revalidarCartera();
    return {
      status: "success",
      message: `Cuenta de ${formatearPeriodo(periodo)} generada para ${unidad.identificador}.`,
    };
  } catch (error) {
    console.error("generarCuentaUnidad", error);
    return { status: "error", message: "No se pudo generar la cuenta." };
  }
}

/**
 * Corrige los valores de una cuenta ya generada. No permite bajar el total por
 * debajo de lo ya pagado; el estado se recalcula (PAGADA ↔ PENDIENTE) y el
 * cambio queda en la bitácora de la unidad.
 */
export async function actualizarCuentaCobro(
  _prevState: EstadoAccionFormulario,
  formData: FormData
): Promise<EstadoAccionFormulario> {
  const validado = actualizarCuentaSchema.safeParse({
    cuentaId: formData.get("cuentaId"),
    montoAdministracion: formData.get("montoAdministracion"),
    montoExpensas: formData.get("montoExpensas") || "0",
    fechaLimitePago: formData.get("fechaLimitePago"),
  });
  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }
  const { cuentaId, montoAdministracion, montoExpensas, fechaLimitePago } = validado.data;

  try {
    const { administrador, copropiedad } = await getContextoAdministrador();
    if (!copropiedad) {
      return { status: "error", message: "No tienes una copropiedad asignada todavía." };
    }

    const cuenta = await prisma.cuentaDeCobro.findFirst({
      where: {
        id: cuentaId,
        deletedAt: null,
        inmueble: { copropiedadId: copropiedad.id, deletedAt: null },
      },
      include: { recargosMora: { where: { deletedAt: null } } },
    });
    if (!cuenta) {
      return { status: "error", message: "La cuenta no existe en esta copropiedad." };
    }

    const admin = new Prisma.Decimal(montoAdministracion);
    const expensas = new Prisma.Decimal(montoExpensas);
    const nuevoTotal = admin.plus(expensas).plus(cuenta.saldoAnterior);

    if (nuevoTotal.lessThan(cuenta.montoPagado)) {
      return {
        status: "error",
        message: "Revisa los datos del formulario.",
        errores: {
          montoAdministracion: [
            `Ya se pagaron $${cuenta.montoPagado.toFixed(0)}; el total no puede ser menor.`,
          ],
        },
      };
    }

    const saldo = calcularSaldoPendiente({
      totalAPagar: nuevoTotal,
      montoPagado: cuenta.montoPagado,
      recargosMora: cuenta.recargosMora,
    });
    const estado =
      saldo.lte(0)
        ? EstadoCuenta.PAGADA
        : cuenta.estado === EstadoCuenta.PAGADA
          ? EstadoCuenta.PENDIENTE
          : cuenta.estado;

    await prisma.$transaction([
      prisma.cuentaDeCobro.update({
        where: { id: cuenta.id },
        data: {
          montoAdministracion: admin,
          montoExpensas: expensas,
          totalAPagar: nuevoTotal,
          fechaLimitePago: new Date(fechaLimitePago),
          estado,
        },
      }),
      prisma.gestionCobro.create({
        data: {
          inmuebleId: cuenta.inmuebleId,
          registradoPorId: administrador.id,
          tipo: TipoGestionCobro.NOTA,
          nota: `Se corrigió la cuenta ${cuenta.periodo}: de $${cuenta.totalAPagar.toFixed(0)} a $${nuevoTotal.toFixed(0)}.`,
        },
      }),
    ]);

    revalidarCartera();
    return { status: "success", message: "Cuenta actualizada." };
  } catch (error) {
    console.error("actualizarCuentaCobro", error);
    return { status: "error", message: "No se pudo actualizar la cuenta." };
  }
}
