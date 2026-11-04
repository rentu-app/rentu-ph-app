"use client";

import { useCallback, useState } from "react";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import {
  CrearZonaComunForm,
  type ZonaEditable,
} from "@/components/reservas/crear-zona-comun-form";

export function EditarZonaComun({ zona }: { zona: ZonaEditable }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = useCallback(() => setAbierto(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={`Editar ${zona.nombre}`}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 sm:min-h-9 sm:min-w-9"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <Modal
        open={abierto}
        onClose={cerrar}
        title={`Editar ${zona.nombre}`}
        description="Los cambios aplican a las reservas nuevas."
      >
        <CrearZonaComunForm zona={zona} alGuardar={cerrar} />
      </Modal>
    </>
  );
}
