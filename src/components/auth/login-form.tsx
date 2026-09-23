"use client";

import { useActionState, useId } from "react";
import { iniciarSesion } from "@/lib/actions/auth";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";

export function LoginForm({ next }: { next?: string }) {
  const [estado, accion] = useActionState(iniciarSesion, ESTADO_INICIAL_ACCION);
  const emailId = useId();
  const passwordId = useId();

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ""} />

      <Campo etiqueta="Correo" htmlFor={emailId}>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@copropiedad.com"
          className={CLASES_CONTROL}
        />
      </Campo>

      <Campo etiqueta="Contraseña" htmlFor={passwordId}>
        <input
          id={passwordId}
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={CLASES_CONTROL}
        />
      </Campo>

      <MensajeAccion estado={estado} />

      <BotonSubmit pendiente="Ingresando…" className="w-full">
        Ingresar
      </BotonSubmit>
    </form>
  );
}
