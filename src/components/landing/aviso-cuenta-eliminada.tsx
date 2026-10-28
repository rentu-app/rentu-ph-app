"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

/** Aviso tras eliminar la cuenta (`/?cuenta=eliminada`). La landing sigue siendo estática. */
export function AvisoCuentaEliminada() {
  const cuenta = useSearchParams().get("cuenta");
  const [cerrado, setCerrado] = useState(false);

  if ((cuenta !== "eliminada" && cuenta !== "eliminada-parcial") || cerrado) return null;
  const parcial = cuenta === "eliminada-parcial";

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 px-4 py-3 text-sm ${
        parcial ? "bg-amber-100 text-amber-950" : "bg-emerald-600 text-white"
      }`}
    >
      <p>
        {parcial
          ? "Tu cuenta se eliminó, pero tu correo puede tardar en liberarse. Si no puedes registrarte de nuevo, escríbenos."
          : "Tu cuenta se eliminó correctamente. Si quieres volver, puedes registrarte de nuevo con el mismo correo."}
      </p>
      <button
        type="button"
        onClick={() => setCerrado(true)}
        aria-label="Cerrar aviso"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          parcial ? "hover:bg-amber-200" : "hover:bg-emerald-700"
        }`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
