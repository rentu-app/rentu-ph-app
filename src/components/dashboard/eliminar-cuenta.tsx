"use client";

import { startTransition, useActionState, useId, useState, type FormEvent } from "react";
import { TriangleAlert } from "lucide-react";
import { eliminarMiCuenta } from "@/lib/actions/cuenta";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { Modal } from "@/components/ui/modal";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";

/** Zona de peligro de Cuenta. En la cuenta demo el botón está bloqueado. */
export function EliminarCuenta({ email, esDemo }: { email: string; esDemo: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [escrito, setEscrito] = useState("");
  const [estado, accion, pendiente] = useActionState(eliminarMiCuenta, ESTADO_INICIAL_ACCION);
  const idEmail = useId();

  const coincide = escrito.trim() === email;

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!coincide) return;
    const datos = new FormData(evento.currentTarget);
    startTransition(() => accion(datos));
  }

  return (
    <>
      <button
        type="button"
        disabled={esDemo}
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        Eliminar mi cuenta
      </button>
      {esDemo ? (
        <p className="mt-2 text-xs text-zinc-500">La cuenta demo no se puede eliminar</p>
      ) : null}

      <Modal
        open={abierto}
        onClose={() => {
          setAbierto(false);
          setEscrito("");
        }}
        title="Eliminar mi cuenta"
        description="Esta acción no se puede deshacer desde la aplicación."
      >
        <form onSubmit={alEnviar} className="flex flex-col gap-4">
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Si eres el único administrador de una copropiedad, se eliminará con todos sus datos
              (unidades, cartera, PQRS, reservas). Si la compartes con otros administradores, solo
              te desvinculamos. Tu acceso se cierra de inmediato.
            </p>
          </div>

          <Campo
            etiqueta={`Escribe ${email} para confirmar`}
            htmlFor={idEmail}
            error={estado.errores?.email?.[0]}
          >
            <input
              id={idEmail}
              name="email"
              type="email"
              autoComplete="off"
              autoFocus
              autoCapitalize="none"
              value={escrito}
              onChange={(evento) => setEscrito(evento.target.value)}
              placeholder={email}
              className={CLASES_CONTROL}
            />
          </Campo>

          <MensajeAccion estado={estado} />

          <button
            type="submit"
            disabled={!coincide || pendiente}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {pendiente ? "Eliminando…" : "Eliminar definitivamente"}
          </button>
        </form>
      </Modal>
    </>
  );
}
