"use client";

import { CircleHelp } from "lucide-react";
import { EVENTO_INICIAR_TOUR } from "@/components/dashboard/tour-guiado";

/**
 * Botón de ayuda flotante: relanza el tour. Se monta solo en el layout del
 * dashboard. Se oculta por CSS (globals.css, `.rentu-ayuda`) mientras haya un
 * modal abierto (`body[data-modal-abierto]`) o el tour activo (`body.driver-active`).
 */
export function AyudaFlotante() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENTO_INICIAR_TOUR))}
      aria-label="Ver tutorial"
      title="Ver tutorial"
      className="rentu-ayuda fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-30 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-zinc-900/20 transition-colors hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <CircleHelp className="h-6 w-6" />
    </button>
  );
}
