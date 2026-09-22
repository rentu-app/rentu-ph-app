"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { TipoPQRS } from "@prisma/client";
import { crearPqrsResidente } from "@/lib/actions/pqrs";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";

const TIPOS_PQRS = [
  { value: "PETICION", label: "Petición" },
  { value: "QUEJA", label: "Queja" },
  { value: "RECLAMO", label: "Reclamo" },
  { value: "SUGERENCIA", label: "Sugerencia" },
  { value: "FALLA", label: "Falla" },
] as const satisfies { value: TipoPQRS; label: string }[];

function BotonRadicar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {pending ? "Radicando…" : "Radicar PQRS"}
    </button>
  );
}

export function CrearPqrsForm() {
  const [estado, accion] = useActionState(crearPqrsResidente, ESTADO_INICIAL_ACCION);

  const idTipo = useId();
  const idTitulo = useId();
  const idDescripcion = useId();

  return (
    <form
      action={accion}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h3 className="font-semibold text-zinc-900">Radicar PQRS</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Cuéntanos tu petición, queja, reclamo o sugerencia.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
        <div className="flex flex-col gap-1">
          <label htmlFor={idTipo} className="text-xs font-medium text-zinc-500">
            Tipo
          </label>
          <select
            id={idTipo}
            name="tipo"
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          >
            {TIPOS_PQRS.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idTitulo} className="text-xs font-medium text-zinc-500">
            Título
          </label>
          <input
            id={idTitulo}
            name="titulo"
            type="text"
            required
            placeholder="ej. Fuga de agua en el baño principal"
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
          {estado.errores?.titulo?.[0] ? (
            <p className="text-xs text-red-600">{estado.errores.titulo[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={idDescripcion} className="text-xs font-medium text-zinc-500">
          Descripción
        </label>
        <textarea
          id={idDescripcion}
          name="descripcion"
          required
          rows={3}
          placeholder="Describe la situación con el mayor detalle posible…"
          className="w-full resize-y rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
        />
        {estado.errores?.descripcion?.[0] ? (
          <p className="text-xs text-red-600">{estado.errores.descripcion[0]}</p>
        ) : null}
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
