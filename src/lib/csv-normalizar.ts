/**
 * Normalización ÚNICA del texto de un CSV, compartida por cliente y servidor.
 *
 * El servidor valida y devuelve (`contenidoValidado`) el texto ya normalizado,
 * y la UI compara contra `normalizarContenidoCsv(lo que hay en pantalla)`.
 * Si cada lado normalizara a su manera (el servidor recortaba el salto de
 * línea final con `.trim()` y el cliente no), el texto "idéntico" parecía
 * distinto y la vista previa desaparecía. Sin dependencias (ni Prisma) para
 * poder importarla desde componentes de cliente.
 */
export function normalizarContenidoCsv(texto: string): string {
  return texto
    .replace(/^﻿/, "") // BOM
    .replace(/\r\n?/g, "\n") // \r\n y \r sueltos → \n
    .trim(); // espacios y saltos al inicio/final
}
