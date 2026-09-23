import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Primitivos compartidos por Dashboard y Portal. Todos son Server
 * Components (no llevan `"use client"`) para que las páginas que los usan no
 * arrastren JavaScript al cliente solo por pintar una tarjeta o una tabla.
 */

export function Tarjeta({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Seccion({
  titulo,
  descripcion,
  accion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-zinc-900">{titulo}</h2>
          {descripcion ? (
            <p className="mt-0.5 text-sm text-zinc-500">{descripcion}</p>
          ) : null}
        </div>
        {accion ? <div className="shrink-0">{accion}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function EncabezadoPagina({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {/* `text-2xl` en móvil y `text-3xl` desde `sm`: a 375 px un título de
            30 px con dos palabras largas se partía en tres líneas. */}
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
          {titulo}
        </h1>
        {descripcion ? (
          <p className="mt-1 text-sm text-zinc-500">{descripcion}</p>
        ) : null}
      </div>
      {accion ? <div className="shrink-0">{accion}</div> : null}
    </div>
  );
}

export function EstadoVacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
      <p className="text-sm font-medium text-zinc-700">{titulo}</p>
      {descripcion ? (
        <p className="max-w-md text-sm text-zinc-500">{descripcion}</p>
      ) : null}
      {accion}
    </div>
  );
}

const TONOS_ETIQUETA = {
  neutro: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
  marca: "bg-brand-50 text-brand-700 ring-brand-600/20",
  exito: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  alerta: "bg-amber-50 text-amber-800 ring-amber-600/20",
  peligro: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-sky-50 text-sky-700 ring-sky-600/20",
} as const;

export type TonoEtiqueta = keyof typeof TONOS_ETIQUETA;

export function Etiqueta({
  children,
  tono = "neutro",
  className = "",
}: {
  children: ReactNode;
  tono?: TonoEtiqueta;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${TONOS_ETIQUETA[tono]} ${className}`}
    >
      {children}
    </span>
  );
}

const COLORES_BARRA = {
  neutro: "bg-zinc-400",
  marca: "bg-brand-600",
  exito: "bg-emerald-500",
  alerta: "bg-amber-500",
  peligro: "bg-red-500",
  info: "bg-sky-500",
} as const;

/**
 * Barra horizontal para las gráficas de cartera. El porcentaje viaja como
 * variable CSS (`--valor`) y el ancho se calcula con `calc()` (utilidad
 * `barra-valor` en globals.css): sin JS, sin medir el DOM.
 */
export function BarraProgreso({
  porcentaje,
  tono = "marca",
  etiquetaAccesible,
}: {
  porcentaje: number;
  tono?: keyof typeof COLORES_BARRA;
  etiquetaAccesible: string;
}) {
  const valor = Math.max(0, Math.min(100, Math.round(porcentaje)));

  return (
    <div
      role="progressbar"
      aria-label={etiquetaAccesible}
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-zinc-100"
    >
      <div
        className={`barra-valor h-full rounded-full ${COLORES_BARRA[tono]}`}
        style={{ "--valor": valor } as React.CSSProperties}
      />
    </div>
  );
}

/** Píldora de filtro basada en navegación (searchParams), sin estado cliente. */
export function FiltroPill({
  href,
  activo,
  children,
}: {
  href: string;
  activo: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-sm font-medium transition-colors sm:min-h-9 ${
        activo
          ? "bg-zinc-900 text-white"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {children}
    </Link>
  );
}

/**
 * Fila de filtros con scroll horizontal en móvil. `-mx-4 px-4` hace que la
 * fila sangre hasta el borde de la pantalla, señal visual de que hay más
 * opciones a la derecha.
 */
export function FilaFiltros({
  children,
  etiquetaAccesible,
}: {
  children: ReactNode;
  etiquetaAccesible: string;
}) {
  return (
    <nav
      aria-label={etiquetaAccesible}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </nav>
  );
}

/** Aviso de "esto es una simulación del MVP", obligatorio donde no hay integración real. */
export function AvisoSimulacion({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-600/20">
      <span aria-hidden className="mt-px font-bold">
        !
      </span>
      <span>{children}</span>
    </p>
  );
}

/** Contenedor de tabla: scroll horizontal acotado y bordes consistentes. */
export function TablaScroll({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      {children}
    </div>
  );
}

export function Th({
  children,
  className = "",
}: {
  /** Opcional: la columna de acciones va con encabezado vacío. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 text-sm text-zinc-700 ${className}`}>{children}</td>
  );
}

export function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-zinc-500">{etiqueta}</p>
      <p className="truncate text-sm text-zinc-900">{children}</p>
    </div>
  );
}
