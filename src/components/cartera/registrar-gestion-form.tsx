"use client";

import { useActionState, useId } from "react";
import { EtapaCobro, TipoGestionCobro } from "@prisma/client";
import { registrarGestionCobro } from "@/lib/actions/cartera";
import {
  ETIQUETAS_ETAPA_COBRO,
  ETIQUETAS_TIPO_GESTION,
} from "@/lib/validations/cartera";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import {
  CLASES_CONTROL,
  CLASES_TEXTAREA,
  Campo,
  MensajeAccion,
} from "@/components/ui/formulario";

/**
 * Registra una gestión de cobro sobre una unidad y, opcionalmente, mueve su
 * etapa de seguimiento.
 *
 * El texto del select de etapa deja claro que PREJURIDICO/JURIDICO son
 * clasificaciones de seguimiento: Rentu no inicia procesos ni da asesoría
 * legal, solo registra en qué punto está el caso.
 */
export function RegistrarGestionForm({
  inmuebleId,
  etapaActual,
}: {
  inmuebleId: string;
  etapaActual: EtapaCobro;
}) {
  const [estado, accion] = useActionState(
    registrarGestionCobro,
    ESTADO_INICIAL_ACCION
  );
  const idTipo = useId();
  const idEtapa = useId();
  const idNota = useId();

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="inmuebleId" value={inmuebleId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo etiqueta="Tipo de gestión" htmlFor={idTipo}>
          <select
            id={idTipo}
            name="tipo"
            defaultValue={TipoGestionCobro.LLAMADA}
            className={CLASES_CONTROL}
          >
            {(
              [
                TipoGestionCobro.LLAMADA,
                TipoGestionCobro.VISITA,
                TipoGestionCobro.NOTA,
                TipoGestionCobro.ACUERDO_PAGO,
              ] as const
            ).map((tipo) => (
              <option key={tipo} value={tipo}>
                {ETIQUETAS_TIPO_GESTION[tipo]}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          etiqueta="Mover a etapa (opcional)"
          htmlFor={idEtapa}
          ayuda={`Etapa actual: ${ETIQUETAS_ETAPA_COBRO[etapaActual]}. Es una clasificación de seguimiento interno.`}
        >
          <select id={idEtapa} name="etapaNueva" defaultValue="" className={CLASES_CONTROL}>
            <option value="">No cambiar la etapa</option>
            {Object.values(EtapaCobro).map((etapa) => (
              <option key={etapa} value={etapa}>
                {ETIQUETAS_ETAPA_COBRO[etapa]}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo
        etiqueta="Qué pasó"
        htmlFor={idNota}
        error={estado.errores?.nota?.[0]}
        ayuda="Queda en la bitácora de la unidad con tu nombre y la fecha."
      >
        <textarea
          id={idNota}
          name="nota"
          required
          rows={3}
          placeholder="ej. Se habló con el propietario; se compromete a pagar el saldo antes del 20."
          className={CLASES_TEXTAREA}
        />
      </Campo>

      <MensajeAccion estado={estado} />

      <div>
        <BotonSubmit pendiente="Registrando…" anchoCompleto>
          Registrar gestión
        </BotonSubmit>
      </div>
    </form>
  );
}
