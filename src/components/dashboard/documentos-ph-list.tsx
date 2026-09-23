import { FileText } from "lucide-react";
import type { DocumentoPHIndexado } from "@/lib/data/documentos-ph";
import { EstadoVacio } from "@/components/ui/primitivos";
import { formatearFecha } from "@/lib/formatters";

const ETIQUETAS_TIPO: Record<string, string> = {
  REGLAMENTO_PH: "Reglamento de PH",
  MANUAL_CONVIVENCIA: "Manual de convivencia",
  ACTA_ASAMBLEA: "Acta de asamblea",
  OTRO: "Otro",
};

export function DocumentosPHList({
  documentos,
}: {
  documentos: DocumentoPHIndexado[];
}) {
  if (documentos.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay documentos indexados"
        descripcion="Pega el reglamento, el manual de convivencia o un acta para que el Copiloto pueda responder con base en ellos."
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
      {documentos.map((documento) => (
        <li key={documento.id} className="flex items-center gap-3 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900">
              {documento.titulo}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {ETIQUETAS_TIPO[documento.tipo] ?? documento.tipo} ·{" "}
              {documento._count.chunks} fragmento(s) ·{" "}
              {formatearFecha(documento.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
