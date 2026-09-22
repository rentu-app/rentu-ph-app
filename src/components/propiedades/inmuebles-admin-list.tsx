import type { ReactNode } from "react";
import type { InmuebleParaMarketplace } from "@/lib/data/propiedades";
import { ToggleDisponibilidadForm } from "@/components/propiedades/toggle-disponibilidad-form";
import { formatearMoneda } from "@/lib/formatters";
import { FadeIn } from "@/components/ui/motion";

export function InmueblesAdminList({
  inmuebles,
}: {
  inmuebles: InmuebleParaMarketplace[];
}) {
  if (inmuebles.length === 0) {
    return <p className="text-sm text-zinc-500">No tienes inmuebles registrados.</p>;
  }

  return (
    <FadeIn className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <Th>Inmueble</Th>
            <Th>Copropiedad</Th>
            <Th>Canon</Th>
            <Th>Detalles</Th>
            <Th>Estado en el marketplace</Th>
            <Th>Acciones</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {inmuebles.map((inmueble) => (
            <tr key={inmueble.id}>
              <Td className="flex items-center gap-3 font-medium text-zinc-900">
                {inmueble.imagenUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- foto externa de Unsplash
                  <img
                    src={inmueble.imagenUrl}
                    alt=""
                    className="h-10 w-14 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <span className="h-10 w-14 shrink-0 rounded-md bg-zinc-100" />
                )}
                {inmueble.identificador}
              </Td>
              <Td className="text-zinc-500">{inmueble.copropiedad.nombre}</Td>
              <Td className="tabular-nums">
                {inmueble.canonArriendo ? formatearMoneda(inmueble.canonArriendo) : "—"}
              </Td>
              <Td className="text-zinc-500">
                {inmueble.areaM2 ? `${Number(inmueble.areaM2)} m²` : "—"}
                {inmueble.habitaciones ? ` · ${inmueble.habitaciones} hab` : ""}
                {inmueble.banos ? ` · ${inmueble.banos} baños` : ""}
              </Td>
              <Td>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                    inmueble.disponibleArriendo
                      ? "bg-brand-50 text-brand-700 ring-brand-600/20"
                      : "bg-zinc-100 text-zinc-500 ring-zinc-500/20"
                  }`}
                >
                  {inmueble.disponibleArriendo ? "Publicado" : "No publicado"}
                </span>
              </Td>
              <Td>
                <ToggleDisponibilidadForm
                  inmuebleId={inmueble.id}
                  disponibleArriendo={inmueble.disponibleArriendo}
                />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </FadeIn>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-sm text-zinc-700 ${className}`}>{children}</td>;
}
