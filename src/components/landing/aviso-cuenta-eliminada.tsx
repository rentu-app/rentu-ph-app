"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

/** Aviso tras eliminar la cuenta (`/?cuenta=eliminada`). La landing sigue siendo estática. */
export function AvisoCuentaEliminada() {
  const eliminada = useSearchParams().get("cuenta") === "eliminada";
  const [cerrado, setCerrado] = useState(false);

  if (!eliminada || cerrado) return null;

  return (
    <div
      role="status"
      className="flex items-start justify-between gap-3 bg-emerald-600 px-4 py-3 text-sm text-white"
    >
      <p>Tu cuenta se eliminó correctamente. Si quieres volver, puedes registrarte de nuevo con el mismo correo.</p>
      <button
        type="button"
        onClick={() => setCerrado(true)}
        aria-label="Cerrar aviso"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-emerald-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
