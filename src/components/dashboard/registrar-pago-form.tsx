"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import {
  registrarPago,
  registrarPagoTotalDesdeFormulario,
} from "@/lib/actions/pagos";
import { METODOS_PAGO } from "@/lib/validations/pagos";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";

function BotonAbonar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 shrink-0 rounded-md bg-brand-600 px-3 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:py-1.5 dark:bg-brand-500 dark:hover:bg-brand-400"
    >
      {pending ? "Registrando…" : "Abonar"}
    </button>
  );
}

function BotonPagarTodo() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 shrink-0 rounded-md border border-zinc-300 px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:py-1.5 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {pending ? "…" : "Pagar todo"}
    </button>
  );
}

export function RegistrarPagoForm({
  cuentaDeCobroId,
  saldoPendiente,
}: {
  cuentaDeCobroId: string;
  saldoPendiente: string;
}) {
  const montoId = useId();
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
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <form action={accionAbono} className="flex items-center gap-1.5">
          <input type="hidden" name="cuentaDeCobroId" value={cuentaDeCobroId} />
          <input type="hidden" name="metodo" value={METODOS_PAGO[0]} />
          <label htmlFor={montoId} className="sr-only">
            Monto a abonar
          </label>
          <input
            id={montoId}
            name="monto"
            type="text"
            inputMode="decimal"
            placeholder={saldoPendiente}
            className="min-h-11 w-24 rounded-md border border-zinc-300 px-2 text-xs tabular-nums focus:border-zinc-500 focus:outline-none sm:min-h-0 sm:w-28 sm:py-1.5 dark:border-zinc-700 dark:bg-zinc-950"
          />
          <BotonAbonar />
        </form>
        <form action={accionTotal}>
          <input type="hidden" name="cuentaDeCobroId" value={cuentaDeCobroId} />
          <BotonPagarTodo />
        </form>
      </div>
      {estado.status === "error" ? (
        <p className="text-xs text-red-600">
          {estado.errores?.monto?.[0] ?? estado.message}
        </p>
      ) : null}
      {estado.status === "success" ? (
        <p className="text-xs text-emerald-600">{estado.message}</p>
      ) : null}
    </div>
  );
}
