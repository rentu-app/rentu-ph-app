// TODO: marketplace fuera del MVP, retomar después — ruta sin enlace visible
// desde la landing ni el nav (ver src/components/landing/nav-links.ts).
import type { Metadata } from "next";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { FiltrosMarketplace } from "@/components/propiedades/filtros-marketplace";
import { PropiedadCard } from "@/components/propiedades/propiedad-card";
import {
  getCopropiedadesConPublicaciones,
  getPropiedadesDisponibles,
} from "@/lib/data/propiedades";

export const metadata: Metadata = {
  title: "Propiedades en arriendo · Rentu PH",
  description: "Explora los inmuebles disponibles en arriendo en las copropiedades administradas por Rentu.",
};

export default async function PropiedadesPage(props: PageProps<"/propiedades">) {
  const searchParams = await props.searchParams;

  const copropiedadId =
    typeof searchParams.copropiedadId === "string" && searchParams.copropiedadId
      ? searchParams.copropiedadId
      : undefined;
  const habitacionesMinParam =
    typeof searchParams.habitacionesMin === "string" ? searchParams.habitacionesMin : undefined;
  const precioMaxParam =
    typeof searchParams.precioMax === "string" ? searchParams.precioMax : undefined;

  const habitacionesMin =
    habitacionesMinParam && !Number.isNaN(Number(habitacionesMinParam))
      ? Number(habitacionesMinParam)
      : undefined;
  const precioMax =
    precioMaxParam && !Number.isNaN(Number(precioMaxParam)) ? Number(precioMaxParam) : undefined;

  const [propiedades, copropiedades] = await Promise.all([
    getPropiedadesDisponibles({ copropiedadId, habitacionesMin, precioMax }),
    getCopropiedadesConPublicaciones(),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-zinc-200 bg-white py-14">
          <div className="mx-auto max-w-6xl px-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Propiedades disponibles en arriendo
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-zinc-600">
              Inmuebles publicados por los administradores de las copropiedades en Rentu.
            </p>
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
          <FiltrosMarketplace
            copropiedades={copropiedades}
            valores={{ copropiedadId, habitacionesMin: habitacionesMinParam, precioMax: precioMaxParam }}
          />

          {propiedades.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
              No hay propiedades disponibles con esos filtros por ahora.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {propiedades.map((propiedad) => (
                <PropiedadCard key={propiedad.id} propiedad={propiedad} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
