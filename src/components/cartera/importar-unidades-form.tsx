"use client";

import { useActionState, useId } from "react";
import { importarUnidadesCsv } from "@/lib/actions/cartera";
import { FILA_CSV_ESPERADA } from "@/lib/validations/cartera";
import { ESTADO_INICIAL_IMPORTACION } from "@/lib/types/importacion";
import { BotonSubmit } from "@/components/ui/boton";
import { CLASES_CONTROL, CLASES_TEXTAREA, Campo, MensajeAccion } from "@/components/ui/formulario";
import { Etiqueta } from "@/components/ui/primitivos";

const EJEMPLO = `${FILA_CSV_ESPERADA}
Apto 101,Torre 1,0.04167,72.50
Apto 102,Torre 1,0.04167,72.50
Apto 201,Torre 2,0.04167,68.00`;

/**
 * Importación real del padrón de unidades desde CSV, en dos pasos:
 * validar (vista previa, sin escribir) y confirmar (escribe).
 *
 * Por qué CSV y no .xlsx: leer un Excel binario exige una dependencia de
 * parsing en el servidor, y "Guardar como CSV" es un paso que cualquier
 * administrador ya sabe hacer. Se acepta `,` y `;` como separador porque
 * Excel en configuración regional colombiana exporta con `;`.
 *
 * `confirmar` es estado local en vez de dos formularios separados: así la
 * vista previa y la confirmación mandan exactamente el mismo contenido y no
 * se puede confirmar algo distinto a lo que se revisó.
 */
export function ImportarUnidadesForm() {
  const [estado, accion] = useActionState(
    importarUnidadesCsv,
    ESTADO_INICIAL_IMPORTACION
  );
  const idArchivo = useId();
  const idContenido = useId();

  const hayVistaPrevia =
    !estado.confirmado && (estado.filasValidas?.length ?? 0) > 0;

  return (
    <form action={accion} className="flex flex-col gap-4">
      <Campo
        etiqueta="Archivo CSV"
        htmlFor={idArchivo}
        ayuda="O pega el contenido abajo si prefieres."
      >
        <input
          id={idArchivo}
          name="archivo"
          type="file"
          accept=".csv,text/csv,text/plain"
          className={`${CLASES_CONTROL} py-2 file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium`}
        />
      </Campo>

      <Campo
        etiqueta="Contenido pegado"
        htmlFor={idContenido}
        error={estado.errores?.contenido?.[0]}
        ayuda={`Columnas esperadas: ${FILA_CSV_ESPERADA}`}
      >
        <textarea
          id={idContenido}
          name="contenido"
          rows={6}
          placeholder={EJEMPLO}
          className={`${CLASES_TEXTAREA} font-mono text-xs`}
        />
      </Campo>

      <MensajeAccion estado={estado} />

      {estado.erroresFila && estado.erroresFila.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-900">
            Filas con problemas ({estado.erroresFila.length})
          </p>
          <ul className="mt-1.5 flex max-h-40 flex-col gap-1 overflow-y-auto text-xs text-amber-900">
            {estado.erroresFila.map((error) => (
              <li key={error.linea}>
                Línea {error.linea}: {error.mensaje}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {estado.filasValidas && estado.filasValidas.length > 0 ? (
        <div className="rounded-lg border border-zinc-200">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2">
            <p className="text-xs font-semibold text-zinc-700">
              {estado.confirmado ? "Filas importadas" : "Vista previa"} (
              {estado.filasValidas.length})
            </p>
            {!estado.confirmado ? (
              <Etiqueta tono="alerta">Nada se ha guardado todavía</Etiqueta>
            ) : (
              <Etiqueta tono="exito">Guardado</Etiqueta>
            )}
          </div>
          <ul className="flex max-h-56 flex-col divide-y divide-zinc-100 overflow-y-auto text-xs">
            {estado.filasValidas.map((fila) => (
              <li
                key={fila.identificador}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <span className="truncate text-zinc-800">
                  {fila.identificador} · {fila.torre} · coef {fila.coeficiente}
                  {fila.areaM2 ? ` · ${fila.areaM2} m²` : ""}
                </span>
                <span className="shrink-0 text-zinc-400">
                  {fila.yaExiste ? "actualiza" : "nueva"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Dos submits en el mismo formulario: el navegador solo manda el par
            name/value del botón que se presionó, así la confirmación viaja
            con exactamente el mismo contenido que se validó. */}
        <BotonSubmit
          variante="neutro"
          pendiente="Validando…"
          anchoCompleto
          name="confirmar"
          value="false"
        >
          Validar sin guardar
        </BotonSubmit>

        {hayVistaPrevia ? (
          <BotonSubmit
            pendiente="Importando…"
            anchoCompleto
            name="confirmar"
            value="true"
          >
            Confirmar e importar {estado.filasValidas?.length} fila(s)
          </BotonSubmit>
        ) : null}
      </div>
    </form>
  );
}
