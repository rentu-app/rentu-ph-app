"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { Share, X } from "lucide-react";
import {
  cerrarAvisoInstalacion,
  instalarApp,
  leerModoInstalacion,
  suscribirInstalacion,
} from "@/lib/pwa-instalacion";

/**
 * Aviso discreto "Instalar app": solo en móvil y solo si la app no está
 * instalada. Android/Chrome instala con un clic; en iPhone no existe ese
 * evento, así que se muestran las instrucciones. Se cierra y no vuelve.
 */
export function AvisoInstalar({ className = "" }: { className?: string }) {
  const modo = useSyncExternalStore(suscribirInstalacion, leerModoInstalacion, () => null);
  if (!modo) return null;

  return (
    <div
      role="region"
      aria-label="Instalar la app"
      className={`flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm ${className}`}
    >
      <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-zinc-900">Instala Rentu en tu celular</p>
        {modo === "ios" ? (
          <p className="text-zinc-500">
            Toca <Share aria-hidden="true" className="mx-0.5 inline h-3.5 w-3.5 align-[-2px]" />
            <span className="font-medium text-zinc-700"> Compartir</span> y luego{" "}
            <span className="font-medium text-zinc-700">Agregar a inicio</span>.
          </p>
        ) : (
          <p className="text-zinc-500">Ábrela como una app, a pantalla completa.</p>
        )}
      </div>
      {modo === "android" ? (
        <button
          type="button"
          onClick={() => void instalarApp()}
          className="inline-flex min-h-11 shrink-0 items-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          Instalar
        </button>
      ) : null}
      <button
        type="button"
        onClick={cerrarAvisoInstalacion}
        aria-label="Cerrar aviso"
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
