"use server";

import { revalidatePath } from "next/cache";
import { Prisma, EstadoCuenta, TipoGestionCobro } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdministradorActual } from "@/lib/session";
import { calcularSaldoPendiente } from "@/lib/data/cartera";
import { registrarPagoSchema } from "@/lib/validations/pagos";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

export type EstadoAccionPago = EstadoAccionFormulario;

async function aplicarPago(params: {
  cuentaDeCobroId: string;
  metodo: string;
  observaciones?: string;
  monto?: string;
  pagarSaldoTotal?: boolean;
}): Promise<EstadoAccionPago> {
  const administrador = await getAdministradorActual();

  // Nunca confiamos en un monto/estado que venga del cliente: se relee la
  // cuenta desde la base filtrando por las copropiedades que administra el
  // usuario autenticado, y todo el cálculo de saldo se rehace en el servidor.
  const cuenta = await prisma.cuentaDeCobro.findFirst({
    where: {
      id: params.cuentaDeCobroId,
      deletedAt: null,
      inmueble: {
        copropiedad: {
          administradores: {
            some: { usuarioId: administrador.id, deletedAt: null },
          },
        },
      },
    },
    include: {
      recargosMora: { where: { deletedAt: null } },
    },
  });

  if (!cuenta) {
    return {
      status: "error",
      message: "La cuenta de cobro no existe o no tienes acceso a ella.",
    };
  }

  if (cuenta.estado === EstadoCuenta.PAGADA) {
    return { status: "error", message: "Esta cuenta ya está marcada como pagada." };
  }

  const saldoPendiente = calcularSaldoPendiente(cuenta);
  const totalExigible = cuenta.montoPagado.plus(saldoPendiente);

  if (saldoPendiente.lessThanOrEqualTo(0)) {
    return { status: "error", message: "Esta cuenta ya está saldada." };
  }

  const montoPago = params.pagarSaldoTotal
    ? saldoPendiente
    : new Prisma.Decimal(params.monto ?? "0");

  if (montoPago.lessThanOrEqualTo(0)) {
    return { status: "error", message: "El monto debe ser mayor a 0." };
  }

  if (montoPago.greaterThan(saldoPendiente)) {
    return {
      status: "error",
      message: `El monto excede el saldo pendiente ($${saldoPendiente.toFixed(2)}).`,
    };
  }

  const nuevoMontoPagado = cuenta.montoPagado.plus(montoPago);
  const quedaSaldada = nuevoMontoPagado.greaterThanOrEqualTo(totalExigible);

  await prisma.$transaction([
    prisma.pago.create({
      data: {
        cuentaDeCobroId: cuenta.id,
        registradoPorId: administrador.id,
        monto: montoPago,
        metodo: params.metodo,
        observaciones: params.observaciones || null,
      },
    }),
    prisma.cuentaDeCobro.update({
      where: { id: cuenta.id },
      data: {
        montoPagado: nuevoMontoPagado,
        estado: quedaSaldada ? EstadoCuenta.PAGADA : cuenta.estado,
      },
    }),
    // El pago queda también en la bitácora de gestión de la unidad: al abrir
    // el detalle, el administrador ve en una sola línea de tiempo las
    // llamadas, los avisos y los pagos que resultaron de ellos.
    prisma.gestionCobro.create({
      data: {
        inmuebleId: cuenta.inmuebleId,
        registradoPorId: administrador.id,
        tipo: TipoGestionCobro.NOTA,
        nota: quedaSaldada
          ? `Pago registrado por $${montoPago.toFixed(0)} (${params.metodo}). La cuenta ${cuenta.periodo} quedó saldada.`
          : `Abono registrado por $${montoPago.toFixed(0)} (${params.metodo}) sobre la cuenta ${cuenta.periodo}.`,
      },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cartera");
  revalidatePath("/portal");
  revalidatePath("/portal/cartera");

  return {
    status: "success",
    message: quedaSaldada
      ? "Pago registrado. La cuenta quedó saldada."
      : `Abono de $${montoPago.toFixed(2)} registrado. Saldo pendiente: $${saldoPendiente
          .minus(montoPago)
          .toFixed(2)}.`,
  };
}

/** Server Action para `<form action={...}>` + `useActionState` (abono o pago parcial/total con monto explícito). */
export async function registrarPago(
  _prevState: EstadoAccionPago,
  formData: FormData
): Promise<EstadoAccionPago> {
  const validado = registrarPagoSchema.safeParse({
    cuentaDeCobroId: formData.get("cuentaDeCobroId"),
    monto: formData.get("monto"),
    metodo: formData.get("metodo") || "Transferencia",
    observaciones: formData.get("observaciones") ?? "",
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  try {
    return await aplicarPago(validado.data);
  } catch (error) {
    console.error("registrarPago", error);
    return { status: "error", message: "No se pudo registrar el pago." };
  }
}

/** Atajo de un solo clic para saldar el 100% del saldo pendiente de la cuenta. */
export async function registrarPagoTotal(
  cuentaDeCobroId: string
): Promise<EstadoAccionPago> {
  const validado = z.uuid().safeParse(cuentaDeCobroId);
  if (!validado.success) {
    return { status: "error", message: "Cuenta de cobro inválida." };
  }

  try {
    return await aplicarPago({
      cuentaDeCobroId: validado.data,
      metodo: "Pago total",
      pagarSaldoTotal: true,
    });
  } catch (error) {
    console.error("registrarPagoTotal", error);
    return { status: "error", message: "No se pudo registrar el pago." };
  }
}

/** Adaptador de `registrarPagoTotal` para usarse con `useActionState` desde un `<form>`. */
export async function registrarPagoTotalDesdeFormulario(
  _prevState: EstadoAccionPago,
  formData: FormData
): Promise<EstadoAccionPago> {
  return registrarPagoTotal(String(formData.get("cuentaDeCobroId") ?? ""));
}
