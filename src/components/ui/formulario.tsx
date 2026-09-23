import type { ReactNode } from "react";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

/**
 * Clases de los controles de formulario en un solo lugar.
 *
 * `min-h-11` (44 px) es el mínimo táctil recomendado por las guías de
 * accesibilidad de iOS/Android; `text-base` en móvil evita el zoom
 * automático de Safari al enfocar un input (Safari hace zoom si la fuente
 * mide menos de 16 px), y desde `sm` baja a `text-sm` para que los
 * formularios densos del escritorio no se vean enormes.
 */
export const CLASES_CONTROL =
  "min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none sm:min-h-10 sm:text-sm";

export const CLASES_TEXTAREA = `${CLASES_CONTROL} min-h-24 py-2 sm:min-h-24`;

export function Campo({
  etiqueta,
  htmlFor,
  error,
  ayuda,
  className = "",
  children,
}: {
  etiqueta: string;
  htmlFor: string;
  error?: string;
  ayuda?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-zinc-600"
      >
        {etiqueta}
      </label>
      {children}
      {ayuda && !error ? (
        <p className="text-xs text-zinc-500">{ayuda}</p>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

/**
 * Resultado de un Server Action. `role="status"` / `aria-live` hace que un
 * lector de pantalla anuncie el resultado sin mover el foco.
 */
export function MensajeAccion({ estado }: { estado: EstadoAccionFormulario }) {
  if (estado.status === "idle" || !estado.message) return null;

  const esError = estado.status === "error";

  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded-md px-3 py-2 text-sm ${
        esError
          ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
          : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
      }`}
    >
      {estado.message}
    </p>
  );
}
