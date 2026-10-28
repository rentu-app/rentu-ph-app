import { Prisma } from "@prisma/client";

/**
 * En la base el coeficiente de copropiedad es una FRACCIÓN (la copropiedad
 * suma 1.00000, columna `Decimal(7,5)`), pero los administradores lo piensan
 * en PORCENTAJE, como aparece en la escritura (4.167 %). Todo el
 * redondeo/conversión vive aquí y usa `Prisma.Decimal`, nunca `number`.
 *
 * Precisión: 5 decimales de fracción = 3 decimales de porcentaje (0.001 %).
 * Se rechaza lo que traiga más decimales en vez de redondearlo en silencio.
 */

export type FormatoCoeficiente = "porcentaje" | "fraccion";

/** ±0.001 % de tolerancia en la suma, que es 1 unidad del último decimal. */
const TOLERANCIA_SUMA = new Prisma.Decimal("0.00001");

/** Acepta "4,167", "4.167", "4.167 %" y espacios. */
export function normalizarNumero(texto: string): string {
  return texto.replace(/%/g, "").replace(/\s+/g, "").replace(",", ".");
}

export type ResultadoCoeficiente =
  | { ok: true; fraccion: string; porcentaje: string }
  | { ok: false; error: string };

export function convertirCoeficiente(
  texto: string,
  formato: FormatoCoeficiente
): ResultadoCoeficiente {
  const limpio = normalizarNumero(texto);

  if (formato === "porcentaje") {
    if (!/^\d{1,3}(\.\d{1,3})?$/.test(limpio)) {
      return { ok: false, error: "Coeficiente inválido (ej. 4.167 %, máximo 3 decimales)" };
    }
    const porcentaje = new Prisma.Decimal(limpio);
    if (porcentaje.lte(0)) {
      return { ok: false, error: "El coeficiente debe ser mayor que 0" };
    }
    if (porcentaje.gt(100)) {
      return { ok: false, error: "El coeficiente no puede superar 100 %" };
    }
    return {
      ok: true,
      fraccion: porcentaje.div(100).toFixed(5),
      porcentaje: porcentaje.toFixed(3),
    };
  }

  if (!/^\d(\.\d{1,5})?$|^\.\d{1,5}$/.test(limpio)) {
    return { ok: false, error: "Coeficiente inválido (ej. 0.04167, máximo 5 decimales)" };
  }
  const fraccion = new Prisma.Decimal(limpio);
  if (fraccion.lte(0)) return { ok: false, error: "El coeficiente debe ser mayor que 0" };
  if (fraccion.gt(1)) return { ok: false, error: "Una fracción no puede superar 1" };
  return {
    ok: true,
    fraccion: fraccion.toFixed(5),
    porcentaje: fraccion.mul(100).toFixed(3),
  };
}

/** "0.04167" → "4.167" */
export function fraccionAPorcentaje(fraccion: Prisma.Decimal | string): string {
  return new Prisma.Decimal(fraccion).mul(100).toFixed(3);
}

/**
 * Decide si la columna de coeficientes de un CSV viene en porcentaje o en
 * fracción mirando la suma del archivo: ≈100 → porcentaje, ≈1 → fracción.
 * Un archivo parcial (solo algunas unidades) no suma ni 1 ni 100; ahí un
 * valor mayor que 1 solo puede ser porcentaje, y si todos son ≤ 1 se asume
 * fracción.
 */
export function detectarFormato(valores: string[]): {
  formato: FormatoCoeficiente;
  suma: Prisma.Decimal;
} {
  const numeros = valores
    .map(normalizarNumero)
    .filter((valor) => /^\d*\.?\d+$/.test(valor))
    .map((valor) => new Prisma.Decimal(valor));
  const suma = numeros.reduce((acc, valor) => acc.plus(valor), new Prisma.Decimal(0));

  if (suma.gte(50) && suma.lte(150)) return { formato: "porcentaje", suma };
  if (suma.gte(0.5) && suma.lte(1.5)) return { formato: "fraccion", suma };
  const hayMayorQueUno = numeros.some((valor) => valor.gt(1));
  return { formato: hayMayorQueUno ? "porcentaje" : "fraccion", suma };
}

/** ¿La suma de fracciones es 100 % dentro de ±0.001 %? */
export function sumaEsCompleta(sumaFraccion: Prisma.Decimal | string): boolean {
  return new Prisma.Decimal(sumaFraccion).minus(1).abs().lte(TOLERANCIA_SUMA);
}
