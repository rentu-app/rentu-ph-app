"use client";

import { useActionState, useId, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { TipoPQRS } from "@prisma/client";
import { crearPqrs } from "@/lib/actions/pqrs";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import type { CopropiedadParaPqrs } from "@/lib/data/pqrs";

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
      className="min-h-11 w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-600/20 sm:w-auto transition-all hover:scale-[1.02] hover:bg-brand-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 dark:bg-brand-500 dark:hover:bg-brand-400"
    >
      {pending ? "Radicando…" : "Radicar PQRS"}
    </button>
  );
}

export function CrearPqrsForm({
  copropiedades,
}: {
  copropiedades: CopropiedadParaPqrs[];
}) {
  const [estado, accion] = useActionState(crearPqrs, ESTADO_INICIAL_ACCION);

  const [copropiedadId, setCopropiedadId] = useState(copropiedades[0]?.id ?? "");
  const copropiedad = copropiedades.find((c) => c.id === copropiedadId);

  const [inmuebleId, setInmuebleId] = useState(copropiedad?.inmuebles[0]?.id ?? "");
  const inmueble = useMemo(
    () => copropiedad?.inmuebles.find((i) => i.id === inmuebleId),
    [copropiedad, inmuebleId]
  );

  const idCopropiedad = useId();
  const idInmueble = useId();
  const idResidente = useId();
  const idTipo = useId();
  const idTitulo = useId();
  const idDescripcion = useId();

  if (copropiedades.length === 0) return null;

  function alCambiarCopropiedad(id: string) {
    setCopropiedadId(id);
    const nuevaCopropiedad = copropiedades.find((c) => c.id === id);
    setInmuebleId(nuevaCopropiedad?.inmuebles[0]?.id ?? "");
  }

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={idCopropiedad} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Copropiedad
          </label>
          <select
            id={idCopropiedad}
            value={copropiedadId}
            onChange={(evento) => alCambiarCopropiedad(evento.target.value)}
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
          <label htmlFor={idInmueble} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Inmueble
          </label>
          <select
            id={idInmueble}
            name="inmuebleId"
            required
            value={inmuebleId}
            onChange={(evento) => setInmuebleId(evento.target.value)}
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          >
            {(copropiedad?.inmuebles ?? []).map((i) => (
              <option key={i.id} value={i.id}>
                {i.identificador}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idResidente} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Dirigida a
          </label>
          {inmueble && inmueble.residentes.length > 0 ? (
            <select
              id={idResidente}
              name="dirigidoAId"
              required
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            >
              {inmueble.residentes.map((residente) => (
                <option key={residente.usuarioId} value={residente.usuarioId}>
                  {residente.usuario.nombre}
                </option>
              ))}
            </select>
          ) : (
            <p className="rounded-md border border-dashed border-zinc-300 px-2 py-1.5 text-xs text-zinc-400 dark:border-zinc-700">
              Este inmueble no tiene residentes activos vinculados.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
        <div className="flex flex-col gap-1">
          <label htmlFor={idTipo} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Tipo
          </label>
          <select
            id={idTipo}
            name="tipo"
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          >
            {TIPOS_PQRS.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idTitulo} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Título
          </label>
          <input
            id={idTitulo}
            name="titulo"
            type="text"
            required
            placeholder="ej. Fuga de agua en el baño principal"
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
          {estado.errores?.titulo?.[0] ? (
            <p className="text-xs text-red-600">{estado.errores.titulo[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={idDescripcion} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Descripción
        </label>
        <textarea
          id={idDescripcion}
          name="descripcion"
          required
          rows={3}
          placeholder="Describe la situación con el mayor detalle posible…"
          className="w-full resize-y rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
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
