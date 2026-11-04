"use client";

import { useActionState, useId } from "react";
import { entrarComoDemo } from "@/lib/actions/auth";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";

/**
 * El correo es obligatorio: no es un dato de login (la demo siempre entra
 * con la misma cuenta fija), es el lead que queda registrado en `LeadDemo`
 * antes de abrir la sesión demo — ver `entrarComoDemo`.
 */
export function DemoForm() {
  const [estado, accion] = useActionState(entrarComoDemo, ESTADO_INICIAL_ACCION);
  const emailId = useId();

  return (
    <form action={accion} className="flex flex-col gap-3">
      <Campo etiqueta="Tu correo" htmlFor={emailId}>
        <input
          id={emailId}
          name="email"
          type="email"
          autoCapitalize="none"
          autoCorrect="off"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          className={CLASES_CONTROL}
        />
      </Campo>

      <MensajeAccion estado={estado} />

      <BotonSubmit pendiente="Entrando…" variante="accent" className="w-full">
        Entrar a la demo
      </BotonSubmit>
    </form>
  );
}
