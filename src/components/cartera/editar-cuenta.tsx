"use client";

import { useActionState, useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { actualizarCuentaCobro } from "@/lib/actions/cuentas-unidad";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";
import { InputMoneda } from "@/components/ui/input-moneda";
import { Modal } from "@/components/ui/modal";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";

type CuentaEditable = {
  id: string;
  periodo: string;
  montoAdministracion: number;
  montoExpensas: number;
  /** AAAA-MM-DD */
  fechaLimitePago: string;
};

function Formulario({ cuenta, alGuardar }: { cuenta: CuentaEditable; alGuardar: () => void }) {
  const [estado, accion] = useActionState(actualizarCuentaCobro, ESTADO_INICIAL_ACCION);
  const router = useRouter();
  const idAdmin = useId();
  const idExpensas = useId();
  const idFecha = useId();

  useEffect(() => {
    if (estado.status !== "success") return;
    alGuardar();
    router.refresh();
  }, [estado, alGuardar, router]);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="cuentaId" value={cuenta.id} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Cuota de administración"
          htmlFor={idAdmin}
          error={estado.errores?.montoAdministracion?.[0]}
        >
          <InputMoneda
            id={idAdmin}
            name="montoAdministracion"
            required
            defaultValue={String(cuenta.montoAdministracion)}
            className={`${CLASES_CONTROL} tabular-nums`}
          />
        </Campo>
        <Campo
          etiqueta="Expensas"
          htmlFor={idExpensas}
          error={estado.errores?.montoExpensas?.[0]}
        >
          <InputMoneda
            id={idExpensas}
            name="montoExpensas"
            defaultValue={cuenta.montoExpensas > 0 ? String(cuenta.montoExpensas) : ""}
            className={`${CLASES_CONTROL} tabular-nums`}
          />
        </Campo>
        <Campo
          etiqueta="Fecha límite de pago"
          htmlFor={idFecha}
          error={estado.errores?.fechaLimitePago?.[0]}
          className="sm:col-span-2"
        >
          <input
            id={idFecha}
            name="fechaLimitePago"
            type="date"
            required
            defaultValue={cuenta.fechaLimitePago}
            className={`${CLASES_CONTROL} w-full min-w-0 appearance-none`}
          />
        </Campo>
      </div>
      <MensajeAccion estado={estado} />
      <BotonSubmit pendiente="Guardando…" anchoCompleto>
        Guardar cambios
      </BotonSubmit>
    </form>
  );
}

export function EditarCuenta({ cuenta }: { cuenta: CuentaEditable }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = useCallback(() => setAbierto(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-brand-700 hover:bg-brand-50 sm:min-h-9"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar valores
      </button>
      <Modal
        open={abierto}
        onClose={cerrar}
        title={`Cuenta ${cuenta.periodo}`}
        description="El total no puede quedar por debajo de lo ya pagado. El cambio queda en la bitácora."
      >
        <Formulario cuenta={cuenta} alGuardar={cerrar} />
      </Modal>
    </>
  );
}
