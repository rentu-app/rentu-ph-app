"use client";

import { useActionState, useId } from "react";
import { crearOrdenServicio } from "@/lib/actions/prestadores";
import type { PrestadorConOrdenes } from "@/lib/data/prestadores";
import type { PqrsEscalable } from "@/lib/data/prestadores";
import { ETIQUETAS_TIPO_PRESTADOR } from "@/lib/validations/prestadores";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import {
  CLASES_CONTROL,
  CLASES_TEXTAREA,
  Campo,
  MensajeAccion,
} from "@/components/ui/formulario";

/**
 * Crea una orden de servicio para un prestador.
 *
 * Dos modos:
 *   - `pqrsFija`: la orden nace de una PQRS concreta (se llama desde la lista
 *     de PQRS). La PQRS viaja en un campo oculto y se muestra como contexto.
 *   - `pqrsDisponibles`: el administrador crea la orden desde la sección de
 *     prestadores y elige, si quiere, de qué PQRS viene.
 *
 * En ambos casos el vínculo PQRS → orden es una decisión explícita. Ninguna
 * queja se convierte sola en orden de servicio ni en multa.
 */
export function CrearOrdenForm({
  prestadores,
  pqrsDisponibles = [],
  pqrsFija,
}: {
  prestadores: PrestadorConOrdenes[];
  pqrsDisponibles?: PqrsEscalable[];
  pqrsFija?: { id: string; codigoRadicado: string; titulo: string };
}) {
  const [estado, accion] = useActionState(crearOrdenServicio, ESTADO_INICIAL_ACCION);
  const idPrestador = useId();
  const idPqrs = useId();
  const idTitulo = useId();
  const idDescripcion = useId();
  const idFecha = useId();
  const idCosto = useId();

  const activos = prestadores.filter((prestador) => prestador.activo);

  if (activos.length === 0) {
    return (
      <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
        Primero agrega un prestador al directorio para poder asignarle órdenes.
      </p>
    );
  }

  return (
    <form action={accion} className="flex flex-col gap-4">
      {pqrsFija ? (
        <>
          <input type="hidden" name="pqrsId" value={pqrsFija.id} />
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900">
            Se vinculará a <strong>{pqrsFija.codigoRadicado}</strong> —{" "}
            {pqrsFija.titulo}
          </p>
        </>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Prestador"
          htmlFor={idPrestador}
          error={estado.errores?.prestadorId?.[0]}
        >
          <select
            id={idPrestador}
            name="prestadorId"
            required
            className={CLASES_CONTROL}
          >
            {activos.map((prestador) => (
              <option key={prestador.id} value={prestador.id}>
                {prestador.nombre} · {ETIQUETAS_TIPO_PRESTADOR[prestador.tipo]}
              </option>
            ))}
          </select>
        </Campo>

        {!pqrsFija ? (
          <Campo
            etiqueta="PQRS de origen (opcional)"
            htmlFor={idPqrs}
            ayuda="Solo aparecen las PQRS abiertas o en proceso que aún no tienen orden."
          >
            <select id={idPqrs} name="pqrsId" defaultValue="" className={CLASES_CONTROL}>
              <option value="">Sin PQRS asociada</option>
              {pqrsDisponibles.map((pqrs) => (
                <option key={pqrs.id} value={pqrs.id}>
                  {pqrs.codigoRadicado} · {pqrs.inmueble.identificador} ·{" "}
                  {pqrs.titulo}
                </option>
              ))}
            </select>
          </Campo>
        ) : null}

        <Campo
          etiqueta="Título de la orden"
          htmlFor={idTitulo}
          error={estado.errores?.titulo?.[0]}
          className={pqrsFija ? "" : "sm:col-span-2"}
        >
          <input
            id={idTitulo}
            name="titulo"
            type="text"
            required
            defaultValue={pqrsFija ? pqrsFija.titulo : ""}
            placeholder="ej. Reparar fuga en tubería del sótano"
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo etiqueta="Fecha programada (opcional)" htmlFor={idFecha}>
          <input
            id={idFecha}
            name="fechaProgramada"
            type="date"
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo
          etiqueta="Costo estimado (opcional)"
          htmlFor={idCosto}
          error={estado.errores?.costoEstimado?.[0]}
          ayuda="Referencia de presupuesto. Rentu no hace pagos ni contabilidad."
        >
          <input
            id={idCosto}
            name="costoEstimado"
            type="text"
            inputMode="decimal"
            placeholder="ej. 850000"
            className={`${CLASES_CONTROL} tabular-nums`}
          />
        </Campo>
      </div>

      <Campo etiqueta="Detalle (opcional)" htmlFor={idDescripcion}>
        <textarea
          id={idDescripcion}
          name="descripcion"
          rows={3}
          className={CLASES_TEXTAREA}
        />
      </Campo>

      <MensajeAccion estado={estado} />

      <div>
        <BotonSubmit pendiente="Creando…" anchoCompleto>
          Crear orden de servicio
        </BotonSubmit>
      </div>
    </form>
  );
}
