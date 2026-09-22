import { FileText } from "lucide-react";
import type { DocumentoPHConCopropiedad } from "@/lib/data/documentos-ph";
import { formatearFecha } from "@/lib/formatters";
import { StaggerList, StaggerListItem } from "@/components/ui/motion";

const ETIQUETAS_TIPO: Record<string, string> = {
  REGLAMENTO_PH: "Reglamento de PH",
  MANUAL_CONVIVENCIA: "Manual de convivencia",
  ACTA_ASAMBLEA: "Acta de asamblea",
  OTRO: "Otro",
};

export function DocumentosPHList({
  documentos,
}: {
  documentos: DocumentoPHConCopropiedad[];
}) {
  if (documentos.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Todavía no has indexado documentos de ninguna copropiedad.
      </p>
    );
  }

  return (
    <StaggerList className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {documentos.map((documento) => (
        <StaggerListItem
          key={documento.id}
          className="flex items-center gap-3 px-4 py-3"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-950/30 dark:text-accent-400">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {documento.titulo}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {documento.copropiedad.nombre} · {ETIQUETAS_TIPO[documento.tipo] ?? documento.tipo} ·{" "}
              {documento._count.chunks} fragmento(s) · {formatearFecha(documento.createdAt)}
            </p>
          </div>
        </StaggerListItem>
      ))}
    </StaggerList>
  );
}
