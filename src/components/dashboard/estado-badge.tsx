import { EstadoCuenta } from "@prisma/client";

const ESTILOS: Record<EstadoCuenta, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700 ring-amber-600/20",
  PAGADA: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  VENCIDA: "bg-orange-50 text-orange-700 ring-orange-600/20",
  EN_MORA: "bg-red-50 text-red-700 ring-red-600/20",
};

const ETIQUETAS: Record<EstadoCuenta, string> = {
  PENDIENTE: "Pendiente",
  PAGADA: "Pagada",
  VENCIDA: "Vencida",
  EN_MORA: "En mora",
};

const PUNTOS: Record<EstadoCuenta, string> = {
  PENDIENTE: "bg-amber-500",
  PAGADA: "bg-emerald-500",
  VENCIDA: "bg-orange-500",
  EN_MORA: "bg-red-500",
};

const CON_PULSO: EstadoCuenta[] = ["VENCIDA", "EN_MORA"];

export function EstadoCuentaBadge({ estado }: { estado: EstadoCuenta }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${ESTILOS[estado]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${PUNTOS[estado]} ${
          CON_PULSO.includes(estado) ? "animate-pulse" : ""
        }`}
      />
      {ETIQUETAS[estado]}
    </span>
  );
}
