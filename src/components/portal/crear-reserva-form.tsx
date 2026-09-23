"use client";

import { useActionState, useId } from "react";
import { crearReservaResidente } from "@/lib/actions/reservas";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import type { ZonaComunParaResidente } from "@/lib/data/reservas";
import { BotonSubmit } from "@/components/ui/boton";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";
import { Tarjeta } from "@/components/ui/primitivos";
import { formatearMoneda } from "@/lib/formatters";

export function CrearReservaForm({ zonas }: { zonas: ZonaComunParaResidente[] }) {
  const [estado, accion] = useActionState(crearReservaResidente, ESTADO_INICIAL_ACCION);

  const idZona = useId();
  const idInicio = useId();
  const idFin = useId();
  const idObservaciones = useId();

  if (zonas.length === 0) {
    return (
      <Tarjeta className="p-4 sm:p-5">
        <p className="text-sm text-zinc-600">
          Tu conjunto todavía no tiene zonas comunes habilitadas para reservar.
        </p>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta className="p-4 sm:p-5">
      <form action={accion} className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-zinc-900">Radicar una reserva</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Queda pendiente hasta que la administración la confirme. Si el
            horario ya está tomado, te lo decimos al enviar.
          </p>
        </div>

        <Campo etiqueta="Zona común" htmlFor={idZona}>
          <select id={idZona} name="zonaComunId" required className={CLASES_CONTROL}>
            {zonas.map((zona) => (
              <option key={zona.id} value={zona.id}>
                {zona.nombre} · aforo {zona.aforo}
                {zona.costo > 0 ? ` · ${formatearMoneda(zona.costo)}` : " · sin costo"}
              </option>
            ))}
          </select>
        </Campo>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Desde"
            htmlFor={idInicio}
            error={estado.errores?.fechaInicio?.[0]}
          >
            <input
              id={idInicio}
              name="fechaInicio"
              type="datetime-local"
              required
              className={CLASES_CONTROL}
            />
          </Campo>

          <Campo etiqueta="Hasta" htmlFor={idFin} error={estado.errores?.fechaFin?.[0]}>
            <input
              id={idFin}
              name="fechaFin"
              type="datetime-local"
              required
              className={CLASES_CONTROL}
            />
          </Campo>
        </div>

        <Campo etiqueta="Observaciones (opcional)" htmlFor={idObservaciones}>
          <input
            id={idObservaciones}
            name="observaciones"
            type="text"
            placeholder="ej. Cumpleaños, 20 personas"
            className={CLASES_CONTROL}
          />
        </Campo>

        <MensajeAccion estado={estado} />

        <div>
          <BotonSubmit pendiente="Radicando…" anchoCompleto>
            Radicar reserva
          </BotonSubmit>
        </div>
      </form>
    </Tarjeta>
  );
}
