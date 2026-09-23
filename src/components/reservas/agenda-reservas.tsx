import type { ReservaConDetalle } from "@/lib/data/reservas";
import { EstadoReservaBadge } from "@/components/reservas/estado-reserva-badge";
import { GestionarReservaForm } from "@/components/reservas/gestionar-reserva-form";
import { EstadoVacio } from "@/components/ui/primitivos";
import { formatearFechaLarga, formatearHora } from "@/lib/formatters";

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
      <EstadoVacio
        titulo="No hay reservas con este filtro"
        descripcion="Los residentes radican sus reservas desde el portal. Una unidad con cuotas vencidas no puede radicar hasta ponerse a paz y salvo."
      />
    );
  }

  const dias = agruparPorDia(reservas);

  return (
    <div className="flex flex-col gap-6">
      {dias.map(([clave, reservasDelDia]) => (
        <div key={clave} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-zinc-900">
            {formatearFechaLarga(reservasDelDia[0].fechaInicio)}
          </h3>
          <ul className="flex flex-col gap-3">
            {reservasDelDia.map((reserva) => (
              <li
                key={reserva.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900">
                    {formatearHora(reserva.fechaInicio)}–
                    {formatearHora(reserva.fechaFin)} ·{" "}
                    {reserva.zonaComun.nombre}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {reserva.inmueble.identificador} ({reserva.inmueble.torre}) ·
                    solicitó {reserva.solicitadaPor.nombre}
                  </p>
                  {reserva.observaciones ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      &ldquo;{reserva.observaciones}&rdquo;
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <EstadoReservaBadge estado={reserva.estado} />
                  <GestionarReservaForm
                    reservaId={reserva.id}
                    estadoActual={reserva.estado}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
