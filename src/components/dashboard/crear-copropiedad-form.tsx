"use client";

import { startTransition, useActionState, useId, type FormEvent } from "react";
import { crearCopropiedad } from "@/lib/actions/copropiedades";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";

/**
 * Alta de una copropiedad adicional desde adentro. Al crearla, el servidor la
 * deja como copropiedad activa y manda al administrador a cargar sus unidades.
 */
export function CrearCopropiedadForm() {
  const [estado, accion, pendiente] = useActionState(crearCopropiedad, ESTADO_INICIAL_ACCION);
  const idNombre = useId();
  const idNit = useId();
  const idDireccion = useId();
  const idCiudad = useId();

  // `onSubmit` en vez de `<form action>`: React 19 resetea el formulario al
  // terminar el action aunque haya fallado la validación, y el administrador
  // perdería lo que escribió justo cuando necesita corregirlo.
  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => accion(datos));
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4">
      <Campo etiqueta="Nombre" htmlFor={idNombre} error={estado.errores?.nombre?.[0]}>
        <input
          id={idNombre}
          name="nombre"
          type="text"
          required
          placeholder="ej. Conjunto Residencial Los Almendros"
          className={CLASES_CONTROL}
        />
      </Campo>

      <Campo
        etiqueta="NIT (opcional)"
        htmlFor={idNit}
        error={estado.errores?.nit?.[0]}
      >
        <input
          id={idNit}
          name="nit"
          type="text"
          placeholder="ej. 900.123.456-7"
          className={CLASES_CONTROL}
        />
      </Campo>

      <Campo etiqueta="Dirección" htmlFor={idDireccion} error={estado.errores?.direccion?.[0]}>
        <input
          id={idDireccion}
          name="direccion"
          type="text"
          required
          placeholder="ej. Calle 100 # 15-20"
          className={CLASES_CONTROL}
        />
      </Campo>

      <Campo etiqueta="Ciudad" htmlFor={idCiudad} error={estado.errores?.ciudad?.[0]}>
        <input
          id={idCiudad}
          name="ciudad"
          type="text"
          required
          defaultValue="Bogotá D.C."
          className={CLASES_CONTROL}
        />
      </Campo>

      <MensajeAccion estado={estado} />

      <div>
        <button
          type="submit"
          disabled={pendiente}
          aria-busy={pendiente}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {pendiente ? "Creando…" : "Crear copropiedad"}
        </button>
      </div>
    </form>
  );
}
