import { CheckCircle2, TriangleAlert } from "lucide-react";
import { Prisma } from "@prisma/client";
import { fraccionAPorcentaje, sumaEsCompleta } from "@/lib/coeficientes";

function formatear(porcentaje: string) {
  return Number(porcentaje).toLocaleString("es-CO", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

/**
 * Indicador de la suma de coeficientes (Ley 675 de 2001): verde cuando suma
 * 100 % (con ±0.001 % de tolerancia por redondeo), amarillo en cualquier otro
 * caso. Recibe la suma como fracción en string (calculada con Decimal en el
 * servidor) para comparar sin error de punto flotante.
 */
export function SumaCoeficientes({
  suma,
  totalUnidades,
}: {
  suma: string;
  totalUnidades: number;
}) {
  const completa = sumaEsCompleta(suma);
  const porcentaje = fraccionAPorcentaje(suma);
  const diferencia = new Prisma.Decimal(porcentaje).minus(100).abs().toFixed(3);
  const Icono = completa ? CheckCircle2 : TriangleAlert;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border p-4 ${
        completa
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      <Icono className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          Suma:{" "}
          <span className="tabular-nums">{completa ? "100" : formatear(porcentaje)} %</span>
          <span className="font-normal"> · {totalUnidades} unidad(es)</span>
        </p>
        <p className="mt-0.5 text-xs">
          {completa
            ? "Los coeficientes suman 100 %, como exige la Ley 675."
            : totalUnidades === 0
              ? "Aún no hay unidades. Según la Ley 675, los coeficientes de la copropiedad deben sumar 100 %."
              : Number(porcentaje) < 100
                ? `Faltan ${formatear(diferencia)} % para llegar a 100 % (Ley 675).`
                : `Se pasa ${formatear(diferencia)} % de 100 % (Ley 675).`}
        </p>
      </div>
    </div>
  );
}
