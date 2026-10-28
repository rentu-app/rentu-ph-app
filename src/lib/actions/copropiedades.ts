"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { COOKIE_COPROPIEDAD_ACTIVA, getAdministradorActual } from "@/lib/session";
import { getCopropiedadPorId } from "@/lib/data/copropiedad";
import { copropiedadNuevaSchema } from "@/lib/validations/unidades";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

const TREINTA_DIAS = 60 * 60 * 24 * 30;

async function guardarCopropiedadActiva(copropiedadId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_COPROPIEDAD_ACTIVA, copropiedadId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TREINTA_DIAS,
  });
}

/**
 * Fija la copropiedad activa. El id llega del cliente (un `<input hidden>`),
 * así que NUNCA se guarda tal cual: primero se comprueba en la base que el
 * administrador autenticado esté vinculado a esa copropiedad. Si no lo está,
 * no se escribe la cookie.
 */
export async function seleccionarCopropiedad(formData: FormData): Promise<void> {
  const id = z.uuid().safeParse(formData.get("copropiedadId"));
  if (!id.success) redirect("/seleccionar-copropiedad");

  const administrador = await getAdministradorActual();
  const copropiedad = await getCopropiedadPorId(id.data, administrador.id);
  if (!copropiedad) redirect("/seleccionar-copropiedad");

  await guardarCopropiedadActiva(copropiedad.id);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

/**
 * Crea una copropiedad nueva desde adentro y deja al administrador como su
 * administrador, con ella como activa. Misma regla que el registro: el NIT,
 * si se da, es único.
 */
export async function crearCopropiedad(
  _prevState: EstadoAccionFormulario,
  formData: FormData
): Promise<EstadoAccionFormulario> {
  const validado = copropiedadNuevaSchema.safeParse({
    nombre: formData.get("nombre"),
    nit: formData.get("nit") ?? "",
    direccion: formData.get("direccion"),
    ciudad: formData.get("ciudad"),
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { nombre, nit, direccion, ciudad } = validado.data;
  let copropiedadId: string;

  try {
    const administrador = await getAdministradorActual();

    if (nit) {
      const conMismoNit = await prisma.copropiedad.findFirst({
        where: { nit },
        select: { id: true },
      });
      if (conMismoNit) {
        return {
          status: "error",
          message: "Revisa los datos del formulario.",
          errores: { nit: ["Ya existe una copropiedad con ese NIT"] },
        };
      }
    }

    const copropiedad = await prisma.copropiedad.create({
      data: {
        nombre,
        nit,
        direccion,
        ciudad,
        administradores: { create: { usuarioId: administrador.id } },
      },
      select: { id: true },
    });
    copropiedadId = copropiedad.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "error",
        message: "Revisa los datos del formulario.",
        errores: { nit: ["Ya existe una copropiedad con ese NIT"] },
      };
    }
    console.error("crearCopropiedad", error);
    return { status: "error", message: "No se pudo crear la copropiedad." };
  }

  await guardarCopropiedadActiva(copropiedadId);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/unidades");
}
