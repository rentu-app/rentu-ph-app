import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin conexión · Rentu",
  robots: { index: false },
};

/**
 * Página de respaldo del service worker. Es 100 % estática (sin datos ni
 * cookies) y lleva sus estilos en línea para verse bien aunque el CSS de la
 * app no esté en caché.
 */
export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "24px",
        textAlign: "center",
        background: "#ffffff",
        color: "#18181b",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo.svg" alt="Rentu PH" width={64} height={77} />
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Sin conexión</h1>
      <p style={{ maxWidth: 320, margin: 0, color: "#52525b", lineHeight: 1.5 }}>
        Sin conexión. Revisa tu internet para ver los datos de tu copropiedad.
      </p>
    </main>
  );
}
