import { EstadoCuenta, EtapaCobro } from "@prisma/client";
import { Etiqueta, type TonoEtiqueta } from "@/components/ui/primitivos";
import { ETIQUETAS_ETAPA_COBRO } from "@/lib/validations/cartera";

const TONO_CUENTA: Record<EstadoCuenta, TonoEtiqueta> = {
  PENDIENTE: "alerta",
  PAGADA: "exito",
  VENCIDA: "peligro",
  EN_MORA: "peligro",
};

const ETIQUETAS_CUENTA: Record<EstadoCuenta, string> = {
  PENDIENTE: "Pendiente",
  PAGADA: "Pagada",
  VENCIDA: "Vencida",
  EN_MORA: "En mora",
};

/**
 * Los puntos ya no pulsan (`animate-pulse`). Una animación infinita obliga al
 * navegador a repintar en cada frame mientras el elemento está en pantalla, y
 * con una tabla de 24 unidades eran 24 animaciones permanentes compitiendo
 * con el scroll.
 */
export function EstadoCuentaBadge({ estado }: { estado: EstadoCuenta }) {
  return <Etiqueta tono={TONO_CUENTA[estado]}>{ETIQUETAS_CUENTA[estado]}</Etiqueta>;
}

const TONO_ETAPA: Record<EtapaCobro, TonoEtiqueta> = {
  AL_DIA: "exito",
  RECORDATORIO: "info",
  COBRO_PERSUASIVO: "alerta",
  ACUERDO_PAGO: "marca",
  PREJURIDICO: "peligro",
  JURIDICO: "peligro",
};

export function EtapaCobroBadge({ etapa }: { etapa: EtapaCobro }) {
  return <Etiqueta tono={TONO_ETAPA[etapa]}>{ETIQUETAS_ETAPA_COBRO[etapa]}</Etiqueta>;
}

/** Días de mora en texto corto, con color proporcional al atraso. */
export function DiasMoraBadge({ dias }: { dias: number }) {
  if (dias <= 0) return <Etiqueta tono="exito">Al día</Etiqueta>;

  const tono: TonoEtiqueta = dias > 90 ? "peligro" : dias > 30 ? "alerta" : "info";
  return <Etiqueta tono={tono}>{dias} día(s)</Etiqueta>;
}
