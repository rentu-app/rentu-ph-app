"use client";

import { useActionState, useId } from "react";
import {
  registrarPago,
  registrarPagoTotalDesdeFormulario,
} from "@/lib/actions/pagos";
import { METODOS_PAGO } from "@/lib/validations/pagos";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import { CLASES_CONTROL } from "@/components/ui/formulario";

/**
 * Registra un abono parcial o salda el total de una cuenta.
 *
 * Son dos `<form>` separados (y dos `useActionState`) porque son dos Server
 * Actions distintas; el estado que se muestra es el del último que respondió.
 * El monto siempre se recalcula en el servidor: acá solo viaja lo que el
 * administrador escribió.
 */
export function RegistrarPagoForm({
  cuentaDeCobroId,
  saldoPendiente,
}: {
  cuentaDeCobroId: string;
  saldoPendiente: string;
}) {
  const montoId = useId();
  const metodoId = useId();
  const [estadoAbono, accionAbono] = useActionState(
    registrarPago,
    ESTADO_INICIAL_ACCION
  );
  const [estadoTotal, accionTotal] = useActionState(
    registrarPagoTotalDesdeFormulario,
    ESTADO_INICIAL_ACCION
  );

  const estado = estadoAbono.status !== "idle" ? estadoAbono : estadoTotal;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <form action={accionAbono} className="flex flex-1 flex-wrap items-end gap-2">
          <input type="hidden" name="cuentaDeCobroId" value={cuentaDeCobroId} />

          <div className="flex min-w-28 flex-1 flex-col gap-1">
            <label htmlFor={montoId} className="text-xs text-zinc-500">
              Monto
            </label>
            <input
              id={montoId}
              name="monto"
              type="text"
              inputMode="decimal"
              placeholder={saldoPendiente}
              className={`${CLASES_CONTROL} tabular-nums`}
            />
          </div>

          <div className="flex min-w-32 flex-1 flex-col gap-1">
            <label htmlFor={metodoId} className="text-xs text-zinc-500">
              Método
            </label>
            <select id={metodoId} name="metodo" className={CLASES_CONTROL}>
              {METODOS_PAGO.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
          </div>

          <BotonSubmit pendiente="Registrando…">Abonar</BotonSubmit>
        </form>

        <form action={accionTotal}>
          <input type="hidden" name="cuentaDeCobroId" value={cuentaDeCobroId} />
          <BotonSubmit variante="neutro" pendiente="…">
            Saldar todo
          </BotonSubmit>
        </form>
      </div>

      {estado.status === "error" ? (
        <p role="status" className="text-xs font-medium text-red-600">
          {estado.errores?.monto?.[0] ?? estado.message}
        </p>
      ) : null}
      {estado.status === "success" ? (
        <p role="status" className="text-xs font-medium text-emerald-600">
          {estado.message}
        </p>
      ) : null}
    </div>
  );
}
