import type { ReservaDeResidente } from "@/lib/data/reservas";
import { EstadoReservaBadge } from "@/components/reservas/estado-reserva-badge";
import { EstadoVacio } from "@/components/ui/primitivos";
import { formatearFechaLarga, formatearHora } from "@/lib/formatters";

export function ReservasList({ reservas }: { reservas: ReservaDeResidente[] }) {
  if (reservas.length === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no tienes reservas"
        descripcion="Cuando radiques una, acá vas a ver si quedó pendiente, confirmada o cancelada."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {reservas.map((reserva) => (
        <li
          key={reserva.id}
          className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900">
              {reserva.zonaComun.nombre}
            </p>
            <p className="text-xs text-zinc-500">
              {formatearFechaLarga(reserva.fechaInicio)} ·{" "}
              {formatearHora(reserva.fechaInicio)}–{formatearHora(reserva.fechaFin)}
            </p>
            {reserva.observaciones ? (
              <p className="mt-1 text-xs text-zinc-500">
                &ldquo;{reserva.observaciones}&rdquo;
              </p>
            ) : null}
          </div>
          <div className="shrink-0">
            <EstadoReservaBadge estado={reserva.estado} />
          </div>
        </li>
      ))}
    </ul>
  );
}
