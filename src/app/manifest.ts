import type { MetadataRoute } from "next";
import { COLOR_TEMA, DESCRIPCION_APP } from "@/lib/marca";

/**
 * Manifest de la PWA (se sirve en /manifest.webmanifest). Los íconos están en
 * public/icons: 192 y 512 con el logo "any" y un 512 "maskable" con fondo
 * blanco y el logo dentro de la zona segura (80 % central).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rentu PH",
    short_name: "Rentu",
    description: DESCRIPCION_APP,
    lang: "es-CO",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: COLOR_TEMA,
    background_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
