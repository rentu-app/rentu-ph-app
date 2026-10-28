"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { COOKIE_COPROPIEDAD_ACTIVA, getAdministradorActual } from "@/lib/session";
import { esCuentaDemo } from "@/lib/demo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eliminarCuentaAdministrador } from "@/lib/eliminar-cuenta";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

/**
 * Elimina la cuenta del administrador autenticado. Todo sale de la sesión: el
 * cliente solo manda el correo que escribió como confirmación, que debe ser
 * idéntico al de la cuenta. La demo está bloqueada aquí aunque la UI falle.
 */
export async function eliminarMiCuenta(
  _prevState: EstadoAccionFormulario,
  formData: FormData
): Promise<EstadoAccionFormulario> {
  const confirmacion = z.string().safeParse(formData.get("email"));
  let destino = "/?cuenta=eliminada";

  try {
    const administrador = await getAdministradorActual();

    if (esCuentaDemo(administrador.email)) {
      return { status: "error", message: "La cuenta demo no se puede eliminar." };
    }
    if (!confirmacion.success || confirmacion.data.trim() !== administrador.email) {
      return {
        status: "error",
        message: "Revisa los datos del formulario.",
        errores: { email: ["Escribe tu correo exactamente como aparece arriba"] },
      };
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const resultado = await eliminarCuentaAdministrador(administrador.id, user?.id ?? null);
    // Auth no se pudo borrar tras los reintentos: el correo puede tardar en liberarse.
    if (user && !resultado.authEliminado) destino = "/?cuenta=eliminada-parcial";

    try {
      await supabase.auth.signOut();
    } catch {
      // El usuario de Auth ya no existe: la sesión muere sola.
    }
    (await cookies()).delete(COOKIE_COPROPIEDAD_ACTIVA);
  } catch (error) {
    console.error("eliminarMiCuenta", error);
    return { status: "error", message: "No se pudo eliminar la cuenta. Intenta de nuevo." };
  }

  redirect(destino);
}
