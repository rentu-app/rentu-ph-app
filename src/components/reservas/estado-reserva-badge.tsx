import { EstadoReserva } from "@prisma/client";
import { Etiqueta, type TonoEtiqueta } from "@/components/ui/primitivos";

export const ETIQUETAS_ESTADO_RESERVA: Record<EstadoReserva, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
};

const TONOS: Record<EstadoReserva, TonoEtiqueta> = {
  PENDIENTE: "alerta",
  CONFIRMADA: "exito",
  CANCELADA: "neutro",
};

export function EstadoReservaBadge({ estado }: { estado: EstadoReserva }) {
  return <Etiqueta tono={TONOS[estado]}>{ETIQUETAS_ESTADO_RESERVA[estado]}</Etiqueta>;
}
