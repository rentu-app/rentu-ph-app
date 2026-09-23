import type { ZonaComunResumen } from "@/lib/data/reservas";
import { EstadoVacio, Etiqueta } from "@/components/ui/primitivos";
import { formatearMoneda } from "@/lib/formatters";

export function ZonasComunesList({ zonas }: { zonas: ZonaComunResumen[] }) {
  if (zonas.length === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no hay zonas comunes"
        descripcion="Crea el salón social, la zona BBQ o las canchas para que los residentes puedan reservarlas."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {zonas.map((zona) => (
        <li
          key={zona.id}
          className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-zinc-900">{zona.nombre}</h3>
              {!zona.activa ? <Etiqueta tono="neutro">Inactiva</Etiqueta> : null}
            </div>
            {zona.descripcion ? (
              <p className="mt-2 text-sm text-zinc-600">{zona.descripcion}</p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-100 pt-4 text-sm text-zinc-600">
            <span>Aforo {zona.aforo}</span>
            <span>{zona.costo > 0 ? formatearMoneda(zona.costo) : "Sin costo"}</span>
            <span className="text-zinc-500">{zona._count.reservas} reservas</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
