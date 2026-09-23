import type { ReactNode } from "react";

/**
 * Animaciones de entrada como Server Components: cero JavaScript en el
 * cliente. Antes esto era framer-motion (`"use client"`), lo que además
 * forzaba a que cada lista/tabla que quisiera animarse cruzara la frontera
 * servidor→cliente. Quitar la dependencia bajó el JS del cliente de 407 KB a
 * 373 KB gzip (medido comparando builds de producción).
 *
 * Solo el contenedor anima (`aparecer`, 220 ms). No hay stagger por ítem a
 * propósito: animar 24 filas a la vez es justo lo que se sentía trabado en
 * un teléfono de gama media, y el beneficio visual es marginal.
 */
export function FadeIn({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`aparecer ${className}`}>{children}</div>;
}
