"use client";

import { useState, useSyncExternalStore } from "react";
import { Download, Share } from "lucide-react";
import { instalarApp, leerModoDisponible, suscribirInstalacion } from "@/lib/pwa-instalacion";

/**
 * Botón permanente "Instalar app" (landing): sigue disponible aunque se haya
 * cerrado el aviso. Solo aparece en móvil y si la app no está instalada.
 * Android lanza el diálogo nativo; iPhone muestra cómo agregarla a inicio.
 */
export function BotonInstalar({ className = "" }: { className?: string }) {
  const modo = useSyncExternalStore(suscribirInstalacion, leerModoDisponible, () => null);
  const [verPasos, setVerPasos] = useState(false);
  if (!modo) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => (modo === "android" ? void instalarApp() : setVerPasos((v) => !v))}
        aria-expanded={modo === "ios" ? verPasos : undefined}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        <Download aria-hidden="true" className="h-4 w-4" />
        Instalar app
      </button>
      {modo === "ios" && verPasos ? (
        <p className="mt-2 text-sm text-zinc-500">
          Toca <Share aria-hidden="true" className="mx-0.5 inline h-3.5 w-3.5 align-[-2px]" />
          <span className="font-medium text-zinc-700"> Compartir</span> y luego{" "}
          <span className="font-medium text-zinc-700">Agregar a inicio</span>.
        </p>
      ) : null}
    </div>
  );
}
