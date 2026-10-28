"use client";

import { startTransition, useActionState, useCallback, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { EstadoInmueble } from "@prisma/client";
import { eliminarUnidad } from "@/lib/actions/unidades";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { Modal } from "@/components/ui/modal";
import { UnidadForm } from "@/components/unidades/unidad-form";

type UnidadFila = {
  id: string;
  identificador: string;
  torre: string;
  coeficiente: string;
  areaM2: string;
  estado: EstadoInmueble;
};

const CLASES_ICONO =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 sm:min-h-9 sm:min-w-9";

export function AccionesUnidad({ unidad }: { unidad: UnidadFila }) {
  const [editando, setEditando] = useState(false);
  const [estadoEliminar, eliminar, eliminando] = useActionState(
    eliminarUnidad,
    ESTADO_INICIAL_ACCION
  );
  const cerrar = useCallback(() => setEditando(false), []);

  function alEliminar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const confirmado = window.confirm(
      `¿Eliminar "${unidad.identificador}"? Dejará de aparecer en la cartera y en la suma de coeficientes; su historial se conserva.`
    );
    if (!confirmado) return;
    const datos = new FormData(evento.currentTarget);
    startTransition(() => eliminar(datos));
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => setEditando(true)}
        aria-label={`Editar ${unidad.identificador}`}
        className={CLASES_ICONO}
      >
        <Pencil className="h-4 w-4" />
      </button>

      <form onSubmit={alEliminar}>
        <input type="hidden" name="inmuebleId" value={unidad.id} />
        <button
          type="submit"
          disabled={eliminando}
          aria-label={`Eliminar ${unidad.identificador}`}
          className={`${CLASES_ICONO} hover:text-red-600 disabled:opacity-60`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </form>

      {estadoEliminar.status === "error" ? (
        <span role="status" className="text-xs text-red-600">
          {estadoEliminar.message}
        </span>
      ) : null}

      <Modal
        open={editando}
        onClose={cerrar}
        title={`Editar ${unidad.identificador}`}
        description="Los cambios se reflejan de inmediato en la cartera."
      >
        <UnidadForm modo="editar" unidad={unidad} alGuardar={cerrar} />
      </Modal>
    </div>
  );
}
