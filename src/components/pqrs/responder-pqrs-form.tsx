"use client";

import { useActionState, useId, useState } from "react";
import { EstadoPQRS } from "@prisma/client";
import { responderPqrs } from "@/lib/actions/pqrs";
import { ETIQUETAS_ESTADO_PQRS } from "@/components/pqrs/estado-pqrs-badge";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import {
  CLASES_CONTROL,
  CLASES_TEXTAREA,
  Campo,
  MensajeAccion,
} from "@/components/ui/formulario";

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
        className="flex min-h-11 items-center text-sm font-medium text-brand-700 hover:underline"
      >
        Responder / cambiar estado
      </button>
    );
  }

  return (
    <form
      action={accion}
      className="flex w-full flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
    >
      <input type="hidden" name="pqrsId" value={pqrsId} />

      <Campo etiqueta="Estado" htmlFor={estadoId}>
        <select
          id={estadoId}
          name="estado"
          defaultValue={estadoActual}
          required
          className={CLASES_CONTROL}
        >
          {Object.values(EstadoPQRS).map((valor) => (
            <option key={valor} value={valor}>
              {ETIQUETAS_ESTADO_PQRS[valor]}
            </option>
          ))}
        </select>
      </Campo>

      <Campo
        etiqueta="Respuesta al residente (opcional)"
        htmlFor={respuestaId}
        error={estado.errores?.respuesta?.[0]}
      >
        <textarea
          id={respuestaId}
          name="respuesta"
          rows={3}
          defaultValue={respuestaActual ?? ""}
          placeholder="Escribe la respuesta o el plan de acción…"
          className={CLASES_TEXTAREA}
        />
      </Campo>

      <MensajeAccion estado={estado} />

      <div className="flex flex-wrap items-center gap-2">
        <BotonSubmit pendiente="Guardando…" tamanio="sm">
          Guardar
        </BotonSubmit>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="flex min-h-11 items-center px-2 text-sm text-zinc-500 hover:text-zinc-700 sm:min-h-9"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
