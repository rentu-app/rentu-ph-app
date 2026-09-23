import type { LucideIcon } from "lucide-react";

/**
 * Tarjeta de indicador. Sin `transition-all`, sin `hover:-translate-y` y sin
 * `group-hover:scale`: en una parrilla de 4–6 tarjetas esos efectos hacían
 * que el navegador recalculara layout y repintara sombras en cada
 * movimiento del cursor, y en móvil (donde el hover ni existe) solo
 * aportaban peso.
 */
export function StatCard({
  etiqueta,
  valor,
  detalle,
  tono = "neutral",
  icono: Icono,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  tono?: "neutral" | "alerta" | "positivo" | "marca";
  icono?: LucideIcon;
}) {
  const colorDetalle =
    tono === "alerta"
      ? "text-red-600"
      : tono === "positivo"
        ? "text-emerald-600"
        : "text-zinc-500";

  const estilosIcono =
    tono === "alerta"
      ? "bg-red-50 text-red-600"
      : tono === "positivo"
        ? "bg-emerald-50 text-emerald-600"
        : tono === "marca"
          ? "bg-brand-50 text-brand-600"
          : "bg-accent-50 text-accent-600";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-500">{etiqueta}</p>
        {Icono ? (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${estilosIcono}`}
          >
            <Icono className="h-[18px] w-[18px]" />
          </span>
        ) : null}
      </div>
      {/* `break-words` + `tabular-nums`: una cifra en pesos colombianos
          ("$12.480.000") no cabe en 160 px sin partirse, y las cifras
          alineadas en columnas necesitan ancho de dígito fijo. */}
      <p className="mt-2 text-xl font-semibold tracking-tight tabular-nums text-zinc-900 break-words sm:text-2xl">
        {valor}
      </p>
      {detalle ? (
        <p className={`mt-1 text-sm ${colorDetalle}`}>{detalle}</p>
      ) : null}
    </div>
  );
}
