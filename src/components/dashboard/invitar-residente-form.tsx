"use client";

import { useActionState, useId } from "react";
import { RolEnInmueble } from "@prisma/client";
import { invitarResidente } from "@/lib/actions/residentes";
import type { UnidadParaInvitar } from "@/lib/data/residentes";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";
import { AvisoSimulacion } from "@/components/ui/primitivos";

const ROLES: { value: RolEnInmueble; label: string }[] = [
  { value: RolEnInmueble.PROPIETARIO, label: "Propietario" },
  { value: RolEnInmueble.INQUILINO, label: "Inquilino" },
];

/**
 * Da de alta a un residente y lo vincula a una unidad. Al haber una sola
 * copropiedad, el formulario pasó de tres selects en cascada a uno.
 */
export function InvitarResidenteForm({ unidades }: { unidades: UnidadParaInvitar[] }) {
  const [estado, accion] = useActionState(invitarResidente, ESTADO_INICIAL_ACCION);

  const idNombre = useId();
  const idEmail = useId();
  const idTelefono = useId();
  const idRol = useId();
  const idUnidad = useId();

  if (unidades.length === 0) {
    return (
      <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
        Primero carga las unidades de la copropiedad (puedes importarlas desde
        CSV en el resumen) y luego invita a sus residentes.
      </p>
    );
  }

  return (
    <form action={accion} className="flex flex-col gap-4">
      <AvisoSimulacion>
        No hay proveedor de correo conectado: la contraseña temporal se muestra
        una sola vez acá y tienes que compartirla tú.
      </AvisoSimulacion>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" htmlFor={idNombre} error={estado.errores?.nombre?.[0]}>
          <input
            id={idNombre}
            name="nombre"
            type="text"
            required
            autoComplete="name"
            className={CLASES_CONTROL}
          />
        </Campo>

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

        <Campo etiqueta="Rol en la unidad" htmlFor={idRol}>
          <select id={idRol} name="rol" required className={CLASES_CONTROL}>
            {ROLES.map((rol) => (
              <option key={rol.value} value={rol.value}>
                {rol.label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          etiqueta="Unidad"
          htmlFor={idUnidad}
          error={estado.errores?.inmuebleId?.[0]}
          className="sm:col-span-2"
        >
          <select id={idUnidad} name="inmuebleId" required className={CLASES_CONTROL}>
            {unidades.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                {unidad.identificador} — {unidad.torre}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <MensajeAccion estado={estado} />

      <div>
        <BotonSubmit pendiente="Invitando…" anchoCompleto>
          Invitar residente
        </BotonSubmit>
      </div>
    </form>
  );
}
