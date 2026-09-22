import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-gradient-to-b from-brand-50 to-white" />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-800">
            Propiedad Horizontal, sin fricción
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
            La plataforma inteligente de{" "}
            <span className="text-brand-700">gestión operativa</span> para
            Propiedad Horizontal.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600">
            Cartera al día, PQRS con trazabilidad, reservas que se bloquean
            solas cuando un inmueble no está a paz y salvo, y un Copiloto con
            IA que responde el reglamento por ti.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm shadow-brand-600/20 transition-colors hover:bg-brand-700"
            >
              Probar Demo Admin
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
