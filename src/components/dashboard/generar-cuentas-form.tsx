"use client";

import { useActionState, useId } from "react";
import { generarCuentasDeCobroMensual } from "@/lib/actions/cuentas-cobro";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";

function periodoActual(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
}

function fechaLimiteSugerida(): string {
  const ahora = new Date();
  const dia10SiguienteMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 10);
  return dia10SiguienteMes.toISOString().slice(0, 10);
}

/**
 * Genera las cuentas del periodo para todas las unidades. Ya no pide
 * copropiedad: la resuelve el servidor desde la sesión.
 */
export function GenerarCuentasForm({ totalUnidades }: { totalUnidades: number }) {
  const [estado, accion] = useActionState(
    generarCuentasDeCobroMensual,
    ESTADO_INICIAL_ACCION
  );
  const idPeriodo = useId();
  const idMontoAdmin = useId();
  const idExpensas = useId();
  const idFechaLimite = useId();

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
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo
          etiqueta="Total administración del mes"
          htmlFor={idMontoAdmin}
          error={estado.errores?.montoAdministracionTotal?.[0]}
          ayuda={`Se reparte entre las ${totalUnidades} unidades según su coeficiente.`}
        >
          <input
            id={idMontoAdmin}
            name="montoAdministracionTotal"
            type="text"
            inputMode="decimal"
            required
            placeholder="ej. 32000000"
            className={`${CLASES_CONTROL} tabular-nums`}
          />
        </Campo>

        <Campo
          etiqueta="Expensas por unidad (opcional)"
          htmlFor={idExpensas}
          error={estado.errores?.montoExpensasPorInmueble?.[0]}
          ayuda="Cargo fijo igual para todas, ej. cuota extraordinaria aprobada."
        >
          <input
            id={idExpensas}
            name="montoExpensasPorInmueble"
            type="text"
            inputMode="decimal"
            placeholder="0"
            className={`${CLASES_CONTROL} tabular-nums`}
          />
        </Campo>
      </div>

      <MensajeAccion estado={estado} />

      <div>
        <BotonSubmit pendiente="Generando…" anchoCompleto>
          Generar cuentas del periodo
        </BotonSubmit>
      </div>
    </form>
  );
}
