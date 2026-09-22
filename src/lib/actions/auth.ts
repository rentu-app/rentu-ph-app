"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { RolUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/password";
import { registrarAdministradorSchema } from "@/lib/validations/registro";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

export type EstadoAccionLogin = EstadoAccionFormulario;

const loginSchema = z.object({
  email: z.email("Ingresa un correo válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export async function iniciarSesion(
  _prevState: EstadoAccionLogin,
  formData: FormData
): Promise<EstadoAccionLogin> {
  const validado = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validado.success) {
    return { status: "error", message: "Ingresa un correo y contraseña válidos." };
  }

  // `redirect()` lanza una señal interna (NEXT_REDIRECT) que un catch de
  // más arriba interceptaría por error — por eso se llama SIEMPRE fuera del
  // try/catch, calculando el destino adentro.
  let destino = "/dashboard";

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword(validado.data);

    if (error) {
      return { status: "error", message: "Correo o contraseña incorrectos." };
    }

    const usuario = await prisma.usuario.findFirst({
      where: { email: validado.data.email, deletedAt: null },
      select: { rol: true },
    });
    destino = usuario?.rol === RolUsuario.ADMINISTRADOR ? "/dashboard" : "/portal";

    const destinoParam = formData.get("next");
    if (typeof destinoParam === "string" && destinoParam.startsWith("/")) {
      destino = destinoParam;
    }
  } catch (error) {
    console.error("iniciarSesion", error);
    return {
      status: "error",
      message: "No se pudo iniciar sesión. Intenta de nuevo en un momento.",
    };
  }

  redirect(destino);
}

export type EstadoAccionRegistro = EstadoAccionFormulario;

/**
 * Alta de un Administrador nuevo (self-service, sin invitación previa): crea
 * su Copropiedad desde cero. Distinto de `invitarResidente` (que vincula a
 * un residente a un inmueble YA existente de una copropiedad administrada
 * por otra persona) — aquí el usuario que se registra es quien queda como
 * único administrador de una copropiedad recién creada.
 *
 * Orden de escritura: primero Supabase Auth (si falla, no queda ningún
 * registro huérfano en Prisma); luego Prisma en una transacción. Si Supabase
 * Auth ya existía para ese correo, se reutiliza (createUser falla con
 * "already registered") y se continúa igual — puede pasar si alguien quedó
 * a medias en un intento anterior.
 */
export async function registrarAdministrador(
  _prevState: EstadoAccionRegistro,
  formData: FormData
): Promise<EstadoAccionRegistro> {
  const validado = registrarAdministradorSchema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    telefono: formData.get("telefono") ?? "",
    password: formData.get("password"),
    copropiedadNombre: formData.get("copropiedadNombre"),
    copropiedadDireccion: formData.get("copropiedadDireccion"),
    copropiedadCiudad: formData.get("copropiedadCiudad"),
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const {
    nombre,
    email,
    telefono,
    password,
    copropiedadNombre,
    copropiedadDireccion,
    copropiedadCiudad,
  } = validado.data;

  try {
    const existente = await prisma.usuario.findFirst({
      where: { email, deletedAt: null },
      select: { id: true },
    });

    if (existente) {
      return {
        status: "error",
        message: "Ya existe una cuenta con ese correo. Inicia sesión en su lugar.",
      };
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { error: errorAuth } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre },
    });

    if (errorAuth && !errorAuth.message.toLowerCase().includes("already")) {
      console.error("registrarAdministrador:createUser", errorAuth);
      return { status: "error", message: "No se pudo crear la cuenta. Intenta de nuevo." };
    }

    await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nombre,
          email,
          telefono: telefono || null,
          rol: RolUsuario.ADMINISTRADOR,
          passwordHash: hashPassword(password),
        },
      });

      const copropiedad = await tx.copropiedad.create({
        data: {
          nombre: copropiedadNombre,
          direccion: copropiedadDireccion,
          ciudad: copropiedadCiudad,
        },
      });

      await tx.administradorCopropiedad.create({
        data: { usuarioId: usuario.id, copropiedadId: copropiedad.id },
      });
    });

    const supabase = await createSupabaseServerClient();
    const { error: errorLogin } = await supabase.auth.signInWithPassword({ email, password });

    if (errorLogin) {
      console.error("registrarAdministrador:signIn", errorLogin);
      return {
        status: "success",
        message: "Cuenta creada. Inicia sesión con tu correo y contraseña.",
      };
    }
  } catch (error) {
    console.error("registrarAdministrador", error);
    return { status: "error", message: "No se pudo crear la cuenta. Intenta de nuevo." };
  }

  redirect("/dashboard");
}

export async function cerrarSesion() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("cerrarSesion", error);
  }
  redirect("/login");
}
