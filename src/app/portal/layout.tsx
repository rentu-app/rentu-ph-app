import type { ReactNode } from "react";
import { getResidenteActual } from "@/lib/session";
import { PortalNav } from "@/components/portal/portal-nav";
import { SeleccionarInmuebleForm } from "@/components/portal/seleccionar-inmueble-form";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { vinculos, inmuebleActivo } = await getResidenteActual();

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white pt-[env(safe-area-inset-top)]">
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-zinc-900">Rentu</p>
            <p className="truncate text-xs text-zinc-500">
              {inmuebleActivo
                ? `${inmuebleActivo.inmueble.identificador} — ${inmuebleActivo.inmueble.copropiedad.nombre}`
                : "Portal del residente"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {vinculos.length > 1 ? (
              <SeleccionarInmuebleForm
                vinculos={vinculos}
                inmuebleActivoId={inmuebleActivo?.inmueble.id}
              />
            ) : null}
            <PortalNav />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6">
        {children}
      </main>
    </div>
  );
}
