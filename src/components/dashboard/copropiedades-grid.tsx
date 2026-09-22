import type { CopropiedadResumen } from "@/lib/data/copropiedades";
import { StaggerGrid, StaggerItem } from "@/components/ui/motion";

export function CopropiedadesGrid({
  copropiedades,
}: {
  copropiedades: CopropiedadResumen[];
}) {
  if (copropiedades.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No administras ninguna copropiedad todavía.
      </p>
    );
  }

  return (
    <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {copropiedades.map((copropiedad) => (
        <StaggerItem
          key={copropiedad.id}
          className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              {copropiedad.nombre}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {copropiedad.direccion} · {copropiedad.ciudad}
            </p>
            {copropiedad.nit ? (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                NIT {copropiedad.nit}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex items-center gap-4 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
            <span className="text-zinc-600 dark:text-zinc-300">
              <strong className="font-semibold text-zinc-900 dark:text-zinc-50">
                {copropiedad.totalInmuebles}
              </strong>{" "}
              inmuebles
            </span>
            <span
              className={
                copropiedad.cuentasPorCobrar > 0
                  ? "font-medium text-amber-600"
                  : "text-zinc-500"
              }
            >
              {copropiedad.cuentasPorCobrar} cuentas por cobrar
            </span>
          </div>
        </StaggerItem>
      ))}
    </StaggerGrid>
  );
}
