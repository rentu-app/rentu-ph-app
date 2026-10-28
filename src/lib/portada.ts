/**
 * Portada generada a partir del nombre (sin imágenes externas): el mismo
 * nombre produce siempre el mismo degradado, así cada copropiedad se
 * reconoce de un vistazo. Los tonos se limitan al rango azul–violeta–teal
 * para que cualquier nombre combine con la marca.
 */
export function estiloPortada(nombre: string): { background: string } {
  let hash = 0;
  for (const caracter of nombre) {
    hash = (hash * 31 + caracter.charCodeAt(0)) >>> 0;
  }
  const tono = 190 + (hash % 100); // 190–289: cian → azul → violeta
  const desplazamiento = 25 + ((hash >> 8) % 35);
  const angulo = 115 + ((hash >> 16) % 50);

  return {
    background: [
      "repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0 10px, transparent 10px 22px)",
      `linear-gradient(${angulo}deg, hsl(${tono} 72% 46%), hsl(${(tono + desplazamiento) % 360} 70% 32%))`,
    ].join(", "),
  };
}

/** "Conjunto Residencial Altos de Salitre" → "AS" (primeras letras de las dos últimas palabras con peso). */
export function iniciales(nombre: string): string {
  const palabras = nombre
    .split(/\s+/)
    .filter((palabra) => palabra.length > 2 && !/^(conjunto|residencial|edificio|torres?|de|del|los|las)$/i.test(palabra));
  const base = palabras.length > 0 ? palabras : nombre.split(/\s+/);
  return base
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? "")
    .join("");
}
