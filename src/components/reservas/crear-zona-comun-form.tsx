"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { crearZonaComun } from "@/lib/actions/reservas";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";

function BotonCrear() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-600/20 sm:w-auto transition-all hover:scale-[1.02] hover:bg-brand-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 dark:bg-brand-500 dark:hover:bg-brand-400"
    >
      {pending ? "Creando…" : "Crear zona común"}
    </button>
  );
}

export function CrearZonaComunForm({
  copropiedades,
}: {
  copropiedades: { id: string; nombre: string }[];
}) {
  const [estado, accion] = useActionState(crearZonaComun, ESTADO_INICIAL_ACCION);
  const idCopropiedad = useId();
  const idNombre = useId();
  const idAforo = useId();
  const idCosto = useId();
  const idDescripcion = useId();

  if (copropiedades.length === 0) return null;

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={idCopropiedad} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Copropiedad
          </label>
          <select
            id={idCopropiedad}
            name="copropiedadId"
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          >
            {copropiedades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idNombre} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Nombre
          </label>
          <input
            id={idNombre}
            name="nombre"
            type="text"
            required
            placeholder="Salón social"
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idAforo} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Aforo
          </label>
          <input
            id={idAforo}
            name="aforo"
            type="number"
            min={1}
            required
            placeholder="30"
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idCosto} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Costo (opcional)
          </label>
          <input
            id={idCosto}
            name="costo"
            type="text"
            inputMode="decimal"
            placeholder="0"
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm tabular-nums focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={idDescripcion} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Descripción (opcional)
        </label>
        <input
          id={idDescripcion}
          name="descripcion"
          type="text"
          placeholder="ej. Incluye sillas y mesas para 30 personas"
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <BotonCrear />
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
