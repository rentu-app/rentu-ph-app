import type { PqrsConDetalle } from "@/lib/data/pqrs";
import { EstadoPqrsBadge } from "@/components/pqrs/estado-pqrs-badge";
import { ResponderPqrsForm } from "@/components/pqrs/responder-pqrs-form";
import { formatearFecha } from "@/lib/formatters";
import { StaggerList, StaggerListItem } from "@/components/ui/motion";

const ETIQUETAS_TIPO: Record<string, string> = {
  PETICION: "Petición",
  QUEJA: "Queja",
  RECLAMO: "Reclamo",
  SUGERENCIA: "Sugerencia",
  FALLA: "Falla",
};

export function PqrsList({ items }: { items: PqrsConDetalle[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No hay PQRS que coincidan con este filtro.
      </p>
    );
  }

  return (
    <StaggerList className="flex flex-col gap-3">
      {items.map((pqrs) => (
        <StaggerListItem
          key={pqrs.id}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-mono text-zinc-400">{pqrs.codigoRadicado}</p>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{pqrs.titulo}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {ETIQUETAS_TIPO[pqrs.tipo] ?? pqrs.tipo} · {pqrs.inmueble.identificador} —{" "}
                {pqrs.inmueble.copropiedad.nombre} · radicada por {pqrs.radicadoPor.nombre}
                {pqrs.dirigidoA ? ` · dirigida a ${pqrs.dirigidoA.nombre}` : ""} ·{" "}
                {formatearFecha(pqrs.createdAt)}
              </p>
            </div>
            <EstadoPqrsBadge estado={pqrs.estado} />
          </div>

          <p className="text-sm text-zinc-700 dark:text-zinc-300">{pqrs.descripcion}</p>

          {pqrs.respuestaAdmin ? (
            <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Respuesta del Administrador
                {pqrs.respondidoEn ? ` · ${formatearFecha(pqrs.respondidoEn)}` : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{pqrs.respuestaAdmin}</p>
            </div>
          ) : null}

          <ResponderPqrsForm
            pqrsId={pqrs.id}
            estadoActual={pqrs.estado}
            respuestaActual={pqrs.respuestaAdmin}
          />
        </StaggerListItem>
      ))}
    </StaggerList>
  );
}
