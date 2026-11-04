"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getContextoAdministrador } from "@/lib/session";
import { editarRubroSchema, rubroSchema } from "@/lib/validations/rubros";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

function leer(formData: FormData) {
  return {
    nombre: formData.get("nombre"),
    monto: formData.get("monto"),
    periodicidad: formData.get("periodicidad"),
    activo: formData.get("activo") === "on",
  };
}

function revalidarRubros() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cartera");
}

export async function crearRubro(
  _prevState: EstadoAccionFormulario,
  formData: FormData
): Promise<EstadoAccionFormulario> {
  const validado = rubroSchema.safeParse(leer(formData));
  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }
  const { nombre, monto, periodicidad, activo } = validado.data;

  try {
    const { copropiedad } = await getContextoAdministrador();
    if (!copropiedad) {
      return { status: "error", message: "No tienes una copropiedad asignada todavía." };
    }
    await prisma.rubroCobro.create({
      data: {
        copropiedadId: copropiedad.id,
        nombre,
        monto: new Prisma.Decimal(monto),
        periodicidad,
        activo,
      },
    });
    revalidarRubros();
    return { status: "success", message: `Rubro "${nombre}" creado.` };
  } catch (error) {
    console.error("crearRubro", error);
    return { status: "error", message: "No se pudo crear el rubro." };
  }
}

export async function actualizarRubro(
  _prevState: EstadoAccionFormulario,
  formData: FormData
): Promise<EstadoAccionFormulario> {
  const validado = editarRubroSchema.safeParse({ ...leer(formData), rubroId: formData.get("rubroId") });
  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }
  const { rubroId, nombre, monto, periodicidad, activo } = validado.data;

  try {
    const { copropiedad } = await getContextoAdministrador();
    if (!copropiedad) {
      return { status: "error", message: "No tienes una copropiedad asignada todavía." };
    }
    const { count } = await prisma.rubroCobro.updateMany({
      where: { id: rubroId, copropiedadId: copropiedad.id, deletedAt: null },
      data: { nombre, monto: new Prisma.Decimal(monto), periodicidad, activo },
    });
    if (count === 0) {
      return { status: "error", message: "El rubro no existe en esta copropiedad." };
    }
    revalidarRubros();
    return { status: "success", message: `Rubro "${nombre}" actualizado.` };
  } catch (error) {
    console.error("actualizarRubro", error);
    return { status: "error", message: "No se pudo actualizar el rubro." };
  }
}

export async function eliminarRubro(
  _prevState: EstadoAccionFormulario,
  formData: FormData
): Promise<EstadoAccionFormulario> {
  const id = z.uuid().safeParse(formData.get("rubroId"));
  if (!id.success) return { status: "error", message: "Rubro inválido." };

  try {
    const { copropiedad } = await getContextoAdministrador();
    if (!copropiedad) {
      return { status: "error", message: "No tienes una copropiedad asignada todavía." };
    }
    const { count } = await prisma.rubroCobro.updateMany({
      where: { id: id.data, copropiedadId: copropiedad.id, deletedAt: null },
      data: { deletedAt: new Date(), activo: false },
    });
    if (count === 0) {
      return { status: "error", message: "El rubro no existe en esta copropiedad." };
    }
    revalidarRubros();
    return { status: "success", message: "Rubro eliminado." };
  } catch (error) {
    console.error("eliminarRubro", error);
    return { status: "error", message: "No se pudo eliminar el rubro." };
  }
}
