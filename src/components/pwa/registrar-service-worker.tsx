"use client";

import { useEffect } from "react";
import { iniciarCapturaInstalacion } from "@/lib/pwa-instalacion";

/** Registra /sw.js (solo en producción) y captura el evento de instalación de la PWA. */
export function RegistrarServiceWorker() {
  useEffect(() => {
    // El evento de instalación puede llegar antes de que exista el aviso.
    iniciarCapturaInstalacion();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.error("No se pudo registrar el service worker", error);
    });
  }, []);

  return null;
}
