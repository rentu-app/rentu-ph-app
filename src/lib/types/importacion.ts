import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

/**
 * Resultado de `importarUnidadesCsv`. Vive aquí y no en
 * `src/lib/actions/cartera.ts` porque un archivo con `"use server"` solo
 * puede exportar funciones async — exportar el estado inicial desde allí
 * rompe en runtime con "A 'use server' file can only export async
 * functions".
 */
export type FilaImportada = {
  identificador: string;
  torre: string;
  /** Fracción de 5 decimales, tal como se guarda en la base. */
  coeficiente: string;
  /** El mismo valor en porcentaje, para mostrarlo. */
  coeficientePorcentaje: string;
  areaM2: string | null;
  estado: "OCUPADO" | "DESOCUPADO";
  yaExiste: boolean;
};

export type ResultadoImportacion = EstadoAccionFormulario & {
  /** Filas válidas listas para importar (o ya importadas si `confirmado`). */
  filasValidas?: FilaImportada[];
  erroresFila?: { linea: number; mensaje: string }[];
  confirmado?: boolean;
  /** Cómo se interpretó la columna de coeficientes y cuánto suma el archivo. */
  formatoCoeficiente?: "porcentaje" | "fraccion";
  sumaArchivoPorcentaje?: string;
  /**
   * El contenido exacto que el servidor validó. La UI lo compara con lo que
   * hay en pantalla para no ofrecer "Confirmar" sobre un texto distinto del
   * que se revisó; al confirmar el servidor igual vuelve a validar todo.
   */
  contenidoValidado?: string;
};

export const ESTADO_INICIAL_IMPORTACION: ResultadoImportacion = { status: "idle" };
