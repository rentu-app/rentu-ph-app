import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { COLOR_TEMA, DESCRIPCION_APP, TITULO_APP } from "@/lib/marca";
import { RegistrarServiceWorker } from "@/components/pwa/registrar-service-worker";
import { VersionApp } from "@/components/ui/version-app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITULO = TITULO_APP;
const DESCRIPCION = DESCRIPCION_APP;

export const metadata: Metadata = {
  metadataBase: new URL("https://rentu-ph-app-rho.vercel.app"),
  title: TITULO,
  description: DESCRIPCION,
  // iPhone: al "Agregar a inicio" abre en pantalla completa con el nombre corto.
  appleWebApp: { capable: true, title: "Rentu", statusBarStyle: "default" },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: "/",
    siteName: "Rentu PH",
    locale: "es_CO",
    type: "website",
    // La imagen la inyecta app/opengraph-image.tsx.
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
  },
};

/**
 * `width`/`initialScale` son el default de Next (sin bloquear zoom, nunca lo
 * sobreescribimos). `viewportFit: "cover"` es lo que activa
 * `env(safe-area-inset-*)` en iOS cuando la app corre standalone (PWA) o en
 * un iPhone con notch/home indicator — sin esto los `env()` que usan los
 * headers y el bottom sheet del modal siempre valen 0.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: COLOR_TEMA,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CO"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <RegistrarServiceWorker />
        <VersionApp />
      </body>
    </html>
  );
}
