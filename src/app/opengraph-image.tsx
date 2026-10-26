import { ImageResponse } from "next/og";

export const alt = "Rentu PH · Gestión inteligente de Propiedad Horizontal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colores de la marca (tokens brand/accent de globals.css).
const AZUL_700 = "#1d4ed8";
const AZUL_900 = "#1e3a8a";
const AZUL_600 = "#2563eb";
const AMARILLO_500 = "#f59e0b";
const AMARILLO_100 = "#fef3c7";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "white",
          background: `linear-gradient(135deg, ${AZUL_900} 0%, ${AZUL_700} 100%)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: AZUL_600,
              border: "3px solid rgba(255,255,255,0.35)",
              display: "flex",
            }}
          />
          <div style={{ display: "flex", fontSize: 56, fontWeight: 800 }}>
            Rentu<span style={{ color: AMARILLO_500 }}>PH</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            La cartera de tu copropiedad, clara en una sola pantalla.
          </div>
          <div style={{ display: "flex", fontSize: 32, color: AMARILLO_100 }}>
            Para administradores de propiedad horizontal
          </div>
        </div>
      </div>
    ),
    size
  );
}
