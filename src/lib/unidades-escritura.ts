import { EstadoCuenta, EstadoInmueble, EtapaCobro, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ORDEN_ETAPAS: EtapaCobro[] = [
  EtapaCobro.AL_DIA,
  EtapaCobro.RECORDATORIO,
  EtapaCobro.COBRO_PERSUASIVO,
  EtapaCobro.ACUERDO_PAGO,
  EtapaCobro.PREJURIDICO,
  EtapaCobro.JURIDICO,
];

/**
 * Etapa de cobro de unidades que se reactivan, calculada con sus cuentas de
 * cobro (no se fuerza "Al día"):
 *   - sin cuentas VENCIDA/EN_MORA (nada o solo PENDIENTE dentro de plazo) → AL_DIA;
 *   - con alguna VENCIDA/EN_MORA → la etapa que ya tenía si era más avanzada
 *     que RECORDATORIO (es una decisión del administrador, registrada en la
 *     bitácora, y la deuda sigue ahí), y si no, RECORDATORIO.
 * Usa el mismo criterio de mora que la cartera: el estado persistido de la cuenta.
 * Una sola consulta para todas las unidades.
 */
export async function calcularEtapasReactivacion(
  inmuebleIds: string[]
): Promise<Map<string, EtapaCobro>> {
  const etapas = new Map<string, EtapaCobro>();
  if (inmuebleIds.length === 0) return etapas;

  const unidades = await prisma.inmueble.findMany({
    where: { id: { in: inmuebleIds } },
    select: {
      id: true,
      etapaCobro: true,
      cuentasDeCobro: {
        where: {
          deletedAt: null,
          estado: { in: [EstadoCuenta.VENCIDA, EstadoCuenta.EN_MORA] },
        },
        select: { id: true },
        take: 1,
      },
    },
  });

  for (const unidad of unidades) {
    const enMora = unidad.cuentasDeCobro.length > 0;
    etapas.set(
      unidad.id,
      !enMora
        ? EtapaCobro.AL_DIA
        : ORDEN_ETAPAS.indexOf(unidad.etapaCobro) > ORDEN_ETAPAS.indexOf(EtapaCobro.RECORDATORIO)
          ? unidad.etapaCobro
          : EtapaCobro.RECORDATORIO
    );
  }
  return etapas;
}

/**
 * Operaciones para reactivar una unidad borrada (soft delete) que vuelve a
 * crearse con el mismo identificador. Se tratan como una unidad NUEVA:
 *   - toma los valores del formulario/CSV (torre, coeficiente, área, estado);
 *   - su etapa de cobro es la calculada por `calcularEtapasReactivacion`;
 *   - los residentes que seguían vinculados cuando se borró se cierran
 *     (`activo = false`, `fechaFin`), para que la unidad nueva no herede
 *     ocupantes ni destinatarios de avisos de la anterior.
 * Las cuentas de cobro, pagos y bitácora anteriores NO se tocan: son historial
 * financiero que se conserva por trazabilidad (Ley 675).
 */
export function operacionesReactivarUnidad(
  inmuebleId: string,
  etapaCobro: EtapaCobro,
  datos: {
    torre: string;
    coeficiente: Prisma.Decimal;
    areaM2: Prisma.Decimal | null;
    estado: EstadoInmueble;
  }
) {
  return [
    prisma.inmueble.update({
      where: { id: inmuebleId },
      data: { ...datos, etapaCobro, deletedAt: null },
    }),
    prisma.usuarioInmueble.updateMany({
      where: { inmuebleId, activo: true, deletedAt: null },
      data: { activo: false, fechaFin: new Date() },
    }),
  ] as const;
}
