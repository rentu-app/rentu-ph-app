import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rentu PH · Gestión inteligente de Propiedad Horizontal",
  description:
    "La plataforma de gestión para Propiedad Horizontal con cartera, PQRS, reservas y un Copiloto Administrativo con IA.",
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
