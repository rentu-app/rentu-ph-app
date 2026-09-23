"use client";

import { useActionState, useId, useState } from "react";
import { TipoPQRS } from "@prisma/client";
import { crearPqrs } from "@/lib/actions/pqrs";
import type { UnidadConResidentes } from "@/lib/data/pqrs";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import {
  CLASES_CONTROL,
  CLASES_TEXTAREA,
  Campo,
  MensajeAccion,
} from "@/components/ui/formulario";

const ETIQUETAS_TIPO: Record<TipoPQRS, string> = {
  PETICION: "Petición",
  QUEJA: "Queja",
  RECLAMO: "Reclamo",
  SUGERENCIA: "Sugerencia",
  FALLA: "Falla",
};

/**
 * El administrador radica una PQRS dirigida a un residente concreto.
 *
 * El select de unidad y el de residente están en cascada en el cliente (la
 * lista completa llega ya resuelta del servidor), así elegir la unidad no
 * cuesta un round-trip. Al haber una sola copropiedad desapareció el tercer
 * nivel del formulario.
 */
export function CrearPqrsForm({ unidades }: { unidades: UnidadConResidentes[] }) {
  const [estado, accion] = useActionState(crearPqrs, ESTADO_INICIAL_ACCION);

  const unidadesConResidentes = unidades.filter(
    (unidad) => unidad.residentes.length > 0
  );
  const [inmuebleId, setInmuebleId] = useState(
    unidadesConResidentes[0]?.id ?? ""
  );
  const unidad = unidadesConResidentes.find((item) => item.id === inmuebleId);

  const idUnidad = useId();
  const idResidente = useId();
  const idTipo = useId();
  const idTitulo = useId();
  const idDescripcion = useId();

  if (unidadesConResidentes.length === 0) {
    return (
      <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
        Para radicar una PQRS dirigida a alguien, primero vincula residentes a
        las unidades en la sección <strong>Residentes</strong>.
      </p>
    );
  }

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo etiqueta="Unidad" htmlFor={idUnidad}>
          <select
            id={idUnidad}
            name="inmuebleId"
            required
            value={inmuebleId}
            onChange={(evento) => setInmuebleId(evento.target.value)}
            className={CLASES_CONTROL}
          >
            {unidadesConResidentes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.identificador} — {item.torre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          etiqueta="Dirigida a"
          htmlFor={idResidente}
          error={estado.errores?.dirigidoAId?.[0]}
        >
          <select
            id={idResidente}
            name="dirigidoAId"
            required
            className={CLASES_CONTROL}
          >
            {(unidad?.residentes ?? []).map((residente) => (
              <option key={residente.usuarioId} value={residente.usuarioId}>
                {residente.usuario.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Tipo" htmlFor={idTipo}>
          <select
            id={idTipo}
            name="tipo"
            defaultValue={TipoPQRS.QUEJA}
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
            placeholder="ej. Ruido fuera del horario permitido"
            className={CLASES_CONTROL}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Descripción"
        htmlFor={idDescripcion}
        error={estado.errores?.descripcion?.[0]}
        ayuda="Los hechos, la fecha y qué se espera. Queda visible para el residente en su portal."
      >
        <textarea
          id={idDescripcion}
          name="descripcion"
          required
          rows={4}
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
  );
}
