"use client";

import { useActionState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { useCerrarPanel } from "@/components/ui/form-panel";
import { generarCuentaUnidad } from "@/lib/actions/cuentas-unidad";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import { InputMoneda } from "@/components/ui/input-moneda";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";

function periodoActual() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
}

function fechaLimiteSugerida() {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth() + 1, 10).toISOString().slice(0, 10);
}

/** Genera la cuenta de un periodo solo para esta unidad. */
export function GenerarCuentaUnidadForm({
  inmuebleId,
  cuotaSugerida,
}: {
  inmuebleId: string;
  cuotaSugerida: number;
}) {
  const [estado, accion] = useActionState(generarCuentaUnidad, ESTADO_INICIAL_ACCION);
  const router = useRouter();
  const cerrarPanel = useCerrarPanel();
  const idPeriodo = useId();
  const idMonto = useId();
  const idExpensas = useId();
  const idFecha = useId();

  useEffect(() => {
    if (estado.status !== "success") return;
    cerrarPanel();
    router.refresh();
  }, [estado, cerrarPanel, router]);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="inmuebleId" value={inmuebleId} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo etiqueta="Periodo" htmlFor={idPeriodo} error={estado.errores?.periodo?.[0]}>
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
          htmlFor={idFecha}
          error={estado.errores?.fechaLimitePago?.[0]}
        >
          <input
            id={idFecha}
            name="fechaLimitePago"
            type="date"
            required
            defaultValue={fechaLimiteSugerida()}
            className={`${CLASES_CONTROL} w-full min-w-0 appearance-none`}
          />
        </Campo>
        <Campo
          etiqueta="Cuota de administración"
          htmlFor={idMonto}
          error={estado.errores?.montoAdministracion?.[0]}
        >
          <InputMoneda
            id={idMonto}
            name="montoAdministracion"
            required
            defaultValue={cuotaSugerida > 0 ? String(cuotaSugerida) : ""}
            className={`${CLASES_CONTROL} tabular-nums`}
          />
        </Campo>
        <Campo
          etiqueta="Expensas (opcional)"
          htmlFor={idExpensas}
          error={estado.errores?.montoExpensas?.[0]}
        >
          <InputMoneda
            id={idExpensas}
            name="montoExpensas"
            className={`${CLASES_CONTROL} tabular-nums`}
          />
        </Campo>
      </div>
      <MensajeAccion estado={estado} />
      <BotonSubmit pendiente="Generando…" anchoCompleto>
        Generar cuenta
      </BotonSubmit>
    </form>
  );
}
