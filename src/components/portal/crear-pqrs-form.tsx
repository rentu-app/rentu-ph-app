"use client";

import { useActionState, useId } from "react";
import { TipoPQRS } from "@prisma/client";
import { crearPqrsResidente } from "@/lib/actions/pqrs";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import {
  CLASES_CONTROL,
  CLASES_TEXTAREA,
  Campo,
  MensajeAccion,
} from "@/components/ui/formulario";
import { Tarjeta } from "@/components/ui/primitivos";

const ETIQUETAS_TIPO: Record<TipoPQRS, string> = {
  PETICION: "Petición",
  QUEJA: "Queja",
  RECLAMO: "Reclamo",
  SUGERENCIA: "Sugerencia",
  FALLA: "Falla",
};

export function CrearPqrsForm() {
  const [estado, accion] = useActionState(crearPqrsResidente, ESTADO_INICIAL_ACCION);

  const idTipo = useId();
  const idTitulo = useId();
  const idDescripcion = useId();

  return (
    <Tarjeta className="p-4 sm:p-5">
      <form action={accion} className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-zinc-900">Radicar PQRS</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Recibes un número de radicado y puedes seguir la respuesta desde
            acá.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr]">
          <Campo etiqueta="Tipo" htmlFor={idTipo}>
            <select
              id={idTipo}
              name="tipo"
              required
              defaultValue={TipoPQRS.PETICION}
              className={CLASES_CONTROL}
            >
              {Object.values(TipoPQRS).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ETIQUETAS_TIPO[tipo]}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            etiqueta="Título"
            htmlFor={idTitulo}
            error={estado.errores?.titulo?.[0]}
          >
            <input
              id={idTitulo}
              name="titulo"
              type="text"
              required
              placeholder="ej. Fuga de agua en el baño principal"
              className={CLASES_CONTROL}
            />
          </Campo>
        </div>

        <Campo
          etiqueta="Descripción"
          htmlFor={idDescripcion}
          error={estado.errores?.descripcion?.[0]}
        >
          <textarea
            id={idDescripcion}
            name="descripcion"
            required
            rows={4}
            placeholder="Cuenta qué pasó, dónde y desde cuándo."
            className={CLASES_TEXTAREA}
          />
        </Campo>

        <MensajeAccion estado={estado} />

        <div>
          <BotonSubmit pendiente="Radicando…" anchoCompleto>
            Radicar PQRS
          </BotonSubmit>
        </div>
      </form>
    </Tarjeta>
  );
}
