import { EstadoInmueble, EtapaCobro, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Operaciones para reactivar una unidad borrada (soft delete) que vuelve a
 * crearse con el mismo identificador. Se tratan como una unidad NUEVA:
 *   - toma los valores del formulario/CSV (torre, coeficiente, área, estado);
 *   - su etapa de cobro vuelve a AL_DIA (la que traía era de la vida anterior);
 *   - los residentes que seguían vinculados cuando se borró se cierran
 *     (`activo = false`, `fechaFin`), para que la unidad nueva no herede
 *     ocupantes ni destinatarios de avisos de la anterior.
 * Las cuentas de cobro, pagos y bitácora anteriores NO se tocan: son historial
 * financiero que se conserva por trazabilidad (Ley 675).
 */
export function operacionesReactivarUnidad(
  inmuebleId: string,
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
      data: { ...datos, etapaCobro: EtapaCobro.AL_DIA, deletedAt: null },
    }),
    prisma.usuarioInmueble.updateMany({
      where: { inmuebleId, activo: true, deletedAt: null },
      data: { activo: false, fechaFin: new Date() },
    }),
  ] as const;
}
