"use client";

import { useActionState, useId } from "react";
import { crearCopropiedad } from "@/lib/actions/copropiedades";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";

/**
 * Alta de una copropiedad adicional desde adentro. Al crearla, el servidor la
 * deja como copropiedad activa y manda al administrador a cargar sus unidades.
 */
export function CrearCopropiedadForm() {
  const [estado, accion] = useActionState(crearCopropiedad, ESTADO_INICIAL_ACCION);
  const idNombre = useId();
  const idNit = useId();
  const idDireccion = useId();
  const idCiudad = useId();

  return (
    <form action={accion} className="flex flex-col gap-4">
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
        <BotonSubmit pendiente="Creando…" anchoCompleto>
          Crear copropiedad
        </BotonSubmit>
      </div>
    </form>
  );
}
