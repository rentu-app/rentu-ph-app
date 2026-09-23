import { User } from "lucide-react";
import type {
  ResidenteConDetalle,
  ResidenteHistorico,
} from "@/lib/data/residentes";
import { EstadoVacio, Etiqueta } from "@/components/ui/primitivos";
import { formatearFecha } from "@/lib/formatters";

const ETIQUETAS_ROL: Record<string, string> = {
  PROPIETARIO: "Propietario",
  INQUILINO: "Inquilino",
};

export function ResidentesList({ residentes }: { residentes: ResidenteConDetalle[] }) {
  if (residentes.length === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no hay residentes vinculados"
        descripcion="Invita a los propietarios e inquilinos para que vean su cartera y radiquen PQRS y reservas desde su portal."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {residentes.map((residente) => (
        <li
          key={residente.id}
          className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
            <User className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-zinc-900">{residente.usuario.nombre}</p>
              <Etiqueta tono="neutro">
                {ETIQUETAS_ROL[residente.rol] ?? residente.rol}
              </Etiqueta>
            </div>
            <p className="mt-0.5 break-words text-xs text-zinc-500">
              {residente.usuario.email}
              {residente.usuario.telefono ? ` · ${residente.usuario.telefono}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {residente.inmueble.identificador} — {residente.inmueble.torre} ·
              vinculado desde {formatearFecha(residente.fechaInicio)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Vínculos ya revocados. Se muestran aparte porque la fila nunca se borra:
 * saber quién vivió en una unidad y hasta cuándo es parte de la trazabilidad
 * que pide la Ley 675 y lo que el consejo suele preguntar.
 */
export function ResidentesHistoricosList({
  residentes,
}: {
  residentes: ResidenteHistorico[];
}) {
  if (residentes.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No hay vínculos revocados todavía.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
      {residentes.map((residente) => (
        <li
          key={residente.id}
          className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-800">
              {residente.usuario.nombre}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {ETIQUETAS_ROL[residente.rol] ?? residente.rol} ·{" "}
              {residente.inmueble.identificador} — {residente.inmueble.torre}
            </p>
          </div>
          <p className="shrink-0 text-xs text-zinc-500">
            {formatearFecha(residente.fechaInicio)} —{" "}
            {residente.fechaFin ? formatearFecha(residente.fechaFin) : "sin fecha de fin"}
          </p>
        </li>
      ))}
    </ul>
  );
}
