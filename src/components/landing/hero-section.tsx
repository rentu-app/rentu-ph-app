import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";

/**
 * La promesa de la landing es la misma que cumple el producto: entender y
 * gestionar la cartera de UNA copropiedad. Se retiró todo el lenguaje de
 * marketplace/arriendos y las afirmaciones de automatización que el MVP no
 * hace (no envía correos, no aplica mora sola, no inicia cobros jurídicos).
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-brand-50 to-white"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="inline-flex items-center rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-800">
            Para administradores de propiedad horizontal
          </span>

          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
            La cartera de tu copropiedad,{" "}
            <span className="text-brand-700">clara en una sola pantalla</span>.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            Cuánto se debe, qué torre concentra la mora, qué apartamentos hay que
            llamar hoy y en qué etapa va cada caso. Con reservas de zonas comunes
            que respetan el paz y salvo y PQRS con trazabilidad.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              Entrar a la demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#modulos"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-zinc-300 bg-white px-6 text-base font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Ver qué incluye
            </Link>
          </div>

          <p className="mt-5 max-w-xl text-xs text-zinc-500">
            Producto en construcción. La demo trabaja con datos ficticios y hay
            partes marcadas como simulación: el envío de avisos de cobro queda
            registrado pero no sale por correo ni WhatsApp.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
