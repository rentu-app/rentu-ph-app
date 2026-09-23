"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EstadoOrdenServicio, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getContextoAdministrador } from "@/lib/session";
import {
  actualizarEstadoOrdenSchema,
  crearOrdenServicioSchema,
  crearPrestadorSchema,
} from "@/lib/validations/prestadores";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

export type EstadoAccionPrestador = EstadoAccionFormulario;

const SIN_COPROPIEDAD: EstadoAccionPrestador = {
  status: "error",
  message: "No tienes una copropiedad asignada todavía.",
};

/** Da de alta un prestador externo en el directorio de la copropiedad. */
export async function crearPrestador(
  _prevState: EstadoAccionPrestador,
  formData: FormData
): Promise<EstadoAccionPrestador> {
  const validado = crearPrestadorSchema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    contacto: formData.get("contacto") ?? "",
    telefono: formData.get("telefono") ?? "",
    email: formData.get("email") ?? "",
    notas: formData.get("notas") ?? "",
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { nombre, tipo, contacto, telefono, email, notas } = validado.data;

  try {
    const { copropiedad } = await getContextoAdministrador();
    if (!copropiedad) return SIN_COPROPIEDAD;

    const existente = await prisma.prestador.findFirst({
      where: { copropiedadId: copropiedad.id, nombre },
      select: { id: true, deletedAt: true },
    });

    if (existente && existente.deletedAt === null) {
      return { status: "error", message: `"${nombre}" ya está en el directorio.` };
    }

    if (existente) {
      // Reactiva un prestador que se había retirado, en vez de chocar con el
      // índice único [copropiedadId, nombre].
      await prisma.prestador.update({
        where: { id: existente.id },
        data: {
          tipo,
          contacto: contacto || null,
          telefono: telefono || null,
          email: email || null,
          notas: notas || null,
          activo: true,
          deletedAt: null,
        },
      });
    } else {
      await prisma.prestador.create({
        data: {
          copropiedadId: copropiedad.id,
          nombre,
          tipo,
          contacto: contacto || null,
          telefono: telefono || null,
          email: email || null,
          notas: notas || null,
        },
      });
    }

    revalidatePath("/dashboard/prestadores");

    return { status: "success", message: `"${nombre}" agregado al directorio.` };
  } catch (error) {
    console.error("crearPrestador", error);
    return { status: "error", message: "No se pudo guardar el prestador." };
  }
}

/**
 * Crea una orden de servicio para un prestador. Puede nacer de una PQRS de
 * mantenimiento — pero SOLO cuando el administrador lo decide aquí: una PQRS
 * nunca se convierte en orden (ni en multa) automáticamente.
 */
export async function crearOrdenServicio(
  _prevState: EstadoAccionPrestador,
  formData: FormData
): Promise<EstadoAccionPrestador> {
  const validado = crearOrdenServicioSchema.safeParse({
    prestadorId: formData.get("prestadorId"),
    pqrsId: formData.get("pqrsId") ?? "",
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion") ?? "",
    fechaProgramada: formData.get("fechaProgramada") ?? "",
    costoEstimado: formData.get("costoEstimado") || undefined,
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { prestadorId, pqrsId, titulo, descripcion, fechaProgramada, costoEstimado } =
    validado.data;

  try {
    const { administrador, copropiedad } = await getContextoAdministrador();
    if (!copropiedad) return SIN_COPROPIEDAD;

    const prestador = await prisma.prestador.findFirst({
      where: { id: prestadorId, copropiedadId: copropiedad.id, deletedAt: null },
      select: { id: true, nombre: true },
    });

    if (!prestador) {
      return { status: "error", message: "El prestador no existe en esta copropiedad." };
    }

    // Si la orden viene de una PQRS, se valida que la PQRS sea de esta misma
    // copropiedad antes de vincularla.
    if (pqrsId) {
      const pqrs = await prisma.pqrs.findFirst({
        where: {
          id: pqrsId,
          deletedAt: null,
          inmueble: { copropiedadId: copropiedad.id },
        },
        select: { id: true },
      });
      if (!pqrs) {
        return { status: "error", message: "La PQRS no existe en esta copropiedad." };
      }
    }

    await prisma.ordenServicio.create({
      data: {
        copropiedadId: copropiedad.id,
        prestadorId: prestador.id,
        creadoPorId: administrador.id,
        pqrsId: pqrsId || null,
        titulo,
        descripcion: descripcion || null,
        fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : null,
        costoEstimado:
          costoEstimado && Number(costoEstimado) > 0
            ? new Prisma.Decimal(costoEstimado)
            : null,
      },
    });

    revalidatePath("/dashboard/prestadores");
    revalidatePath("/dashboard/pqrs");

    return {
      status: "success",
      message: `Orden creada para ${prestador.nombre}.`,
    };
  } catch (error) {
    console.error("crearOrdenServicio", error);
    return { status: "error", message: "No se pudo crear la orden de servicio." };
  }
}

/** Mueve una orden entre abierta / en proceso / cerrada / cancelada. */
export async function actualizarEstadoOrden(
  _prevState: EstadoAccionPrestador,
  formData: FormData
): Promise<EstadoAccionPrestador> {
  const validado = actualizarEstadoOrdenSchema.safeParse({
    ordenId: formData.get("ordenId"),
    estado: formData.get("estado"),
  });

  if (!validado.success) {
    return { status: "error", message: "Datos inválidos." };
  }

  const { ordenId, estado } = validado.data;

  try {
    const { copropiedad } = await getContextoAdministrador();
    if (!copropiedad) return SIN_COPROPIEDAD;

    const orden = await prisma.ordenServicio.findFirst({
      where: { id: ordenId, copropiedadId: copropiedad.id, deletedAt: null },
      select: { id: true },
    });

    if (!orden) {
      return { status: "error", message: "La orden no existe en esta copropiedad." };
    }

    await prisma.ordenServicio.update({ where: { id: ordenId }, data: { estado } });

    revalidatePath("/dashboard/prestadores");

    return {
      status: "success",
      message:
        estado === EstadoOrdenServicio.CERRADA
          ? "Orden cerrada."
          : "Orden actualizada.",
    };
  } catch (error) {
    console.error("actualizarEstadoOrden", error);
    return { status: "error", message: "No se pudo actualizar la orden." };
  }
}
