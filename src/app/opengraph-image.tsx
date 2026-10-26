import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Rentu PH · Gestión inteligente de Propiedad Horizontal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colores de la marca (tokens brand/accent de globals.css).
const AZUL_700 = "#1d4ed8";
const AZUL_900 = "#1e3a8a";
const AMARILLO_500 = "#f59e0b";
const AMARILLO_100 = "#fef3c7";

export default async function OpenGraphImage() {
  const logoSvg = await readFile(join(process.cwd(), "public/brand/logo.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logoSvg.toString("base64")}`;

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
          {/* Tarjeta blanca: el logo es azul/amarillo y se pierde sobre el fondo azul. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 22,
              background: "white",
            }}
          >
            <img src={logoSrc} alt="Rentu PH" width={62} height={74} />
          </div>
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
