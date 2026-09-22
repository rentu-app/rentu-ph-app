"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { actualizarDisponibilidadInmueble } from "@/lib/actions/propiedades";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";

function BotonToggle({ publicando }: { publicando: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`min-h-11 rounded-md px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:py-1.5 ${
        publicando
          ? "bg-brand-600 text-white hover:bg-brand-700"
          : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {pending ? "Guardando…" : publicando ? "Publicar" : "Despublicar"}
    </button>
  );
}

export function ToggleDisponibilidadForm({
  inmuebleId,
  disponibleArriendo,
}: {
  inmuebleId: string;
  disponibleArriendo: boolean;
}) {
  const [estado, accion] = useActionState(
    actualizarDisponibilidadInmueble,
    ESTADO_INICIAL_ACCION
  );

  return (
    <form action={accion} className="flex items-center gap-2">
      <input type="hidden" name="inmuebleId" value={inmuebleId} />
      <input
        type="hidden"
        name="disponibleArriendo"
        value={disponibleArriendo ? "false" : "true"}
      />
      <BotonToggle publicando={!disponibleArriendo} />
      {estado.status === "error" ? (
        <span className="text-xs text-red-600">{estado.message}</span>
      ) : null}
    </form>
  );
}
