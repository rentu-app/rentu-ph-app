// TODO: marketplace fuera del MVP, retomar después — ya no se renderiza en
// src/app/page.tsx, se conserva el componente para cuando se retome.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPropiedadesDisponibles } from "@/lib/data/propiedades";
import { PropiedadCard } from "@/components/propiedades/propiedad-card";

export async function PropiedadesDestacadas() {
  const propiedades = await getPropiedadesDisponibles();
  const destacadas = propiedades.slice(0, 3);

  if (destacadas.length === 0) return null;

  return (
    <section className="bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Propiedades destacadas
            </h2>
            <p className="mt-3 text-lg text-zinc-600">
              Inmuebles disponibles hoy en las copropiedades de Rentu.
            </p>
          </div>
          <Link
            href="/propiedades"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Ver todas las propiedades
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destacadas.map((propiedad) => (
            <PropiedadCard key={propiedad.id} propiedad={propiedad} />
          ))}
        </div>
      </div>
    </section>
  );
}
