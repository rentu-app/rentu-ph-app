"use client";

import { useActionState, useId } from "react";
import { crearZonaComun } from "@/lib/actions/reservas";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";

export function CrearZonaComunForm() {
  const [estado, accion] = useActionState(crearZonaComun, ESTADO_INICIAL_ACCION);
  const idNombre = useId();
  const idAforo = useId();
  const idCosto = useId();
  const idDescripcion = useId();

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo
          etiqueta="Nombre"
          htmlFor={idNombre}
          error={estado.errores?.nombre?.[0]}
          className="sm:col-span-3"
        >
          <input
            id={idNombre}
            name="nombre"
            type="text"
            required
            placeholder="ej. Salón social"
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo etiqueta="Aforo" htmlFor={idAforo} error={estado.errores?.aforo?.[0]}>
          <input
            id={idAforo}
            name="aforo"
            type="number"
            min={1}
            required
            placeholder="30"
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo
          etiqueta="Costo (opcional)"
          htmlFor={idCosto}
          error={estado.errores?.costo?.[0]}
        >
          <input
            id={idCosto}
            name="costo"
            type="text"
            inputMode="decimal"
            placeholder="0"
            className={`${CLASES_CONTROL} tabular-nums`}
          />
        </Campo>
      </div>

      <Campo etiqueta="Descripción (opcional)" htmlFor={idDescripcion}>
        <input
          id={idDescripcion}
          name="descripcion"
          type="text"
          placeholder="ej. Incluye sillas y mesas para 30 personas"
          className={CLASES_CONTROL}
        />
      </Campo>

      <MensajeAccion estado={estado} />

      <div>
        <BotonSubmit pendiente="Creando…" anchoCompleto>
          Crear zona común
        </BotonSubmit>
      </div>
    </form>
  );
}
