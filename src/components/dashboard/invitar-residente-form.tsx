"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import type { RolEnInmueble } from "@prisma/client";
import { invitarResidente } from "@/lib/actions/residentes";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import type { CopropiedadParaInvitar } from "@/lib/data/residentes";

const ROLES = [
  { value: "PROPIETARIO", label: "Propietario" },
  { value: "INQUILINO", label: "Inquilino" },
] as const satisfies { value: RolEnInmueble; label: string }[];

function BotonInvitar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-600/20 transition-all hover:scale-[1.02] hover:bg-brand-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 dark:bg-brand-500 dark:hover:bg-brand-400"
    >
      {pending ? "Invitando…" : "Invitar residente"}
    </button>
  );
}

export function InvitarResidenteForm({
  copropiedades,
}: {
  copropiedades: CopropiedadParaInvitar[];
}) {
  const [estado, accion] = useActionState(invitarResidente, ESTADO_INICIAL_ACCION);

  const [copropiedadId, setCopropiedadId] = useState(copropiedades[0]?.id ?? "");
  const copropiedad = copropiedades.find((c) => c.id === copropiedadId);
  const [inmuebleId, setInmuebleId] = useState(copropiedad?.inmuebles[0]?.id ?? "");

  const idNombre = useId();
  const idEmail = useId();
  const idTelefono = useId();
  const idRol = useId();
  const idCopropiedad = useId();
  const idInmueble = useId();

  if (copropiedades.length === 0) return null;

  function alCambiarCopropiedad(id: string) {
    setCopropiedadId(id);
    const nueva = copropiedades.find((c) => c.id === id);
    setInmuebleId(nueva?.inmuebles[0]?.id ?? "");
  }

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={idNombre} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Nombre
          </label>
          <input
            id={idNombre}
            name="nombre"
            type="text"
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
          {estado.errores?.nombre?.[0] ? (
            <p className="text-xs text-red-600">{estado.errores.nombre[0]}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idEmail} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Correo
          </label>
          <input
            id={idEmail}
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
          {estado.errores?.email?.[0] ? (
            <p className="text-xs text-red-600">{estado.errores.email[0]}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idTelefono} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Teléfono (opcional)
          </label>
          <input
            id={idTelefono}
            name="telefono"
            type="text"
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={idRol} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Rol
          </label>
          <select
            id={idRol}
            name="rol"
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          >
            {ROLES.map((rol) => (
              <option key={rol.value} value={rol.value}>
                {rol.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor={idCopropiedad}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            Copropiedad
          </label>
          <select
            id={idCopropiedad}
            value={copropiedadId}
            onChange={(evento) => alCambiarCopropiedad(evento.target.value)}
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          >
            {copropiedades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idInmueble} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Inmueble
          </label>
          <select
            id={idInmueble}
            name="inmuebleId"
            required
            value={inmuebleId}
            onChange={(evento) => setInmuebleId(evento.target.value)}
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          >
            {(copropiedad?.inmuebles ?? []).map((i) => (
              <option key={i.id} value={i.id}>
                {i.identificador}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <BotonInvitar />
        {estado.status === "error" ? (
          <p className="text-sm text-red-600">{estado.message}</p>
        ) : null}
        {estado.status === "success" ? (
          <p className="text-sm text-emerald-600">{estado.message}</p>
        ) : null}
      </div>
    </form>
  );
}
