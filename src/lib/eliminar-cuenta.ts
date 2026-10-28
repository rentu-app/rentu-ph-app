import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ResultadoEliminacion = {
  copropiedadesEliminadas: string[];
  copropiedadesDesvinculadas: string[];
  authEliminado: boolean;
};

/**
 * Elimina la cuenta de un administrador (soft delete; nada se borra de verdad
 * en Prisma):
 *   - copropiedad donde es el ÚNICO administrador activo → soft delete de la
 *     copropiedad y de todos sus datos;
 *   - copropiedad compartida con otros administradores → solo se desvincula;
 *   - el `Usuario` queda con `deletedAt`, `activo = false` y el correo
 *     renombrado a `deleted+<id>@rentu.invalid`, que libera el correo real
 *     (columna única) para volver a registrarse;
 *   - se borra el usuario de Supabase Auth (cliente admin).
 * Sin `next/headers`: la usan la Server Action y el script de prueba. Las
 * validaciones de quién puede llamarla (no demo, correo confirmado) son de la
 * Server Action.
 */
export async function eliminarCuentaAdministrador(
  administradorId: string,
  authUserId: string | null
): Promise<ResultadoEliminacion> {
  const ahora = new Date();

  const vinculos = await prisma.administradorCopropiedad.findMany({
    where: { usuarioId: administradorId, deletedAt: null, copropiedad: { deletedAt: null } },
    select: {
      copropiedadId: true,
      copropiedad: {
        select: {
          administradores: {
            where: { deletedAt: null, usuarioId: { not: administradorId }, usuario: { deletedAt: null } },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  const unicas = vinculos.filter((v) => v.copropiedad.administradores.length === 0).map((v) => v.copropiedadId);
  const compartidas = vinculos.filter((v) => v.copropiedad.administradores.length > 0).map((v) => v.copropiedadId);

  const eliminada = { deletedAt: ahora };
  const sinBorrar = { deletedAt: null };
  const inmuebles = { inmueble: { copropiedadId: { in: unicas } } };

  await prisma.$transaction([
    // Datos colgados de las unidades de las copropiedades que desaparecen.
    prisma.pago.updateMany({ where: { ...sinBorrar, cuentaDeCobro: inmuebles }, data: eliminada }),
    prisma.recargoMora.updateMany({ where: { ...sinBorrar, cuentaDeCobro: inmuebles }, data: eliminada }),
    prisma.comprobantePago.updateMany({ where: { ...sinBorrar, cuentaDeCobro: inmuebles }, data: eliminada }),
    prisma.cuentaDeCobro.updateMany({ where: { ...sinBorrar, ...inmuebles }, data: eliminada }),
    prisma.pqrs.updateMany({ where: { ...sinBorrar, ...inmuebles }, data: eliminada }),
    prisma.reserva.updateMany({
      where: { ...sinBorrar, zonaComun: { copropiedadId: { in: unicas } } },
      data: eliminada,
    }),
    prisma.gestionCobro.updateMany({ where: { ...sinBorrar, ...inmuebles }, data: eliminada }),
    prisma.notificacionCobro.updateMany({ where: { ...sinBorrar, ...inmuebles }, data: eliminada }),
    prisma.vehiculo.updateMany({ where: { ...sinBorrar, ...inmuebles }, data: eliminada }),
    prisma.mascota.updateMany({ where: { ...sinBorrar, ...inmuebles }, data: eliminada }),
    prisma.usuarioInmueble.updateMany({
      where: { ...sinBorrar, ...inmuebles },
      data: { ...eliminada, activo: false, fechaFin: ahora },
    }),
    // Datos de la copropiedad misma.
    prisma.ordenServicio.updateMany({ where: { ...sinBorrar, copropiedadId: { in: unicas } }, data: eliminada }),
    prisma.prestador.updateMany({ where: { ...sinBorrar, copropiedadId: { in: unicas } }, data: eliminada }),
    prisma.zonaComun.updateMany({ where: { ...sinBorrar, copropiedadId: { in: unicas } }, data: eliminada }),
    prisma.documentoPH.updateMany({ where: { ...sinBorrar, copropiedadId: { in: unicas } }, data: eliminada }),
    prisma.comunicado.updateMany({ where: { ...sinBorrar, copropiedadId: { in: unicas } }, data: eliminada }),
    prisma.mantenimiento.updateMany({ where: { ...sinBorrar, copropiedadId: { in: unicas } }, data: eliminada }),
    prisma.inmueble.updateMany({ where: { ...sinBorrar, copropiedadId: { in: unicas } }, data: eliminada }),
    prisma.administradorCopropiedad.updateMany({
      where: { ...sinBorrar, copropiedadId: { in: unicas } },
      data: eliminada,
    }),
    prisma.copropiedad.updateMany({ where: { ...sinBorrar, id: { in: unicas } }, data: eliminada }),
    // En las compartidas solo se quita este administrador.
    prisma.administradorCopropiedad.updateMany({
      where: { ...sinBorrar, usuarioId: administradorId, copropiedadId: { in: compartidas } },
      data: eliminada,
    }),
    // El usuario: soft delete y correo liberado.
    prisma.usuario.update({
      where: { id: administradorId },
      data: {
        deletedAt: ahora,
        activo: false,
        email: `deleted+${administradorId}@rentu.invalid`,
      },
    }),
  ]);

  let authEliminado = false;
  if (authUserId) {
    const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(authUserId);
    if (error) console.error("eliminarCuentaAdministrador:deleteUser", error.message);
    authEliminado = !error;
  }

  return {
    copropiedadesEliminadas: unicas,
    copropiedadesDesvinculadas: compartidas,
    authEliminado,
  };
}
