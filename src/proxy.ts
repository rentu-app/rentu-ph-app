import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/proxy";

/**
 * `proxy.ts` es el reemplazo de `middleware.ts` en Next.js 16
 * (`middleware` quedó deprecado — ver node_modules/next/dist/docs/.../proxy.md).
 */
export function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
