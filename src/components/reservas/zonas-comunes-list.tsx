import type { ZonaComunResumen } from "@/lib/data/reservas";
import { formatearMoneda } from "@/lib/formatters";
import { StaggerGrid, StaggerItem } from "@/components/ui/motion";

export function ZonasComunesList({ zonas }: { zonas: ZonaComunResumen[] }) {
  if (zonas.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Todavía no has creado zonas comunes.
      </p>
    );
  }

  return (
    <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {zonas.map((zona) => (
        <StaggerItem
          key={zona.id}
          className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{zona.nombre}</h3>
              {!zona.activa ? (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                  Inactiva
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{zona.copropiedad.nombre}</p>
            {zona.descripcion ? (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{zona.descripcion}</p>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
            <span className="text-zinc-600 dark:text-zinc-300">Aforo: {zona.aforo}</span>
            <span className="text-zinc-600 dark:text-zinc-300">
              {Number(zona.costo) > 0 ? formatearMoneda(zona.costo) : "Sin costo"}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">{zona._count.reservas} reservas</span>
          </div>
        </StaggerItem>
      ))}
    </StaggerGrid>
  );
}
