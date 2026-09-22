import { EstadoReserva } from "@prisma/client";

const ESTILOS: Record<EstadoReserva, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700 ring-amber-600/20",
  CONFIRMADA: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CANCELADA: "bg-zinc-100 text-zinc-500 ring-zinc-500/20",
};

export const ETIQUETAS_ESTADO_RESERVA: Record<EstadoReserva, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
};

const PUNTOS: Record<EstadoReserva, string> = {
  PENDIENTE: "bg-amber-500 animate-pulse",
  CONFIRMADA: "bg-emerald-500",
  CANCELADA: "bg-zinc-400",
};

export function EstadoReservaBadge({ estado }: { estado: EstadoReserva }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${ESTILOS[estado]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${PUNTOS[estado]}`} />
      {ETIQUETAS_ESTADO_RESERVA[estado]}
    </span>
  );
}
