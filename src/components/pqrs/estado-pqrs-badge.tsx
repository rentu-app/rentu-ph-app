import { EstadoPQRS } from "@prisma/client";
import { Etiqueta, type TonoEtiqueta } from "@/components/ui/primitivos";

export const ETIQUETAS_ESTADO_PQRS: Record<EstadoPQRS, string> = {
  ABIERTO: "Pendiente",
  EN_PROCESO: "En gestión",
  CERRADO: "Cerrada",
};

const TONOS: Record<EstadoPQRS, TonoEtiqueta> = {
  ABIERTO: "alerta",
  EN_PROCESO: "info",
  CERRADO: "exito",
};

export function EstadoPqrsBadge({ estado }: { estado: EstadoPQRS }) {
  return <Etiqueta tono={TONOS[estado]}>{ETIQUETAS_ESTADO_PQRS[estado]}</Etiqueta>;
}
