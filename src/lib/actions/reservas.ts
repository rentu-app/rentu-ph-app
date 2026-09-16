"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EstadoReserva, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdministradorActual, getResidenteActual } from "@/lib/session";
import {
  existeCruceDeHorario,
  inmuebleNoEstaAPazYSalvo,
} from "@/lib/data/reservas";
import {
  actualizarEstadoReservaSchema,
  crearReservaSchema,
  crearZonaComunSchema,
} from "@/lib/validations/reservas";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

export type EstadoAccionReserva = EstadoAccionFormulario;

export async function crearZonaComun(
  _prevState: EstadoAccionReserva,
  formData: FormData
): Promise<EstadoAccionReserva> {
  const validado = crearZonaComunSchema.safeParse({
    copropiedadId: formData.get("copropiedadId"),
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion") ?? "",
    aforo: formData.get("aforo"),
    costo: formData.get("costo") ?? "0",
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { copropiedadId, nombre, descripcion, aforo, costo } = validado.data;

  try {
    const administrador = await getAdministradorActual();

    const copropiedad = await prisma.copropiedad.findFirst({
      where: {
        id: copropiedadId,
        deletedAt: null,
        administradores: { some: { usuarioId: administrador.id, deletedAt: null } },
      },
      select: { id: true },
    });

    if (!copropiedad) {
      return { status: "error", message: "La copropiedad no existe o no tienes acceso a ella." };
    }

    await prisma.zonaComun.create({
      data: {
        copropiedadId,
        nombre,
        descripcion: descripcion || null,
        aforo,
        costo: new Prisma.Decimal(costo),
      },
    });

    revalidatePath("/dashboard/reservas");

    return { status: "success", message: `"${nombre}" creada.` };
  } catch (error) {
    console.error("crearZonaComun", error);
    return { status: "error", message: "No se pudo crear la zona común." };
  }
}

/** El residente radica su propia solicitud de reserva. Bloquea inmuebles sin paz y salvo (VENCIDA/EN_MORA) y cruces de horario. */
export async function crearReservaResidente(
  _prevState: EstadoAccionReserva,
  formData: FormData
): Promise<EstadoAccionReserva> {
  const validado = crearReservaSchema.safeParse({
    zonaComunId: formData.get("zonaComunId"),
    fechaInicio: formData.get("fechaInicio"),
    fechaFin: formData.get("fechaFin"),
    observaciones: formData.get("observaciones") ?? "",
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { zonaComunId, fechaInicio, fechaFin, observaciones } = validado.data;

  try {
    const { usuario, inmuebleActivo } = await getResidenteActual();

    if (!inmuebleActivo) {
      return { status: "error", message: "No tienes ningún inmueble activo vinculado." };
    }

    const zonaComun = await prisma.zonaComun.findFirst({
      where: {
        id: zonaComunId,
        deletedAt: null,
        activa: true,
        copropiedadId: inmuebleActivo.inmueble.copropiedad.id,
      },
      select: { id: true },
    });

    if (!zonaComun) {
      return {
        status: "error",
        message: "La zona común no existe o no está activa en tu copropiedad.",
      };
    }

    // Regla de negocio: un inmueble sin paz y salvo (vencido o en mora) no
    // puede solicitar reservas.
    if (await inmuebleNoEstaAPazYSalvo(inmuebleActivo.inmueble.id)) {
      return {
        status: "error",
        message:
          "Tu inmueble tiene cuentas vencidas o en mora. Debe estar a paz y salvo para solicitar una reserva.",
      };
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (await existeCruceDeHorario({ zonaComunId, fechaInicio: inicio, fechaFin: fin })) {
      return {
        status: "error",
        message: "Ya existe una reserva pendiente o confirmada que se cruza con ese horario.",
      };
    }

    await prisma.reserva.create({
      data: {
        zonaComunId,
        inmuebleId: inmuebleActivo.inmueble.id,
        solicitadaPorId: usuario.id,
        fechaInicio: inicio,
        fechaFin: fin,
        observaciones: observaciones || null,
      },
    });

    revalidatePath("/portal/reservas");
    revalidatePath("/dashboard/reservas");

    return { status: "success", message: "Reserva radicada como pendiente de aprobación." };
  } catch (error) {
    console.error("crearReservaResidente", error);
    return { status: "error", message: "No se pudo radicar la reserva." };
  }
}

/** Aprueba, cancela o vuelve a poner pendiente una reserva. */
export async function actualizarEstadoReserva(
  _prevState: EstadoAccionReserva,
  formData: FormData
): Promise<EstadoAccionReserva> {
  const validado = actualizarEstadoReservaSchema.safeParse({
    reservaId: formData.get("reservaId"),
    estado: formData.get("estado"),
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { reservaId, estado } = validado.data;

  try {
    const administrador = await getAdministradorActual();

    const reserva = await prisma.reserva.findFirst({
      where: {
        id: reservaId,
        deletedAt: null,
        zonaComun: {
          copropiedad: {
            administradores: { some: { usuarioId: administrador.id, deletedAt: null } },
          },
        },
      },
      select: { id: true, zonaComunId: true, inmuebleId: true, fechaInicio: true, fechaFin: true },
    });

    if (!reserva) {
      return { status: "error", message: "La reserva no existe o no tienes acceso a ella." };
    }

    if (estado === EstadoReserva.CONFIRMADA) {
      // El estado de cartera pudo cambiar después de radicada la solicitud: se revalida.
      if (await inmuebleNoEstaAPazYSalvo(reserva.inmuebleId)) {
        return {
          status: "error",
          message: "No se puede confirmar: el inmueble tiene cuentas vencidas o en mora.",
        };
      }

      if (
        await existeCruceDeHorario({
          zonaComunId: reserva.zonaComunId,
          fechaInicio: reserva.fechaInicio,
          fechaFin: reserva.fechaFin,
          excluirReservaId: reserva.id,
        })
      ) {
        return {
          status: "error",
          message: "No se puede confirmar: ya hay otra reserva confirmada en ese horario.",
        };
      }
    }

    await prisma.reserva.update({ where: { id: reservaId }, data: { estado } });

    revalidatePath("/dashboard/reservas");
    revalidatePath("/portal/reservas");

    return { status: "success", message: "Reserva actualizada." };
  } catch (error) {
    console.error("actualizarEstadoReserva", error);
    return { status: "error", message: "No se pudo actualizar la reserva." };
  }
}
