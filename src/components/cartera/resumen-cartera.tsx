import { AlertTriangle, Landmark, TrendingUp, Wallet } from "lucide-react";
import type { CarteraTorre, ResumenCartera } from "@/lib/data/cartera";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarraProgreso, Tarjeta } from "@/components/ui/primitivos";
import { formatearMoneda, formatearPeriodo } from "@/lib/formatters";

/** Cifra en millones abreviada, para que un KPI quepa en una tarjeta de móvil. */
function montoCorto(valor: number): string {
  if (valor >= 1_000_000) {
    return `$${(valor / 1_000_000).toLocaleString("es-CO", {
      maximumFractionDigits: 1,
    })}M`;
  }
  return formatearMoneda(valor);
}

export function KpisCartera({ resumen }: { resumen: ResumenCartera }) {
  const porcentaje = Math.round(resumen.porcentajeRecaudo);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        etiqueta="Cartera por cobrar"
        valor={montoCorto(resumen.carteraTotal)}
        detalle={`${resumen.unidadesConSaldo} de ${resumen.totalUnidades} unidades`}
        tono="marca"
        icono={Wallet}
      />
      <StatCard
        etiqueta="Cartera vencida"
        valor={montoCorto(resumen.carteraVencida)}
        detalle={`${resumen.unidadesEnMora} unidad(es) en mora`}
        tono={resumen.carteraVencida > 0 ? "alerta" : "positivo"}
        icono={AlertTriangle}
      />
      <StatCard
        etiqueta={`Facturado ${formatearPeriodo(resumen.periodoVigente)}`}
        valor={montoCorto(resumen.facturadoPeriodo)}
        detalle={`${resumen.totalUnidades} cuotas emitidas`}
        icono={Landmark}
      />
      <StatCard
        etiqueta="Recaudo del mes"
        valor={montoCorto(resumen.recaudoDelMes)}
        detalle={`${porcentaje}% de lo facturado${
          resumen.recuperacionPeriodosAnteriores > 0
            ? ` · ${montoCorto(resumen.recuperacionPeriodosAnteriores)} de meses anteriores`
            : ""
        }`}
        tono={porcentaje >= 80 ? "positivo" : "alerta"}
        icono={TrendingUp}
      />
    </div>
  );
}

/**
 * Cartera por antigüedad. Es la vista que responde "¿esta plata es de este
 * mes o llevamos un año arrastrándola?" y es la estructura que ya usan los
 * informes de cartera de administración delegada.
 */
export function AntiguedadCartera({ resumen }: { resumen: ResumenCartera }) {
  const hayCartera = resumen.carteraTotal > 0;

  return (
    <Tarjeta className="p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">
          Cartera por antigüedad
        </h3>
        <p className="text-sm tabular-nums text-zinc-500">
          Total {formatearMoneda(resumen.carteraTotal)}
        </p>
      </div>

      {hayCartera ? (
        <ul className="mt-4 flex flex-col gap-3">
          {resumen.antiguedad.map((tramo) => (
            <li key={tramo.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-zinc-600">{tramo.etiqueta}</span>
                <span className="shrink-0 tabular-nums text-zinc-900">
                  {formatearMoneda(tramo.monto)}
                  <span className="ml-2 text-xs text-zinc-400">
                    {tramo.unidades} und
                  </span>
                </span>
              </div>
              <BarraProgreso
                porcentaje={tramo.porcentaje}
                tono={
                  tramo.id === "corriente"
                    ? "info"
                    : tramo.id === "mas-90"
                      ? "peligro"
                      : "alerta"
                }
                etiquetaAccesible={`${tramo.etiqueta}: ${Math.round(
                  tramo.porcentaje
                )}% de la cartera`}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">
          No hay saldos pendientes. Toda la cartera está recaudada.
        </p>
      )}
    </Tarjeta>
  );
}

export function CarteraPorTorre({ torres }: { torres: CarteraTorre[] }) {
  return (
    <Tarjeta className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-zinc-900">
        Distribución por torre
      </h3>

      {torres.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          Todavía no hay unidades registradas.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {torres.map((torre) => (
            <li key={torre.torre} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium text-zinc-800">
                  {torre.torre}
                </span>
                <span className="shrink-0 tabular-nums text-zinc-900">
                  {formatearMoneda(torre.saldoTotal)}
                </span>
              </div>
              <BarraProgreso
                porcentaje={torre.porcentajeDeCartera}
                tono={torre.saldoVencido > 0 ? "peligro" : "marca"}
                etiquetaAccesible={`${torre.torre}: ${Math.round(
                  torre.porcentajeDeCartera
                )}% de la cartera`}
              />
              <p className="text-xs text-zinc-500">
                {torre.unidadesConSaldo} de {torre.unidades} unidades con saldo ·{" "}
                {Math.round(torre.porcentajeDeCartera)}% de la cartera
              </p>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}
