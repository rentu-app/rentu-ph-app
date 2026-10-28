"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { RolUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EMAIL_DEMO_ADMIN, esCuentaDemo } from "@/lib/demo";
import { COOKIE_COPROPIEDAD_ACTIVA } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { registrarAdministradorSchema } from "@/lib/validations/registro";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

export type EstadoAccionLogin = EstadoAccionFormulario;

/**
 * La copropiedad activa no sobrevive a un cambio de sesión: cada inicio de
 * sesión (o registro) parte de cero, así una cookie dejada por otra persona
 * en el mismo navegador nunca decide qué copropiedad se abre.
 */
async function olvidarCopropiedadActiva() {
  (await cookies()).delete(COOKIE_COPROPIEDAD_ACTIVA);
}

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
      select: { rol: true, email: true },
    });
    destino = usuario?.rol === RolUsuario.ADMINISTRADOR ? "/dashboard" : "/portal";

    // Todo administrador pasa por /seleccionar-copropiedad después del login,
    // aunque tenga una sola. Excepción: la cuenta demo, que entra directo a
    // Altos de Salitre.
    if (usuario?.rol === RolUsuario.ADMINISTRADOR) {
      await olvidarCopropiedadActiva();
      if (!esCuentaDemo(usuario.email)) destino = "/seleccionar-copropiedad";
    }

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

/**
 * Entrada de un clic a la cuenta demo de administrador. La contraseña se lee
 * de `DEMO_ADMIN_PASSWORD` en el servidor y nunca viaja al HTML: la cuenta
 * demo comparte contraseña con otras cuentas sembradas, así que no se
 * publica en la página.
 */
export async function entrarComoDemo(): Promise<EstadoAccionLogin> {
  const password = process.env.DEMO_ADMIN_PASSWORD;
  if (!password) {
    return { status: "error", message: "La demo no está disponible en este momento." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: EMAIL_DEMO_ADMIN,
      password,
    });
    if (error) {
      console.error("entrarComoDemo", error.message);
      return { status: "error", message: "No se pudo entrar a la demo. Intenta de nuevo." };
    }
    await olvidarCopropiedadActiva();
  } catch (error) {
    console.error("entrarComoDemo", error);
    return { status: "error", message: "No se pudo entrar a la demo. Intenta de nuevo." };
  }

  redirect("/dashboard");
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

    await olvidarCopropiedadActiva();
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
    await olvidarCopropiedadActiva();
  } catch (error) {
    console.error("cerrarSesion", error);
  }
  redirect("/login");
}
