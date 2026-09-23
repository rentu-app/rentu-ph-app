import type { PqrsDeResidente } from "@/lib/data/pqrs";
import { EstadoPqrsBadge } from "@/components/pqrs/estado-pqrs-badge";
import { EstadoVacio } from "@/components/ui/primitivos";
import { formatearFecha } from "@/lib/formatters";

const ETIQUETAS_TIPO: Record<string, string> = {
  PETICION: "Petición",
  QUEJA: "Queja",
  RECLAMO: "Reclamo",
  SUGERENCIA: "Sugerencia",
  FALLA: "Falla",
};

export function PqrsList({
  items,
  usuarioId,
}: {
  items: PqrsDeResidente[];
  usuarioId: string;
}) {
  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no tienes PQRS"
        descripcion="Cuando radiques una, acá vas a ver su número de radicado y la respuesta de la administración."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((pqrs) => {
        const dirigidaHaciaTi =
          pqrs.dirigidoAId === usuarioId && pqrs.radicadoPorId !== usuarioId;

        return (
          <li
            key={pqrs.id}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-xs text-zinc-400">
                  {pqrs.codigoRadicado}
                </p>
                <h3 className="font-semibold text-zinc-900">{pqrs.titulo}</h3>
                <p className="text-xs text-zinc-500">
                  {ETIQUETAS_TIPO[pqrs.tipo] ?? pqrs.tipo} ·{" "}
                  {dirigidaHaciaTi
                    ? "dirigida a ti por la administración"
                    : `radicada por ${pqrs.radicadoPor.nombre}`}{" "}
                  · {formatearFecha(pqrs.createdAt)}
                </p>
              </div>
              <div className="shrink-0">
                <EstadoPqrsBadge estado={pqrs.estado} />
              </div>
            </div>

            <p className="whitespace-pre-wrap text-sm text-zinc-700">
              {pqrs.descripcion}
            </p>

            {pqrs.respuestaAdmin ? (
              <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
                <p className="text-xs font-medium text-zinc-500">
                  Respuesta de la administración
                  {pqrs.respondidoEn ? ` · ${formatearFecha(pqrs.respondidoEn)}` : ""}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{pqrs.respuestaAdmin}</p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
