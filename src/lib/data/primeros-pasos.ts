import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ProgresoPrimerosPasos = {
  unidades: boolean;
  ocupantes: boolean;
  cuentaDeCobro: boolean;
  zonaComun: boolean;
};

/**
 * Qué pasos del "Primeros pasos" ya se cumplieron, leído de la base en UNA
 * consulta (cuatro EXISTS). Nada se guarda aparte: el paso se marca solo en
 * cuanto existe el dato, y se desmarca si el dato desaparece.
 *   - unidades:      al menos una unidad activa.
 *   - ocupantes:     al menos un residente activo vinculado a una unidad activa.
 *   - cuentaDeCobro: al menos una cuenta de cobro de alguna unidad activa.
 *   - zonaComun:     al menos una zona común.
 */
export const getProgresoPrimerosPasos = cache(
  async (copropiedadId: string): Promise<ProgresoPrimerosPasos> => {
    const [fila] = await prisma.$queryRaw<
      { unidades: boolean; ocupantes: boolean; cuentas: boolean; zonas: boolean }[]
    >(Prisma.sql`
      SELECT
        EXISTS (
          SELECT 1 FROM inmuebles i
          WHERE i."copropiedadId" = ${copropiedadId}::uuid AND i."deletedAt" IS NULL
        ) AS unidades,
        EXISTS (
          SELECT 1 FROM usuario_inmueble ui
          JOIN inmuebles i ON i.id = ui."inmuebleId"
          WHERE i."copropiedadId" = ${copropiedadId}::uuid AND i."deletedAt" IS NULL
            AND ui.activo AND ui."deletedAt" IS NULL
        ) AS ocupantes,
        EXISTS (
          SELECT 1 FROM cuentas_de_cobro cc
          JOIN inmuebles i ON i.id = cc."inmuebleId"
          WHERE i."copropiedadId" = ${copropiedadId}::uuid AND i."deletedAt" IS NULL
            AND cc."deletedAt" IS NULL
        ) AS cuentas,
        EXISTS (
          SELECT 1 FROM zonas_comunes z
          WHERE z."copropiedadId" = ${copropiedadId}::uuid AND z."deletedAt" IS NULL
        ) AS zonas
    `);

    return {
      unidades: fila.unidades,
      ocupantes: fila.ocupantes,
      cuentaDeCobro: fila.cuentas,
      zonaComun: fila.zonas,
    };
  }
);
