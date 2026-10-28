import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Unidades (inmuebles) activas de UNA copropiedad, más la suma de sus
 * coeficientes. La suma se hace con `Prisma.Decimal` (no con `number`) para
 * que 0.04167 × N no arrastre error de punto flotante: la Ley 675 exige que
 * los coeficientes de una copropiedad sumen exactamente 100 %.
 */
export const getUnidadesDeCopropiedad = cache(async (copropiedadId: string) => {
  const filas = await prisma.inmueble.findMany({
    where: { copropiedadId, deletedAt: null },
    orderBy: [{ torre: "asc" }, { identificador: "asc" }],
    select: {
      id: true,
      identificador: true,
      torre: true,
      coeficiente: true,
      areaM2: true,
      estado: true,
    },
  });

  const suma = filas.reduce((acc, fila) => acc.plus(fila.coeficiente), new Prisma.Decimal(0));

  return {
    unidades: filas.map((fila) => ({
      id: fila.id,
      identificador: fila.identificador,
      torre: fila.torre,
      coeficiente: fila.coeficiente.toFixed(5),
      areaM2: fila.areaM2 ? fila.areaM2.toFixed(2) : "",
      estado: fila.estado,
    })),
    sumaCoeficientes: suma.toFixed(5),
  };
});
