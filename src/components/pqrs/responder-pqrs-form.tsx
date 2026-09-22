"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { EstadoPQRS } from "@prisma/client";
import { responderPqrs } from "@/lib/actions/pqrs";
import { ETIQUETAS_ESTADO_PQRS } from "@/components/pqrs/estado-pqrs-badge";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded-md bg-brand-600 px-3 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:py-1.5 dark:bg-brand-500 dark:hover:bg-brand-400"
    >
      {pending ? "Guardando…" : "Guardar"}
    </button>
  );
}

export function ResponderPqrsForm({
  pqrsId,
  estadoActual,
  respuestaActual,
}: {
  pqrsId: string;
  estadoActual: EstadoPQRS;
  respuestaActual: string | null;
}) {
  const [estado, accion] = useActionState(responderPqrs, ESTADO_INICIAL_ACCION);
  const [abierto, setAbierto] = useState(false);
  const estadoId = useId();
  const respuestaId = useId();

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex min-h-11 items-center text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900 sm:min-h-0 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Responder / cambiar estado
      </button>
    );
  }

  return (
    <form action={accion} className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <input type="hidden" name="pqrsId" value={pqrsId} />

      <div className="flex flex-col gap-1">
        <label htmlFor={estadoId} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Estado
        </label>
        <select
          id={estadoId}
          name="estado"
          defaultValue={estadoActual}
          required
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
        >
          {Object.values(EstadoPQRS).map((valor) => (
            <option key={valor} value={valor}>
              {ETIQUETAS_ESTADO_PQRS[valor]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={respuestaId} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Respuesta al residente (opcional)
        </label>
        <textarea
          id={respuestaId}
          name="respuesta"
          rows={3}
          defaultValue={respuestaActual ?? ""}
          placeholder="Escribe la respuesta o el plan de acción…"
          className="w-full resize-y rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex items-center gap-3">
        <BotonGuardar />
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="flex min-h-11 items-center text-xs text-zinc-500 hover:text-zinc-700 sm:min-h-0 dark:hover:text-zinc-300"
        >
          Cancelar
        </button>
        {estado.status === "error" ? (
          <p className="text-xs text-red-600">{estado.message}</p>
        ) : null}
        {estado.status === "success" ? (
          <p className="text-xs text-emerald-600">{estado.message}</p>
        ) : null}
      </div>
    </form>
  );
}
