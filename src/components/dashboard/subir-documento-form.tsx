"use client";

import { useActionState, useId } from "react";
import { TipoDocumentoPH } from "@prisma/client";
import { indexarDocumento } from "@/lib/actions/documentos";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import {
  CLASES_CONTROL,
  CLASES_TEXTAREA,
  Campo,
  MensajeAccion,
} from "@/components/ui/formulario";

const ETIQUETAS_TIPO: Record<TipoDocumentoPH, string> = {
  REGLAMENTO_PH: "Reglamento de PH",
  MANUAL_CONVIVENCIA: "Manual de convivencia",
  ACTA_ASAMBLEA: "Acta de asamblea",
  OTRO: "Otro",
};

export function SubirDocumentoForm() {
  const [estado, accion] = useActionState(indexarDocumento, ESTADO_INICIAL_ACCION);
  const idTipo = useId();
  const idTitulo = useId();
  const idContenido = useId();

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo etiqueta="Tipo de documento" htmlFor={idTipo}>
          <select
            id={idTipo}
            name="tipo"
            required
            defaultValue={TipoDocumentoPH.REGLAMENTO_PH}
            className={CLASES_CONTROL}
          >
            {Object.values(TipoDocumentoPH).map((tipo) => (
              <option key={tipo} value={tipo}>
                {ETIQUETAS_TIPO[tipo]}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Título" htmlFor={idTitulo} error={estado.errores?.titulo?.[0]}>
          <input
            id={idTitulo}
            name="titulo"
            type="text"
            required
            placeholder="ej. Manual de convivencia 2026"
            className={CLASES_CONTROL}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Contenido"
        htmlFor={idContenido}
        error={estado.errores?.contenido?.[0]}
        ayuda="Pega el texto del documento. Se trocea y se indexa con un modelo de embeddings local; la primera vez el modelo tarda en cargar."
      >
        <textarea
          id={idContenido}
          name="contenido"
          required
          rows={8}
          className={CLASES_TEXTAREA}
        />
      </Campo>

      <MensajeAccion estado={estado} />

      <div>
        <BotonSubmit pendiente="Indexando…" anchoCompleto>
          Indexar documento
        </BotonSubmit>
      </div>
    </form>
  );
}
