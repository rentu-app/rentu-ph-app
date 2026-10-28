import { CheckCircle2, TriangleAlert } from "lucide-react";

/**
 * Indicador de la suma de coeficientes (Ley 675 de 2001): verde cuando suma
 * exactamente 100 %, amarillo en cualquier otro caso. Recibe la suma como
 * string de 5 decimales (calculada con Decimal en el servidor) para comparar
 * sin error de punto flotante.
 */
export function SumaCoeficientes({
  suma,
  totalUnidades,
}: {
  suma: string;
  totalUnidades: number;
}) {
  const completa = suma === "1.00000";
  const porcentaje = (Number(suma) * 100).toLocaleString("es-CO", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  const diferencia = Math.abs(100 - Number(suma) * 100).toLocaleString("es-CO", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
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
          Suma de coeficientes: <span className="tabular-nums">{porcentaje} %</span>
          <span className="font-normal"> · {totalUnidades} unidad(es)</span>
        </p>
        <p className="mt-0.5 text-xs">
          {completa
            ? "Los coeficientes suman 100 %, como exige la Ley 675."
            : totalUnidades === 0
              ? "Aún no hay unidades. Según la Ley 675, los coeficientes de la copropiedad deben sumar 100 %."
              : Number(suma) < 1
                ? `Faltan ${diferencia} % para llegar a 100 % (Ley 675).`
                : `Se pasa ${diferencia} % de 100 % (Ley 675).`}
        </p>
      </div>
    </div>
  );
}
