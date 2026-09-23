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
  coeficiente: string;
  areaM2: string | null;
  yaExiste: boolean;
};

export type ResultadoImportacion = EstadoAccionFormulario & {
  /** Filas válidas listas para importar (o ya importadas si `confirmado`). */
  filasValidas?: FilaImportada[];
  erroresFila?: { linea: number; mensaje: string }[];
  confirmado?: boolean;
};

export const ESTADO_INICIAL_IMPORTACION: ResultadoImportacion = { status: "idle" };
