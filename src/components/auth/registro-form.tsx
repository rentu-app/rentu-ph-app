"use client";

import { useActionState, useId } from "react";
import { registrarAdministrador } from "@/lib/actions/auth";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";

/**
 * Registro autogestionado de un administrador: crea su cuenta y, en el mismo
 * paso, la copropiedad que va a gestionar. Rentu opera sobre una sola
 * copropiedad por administrador, así que se pide acá y no después.
 */
export function RegistroForm() {
  const [estado, accion] = useActionState(registrarAdministrador, ESTADO_INICIAL_ACCION);

  const idNombre = useId();
  const idEmail = useId();
  const idTelefono = useId();
  const idPassword = useId();
  const idCopropiedadNombre = useId();
  const idCopropiedadDireccion = useId();
  const idCopropiedadCiudad = useId();

  return (
    <form action={accion} className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Tu cuenta
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Nombre completo"
            htmlFor={idNombre}
            error={estado.errores?.nombre?.[0]}
          >
            <input
              id={idNombre}
              name="nombre"
              type="text"
              required
              autoComplete="name"
              className={CLASES_CONTROL}
            />
          </Campo>

          <Campo etiqueta="Teléfono (opcional)" htmlFor={idTelefono}>
            <input
              id={idTelefono}
              name="telefono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={CLASES_CONTROL}
            />
          </Campo>
        </div>

        <Campo etiqueta="Correo" htmlFor={idEmail} error={estado.errores?.email?.[0]}>
          <input
            id={idEmail}
            name="email"
            type="email"
            required
            autoComplete="email"
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo
          etiqueta="Contraseña"
          htmlFor={idPassword}
          error={estado.errores?.password?.[0]}
          ayuda="Mínimo 8 caracteres."
        >
          <input
            id={idPassword}
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            className={CLASES_CONTROL}
          />
        </Campo>
      </div>

      <div className="flex flex-col gap-4 border-t border-zinc-100 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Tu copropiedad
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Quedas como su administrador. Después puedes cargar las unidades
            desde un CSV e invitar a los residentes.
          </p>
        </div>

        <Campo
          etiqueta="Nombre de la copropiedad"
          htmlFor={idCopropiedadNombre}
          error={estado.errores?.copropiedadNombre?.[0]}
        >
          <input
            id={idCopropiedadNombre}
            name="copropiedadNombre"
            type="text"
            required
            placeholder="ej. Conjunto Residencial Los Robles"
            className={CLASES_CONTROL}
          />
        </Campo>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Dirección"
            htmlFor={idCopropiedadDireccion}
            error={estado.errores?.copropiedadDireccion?.[0]}
          >
            <input
              id={idCopropiedadDireccion}
              name="copropiedadDireccion"
              type="text"
              required
              className={CLASES_CONTROL}
            />
          </Campo>

          <Campo
            etiqueta="Ciudad"
            htmlFor={idCopropiedadCiudad}
            error={estado.errores?.copropiedadCiudad?.[0]}
          >
            <input
              id={idCopropiedadCiudad}
              name="copropiedadCiudad"
              type="text"
              required
              defaultValue="Bogotá D.C."
              className={CLASES_CONTROL}
            />
          </Campo>
        </div>
      </div>

      <MensajeAccion estado={estado} />

      <BotonSubmit pendiente="Creando cuenta…" className="w-full">
        Crear cuenta
      </BotonSubmit>
    </form>
  );
}
