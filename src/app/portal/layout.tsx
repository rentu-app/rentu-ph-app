import type { ReactNode } from "react";
import { Building2 } from "lucide-react";
import { getResidenteActual } from "@/lib/session";
import { PortalNav } from "@/components/portal/portal-nav";
import { SeleccionarInmuebleForm } from "@/components/portal/seleccionar-inmueble-form";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { vinculos, inmuebleActivo } = await getResidenteActual();

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight text-zinc-900">
                  Mi portal
                </p>
                <p className="truncate text-xs leading-tight text-zinc-500">
                  {inmuebleActivo
                    ? `${inmuebleActivo.inmueble.identificador} · ${inmuebleActivo.inmueble.copropiedad.nombre}`
                    : "Portal del residente"}
                </p>
              </div>
            </div>

            {vinculos.length > 1 ? (
              <SeleccionarInmuebleForm
                vinculos={vinculos}
                inmuebleActivoId={inmuebleActivo?.inmueble.id}
              />
            ) : null}
          </div>

          <PortalNav />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-[calc(3rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
