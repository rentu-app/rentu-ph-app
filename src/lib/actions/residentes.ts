"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RolEnInmueble, RolUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdministradorActual } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generarPasswordTemporal, hashPassword } from "@/lib/password";
import { invitarResidenteSchema } from "@/lib/validations/residentes";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

export type EstadoAccionResidente = EstadoAccionFormulario;

/**
 * Da de alta a un residente: lo vincula a un inmueble de una copropiedad
 * administrada por el usuario autenticado y le crea acceso en Supabase Auth
 * con una contraseña temporal (no hay proveedor de email configurado, así
 * que se devuelve una sola vez en el mensaje de éxito para que el
 * administrador se la comparta manualmente).
 */
export async function invitarResidente(
  _prevState: EstadoAccionResidente,
  formData: FormData
): Promise<EstadoAccionResidente> {
  const validado = invitarResidenteSchema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    telefono: formData.get("telefono") ?? "",
    rol: formData.get("rol"),
    inmuebleId: formData.get("inmuebleId"),
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { nombre, email, telefono, rol, inmuebleId } = validado.data;

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
      select: { id: true, identificador: true },
    });

    if (!inmueble) {
      return { status: "error", message: "El inmueble no existe o no tienes acceso a él." };
    }

    const rolUsuario =
      rol === RolEnInmueble.PROPIETARIO ? RolUsuario.PROPIETARIO : RolUsuario.INQUILINO;

    const { yaVinculado } = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.upsert({
        where: { email },
        update: {},
        create: {
          nombre,
          email,
          telefono: telefono || null,
          rol: rolUsuario,
          passwordHash: hashPassword(generarPasswordTemporal()),
        },
      });

      const vinculoExistente = await tx.usuarioInmueble.findFirst({
        where: { usuarioId: usuario.id, inmuebleId, activo: true, deletedAt: null },
        select: { id: true },
      });

      if (!vinculoExistente) {
        await tx.usuarioInmueble.create({ data: { usuarioId: usuario.id, inmuebleId, rol } });
      }

      return { usuario, yaVinculado: !!vinculoExistente };
    });

    let mensajeAcceso = "";

    // Trabajo de red (Supabase Auth) fuera de la transacción de Prisma.
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: listado, error: errorListado } = await supabaseAdmin.auth.admin.listUsers();

    if (errorListado) {
      console.error("invitarResidente:listUsers", errorListado);
    } else if (!listado.users.some((usuarioAuth) => usuarioAuth.email === email)) {
      const passwordTemporal = generarPasswordTemporal();
      const { error: errorCreate } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: passwordTemporal,
        email_confirm: true,
        user_metadata: { nombre },
      });

      if (errorCreate) {
        console.error("invitarResidente:createUser", errorCreate);
      } else {
        mensajeAcceso = ` Contraseña temporal: ${passwordTemporal} (compártela ahora, no vuelve a mostrarse).`;
      }
    }

    revalidatePath("/dashboard/residentes");
    revalidatePath("/dashboard/cartera");

    return {
      status: "success",
      message: yaVinculado
        ? `${nombre} ya estaba vinculado(a) a ${inmueble.identificador}.`
        : `${nombre} vinculado(a) a ${inmueble.identificador}.${mensajeAcceso}`,
    };
  } catch (error) {
    console.error("invitarResidente", error);
    return { status: "error", message: "No se pudo invitar al residente." };
  }
}
