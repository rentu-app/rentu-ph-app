"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdministradorActual } from "@/lib/session";
import { esCuentaDemo } from "@/lib/demo";

/**
 * Marca el tour como visto en `user_metadata.tour_visto` del usuario en
 * Supabase Auth (sin tocar el schema de Prisma), para que no se repita al
 * cambiar de dispositivo. El id sale de la sesión, nunca del cliente. La cuenta
 * demo es compartida y no se marca: así el tour no se "gasta" para los demás.
 */
export async function marcarTourVisto(): Promise<void> {
  try {
    const administrador = await getAdministradorActual();
    if (esCuentaDemo(administrador.email)) return;

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await createSupabaseAdminClient().auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, tour_visto: true },
    });
  } catch (error) {
    console.error("marcarTourVisto", error);
  }
}
