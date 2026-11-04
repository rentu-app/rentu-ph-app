"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useId,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PeriodicidadCosto } from "@prisma/client";
import { actualizarRubro, crearRubro, eliminarRubro } from "@/lib/actions/rubros";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { ETIQUETAS_PERIODICIDAD } from "@/lib/validations/reservas";
import { formatearMoneda } from "@/lib/formatters";
import { BotonSubmit } from "@/components/ui/boton";
import { InputMoneda } from "@/components/ui/input-moneda";
import { Modal } from "@/components/ui/modal";
import { CLASES_CONTROL, Campo, MensajeAccion } from "@/components/ui/formulario";
import { EstadoVacio, Etiqueta } from "@/components/ui/primitivos";

type Rubro = {
  id: string;
  nombre: string;
  monto: number;
  periodicidad: PeriodicidadCosto;
  activo: boolean;
};

function RubroForm({ rubro, alGuardar }: { rubro?: Rubro; alGuardar: () => void }) {
  const [estado, accion] = useActionState(
    rubro ? actualizarRubro : crearRubro,
    ESTADO_INICIAL_ACCION
  );
  const router = useRouter();
  const idNombre = useId();
  const idMonto = useId();
  const idPeriodicidad = useId();

  useEffect(() => {
    if (estado.status !== "success") return;
    alGuardar();
    router.refresh();
  }, [estado, alGuardar, router]);

  return (
    <form action={accion} className="flex flex-col gap-4">
      {rubro ? <input type="hidden" name="rubroId" value={rubro.id} /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombre"
          htmlFor={idNombre}
          error={estado.errores?.nombre?.[0]}
          className="sm:col-span-2"
        >
          <input
            id={idNombre}
            name="nombre"
            type="text"
            required
            defaultValue={rubro?.nombre}
            placeholder="ej. Parqueadero, Fondo de imprevistos"
            className={CLASES_CONTROL}
          />
        </Campo>
        <Campo etiqueta="Valor" htmlFor={idMonto} error={estado.errores?.monto?.[0]}>
          <InputMoneda
            id={idMonto}
            name="monto"
            required
            defaultValue={rubro ? String(rubro.monto) : ""}
            className={`${CLASES_CONTROL} tabular-nums`}
          />
        </Campo>
        <Campo
          etiqueta="Periodicidad"
          htmlFor={idPeriodicidad}
          error={estado.errores?.periodicidad?.[0]}
        >
          <select
            id={idPeriodicidad}
            name="periodicidad"
            defaultValue={rubro?.periodicidad ?? PeriodicidadCosto.MENSUAL}
            className={CLASES_CONTROL}
          >
            {Object.values(PeriodicidadCosto).map((valor) => (
              <option key={valor} value={valor}>
                {ETIQUETAS_PERIODICIDAD[valor]}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="activo"
          defaultChecked={rubro?.activo ?? true}
          className="h-4 w-4"
        />
        Activo (los rubros mensuales activos se suman a las expensas al generar el periodo)
      </label>
      <MensajeAccion estado={estado} />
      <BotonSubmit pendiente="Guardando…" anchoCompleto>
        {rubro ? "Guardar cambios" : "Crear rubro"}
      </BotonSubmit>
    </form>
  );
}

function FilaRubro({ rubro }: { rubro: Rubro }) {
  const [editando, setEditando] = useState(false);
  const cerrar = useCallback(() => setEditando(false), []);
  const router = useRouter();
  const [estadoEliminar, eliminar, eliminando] = useActionState(
    eliminarRubro,
    ESTADO_INICIAL_ACCION
  );

  useEffect(() => {
    if (estadoEliminar.status === "success") router.refresh();
  }, [estadoEliminar, router]);

  function alEliminar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!window.confirm(`¿Eliminar el rubro "${rubro.nombre}"? Las cuentas ya generadas no cambian.`)) {
      return;
    }
    const datos = new FormData(evento.currentTarget);
    startTransition(() => eliminar(datos));
  }

  const clasesIcono =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 sm:min-h-9 sm:min-w-9";

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-medium text-zinc-900">
          {rubro.nombre}
          {rubro.activo ? null : <Etiqueta tono="neutro">Inactivo</Etiqueta>}
        </p>
        <p className="text-sm text-zinc-500">
          <span className="tabular-nums">{formatearMoneda(rubro.monto)}</span>{" "}
          {ETIQUETAS_PERIODICIDAD[rubro.periodicidad]}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditando(true)}
          aria-label={`Editar ${rubro.nombre}`}
          className={clasesIcono}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <form onSubmit={alEliminar}>
          <input type="hidden" name="rubroId" value={rubro.id} />
          <button
            type="submit"
            disabled={eliminando}
            aria-label={`Eliminar ${rubro.nombre}`}
            className={`${clasesIcono} hover:text-red-600 disabled:opacity-60`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </form>
      </div>
      {estadoEliminar.status === "error" ? (
        <p role="status" className="w-full text-xs text-red-600">
          {estadoEliminar.message}
        </p>
      ) : null}
      <Modal
        open={editando}
        onClose={cerrar}
        title={`Editar ${rubro.nombre}`}
        description="El cambio aplica a las cuentas que generes desde ahora."
      >
        <RubroForm rubro={rubro} alGuardar={cerrar} />
      </Modal>
    </li>
  );
}

/** Rubros de cobro de la copropiedad: crear, editar valor y activar/desactivar. */
export function RubrosCobro({ rubros }: { rubros: Rubro[] }) {
  const [creando, setCreando] = useState(false);
  const cerrar = useCallback(() => setCreando(false), []);

  return (
    <div className="flex flex-col gap-3">
      {rubros.length === 0 ? (
        <EstadoVacio
          titulo="Sin rubros todavía"
          descripcion="Crea conceptos como parqueadero o fondo de imprevistos para sumarlos a las cuentas del periodo."
        />
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white px-4">
          {rubros.map((rubro) => (
            <FilaRubro key={rubro.id} rubro={rubro} />
          ))}
        </ul>
      )}
      <div>
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nuevo rubro
        </button>
      </div>
      <Modal
        open={creando}
        onClose={cerrar}
        title="Nuevo rubro"
        description="Un concepto de cobro con su valor, que podrás editar cuando quieras."
      >
        <RubroForm alGuardar={cerrar} />
      </Modal>
    </div>
  );
}
