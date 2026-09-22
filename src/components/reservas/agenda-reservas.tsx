import type { ReservaConDetalle } from "@/lib/data/reservas";
import { EstadoReservaBadge } from "@/components/reservas/estado-reserva-badge";
import { GestionarReservaForm } from "@/components/reservas/gestionar-reserva-form";
import { formatearFechaLarga, formatearHora } from "@/lib/formatters";
import { StaggerList, StaggerListItem } from "@/components/ui/motion";

function agruparPorDia(reservas: ReservaConDetalle[]) {
  const grupos = new Map<string, ReservaConDetalle[]>();
  for (const reserva of reservas) {
    const clave = new Date(reserva.fechaInicio).toISOString().slice(0, 10);
    const lista = grupos.get(clave) ?? [];
    lista.push(reserva);
    grupos.set(clave, lista);
  }
  return Array.from(grupos.entries());
}

export function AgendaReservas({ reservas }: { reservas: ReservaConDetalle[] }) {
  if (reservas.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No hay reservas que coincidan con este filtro.
      </p>
    );
  }

  const dias = agruparPorDia(reservas);

  return (
    <div className="flex flex-col gap-6">
      {dias.map(([clave, reservasDelDia]) => (
        <div key={clave} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {formatearFechaLarga(reservasDelDia[0].fechaInicio)}
          </h3>
          <StaggerList className="flex flex-col gap-3">
            {reservasDelDia.map((reserva) => (
              <StaggerListItem
                key={reserva.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {formatearHora(reserva.fechaInicio)}–{formatearHora(reserva.fechaFin)} ·{" "}
                    {reserva.zonaComun.nombre}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {reserva.zonaComun.copropiedad.nombre} · {reserva.inmueble.identificador} ·
                    solicitado por {reserva.solicitadaPor.nombre}
                  </p>
                  {reserva.observaciones ? (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      &ldquo;{reserva.observaciones}&rdquo;
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <EstadoReservaBadge estado={reserva.estado} />
                  <GestionarReservaForm reservaId={reserva.id} estadoActual={reserva.estado} />
                </div>
              </StaggerListItem>
            ))}
          </StaggerList>
        </div>
      ))}
    </div>
  );
}
