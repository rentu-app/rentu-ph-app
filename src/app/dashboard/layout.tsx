import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { ArrowLeftRight, MapPin } from "lucide-react";
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
 * La copropiedad activa vive en el header (con el selector para cambiarla)
 * porque toda la app opera sobre una sola a la vez: es el contexto
 * permanente, no un dato que se elige en cada pantalla.
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
            <Logo altura={36} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div data-tour="selector-copropiedad" className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-zinc-900">
                  {copropiedad?.nombre ?? "Rentu"}
                </p>
                {copropiedad ? (
                  <p className="flex items-center gap-1 truncate text-xs leading-tight text-zinc-500">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {copropiedad.direccion} · {copropiedad.ciudad} · {copropiedad.totalUnidades}{" "}
                      unidades
                    </span>
                  </p>
                ) : null}
              </div>
            </div>
            <Link
              href="/seleccionar-copropiedad"
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 sm:min-h-9"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Cambiar copropiedad</span>
              <span className="sm:hidden">Cambiar</span>
            </Link>
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
