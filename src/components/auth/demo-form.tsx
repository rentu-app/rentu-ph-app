"use client";

import { useActionState } from "react";
import { entrarComoDemo } from "@/lib/actions/auth";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import { MensajeAccion } from "@/components/ui/formulario";

export function DemoForm() {
  const [estado, accion] = useActionState(
    () => entrarComoDemo(),
    ESTADO_INICIAL_ACCION
  );

  return (
    <form action={accion} className="flex flex-col gap-3">
      <MensajeAccion estado={estado} />
      <BotonSubmit pendiente="Entrando…" variante="accent" className="w-full">
        Entrar a la demo como administrador
      </BotonSubmit>
    </form>
  );
}
