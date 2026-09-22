import type { ResidenteConDetalle } from "@/lib/data/residentes";
import { formatearFecha } from "@/lib/formatters";
import { StaggerList, StaggerListItem } from "@/components/ui/motion";

const ETIQUETAS_ROL: Record<string, string> = {
  PROPIETARIO: "Propietario",
  INQUILINO: "Inquilino",
};

export function ResidentesList({ residentes }: { residentes: ResidenteConDetalle[] }) {
  if (residentes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        Todavía no has invitado a ningún residente.
      </p>
    );
  }

  return (
    <StaggerList className="flex flex-col gap-3">
      {residentes.map((residente) => (
        <StaggerListItem
          key={residente.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {residente.usuario.nombre}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {residente.usuario.email} · {ETIQUETAS_ROL[residente.rol] ?? residente.rol} ·{" "}
              {residente.inmueble.identificador} — {residente.inmueble.copropiedad.nombre}
            </p>
          </div>
          <span className="text-xs text-zinc-400">
            Vinculado desde {formatearFecha(residente.fechaInicio)}
          </span>
        </StaggerListItem>
      ))}
    </StaggerList>
  );
}
