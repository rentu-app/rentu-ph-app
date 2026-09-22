import type { LucideIcon } from "lucide-react";

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
  tono?: "neutral" | "alerta" | "positivo";
  icono?: LucideIcon;
}) {
  const colorDetalle =
    tono === "alerta"
      ? "text-red-600 dark:text-red-400"
      : tono === "positivo"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-zinc-500 dark:text-zinc-400";

  const estilosIcono =
    tono === "alerta"
      ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
      : tono === "positivo"
        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        : "bg-accent-50 text-accent-600 dark:bg-accent-950/30 dark:text-accent-400";

  return (
    <div className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand-800">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {etiqueta}
        </p>
        {Icono ? (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${estilosIcono}`}
          >
            <Icono className="h-[18px] w-[18px]" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {valor}
      </p>
      {detalle ? (
        <p className={`mt-1 flex items-center gap-1.5 text-sm ${colorDetalle}`}>
          {tono === "alerta" ? (
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-red-500" />
          ) : null}
          {detalle}
        </p>
      ) : null}
    </div>
  );
}
