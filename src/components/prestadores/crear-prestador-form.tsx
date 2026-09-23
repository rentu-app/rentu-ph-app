"use client";

import { useActionState, useId } from "react";
import { TipoPrestador } from "@prisma/client";
import { crearPrestador } from "@/lib/actions/prestadores";
import { ETIQUETAS_TIPO_PRESTADOR } from "@/lib/validations/prestadores";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import {
  CLASES_CONTROL,
  CLASES_TEXTAREA,
  Campo,
  MensajeAccion,
} from "@/components/ui/formulario";

/**
 * Alta de un prestador externo. En este MVP los prestadores NO tienen
 * usuario ni inician sesión: son un directorio que mantiene el
 * administrador, y el formulario lo dice para no prometer un portal de
 * proveedores que no existe.
 */
export function CrearPrestadorForm() {
  const [estado, accion] = useActionState(crearPrestador, ESTADO_INICIAL_ACCION);
  const idNombre = useId();
  const idTipo = useId();
  const idContacto = useId();
  const idTelefono = useId();
  const idEmail = useId();
  const idNotas = useId();

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombre o razón social"
          htmlFor={idNombre}
          error={estado.errores?.nombre?.[0]}
        >
          <input
            id={idNombre}
            name="nombre"
            type="text"
            required
            placeholder="ej. Aseo Integral del Norte S.A.S."
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo etiqueta="Servicio" htmlFor={idTipo}>
          <select
            id={idTipo}
            name="tipo"
            defaultValue={TipoPrestador.MANTENIMIENTO}
            className={CLASES_CONTROL}
          >
            {Object.values(TipoPrestador).map((tipo) => (
              <option key={tipo} value={tipo}>
                {ETIQUETAS_TIPO_PRESTADOR[tipo]}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Persona de contacto (opcional)" htmlFor={idContacto}>
          <input
            id={idContacto}
            name="contacto"
            type="text"
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo etiqueta="Teléfono (opcional)" htmlFor={idTelefono}>
          <input
            id={idTelefono}
            name="telefono"
            type="tel"
            inputMode="tel"
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo
          etiqueta="Correo (opcional)"
          htmlFor={idEmail}
          error={estado.errores?.email?.[0]}
          className="sm:col-span-2"
        >
          <input id={idEmail} name="email" type="email" className={CLASES_CONTROL} />
        </Campo>
      </div>

      <Campo
        etiqueta="Notas (opcional)"
        htmlFor={idNotas}
        ayuda="Horarios, alcance del contrato, condiciones de pago acordadas."
      >
        <textarea id={idNotas} name="notas" rows={3} className={CLASES_TEXTAREA} />
      </Campo>

      <MensajeAccion estado={estado} />

      <div>
        <BotonSubmit pendiente="Guardando…" anchoCompleto>
          Agregar al directorio
        </BotonSubmit>
      </div>
    </form>
  );
}
