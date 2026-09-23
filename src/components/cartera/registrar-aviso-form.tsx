"use client";

import { useActionState, useId } from "react";
import { CanalNotificacion } from "@prisma/client";
import { registrarAvisoCobro } from "@/lib/actions/cartera";
import { ETIQUETAS_CANAL } from "@/lib/validations/cartera";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import {
  CLASES_CONTROL,
  CLASES_TEXTAREA,
  Campo,
  MensajeAccion,
} from "@/components/ui/formulario";
import { AvisoSimulacion } from "@/components/ui/primitivos";

/**
 * Redacta un aviso de cobro y lo archiva en el historial de la unidad.
 *
 * ⚠️ NO envía nada. No hay proveedor de correo ni de WhatsApp conectado en
 * este MVP, y la interfaz lo dice antes de que el administrador escriba el
 * mensaje — no después. El valor real que entrega hoy es la trazabilidad:
 * queda registro de qué se le comunicó a una unidad y cuándo.
 */
export function RegistrarAvisoForm({
  inmuebleId,
  identificador,
  destinatarios,
  saldoFormateado,
}: {
  inmuebleId: string;
  identificador: string;
  destinatarios: string[];
  saldoFormateado: string;
}) {
  const [estado, accion] = useActionState(registrarAvisoCobro, ESTADO_INICIAL_ACCION);
  const idCanal = useId();
  const idAsunto = useId();
  const idCuerpo = useId();

  const cuerpoSugerido = `Buen día,

Le escribimos desde la administración para recordarle que la unidad ${identificador} presenta un saldo pendiente de ${saldoFormateado}.

Si ya realizó el pago, por favor haga llegar el soporte para actualizar su estado de cuenta. Si necesita acordar una forma de pago, con gusto lo revisamos.

Cordialmente,
Administración`;

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="inmuebleId" value={inmuebleId} />

      <AvisoSimulacion>
        <strong>Simulación MVP — no se envía ningún mensaje real.</strong> Rentu
        todavía no tiene integrado un proveedor de correo o WhatsApp. El aviso
        queda archivado en el historial de la unidad como evidencia de la
        gestión, y el envío hay que hacerlo por fuera.
      </AvisoSimulacion>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo etiqueta="Canal" htmlFor={idCanal}>
          <select
            id={idCanal}
            name="canal"
            defaultValue={CanalNotificacion.CORREO}
            className={CLASES_CONTROL}
          >
            {Object.values(CanalNotificacion).map((canal) => (
              <option key={canal} value={canal}>
                {ETIQUETAS_CANAL[canal]}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Destinatarios" htmlFor="destinatarios-aviso">
          <input
            id="destinatarios-aviso"
            type="text"
            readOnly
            value={
              destinatarios.length > 0
                ? destinatarios.join(", ")
                : "La unidad no tiene residentes con correo registrado"
            }
            className={`${CLASES_CONTROL} bg-zinc-50 text-zinc-500`}
          />
        </Campo>
      </div>

      <Campo etiqueta="Asunto" htmlFor={idAsunto} error={estado.errores?.asunto?.[0]}>
        <input
          id={idAsunto}
          name="asunto"
          type="text"
          required
          defaultValue={`Saldo pendiente — ${identificador}`}
          className={CLASES_CONTROL}
        />
      </Campo>

      <Campo etiqueta="Mensaje" htmlFor={idCuerpo} error={estado.errores?.cuerpo?.[0]}>
        <textarea
          id={idCuerpo}
          name="cuerpo"
          required
          rows={9}
          defaultValue={cuerpoSugerido}
          className={CLASES_TEXTAREA}
        />
      </Campo>

      <MensajeAccion estado={estado} />

      <div>
        <BotonSubmit pendiente="Guardando…" anchoCompleto>
          Guardar aviso en el historial
        </BotonSubmit>
      </div>
    </form>
  );
}
