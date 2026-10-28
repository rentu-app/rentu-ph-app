"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getContextoAdministrador } from "@/lib/session";
import { editarUnidadSchema, unidadManualSchema } from "@/lib/validations/unidades";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

export type EstadoAccionUnidad = EstadoAccionFormulario;

const SIN_COPROPIEDAD: EstadoAccionUnidad = {
  status: "error",
  message: "No tienes una copropiedad asignada todavía.",
};

function revalidarUnidades() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/unidades");
  revalidatePath("/dashboard/cartera");
  revalidatePath("/dashboard/residentes");
}

function errorIdentificadorRepetido(identificador: string): EstadoAccionUnidad {
  return {
    status: "error",
    message: "Revisa los datos del formulario.",
    errores: { identificador: [`Ya existe "${identificador}" en esta copropiedad`] },
  };
}

function leerCampos(formData: FormData) {
  return {
    torre: formData.get("torre") ?? "",
    identificador: formData.get("identificador"),
    coeficiente: formData.get("coeficiente"),
    areaM2: formData.get("areaM2") ?? "",
    estado: formData.get("estado"),
  };
}

/**
 * Alta manual de una unidad en la copropiedad activa. El identificador es
 * único por copropiedad: si existe una fila borrada (soft delete) con ese
 * identificador, se reactiva en vez de chocar con el índice único.
 */
export async function crearUnidad(
  _prevState: EstadoAccionUnidad,
  formData: FormData
): Promise<EstadoAccionUnidad> {
  const validado = unidadManualSchema.safeParse(leerCampos(formData));

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { torre, identificador, coeficiente, areaM2, estado } = validado.data;
  const datos = {
    torre,
    coeficiente: new Prisma.Decimal(coeficiente),
    areaM2: areaM2 ? new Prisma.Decimal(areaM2) : null,
    estado,
  };

  try {
    const { copropiedad } = await getContextoAdministrador();
    if (!copropiedad) return SIN_COPROPIEDAD;

    const existente = await prisma.inmueble.findUnique({
      where: {
        copropiedadId_identificador: { copropiedadId: copropiedad.id, identificador },
      },
      select: { id: true, deletedAt: true },
    });

    if (existente && existente.deletedAt === null) {
      return errorIdentificadorRepetido(identificador);
    }

    if (existente) {
      await prisma.inmueble.update({
        where: { id: existente.id },
        data: { ...datos, deletedAt: null },
      });
    } else {
      await prisma.inmueble.create({
        data: { copropiedadId: copropiedad.id, identificador, ...datos },
      });
    }

    revalidarUnidades();
    return { status: "success", message: `Unidad "${identificador}" guardada.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorIdentificadorRepetido(identificador);
    }
    console.error("crearUnidad", error);
    return { status: "error", message: "No se pudo guardar la unidad." };
  }
}

export async function actualizarUnidad(
  _prevState: EstadoAccionUnidad,
  formData: FormData
): Promise<EstadoAccionUnidad> {
  const validado = editarUnidadSchema.safeParse({
    ...leerCampos(formData),
    inmuebleId: formData.get("inmuebleId"),
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { inmuebleId, torre, identificador, coeficiente, areaM2, estado } = validado.data;

  try {
    const { copropiedad } = await getContextoAdministrador();
    if (!copropiedad) return SIN_COPROPIEDAD;

    // El filtro por `copropiedadId` es lo que impide editar una unidad de
    // otra copropiedad mandando su id.
    const unidad = await prisma.inmueble.findFirst({
      where: { id: inmuebleId, copropiedadId: copropiedad.id, deletedAt: null },
      select: { id: true },
    });
    if (!unidad) {
      return { status: "error", message: "La unidad no existe en esta copropiedad." };
    }

    const repetido = await prisma.inmueble.findFirst({
      where: {
        copropiedadId: copropiedad.id,
        identificador,
        id: { not: unidad.id },
      },
      select: { id: true },
    });
    if (repetido) return errorIdentificadorRepetido(identificador);

    await prisma.inmueble.update({
      where: { id: unidad.id },
      data: {
        torre,
        identificador,
        coeficiente: new Prisma.Decimal(coeficiente),
        areaM2: areaM2 ? new Prisma.Decimal(areaM2) : null,
        estado,
      },
    });

    revalidarUnidades();
    return { status: "success", message: `Unidad "${identificador}" actualizada.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorIdentificadorRepetido(identificador);
    }
    console.error("actualizarUnidad", error);
    return { status: "error", message: "No se pudo actualizar la unidad." };
  }
}

/**
 * Eliminación lógica (soft delete): la unidad deja de aparecer en cartera,
 * residentes y sumas de coeficiente, pero su historial financiero se
 * conserva por trazabilidad (Ley 675).
 */
export async function eliminarUnidad(
  _prevState: EstadoAccionUnidad,
  formData: FormData
): Promise<EstadoAccionUnidad> {
  const id = z.uuid().safeParse(formData.get("inmuebleId"));
  if (!id.success) return { status: "error", message: "Unidad inválida." };

  try {
    const { copropiedad } = await getContextoAdministrador();
    if (!copropiedad) return SIN_COPROPIEDAD;

    const { count } = await prisma.inmueble.updateMany({
      where: { id: id.data, copropiedadId: copropiedad.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (count === 0) {
      return { status: "error", message: "La unidad no existe en esta copropiedad." };
    }

    revalidarUnidades();
    return { status: "success", message: "Unidad eliminada." };
  } catch (error) {
    console.error("eliminarUnidad", error);
    return { status: "error", message: "No se pudo eliminar la unidad." };
  }
}
