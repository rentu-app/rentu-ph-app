"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { indexarDocumento } from "@/lib/actions/documentos";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";

const TIPOS_DOCUMENTO = [
  { value: "REGLAMENTO_PH", label: "Reglamento de PH" },
  { value: "MANUAL_CONVIVENCIA", label: "Manual de convivencia" },
  { value: "ACTA_ASAMBLEA", label: "Acta de asamblea" },
  { value: "OTRO", label: "Otro" },
] as const;

function BotonIndexar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-600/20 sm:w-auto transition-all hover:scale-[1.02] hover:bg-brand-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 dark:bg-brand-500 dark:hover:bg-brand-400"
    >
      {pending ? "Indexando… (puede tardar la primera vez)" : "Indexar documento"}
    </button>
  );
}

export function SubirDocumentoForm({
  copropiedades,
}: {
  copropiedades: { id: string; nombre: string }[];
}) {
  const [estado, accion] = useActionState(
    indexarDocumento,
    ESTADO_INICIAL_ACCION
  );
  const idCopropiedad = useId();
  const idTipo = useId();
  const idTitulo = useId();
  const idContenido = useId();

  if (copropiedades.length === 0) return null;

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            {copropiedades.map((copropiedad) => (
              <option key={copropiedad.id} value={copropiedad.id}>
                {copropiedad.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idTipo} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Tipo de documento
          </label>
          <select
            id={idTipo}
            name="tipo"
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          >
            {TIPOS_DOCUMENTO.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>
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
          placeholder="ej. Reglamento de Propiedad Horizontal 2026"
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
        {estado.errores?.titulo?.[0] ? (
          <p className="text-xs text-red-600">{estado.errores.titulo[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={idContenido} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Contenido
        </label>
        <textarea
          id={idContenido}
          name="contenido"
          required
          rows={6}
          placeholder="Pega aquí el texto completo del documento…"
          className="w-full resize-y rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
        {estado.errores?.contenido?.[0] ? (
          <p className="text-xs text-red-600">{estado.errores.contenido[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <BotonIndexar />
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
