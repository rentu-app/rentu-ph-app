/**
 * Rutas absolutas (`/#id`) en vez de anchors relativos (`#id`) porque estos
 * enlaces se reutilizan en el header y el footer, que también se renderizan
 * en páginas distintas de la landing.
 */
export const ENLACES_NAV = [
  { href: "/#modulos", etiqueta: "Qué incluye" },
  { href: "/#por-que-rentu", etiqueta: "Por qué Rentu" },
  { href: "/#copiloto", etiqueta: "Copiloto" },
] as const;
