"use client";

import {
  startTransition,
  useActionState,
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { importarUnidadesCsv } from "@/lib/actions/cartera";
import { FILA_CSV_ESPERADA } from "@/lib/validations/cartera";
import { ESTADO_INICIAL_IMPORTACION } from "@/lib/types/importacion";
import { CLASES_CONTROL, CLASES_TEXTAREA, Campo, MensajeAccion } from "@/components/ui/formulario";
import { Etiqueta } from "@/components/ui/primitivos";

const EJEMPLO = `${FILA_CSV_ESPERADA},estado
Apto 101,Torre 1,4.167,72.50,OCUPADO
Apto 102,Torre 1,4.167,72.50,OCUPADO
Apto 201,Torre 2,4.167,68.00,DESOCUPADO`;

const BOTON =
  "inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

/**
 * Importación real del padrón de unidades desde CSV, en dos pasos:
 * validar (vista previa, sin escribir) y confirmar (escribe).
 *
 * Por qué CSV y no .xlsx: leer un Excel binario exige una dependencia de
 * parsing en el servidor, y "Guardar como CSV" es un paso que cualquier
 * administrador ya sabe hacer. Se acepta `,` y `;` como separador porque
 * Excel en configuración regional colombiana exporta con `;`.
 *
 * El contenido del CSV vive en el ESTADO del cliente (textarea controlado; el
 * archivo se lee con `File.text()` y se vuelca ahí), no en campos sin
 * controlar. React 19 resetea el `<form>` al terminar cada action, y eso
 * vaciaba el archivo y el textarea justo después de "Validar": al pulsar
 * "Confirmar" el servidor recibía un CSV vacío. Por eso el envío va por
 * `onSubmit` + `startTransition` (sin reseteo automático) y el contenido se
 * manda explícitamente en cada llamada. El servidor vuelve a validar todo
 * antes de escribir.
 */
export function ImportarUnidadesForm() {
  const [estado, accion, pendiente] = useActionState(
    importarUnidadesCsv,
    ESTADO_INICIAL_IMPORTACION
  );
  const [contenido, setContenido] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const idArchivo = useId();
  const idContenido = useId();

  // Tras una importación exitosa el campo se muestra vacío y se descarta la
  // vista previa; en cuanto el usuario escribe algo distinto vuelve a la normalidad.
  const yaImportado = !!estado.confirmado && estado.contenidoValidado === contenido;
  const contenidoVisible = yaImportado ? "" : contenido;

  const hayVistaPrevia =
    !estado.confirmado &&
    (estado.filasValidas?.length ?? 0) > 0 &&
    estado.contenidoValidado === contenido;

  async function alElegirArchivo(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    if (archivo.size > 1_000_000) {
      setNombreArchivo("");
      setContenido("");
      evento.target.value = "";
      return;
    }
    setContenido(await archivo.text());
    setNombreArchivo(archivo.name);
  }

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const submitter = (evento.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const datos = new FormData();
    // Lo que el usuario ve: tras importar el campo se muestra vacío.
    datos.set("contenido", contenidoVisible);
    datos.set("confirmar", submitter?.value === "true" ? "true" : "false");
    startTransition(() => accion(datos));
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4">
      <Campo
        etiqueta="Archivo CSV"
        htmlFor={idArchivo}
        ayuda={
          nombreArchivo && !yaImportado
            ? `Archivo cargado: ${nombreArchivo}. Puedes editar el contenido abajo.`
            : "O pega el contenido abajo si prefieres."
        }
      >
        <input
          // Se remonta al importar para soltar el archivo ya procesado.
          key={yaImportado ? "importado" : "nuevo"}
          id={idArchivo}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={alElegirArchivo}
          className={`${CLASES_CONTROL} py-2 file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium`}
        />
      </Campo>

      <Campo
        etiqueta="Contenido del CSV"
        htmlFor={idContenido}
        error={estado.errores?.contenido?.[0]}
        ayuda={`Encabezado por nombre y en cualquier orden. Obligatorias: identificador y coeficiente; opcionales: torre, area_m2, estado. El coeficiente puede ir en porcentaje (4.167) o en fracción (0.04167).`}
      >
        <textarea
          id={idContenido}
          rows={6}
          value={contenidoVisible}
          onChange={(evento) => {
            setContenido(evento.target.value);
            setNombreArchivo("");
          }}
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

      {hayVistaPrevia && estado.filasValidas ? (
        <div className="rounded-lg border border-zinc-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2">
            <p className="text-xs font-semibold text-zinc-700">
              Vista previa ({estado.filasValidas.length})
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Etiqueta tono="info">
                Coeficientes en{" "}
                {estado.formatoCoeficiente === "fraccion" ? "fracción" : "porcentaje"} · suma{" "}
                {estado.sumaArchivoPorcentaje} %
              </Etiqueta>
              <Etiqueta tono="alerta">Nada se ha guardado todavía</Etiqueta>
            </div>
          </div>
          <ul className="flex max-h-56 flex-col divide-y divide-zinc-100 overflow-y-auto text-xs">
            {estado.filasValidas.map((fila) => (
              <li
                key={fila.identificador}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <span className="truncate text-zinc-800">
                  {fila.identificador} · {fila.torre} · coef {fila.coeficientePorcentaje} %
                  {fila.areaM2 ? ` · ${fila.areaM2} m²` : ""}
                  {fila.estado === "DESOCUPADO" ? " · desocupada" : ""}
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
        {/* Dos submits en el mismo formulario: `alEnviar` lee cuál se pulsó
            (`submitter.value`) y manda el contenido del estado con esa
            intención. */}
        <button
          type="submit"
          value="false"
          disabled={pendiente}
          className={`${BOTON} border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50`}
        >
          {pendiente ? "Procesando…" : "Validar sin guardar"}
        </button>

        {hayVistaPrevia ? (
          <button
            type="submit"
            value="true"
            disabled={pendiente}
            className={`${BOTON} bg-brand-600 text-white hover:bg-brand-700`}
          >
            {pendiente ? "Importando…" : `Confirmar e importar ${estado.filasValidas?.length} fila(s)`}
          </button>
        ) : null}
      </div>
    </form>
  );
}
