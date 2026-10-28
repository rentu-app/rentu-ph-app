import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type MetricasCopropiedad = {
  unidades: number;
  /** % de unidades sin cuentas vencidas ni en mora (null si no hay unidades). */
  porcentajeAlDia: number | null;
  pqrsAbiertas: number;
};

/**
 * Métricas de las tarjetas de /seleccionar-copropiedad para TODAS las
 * copropiedades del administrador en UNA sola consulta (sin N+1: el costo es
 * el mismo con 2 copropiedades que con 20).
 *
 * "Al día" = unidad activa sin ninguna cuenta de cobro VENCIDA o EN_MORA.
 * "PQRS abiertas" = no cerradas. Las filas con `deletedAt` quedan fuera.
 * Los ids ya vienen filtrados por pertenencia al administrador.
 */
export async function getMetricasCopropiedades(
  copropiedadIds: string[]
): Promise<Map<string, MetricasCopropiedad>> {
  const metricas = new Map<string, MetricasCopropiedad>();
  if (copropiedadIds.length === 0) return metricas;

  const filas = await prisma.$queryRaw<
    { id: string; unidades: number; al_dia: number; pqrs_abiertas: number }[]
  >(Prisma.sql`
    SELECT
      c.id,
      COUNT(DISTINCT i.id)::int AS unidades,
      COUNT(DISTINCT i.id) FILTER (
        WHERE NOT EXISTS (
          SELECT 1 FROM cuentas_de_cobro cc
          WHERE cc."inmuebleId" = i.id
            AND cc."deletedAt" IS NULL
            AND cc.estado IN ('VENCIDA', 'EN_MORA')
        )
      )::int AS al_dia,
      COUNT(DISTINCT p.id) FILTER (WHERE p.estado <> 'CERRADO')::int AS pqrs_abiertas
    FROM copropiedades c
    LEFT JOIN inmuebles i ON i."copropiedadId" = c.id AND i."deletedAt" IS NULL
    LEFT JOIN pqrs p ON p."inmuebleId" = i.id AND p."deletedAt" IS NULL
    WHERE c.id IN (${Prisma.join(copropiedadIds.map((id) => Prisma.sql`${id}::uuid`))})
    GROUP BY c.id
  `);

  for (const fila of filas) {
    metricas.set(fila.id, {
      unidades: fila.unidades,
      porcentajeAlDia: fila.unidades > 0 ? Math.round((fila.al_dia / fila.unidades) * 100) : null,
      pqrsAbiertas: fila.pqrs_abiertas,
    });
  }
  return metricas;
}
