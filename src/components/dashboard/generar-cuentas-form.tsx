"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useCerrarPanel } from "@/components/ui/form-panel";
import { generarCuentasDeCobroMensual } from "@/lib/actions/cuentas-cobro";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { formatearMoneda } from "@/lib/formatters";
import { BotonSubmit } from "@/components/ui/boton";
import { InputMoneda } from "@/components/ui/input-moneda";
import {
  CLASES_CONTROL,
  Campo,
  MensajeAccion,
} from "@/components/ui/formulario";

function periodoActual(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
}

function fechaLimiteSugerida(): string {
  const ahora = new Date();
  const dia10SiguienteMes = new Date(
    ahora.getFullYear(),
    ahora.getMonth() + 1,
    10,
  );
  return dia10SiguienteMes.toISOString().slice(0, 10);
}

/**
 * Genera las cuentas del periodo para todas las unidades. Ya no pide
 * copropiedad: la resuelve el servidor desde la sesión.
 */
export function GenerarCuentasForm({
  totalUnidades,
  unidadesConCuota = 0,
  totalRubros = 0,
}: {
  totalUnidades: number;
  unidadesConCuota?: number;
  /** Suma de rubros mensuales activos; 0 = no hay nada que incluir. */
  totalRubros?: number;
}) {
  const [modo, setModo] = useState<"cuota" | "coeficiente">(
    unidadesConCuota > 0 ? "cuota" : "coeficiente",
  );
  const [estado, accion] = useActionState(
    generarCuentasDeCobroMensual,
    ESTADO_INICIAL_ACCION,
  );
  const router = useRouter();
  const cerrarPanel = useCerrarPanel();
  const idPeriodo = useId();
  const idMontoAdmin = useId();
  const idExpensas = useId();
  const idFechaLimite = useId();

  // Al generar con éxito se cierra el modal y se refresca el dashboard
  // (Primeros pasos, KPIs) sin recargar la página.
  useEffect(() => {
    if (estado.status !== "success") return;
    cerrarPanel();
    router.refresh();
  }, [estado, cerrarPanel, router]);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Periodo"
          htmlFor={idPeriodo}
          error={estado.errores?.periodo?.[0]}
        >
          <input
            id={idPeriodo}
            name="periodo"
            type="month"
            required
            defaultValue={periodoActual()}
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo
          etiqueta="Fecha límite de pago"
          htmlFor={idFechaLimite}
          error={estado.errores?.fechaLimitePago?.[0]}
        >
          <input
            id={idFechaLimite}
            name="fechaLimitePago"
            type="date"
            required
            defaultValue={fechaLimiteSugerida()}
            className={`${CLASES_CONTROL} w-full min-w-0 appearance-none`}
          />
        </Campo>

        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-1 text-sm font-medium text-zinc-700">
            Cómo calcular la cuota
          </legend>
          <label className="flex min-h-11 items-start gap-2 text-sm text-zinc-700">
            <input
              type="radio"
              name="modo"
              value="cuota"
              checked={modo === "cuota"}
              onChange={() => setModo("cuota")}
              disabled={unidadesConCuota === 0}
              className="mt-1"
            />
            <span>
              La cuota de cada apartamento
              <span className="block text-xs text-zinc-500">
                {unidadesConCuota > 0
                  ? `${unidadesConCuota} de ${totalUnidades} unidades tienen cuota propia.`
                  : "Aún ninguna unidad tiene cuota; asígnala en Unidades."}
              </span>
            </span>
          </label>
          <label className="flex min-h-11 items-start gap-2 text-sm text-zinc-700">
            <input
              type="radio"
              name="modo"
              value="coeficiente"
              checked={modo === "coeficiente"}
              onChange={() => setModo("coeficiente")}
              className="mt-1"
            />
            <span>
              Repartir un total por coeficiente
              <span className="block text-xs text-zinc-500">Ley 675.</span>
            </span>
          </label>
        </fieldset>

        {modo === "coeficiente" ? (
          <Campo
            etiqueta="Total administración del mes"
            htmlFor={idMontoAdmin}
            error={estado.errores?.montoAdministracionTotal?.[0]}
            ayuda={`Se reparte entre las ${totalUnidades} unidades según su coeficiente.`}
          >
            <InputMoneda
              id={idMontoAdmin}
              name="montoAdministracionTotal"
              required
              placeholder="$ 32.000.000"
              className={`${CLASES_CONTROL} tabular-nums`}
            />
          </Campo>
        ) : null}

        <Campo
          etiqueta="Expensas por unidad (opcional)"
          htmlFor={idExpensas}
          error={estado.errores?.montoExpensasPorInmueble?.[0]}
          ayuda="Cargo fijo igual para todas, ej. cuota extraordinaria aprobada."
        >
          <InputMoneda
            id={idExpensas}
            name="montoExpensasPorInmueble"
            className={`${CLASES_CONTROL} tabular-nums`}
          />
        </Campo>
      </div>

      {totalRubros > 0 ? (
        <label className="flex min-h-11 items-start gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="incluirRubros" defaultChecked className="mt-1 h-4 w-4" />
          <span>
            Sumar los rubros mensuales activos ({formatearMoneda(totalRubros)} por unidad)
            <span className="block text-xs text-zinc-500">Se agregan a las expensas de cada cuenta.</span>
          </span>
        </label>
      ) : null}

      <MensajeAccion estado={estado} />

      <div>
        <BotonSubmit pendiente="Generando…" anchoCompleto>
          Generar cuentas del periodo
        </BotonSubmit>
      </div>
    </form>
  );
}
