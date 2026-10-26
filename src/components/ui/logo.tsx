import Image from "next/image";

// Proporción del viewBox de public/brand/logo.svg (583 × 703).
const RELACION_ANCHO_ALTO = 583 / 703;

/**
 * Logo de Rentu (SVG a color). Se dimensiona por altura; `unoptimized` porque
 * un SVG ya es vectorial y el optimizador de imágenes no lo procesa.
 */
export function Logo({ altura = 36, className }: { altura?: number; className?: string }) {
  return (
    <Image
      src="/brand/logo.svg"
      alt="Rentu PH"
      width={Math.round(altura * RELACION_ANCHO_ALTO)}
      height={altura}
      unoptimized
      className={className}
    />
  );
}
