import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { UnidadCartera } from "@/lib/data/cartera";
import { DiasMoraBadge, EtapaCobroBadge } from "@/components/dashboard/estado-badge";
import {
  EstadoVacio,
  Etiqueta,
  TablaScroll,
  Td,
  Th,
} from "@/components/ui/primitivos";
import { formatearFecha, formatearMoneda } from "@/lib/formatters";

/**
 * Listado de unidades con su cartera.
 *
 * Debajo de `md` se renderiza como lista de tarjetas y desde `md` como tabla
 * densa: una tabla de 8 columnas en 375 px obliga a scroll horizontal para
 * leer cada fila, que es justo lo que hace inservible una tabla en el
 * teléfono. Se duplica el markup a propósito (ambos bloques existen en el
 * HTML y uno se oculta con `hidden`) porque son dos jerarquías de
 * información distintas, no la misma con otro ancho.
 */
export function UnidadesTabla({
  unidades,
  hrefDe,
}: {
  unidades: UnidadCartera[];
  /** Construye el enlace al detalle conservando los filtros activos. */
  hrefDe: (unidadId: string) => string;
}) {
  if (unidades.length === 0) {
    return (
      <EstadoVacio
        titulo="Ninguna unidad coincide con el filtro"
        descripcion="Prueba con otra torre o quita el filtro de situación."
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {unidades.map((unidad) => (
          <li key={unidad.id}>
            <Link
              href={hrefDe(unidad.id)}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-300"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-zinc-900">
                    {unidad.identificador}
                  </p>
                  <span className="shrink-0 text-xs text-zinc-400">
                    {unidad.torre}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {unidad.residentes.length > 0
                    ? unidad.residentes.map((r) => r.nombre).join(" · ")
                    : "Sin residentes vinculados"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      unidad.saldoTotal > 0 ? "text-zinc-900" : "text-emerald-600"
                    }`}
                  >
                    {unidad.saldoTotal > 0
                      ? formatearMoneda(unidad.saldoTotal)
                      : "Sin saldo"}
                  </span>
                  <DiasMoraBadge dias={unidad.diasMora} />
                  <EtapaCobroBadge etapa={unidad.etapaCobro} />
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden md:block">
        <TablaScroll>
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <Th>Unidad</Th>
                <Th>Torre</Th>
                <Th>Residentes</Th>
                <Th className="text-right">Saldo</Th>
                <Th className="text-right">Vencido</Th>
                <Th>Mora</Th>
                <Th>Etapa</Th>
                <Th>Último pago</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {unidades.map((unidad) => (
                <tr key={unidad.id} className="hover:bg-zinc-50">
                  <Td className="font-medium text-zinc-900">
                    {unidad.identificador}
                  </Td>
                  <Td className="text-zinc-500">{unidad.torre}</Td>
                  <Td className="max-w-48 truncate text-zinc-500">
                    {unidad.residentes.length > 0
                      ? unidad.residentes.map((r) => r.nombre).join(", ")
                      : "—"}
                  </Td>
                  <Td className="text-right font-medium tabular-nums">
                    {unidad.saldoTotal > 0
                      ? formatearMoneda(unidad.saldoTotal)
                      : "—"}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {unidad.saldoVencido > 0 ? (
                      <span className="text-red-600">
                        {formatearMoneda(unidad.saldoVencido)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    <DiasMoraBadge dias={unidad.diasMora} />
                  </Td>
                  <Td>
                    <EtapaCobroBadge etapa={unidad.etapaCobro} />
                  </Td>
                  <Td className="whitespace-nowrap text-zinc-500">
                    {unidad.ultimoPago
                      ? formatearFecha(unidad.ultimoPago.fechaPago)
                      : "Sin pagos"}
                  </Td>
                  <Td>
                    <Link
                      href={hrefDe(unidad.id)}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      Ver
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablaScroll>
      </div>
    </>
  );
}

/** Tarjetas compactas de "unidades a gestionar hoy" para el resumen. */
export function UnidadesPrioritarias({
  unidades,
  hrefDe,
}: {
  unidades: UnidadCartera[];
  hrefDe: (unidadId: string) => string;
}) {
  if (unidades.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay unidades con cartera vencida"
        descripcion="Cuando una cuota pase su fecha límite, la unidad aparecerá acá ordenada por saldo vencido."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {unidades.map((unidad) => (
        <li key={unidad.id}>
          <Link
            href={hrefDe(unidad.id)}
            className="flex h-full flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-300"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-900">
                  {unidad.identificador}
                </p>
                <p className="text-xs text-zinc-500">{unidad.torre}</p>
              </div>
              <DiasMoraBadge dias={unidad.diasMora} />
            </div>

            <p className="text-lg font-semibold tabular-nums text-zinc-900">
              {formatearMoneda(unidad.saldoVencido)}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-1.5">
              <EtapaCobroBadge etapa={unidad.etapaCobro} />
              <Etiqueta tono="neutro">
                {unidad.cuentasPendientes} cuota(s)
              </Etiqueta>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
