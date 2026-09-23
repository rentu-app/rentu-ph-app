"use client";

import { useActionState } from "react";
import { EstadoReserva } from "@prisma/client";
import { actualizarEstadoReserva } from "@/lib/actions/reservas";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";

/**
 * Confirma, cancela o vuelve a dejar pendiente una reserva.
 *
 * Al confirmar, el servidor revalida la regla de paz y salvo (el estado de
 * cartera pudo cambiar después de radicada la solicitud) y el cruce de
 * horario; si algo falla, el mensaje se muestra acá debajo.
 */
export function GestionarReservaForm({
  reservaId,
  estadoActual,
}: {
  reservaId: string;
  estadoActual: EstadoReserva;
}) {
  const [estado, accion] = useActionState(
    actualizarEstadoReserva,
    ESTADO_INICIAL_ACCION
  );

  return (
    <div className="flex w-full flex-col gap-1.5 sm:items-end">
      <form action={accion} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="reservaId" value={reservaId} />

        {estadoActual !== EstadoReserva.CONFIRMADA ? (
          <BotonSubmit
            name="estado"
            value={EstadoReserva.CONFIRMADA}
            tamanio="sm"
            pendiente="…"
          >
            Confirmar
          </BotonSubmit>
        ) : null}

        {estadoActual !== EstadoReserva.CANCELADA ? (
          <BotonSubmit
            name="estado"
            value={EstadoReserva.CANCELADA}
            variante="neutro"
            tamanio="sm"
            pendiente="…"
          >
            Cancelar
          </BotonSubmit>
        ) : null}

        {estadoActual !== EstadoReserva.PENDIENTE ? (
          <BotonSubmit
            name="estado"
            value={EstadoReserva.PENDIENTE}
            variante="neutro"
            tamanio="sm"
            pendiente="…"
          >
            Volver a pendiente
          </BotonSubmit>
        ) : null}
      </form>

      {estado.status === "error" ? (
        <p
          role="status"
          className="max-w-md text-xs font-medium text-red-600 sm:text-right"
        >
          {estado.message}
        </p>
      ) : null}
      {estado.status === "success" ? (
        <p role="status" className="text-xs font-medium text-emerald-600">
          {estado.message}
        </p>
      ) : null}
    </div>
  );
}
