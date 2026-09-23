"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/**
 * Botón de envío con estado pendiente automático (`useFormStatus`), para no
 * repetir el mismo bloque de clases y el mismo `pending ? "…"` en cada
 * formulario.
 *
 * Las variantes usan `transition-colors`, no `transition-all` + `hover:scale`
 * como antes: escalar un botón obliga al navegador a repintar su sombra y su
 * texto en cada frame, y multiplicado por todos los botones de una tabla se
 * notaba al interactuar. El feedback ahora es cambio de color (compositable)
 * y `active:` sin transición.
 */
const VARIANTES = {
  brand: "bg-brand-600 text-white hover:bg-brand-700",
  accent: "bg-accent-500 text-zinc-900 hover:bg-accent-400",
  neutro:
    "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
  peligro: "bg-red-600 text-white hover:bg-red-700",
} as const;

const TAMANIOS = {
  md: "min-h-11 px-4 py-2.5 text-sm",
  sm: "min-h-11 px-3 text-xs sm:min-h-9 sm:py-1.5",
} as const;

export function BotonSubmit({
  children,
  pendiente,
  variante = "brand",
  tamanio = "md",
  anchoCompleto = false,
  icono,
  className = "",
  name,
  value,
}: {
  children: ReactNode;
  /** Texto mientras el Server Action está en vuelo. */
  pendiente?: ReactNode;
  variante?: keyof typeof VARIANTES;
  tamanio?: keyof typeof TAMANIOS;
  anchoCompleto?: boolean;
  icono?: ReactNode;
  className?: string;
  /**
   * `name`/`value` permiten que dos botones del mismo formulario manden
   * intenciones distintas (ej. "validar" vs "confirmar"): el navegador solo
   * incluye el par del botón que disparó el submit.
   */
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        VARIANTES[variante]
      } ${TAMANIOS[tamanio]} ${anchoCompleto ? "w-full sm:w-auto" : ""} ${className}`}
    >
      {pending ? null : icono}
      {pending ? (pendiente ?? "Guardando…") : children}
    </button>
  );
}
