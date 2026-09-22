"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { crearReservaResidente } from "@/lib/actions/reservas";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import type { ZonaComunParaResidente } from "@/lib/data/reservas";

function BotonRadicar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {pending ? "Radicando…" : "Radicar reserva"}
    </button>
  );
}

export function CrearReservaForm({ zonas }: { zonas: ZonaComunParaResidente[] }) {
  const [estado, accion] = useActionState(crearReservaResidente, ESTADO_INICIAL_ACCION);

  const idZona = useId();
  const idInicio = useId();
  const idFin = useId();
  const idObservaciones = useId();

  if (zonas.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500">
        Tu copropiedad todavía no tiene zonas comunes activas.
      </p>
    );
  }

  return (
    <form
      action={accion}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h3 className="font-semibold text-zinc-900">Radicar reserva</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Queda pendiente hasta que el administrador la apruebe.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={idZona} className="text-xs font-medium text-zinc-500">
            Zona común
          </label>
          <select
            id={idZona}
            name="zonaComunId"
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          >
            {zonas.map((zona) => (
              <option key={zona.id} value={zona.id}>
                {zona.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idInicio} className="text-xs font-medium text-zinc-500">
            Fecha y hora de inicio
          </label>
          <input
            id={idInicio}
            name="fechaInicio"
            type="datetime-local"
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
          {estado.errores?.fechaInicio?.[0] ? (
            <p className="text-xs text-red-600">{estado.errores.fechaInicio[0]}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idFin} className="text-xs font-medium text-zinc-500">
            Fecha y hora de fin
          </label>
          <input
            id={idFin}
            name="fechaFin"
            type="datetime-local"
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
          {estado.errores?.fechaFin?.[0] ? (
            <p className="text-xs text-red-600">{estado.errores.fechaFin[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={idObservaciones} className="text-xs font-medium text-zinc-500">
          Observaciones (opcional)
        </label>
        <input
          id={idObservaciones}
          name="observaciones"
          type="text"
          placeholder="ej. Celebración de cumpleaños, 20 personas"
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <BotonRadicar />
        {estado.status === "error" ? (
          <p className="text-sm text-red-600">{estado.message}</p>
        ) : null}
        {estado.status === "success" ? (
          <p className="text-sm text-emerald-600">{estado.message}</p>
        ) : null}
      </div>
    </form>
  );
}
