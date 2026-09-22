"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { registrarAdministrador } from "@/lib/actions/auth";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";

function BotonCrearCuenta() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-11 w-full items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-600/20 transition-all hover:scale-[1.02] hover:bg-brand-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 dark:bg-brand-500 dark:hover:bg-brand-400"
    >
      {pending ? "Creando cuenta…" : "Crear cuenta"}
    </button>
  );
}

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
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Tu cuenta
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor={idNombre} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Nombre completo
            </label>
            <input
              id={idNombre}
              name="nombre"
              type="text"
              required
              className="min-h-11 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            />
            {estado.errores?.nombre?.[0] ? (
              <p className="text-xs text-red-600">{estado.errores.nombre[0]}</p>
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
              className="min-h-11 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
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
            autoComplete="email"
            className="min-h-11 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
          {estado.errores?.email?.[0] ? (
            <p className="text-xs text-red-600">{estado.errores.email[0]}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idPassword} className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Contraseña
          </label>
          <input
            id={idPassword}
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            className="min-h-11 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
          {estado.errores?.password?.[0] ? (
            <p className="text-xs text-red-600">{estado.errores.password[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Tu copropiedad
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Quedas como su único administrador — luego puedes invitar residentes y
            agregar inmuebles desde el portal.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor={idCopropiedadNombre}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            Nombre de la copropiedad
          </label>
          <input
            id={idCopropiedadNombre}
            name="copropiedadNombre"
            type="text"
            required
            placeholder="ej. Conjunto Residencial Los Robles"
            className="min-h-11 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
          {estado.errores?.copropiedadNombre?.[0] ? (
            <p className="text-xs text-red-600">{estado.errores.copropiedadNombre[0]}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={idCopropiedadDireccion}
              className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
            >
              Dirección
            </label>
            <input
              id={idCopropiedadDireccion}
              name="copropiedadDireccion"
              type="text"
              required
              className="min-h-11 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            />
            {estado.errores?.copropiedadDireccion?.[0] ? (
              <p className="text-xs text-red-600">{estado.errores.copropiedadDireccion[0]}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={idCopropiedadCiudad}
              className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
            >
              Ciudad
            </label>
            <input
              id={idCopropiedadCiudad}
              name="copropiedadCiudad"
              type="text"
              required
              defaultValue="Bogotá D.C."
              className="min-h-11 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            />
            {estado.errores?.copropiedadCiudad?.[0] ? (
              <p className="text-xs text-red-600">{estado.errores.copropiedadCiudad[0]}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <BotonCrearCuenta />
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
