"use client";

import { useActionState, useEffect, useId } from "react";
import { PeriodicidadCosto } from "@prisma/client";
import { actualizarZonaComun, crearZonaComun } from "@/lib/actions/reservas";
import { ETIQUETAS_PERIODICIDAD } from "@/lib/validations/reservas";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import { InputMoneda } from "@/components/ui/input-moneda";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";

export type ZonaEditable = {
  id: string;
  nombre: string;
  descripcion: string | null;
  aforo: number;
  costo: number;
  periodicidadCosto: PeriodicidadCosto;
};

/** Crea una zona o, con `zona`, edita una existente (costo y periodicidad incluidos). */
export function CrearZonaComunForm({
  zona,
  alGuardar,
}: {
  zona?: ZonaEditable;
  alGuardar?: () => void;
}) {
  const [estado, accion] = useActionState(
    zona ? actualizarZonaComun : crearZonaComun,
    ESTADO_INICIAL_ACCION
  );
  const idPeriodicidad = useId();

  useEffect(() => {
    if (zona && estado.status === "success") alGuardar?.();
  }, [estado, zona, alGuardar]);
  const idNombre = useId();
  const idAforo = useId();
  const idCosto = useId();
  const idDescripcion = useId();

  return (
    <form action={accion} className="flex flex-col gap-4">
      {zona ? <input type="hidden" name="zonaId" value={zona.id} /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombre"
          htmlFor={idNombre}
          error={estado.errores?.nombre?.[0]}
          className="sm:col-span-2"
        >
          <input
            id={idNombre}
            name="nombre"
            type="text"
            required
            defaultValue={zona?.nombre}
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
            defaultValue={zona?.aforo}
            placeholder="30"
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo
          etiqueta="Costo (opcional)"
          htmlFor={idCosto}
          error={estado.errores?.costo?.[0]}
        >
          <InputMoneda
            id={idCosto}
            name="costo"
            defaultValue={zona && zona.costo > 0 ? String(zona.costo) : ""}
            className={`${CLASES_CONTROL} tabular-nums`}
          />
        </Campo>

        <Campo
          etiqueta="Periodicidad del costo"
          htmlFor={idPeriodicidad}
          error={estado.errores?.periodicidadCosto?.[0]}
        >
          <select
            id={idPeriodicidad}
            name="periodicidadCosto"
            defaultValue={zona?.periodicidadCosto ?? PeriodicidadCosto.POR_USO}
            className={CLASES_CONTROL}
          >
            {Object.values(PeriodicidadCosto).map((valor) => (
              <option key={valor} value={valor}>
                {ETIQUETAS_PERIODICIDAD[valor]}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo etiqueta="Descripción (opcional)" htmlFor={idDescripcion}>
        <input
          id={idDescripcion}
          name="descripcion"
          type="text"
          defaultValue={zona?.descripcion ?? ""}
          placeholder="ej. Incluye sillas y mesas para 30 personas"
          className={CLASES_CONTROL}
        />
      </Campo>

      <MensajeAccion estado={estado} />

      <div>
        <BotonSubmit pendiente={zona ? "Guardando…" : "Creando…"} anchoCompleto>
          {zona ? "Guardar cambios" : "Crear zona común"}
        </BotonSubmit>
      </div>
    </form>
  );
}
