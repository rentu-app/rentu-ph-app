"use client";

import { startTransition, useActionState, useEffect, useId, useRef, type FormEvent } from "react";
import { EstadoInmueble } from "@prisma/client";
import { actualizarUnidad, crearUnidad } from "@/lib/actions/unidades";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";
import { ETIQUETAS_ESTADO_INMUEBLE } from "@/lib/validations/unidades";

type ValoresUnidad = {
  id: string;
  identificador: string;
  torre: string;
  coeficiente: string;
  areaM2: string;
  estado: EstadoInmueble;
};

/**
 * Formulario de una unidad, en dos modos:
 *   - `crear`: pensado para cargar varias seguidas. Al guardar, vacía
 *     identificador/coeficiente/área, conserva torre y estado (lo habitual es
 *     que la siguiente unidad sea de la misma torre) y devuelve el foco al
 *     identificador, sin salir de la página.
 *   - `editar`: precargado con la unidad; avisa con `alGuardar` para que el
 *     modal que lo contiene se cierre.
 *
 * El envío va por `onSubmit` + `startTransition` en vez de `<form action>`
 * porque React 19 resetea el formulario completo cuando termina un action,
 * incluso si falló la validación, y el administrador perdería lo que escribió
 * justo cuando necesita corregirlo.
 */
export function UnidadForm({
  modo,
  unidad,
  alGuardar,
}: {
  modo: "crear" | "editar";
  unidad?: ValoresUnidad;
  alGuardar?: () => void;
}) {
  const [estado, accion, pendiente] = useActionState(
    modo === "crear" ? crearUnidad : actualizarUnidad,
    ESTADO_INICIAL_ACCION
  );
  const idTorre = useId();
  const idIdentificador = useId();
  const idCoeficiente = useId();
  const idArea = useId();
  const idEstado = useId();
  const identificadorRef = useRef<HTMLInputElement>(null);
  const coeficienteRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (estado.status !== "success") return;

    if (modo === "crear") {
      if (identificadorRef.current) identificadorRef.current.value = "";
      if (coeficienteRef.current) coeficienteRef.current.value = "";
      if (areaRef.current) areaRef.current.value = "";
      identificadorRef.current?.focus();
    } else {
      alGuardar?.();
    }
  }, [estado, modo, alGuardar]);

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => accion(datos));
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4">
      {modo === "editar" && unidad ? (
        <input type="hidden" name="inmuebleId" value={unidad.id} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Torre (opcional)"
          htmlFor={idTorre}
          error={estado.errores?.torre?.[0]}
          ayuda='Si la dejas vacía, la unidad queda como "Sin torre".'
        >
          <input
            id={idTorre}
            name="torre"
            type="text"
            defaultValue={unidad?.torre ?? ""}
            placeholder="ej. Torre 2"
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo
          etiqueta="Identificador"
          htmlFor={idIdentificador}
          error={estado.errores?.identificador?.[0]}
        >
          <input
            id={idIdentificador}
            ref={identificadorRef}
            name="identificador"
            type="text"
            required
            defaultValue={unidad?.identificador ?? ""}
            placeholder="ej. Apto 101"
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo
          etiqueta="Coeficiente (%)"
          htmlFor={idCoeficiente}
          error={estado.errores?.coeficiente?.[0]}
          ayuda="En porcentaje, como en la escritura. Máximo 3 decimales."
        >
          <input
            id={idCoeficiente}
            ref={coeficienteRef}
            name="coeficiente"
            type="text"
            inputMode="decimal"
            required
            defaultValue={unidad?.coeficiente ?? ""}
            placeholder="4.167"
            className={`${CLASES_CONTROL} tabular-nums`}
          />
        </Campo>

        <Campo
          etiqueta="Área m² (opcional)"
          htmlFor={idArea}
          error={estado.errores?.areaM2?.[0]}
        >
          <input
            id={idArea}
            ref={areaRef}
            name="areaM2"
            type="text"
            inputMode="decimal"
            defaultValue={unidad?.areaM2 ?? ""}
            placeholder="72.50"
            className={`${CLASES_CONTROL} tabular-nums`}
          />
        </Campo>

        <Campo
          etiqueta="Estado"
          htmlFor={idEstado}
          error={estado.errores?.estado?.[0]}
          className="sm:col-span-2"
        >
          <select
            id={idEstado}
            name="estado"
            defaultValue={unidad?.estado ?? EstadoInmueble.OCUPADO}
            className={CLASES_CONTROL}
          >
            {Object.values(EstadoInmueble).map((valor) => (
              <option key={valor} value={valor}>
                {ETIQUETAS_ESTADO_INMUEBLE[valor]}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <MensajeAccion estado={estado} />

      <div>
        <button
          type="submit"
          disabled={pendiente}
          aria-busy={pendiente}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {pendiente
            ? "Guardando…"
            : modo === "crear"
              ? "Guardar y agregar otra"
              : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
