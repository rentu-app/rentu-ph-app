"use client";

import { seleccionarInmuebleActivo } from "@/lib/actions/portal";
import type { VinculoResidente } from "@/lib/session";

export function SeleccionarInmuebleForm({
  vinculos,
  inmuebleActivoId,
}: {
  vinculos: VinculoResidente[];
  inmuebleActivoId: string | undefined;
}) {
  return (
    <form action={seleccionarInmuebleActivo} className="flex items-center gap-2">
      <select
        name="inmuebleId"
        defaultValue={inmuebleActivoId}
        onChange={(evento) => evento.currentTarget.form?.requestSubmit()}
        className="min-h-11 max-w-[55vw] rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none sm:max-w-none"
      >
        {vinculos.map((vinculo) => (
          <option key={vinculo.inmueble.id} value={vinculo.inmueble.id}>
            {vinculo.inmueble.identificador} — {vinculo.inmueble.copropiedad.nombre}
          </option>
        ))}
      </select>
    </form>
  );
}
