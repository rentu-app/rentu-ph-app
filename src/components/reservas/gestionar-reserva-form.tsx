"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { EstadoReserva } from "@prisma/client";
import { actualizarEstadoReserva } from "@/lib/actions/reservas";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";

function BotonEstado({
  estado,
  etiqueta,
  claseActiva,
}: {
  estado: EstadoReserva;
  etiqueta: string;
  claseActiva: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="estado"
      value={estado}
      disabled={pending}
      className={`min-h-11 rounded-md px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:py-1.5 ${claseActiva}`}
    >
      {etiqueta}
    </button>
  );
}

export function GestionarReservaForm({
  reservaId,
  estadoActual,
}: {
  reservaId: string;
  estadoActual: EstadoReserva;
}) {
  const [estado, accion] = useActionState(actualizarEstadoReserva, ESTADO_INICIAL_ACCION);

  return (
    <div className="flex flex-col gap-1.5">
      <form action={accion} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="reservaId" value={reservaId} />
        {estadoActual !== EstadoReserva.CONFIRMADA ? (
          <BotonEstado
            estado={EstadoReserva.CONFIRMADA}
            etiqueta="Confirmar"
            claseActiva="bg-emerald-600 text-white hover:bg-emerald-500"
          />
        ) : null}
        {estadoActual !== EstadoReserva.CANCELADA ? (
          <BotonEstado
            estado={EstadoReserva.CANCELADA}
            etiqueta="Cancelar"
            claseActiva="border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          />
        ) : null}
        {estadoActual !== EstadoReserva.PENDIENTE ? (
          <BotonEstado
            estado={EstadoReserva.PENDIENTE}
            etiqueta="Volver a pendiente"
            claseActiva="border border-zinc-300 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          />
        ) : null}
      </form>
      {estado.status === "error" ? (
        <p className="text-xs text-red-600">{estado.message}</p>
      ) : null}
    </div>
  );
}
