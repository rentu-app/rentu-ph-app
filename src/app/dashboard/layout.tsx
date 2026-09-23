import { Building2, MapPin } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { getContextoAdministrador } from "@/lib/session";

/**
 * Shell del área de administración.
 *
 * Cambios de rendimiento respecto a la versión anterior:
 *   - El header era `bg-white/85 backdrop-blur` y estaba `sticky`. Un
 *     `backdrop-filter` sobre un elemento fijo obliga al navegador a
 *     recomponer el desenfoque de todo lo que pasa por debajo en cada frame
 *     del scroll; en Safari móvil es el causante clásico del scroll a
 *     tirones. Ahora es un header sólido y opaco.
 *   - Se eliminaron dos capas decorativas (`blur-3xl` + gradiente de 420 px
 *     de alto) que se repintaban con el scroll sin aportar información.
 *
 * El nombre de la copropiedad vive en el header porque toda la app opera
 * sobre una sola: es el contexto permanente, no un dato que se elige en cada
 * pantalla.
 */
export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const { copropiedad } = await getContextoAdministrador();

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-zinc-900">
                {copropiedad?.nombre ?? "Rentu"}
              </p>
              {copropiedad ? (
                <p className="flex items-center gap-1 truncate text-xs leading-tight text-zinc-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {copropiedad.direccion} · {copropiedad.ciudad} ·{" "}
                  {copropiedad.totalUnidades} unidades
                </p>
              ) : (
                <p className="text-xs leading-tight text-zinc-500">
                  Tablero operativo de PH
                </p>
              )}
            </div>
          </div>
          <DashboardNav />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-[calc(3rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
