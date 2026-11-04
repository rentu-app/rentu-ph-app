import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getRubrosDeCopropiedad = cache(async (copropiedadId: string) => {
  const rubros = await prisma.rubroCobro.findMany({
    where: { copropiedadId, deletedAt: null },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, monto: true, periodicidad: true, activo: true },
  });
  return rubros.map((rubro) => ({ ...rubro, monto: Number(rubro.monto) }));
});

export type RubroCobroFila = Awaited<ReturnType<typeof getRubrosDeCopropiedad>>[number];

/** Suma de los rubros activos y mensuales: lo que se agrega a las expensas al generar el periodo. */
export function totalRubrosMensuales(rubros: RubroCobroFila[]): number {
  return rubros
    .filter((rubro) => rubro.activo && rubro.periodicidad === "MENSUAL")
    .reduce((suma, rubro) => suma + rubro.monto, 0);
}
