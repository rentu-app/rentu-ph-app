/**
 * Rutas absolutas (`/#id`) en vez de anchors relativos (`#id`) porque estos
 * enlaces se reutilizan en páginas distintas de la landing (ej. /propiedades)
 * — un anchor relativo ahí apuntaría a un id que no existe en esa página.
 */
// TODO: marketplace fuera del MVP, retomar después — enlace a /propiedades removido del nav.
export const ENLACES_NAV = [
  { href: "/#por-que-rentu", etiqueta: "Beneficios" },
  { href: "/#modulos", etiqueta: "Módulos" },
  { href: "/#copiloto", etiqueta: "Copiloto IA" },
] as const;
