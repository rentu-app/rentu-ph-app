"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EstadoPQRS } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdministradorActual, getResidenteActual } from "@/lib/session";
import {
  crearPqrsResidenteSchema,
  crearPqrsSchema,
  responderPqrsSchema,
} from "@/lib/validations/pqrs";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

export type EstadoAccionPqrs = EstadoAccionFormulario;

async function generarCodigoRadicado(): Promise<string> {
  const anio = new Date().getFullYear();
  const prefijo = `PQRS-${anio}-`;

  const cantidad = await prisma.pqrs.count({
    where: { codigoRadicado: { startsWith: prefijo } },
  });

  for (let intento = 0; intento < 5; intento++) {
    const candidato = `${prefijo}${String(cantidad + 1 + intento).padStart(4, "0")}`;
    const existe = await prisma.pqrs.findUnique({
      where: { codigoRadicado: candidato },
      select: { id: true },
    });
    if (!existe) return candidato;
  }

  // Último recurso ante una carrera de creación simultánea: sufijo aleatorio.
  return `${prefijo}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/** El Administrador radica una PQRS dirigida hacia un residente activo de un inmueble administrado. */
export async function crearPqrs(
  _prevState: EstadoAccionPqrs,
  formData: FormData
): Promise<EstadoAccionPqrs> {
  const validado = crearPqrsSchema.safeParse({
    inmuebleId: formData.get("inmuebleId"),
    dirigidoAId: formData.get("dirigidoAId"),
    tipo: formData.get("tipo"),
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { inmuebleId, dirigidoAId, tipo, titulo, descripcion } = validado.data;

  try {
    const administrador = await getAdministradorActual();

    const inmueble = await prisma.inmueble.findFirst({
      where: {
        id: inmuebleId,
        deletedAt: null,
        copropiedad: {
          administradores: { some: { usuarioId: administrador.id, deletedAt: null } },
        },
      },
      select: {
        id: true,
        residentes: {
          where: { activo: true, deletedAt: null, usuarioId: dirigidoAId },
          select: { id: true },
        },
      },
    });

    if (!inmueble) {
      return { status: "error", message: "El inmueble no existe o no tienes acceso a él." };
    }

    if (inmueble.residentes.length === 0) {
      return {
        status: "error",
        message: "La persona seleccionada no es un residente activo de ese inmueble.",
      };
    }

    const codigoRadicado = await generarCodigoRadicado();

    await prisma.pqrs.create({
      data: {
        inmuebleId,
        radicadoPorId: administrador.id,
        dirigidoAId,
        tipo,
        titulo,
        descripcion,
        codigoRadicado,
      },
    });

    revalidatePath("/dashboard/pqrs");
    revalidatePath("/portal/pqrs");

    return { status: "success", message: `PQRS ${codigoRadicado} radicada hacia el residente.` };
  } catch (error) {
    console.error("crearPqrs", error);
    return { status: "error", message: "No se pudo radicar la PQRS." };
  }
}

/** El residente radica su propia PQRS. `inmuebleId`/`radicadoPorId` se derivan de su sesión, nunca del formulario. */
export async function crearPqrsResidente(
  _prevState: EstadoAccionPqrs,
  formData: FormData
): Promise<EstadoAccionPqrs> {
  const validado = crearPqrsResidenteSchema.safeParse({
    tipo: formData.get("tipo"),
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { tipo, titulo, descripcion } = validado.data;

  try {
    const { usuario, inmuebleActivo } = await getResidenteActual();

    if (!inmuebleActivo) {
      return { status: "error", message: "No tienes ningún inmueble activo vinculado." };
    }

    const codigoRadicado = await generarCodigoRadicado();

    await prisma.pqrs.create({
      data: {
        inmuebleId: inmuebleActivo.inmueble.id,
        radicadoPorId: usuario.id,
        tipo,
        titulo,
        descripcion,
        codigoRadicado,
      },
    });

    revalidatePath("/portal/pqrs");

    return { status: "success", message: `PQRS ${codigoRadicado} radicada.` };
  } catch (error) {
    console.error("crearPqrsResidente", error);
    return { status: "error", message: "No se pudo radicar la PQRS." };
  }
}

/** Responde una PQRS y/o cambia su estado, en un solo flujo. */
export async function responderPqrs(
  _prevState: EstadoAccionPqrs,
  formData: FormData
): Promise<EstadoAccionPqrs> {
  const validado = responderPqrsSchema.safeParse({
    pqrsId: formData.get("pqrsId"),
    estado: formData.get("estado"),
    respuesta: formData.get("respuesta") ?? "",
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { pqrsId, estado, respuesta } = validado.data;

  try {
    const administrador = await getAdministradorActual();

    const pqrs = await prisma.pqrs.findFirst({
      where: {
        id: pqrsId,
        deletedAt: null,
        inmueble: {
          copropiedad: {
            administradores: { some: { usuarioId: administrador.id, deletedAt: null } },
          },
        },
      },
      select: { id: true },
    });

    if (!pqrs) {
      return { status: "error", message: "La PQRS no existe o no tienes acceso a ella." };
    }

    await prisma.pqrs.update({
      where: { id: pqrsId },
      data: {
        estado,
        fechaCierre: estado === EstadoPQRS.CERRADO ? new Date() : null,
        ...(respuesta
          ? {
              respuestaAdmin: respuesta,
              respondidoEn: new Date(),
              respondidoPorId: administrador.id,
            }
          : {}),
      },
    });

    revalidatePath("/dashboard/pqrs");
    revalidatePath("/portal/pqrs");

    return { status: "success", message: "PQRS actualizada." };
  } catch (error) {
    console.error("responderPqrs", error);
    return { status: "error", message: "No se pudo actualizar la PQRS." };
  }
}
