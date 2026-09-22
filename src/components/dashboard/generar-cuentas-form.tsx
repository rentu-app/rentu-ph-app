"use client";

import { useActionState, useId, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { generarCuentasDeCobroMensual } from "@/lib/actions/cuentas-cobro";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";

function BotonGenerar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-600/20 sm:w-auto transition-all hover:scale-[1.02] hover:bg-brand-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 dark:bg-brand-500 dark:hover:bg-brand-400"
    >
      {pending ? "Generando…" : "Generar cuentas"}
    </button>
  );
}

function periodoActual(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
}

function fechaLimiteSugerida(): string {
  const ahora = new Date();
  const dia10SiguienteMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 10);
  return dia10SiguienteMes.toISOString().slice(0, 10);
}

export function GenerarCuentasForm({
  copropiedades,
}: {
  copropiedades: { id: string; nombre: string }[];
}) {
  const [estado, accion] = useActionState(
    generarCuentasDeCobroMensual,
    ESTADO_INICIAL_ACCION
  );
  const idCopropiedad = useId();
  const idPeriodo = useId();
  const idMontoAdmin = useId();
  const idExpensas = useId();
  const idFechaLimite = useId();

  if (copropiedades.length === 0) return null;

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Campo label="Copropiedad" htmlFor={idCopropiedad} className="lg:col-span-2">
          <select
            id={idCopropiedad}
            name="copropiedadId"
            required
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          >
            {copropiedades.map((copropiedad) => (
              <option key={copropiedad.id} value={copropiedad.id}>
                {copropiedad.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Periodo" htmlFor={idPeriodo} error={estado.errores?.periodo?.[0]}>
          <input
            id={idPeriodo}
            name="periodo"
            type="month"
            required
            defaultValue={periodoActual()}
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
        </Campo>

        <Campo
          label="Total administración"
          htmlFor={idMontoAdmin}
          error={estado.errores?.montoAdministracionTotal?.[0]}
        >
          <input
            id={idMontoAdmin}
            name="montoAdministracionTotal"
            type="text"
            inputMode="decimal"
            required
            placeholder="ej. 8000000"
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm tabular-nums focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
        </Campo>

        <Campo
          label="Expensas por inmueble"
          htmlFor={idExpensas}
          error={estado.errores?.montoExpensasPorInmueble?.[0]}
        >
          <input
            id={idExpensas}
            name="montoExpensasPorInmueble"
            type="text"
            inputMode="decimal"
            placeholder="0"
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm tabular-nums focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
        </Campo>
      </div>

      <Campo
        label="Fecha límite de pago"
        htmlFor={idFechaLimite}
        error={estado.errores?.fechaLimitePago?.[0]}
        className="max-w-xs"
      >
        <input
          id={idFechaLimite}
          name="fechaLimitePago"
          type="date"
          required
          defaultValue={fechaLimiteSugerida()}
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
      </Campo>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <BotonGenerar />
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

function Campo({
  label,
  htmlFor,
  error,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
      >
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
