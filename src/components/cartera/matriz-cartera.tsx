import Link from "next/link";
import type { UnidadCartera } from "@/lib/data/cartera";
import { EstadoCuenta } from "@prisma/client";
import { EstadoVacio, TablaScroll } from "@/components/ui/primitivos";
import { formatearMoneda } from "@/lib/formatters";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const pesos = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

/**
 * Vista "tipo Excel": una fila por apartamento y una columna por mes del año.
 * Cada celda sale de la cuenta real de ese periodo (nada se calcula aparte):
 *   verde = pagada · ámbar = abono parcial · rojo = vencida · gris = por vencer.
 * Al final de la fila: lo pagado en el año y la deuda total de la unidad.
 */
export function MatrizCartera({
  unidades,
  anio,
  hrefDe,
  hrefAnio,
}: {
  unidades: UnidadCartera[];
  anio: number;
  hrefDe: (unidadId: string) => string;
  hrefAnio: (anio: number) => string;
}) {
  if (unidades.length === 0) {
    return (
      <EstadoVacio
        titulo="Ninguna unidad coincide con el filtro"
        descripcion="Prueba con otra torre o quita el filtro de situación."
      />
    );
  }

  const filas = [...unidades].sort((a, b) =>
    `${a.torre} ${a.identificador}`.localeCompare(`${b.torre} ${b.identificador}`, "es", {
      numeric: true,
    })
  );

  const totalesMes = MESES.map((_, indice) => {
    const periodo = `${anio}-${String(indice + 1).padStart(2, "0")}`;
    return filas.reduce(
      (suma, unidad) =>
        suma + (unidad.cuentas.find((cuenta) => cuenta.periodo === periodo)?.montoPagado ?? 0),
      0
    );
  });
  const totalPagadoAnio = totalesMes.reduce((suma, total) => suma + total, 0);
  const totalDeuda = filas.reduce((suma, unidad) => suma + unidad.saldoTotal, 0);

  const cuerpo = filas.map((unidad) => {
    const celdas = MESES.map((_, indice) => {
      const periodo = `${anio}-${String(indice + 1).padStart(2, "0")}`;
      const cuenta = unidad.cuentas.find((item) => item.periodo === periodo);
      if (!cuenta) return { texto: "·", clase: "text-zinc-300", titulo: "Sin cuenta" };

      if (cuenta.estado === EstadoCuenta.PAGADA) {
        return {
          texto: pesos.format(cuenta.totalAPagar),
          clase: "bg-emerald-50 text-emerald-700",
          titulo: "Pagada",
        };
      }
      if (cuenta.montoPagado > 0) {
        return {
          texto: pesos.format(cuenta.saldoPendiente),
          clase: "bg-amber-50 text-amber-800",
          titulo: `Abono parcial: pagó ${formatearMoneda(cuenta.montoPagado)}, debe ${formatearMoneda(cuenta.saldoPendiente)}`,
        };
      }
      return cuenta.diasMora > 0
        ? {
            texto: pesos.format(cuenta.saldoPendiente),
            clase: "bg-red-50 text-red-700",
            titulo: `Vencida hace ${cuenta.diasMora} día(s)`,
          }
        : {
            texto: pesos.format(cuenta.saldoPendiente),
            clase: "bg-zinc-50 text-zinc-600",
            titulo: "Por vencer",
          };
    });
    const pagadoAnio = unidad.cuentas
      .filter((cuenta) => cuenta.periodo.startsWith(`${anio}-`))
      .reduce((suma, cuenta) => suma + cuenta.montoPagado, 0);
    return { unidad, celdas, pagadoAnio };
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link
            href={hrefAnio(anio - 1)}
            aria-label="Año anterior"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100"
          >
            ←
          </Link>
          <span className="min-w-12 text-center text-sm font-semibold tabular-nums">{anio}</span>
          <Link
            href={hrefAnio(anio + 1)}
            aria-label="Año siguiente"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100"
          >
            →
          </Link>
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
          <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-200" />Pagada</li>
          <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-amber-200" />Abono parcial (muestra lo que debe)</li>
          <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-red-200" />Vencida</li>
          <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-zinc-200" />Por vencer</li>
        </ul>
      </div>

      <TablaScroll>
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-zinc-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Unidad
              </th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Cuota
              </th>
              {MESES.map((mes) => (
                <th key={mes} scope="col" className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {mes}
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Pagado {anio}
              </th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Deuda
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {cuerpo.map(({ unidad, celdas, pagadoAnio }) => (
              <tr key={unidad.id}>
                <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 text-left font-medium text-zinc-900">
                  <Link href={hrefDe(unidad.id)} className="hover:underline">
                    {unidad.identificador}
                  </Link>
                </th>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-zinc-500">
                  {unidad.cuotaMensual > 0 ? pesos.format(unidad.cuotaMensual) : "—"}
                </td>
                {celdas.map((celda, indice) => (
                  <td
                    key={indice}
                    title={celda.titulo}
                    className={`whitespace-nowrap px-2 py-2 text-right text-xs tabular-nums ${celda.clase}`}
                  >
                    {celda.texto}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-emerald-700">
                  {pagadoAnio > 0 ? formatearMoneda(pagadoAnio) : "—"}
                </td>
                <td className={`whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums ${unidad.saldoTotal > 0 ? "text-red-600" : "text-zinc-400"}`}>
                  {unidad.saldoTotal > 0 ? formatearMoneda(unidad.saldoTotal) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-zinc-50 font-semibold">
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-zinc-50 px-3 py-2 text-left text-xs uppercase tracking-wide text-zinc-500">
                Recaudado
              </th>
              <td />
              {totalesMes.map((total, indice) => (
                <td key={indice} className="px-2 py-2 text-right text-xs tabular-nums text-zinc-700">
                  {total > 0 ? pesos.format(total) : "·"}
                </td>
              ))}
              <td className="px-3 py-2 text-right tabular-nums text-emerald-700">
                {formatearMoneda(totalPagadoAnio)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-red-600">
                {formatearMoneda(totalDeuda)}
              </td>
            </tr>
          </tfoot>
        </table>
      </TablaScroll>
      <p className="text-xs text-zinc-500">
        Cada celda muestra el valor de la cuota de ese mes, o lo que aún se debe si hay abonos. Toca una unidad para ver su detalle.
      </p>
    </div>
  );
}
