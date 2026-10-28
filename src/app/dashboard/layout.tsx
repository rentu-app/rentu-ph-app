import { Logo } from "@/components/ui/logo";
import { SelectorCopropiedad } from "@/components/dashboard/selector-copropiedad";
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
  const { copropiedad, copropiedades } = await getContextoAdministrador();

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Logo altura={36} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <SelectorCopropiedad
                copropiedades={copropiedades}
                activaId={copropiedad?.id}
              />
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
