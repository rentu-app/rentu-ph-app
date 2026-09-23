import { Skeleton } from "@/components/ui/skeleton";

/**
 * Límite de carga de las seis secciones. Aproxima la forma común a todas
 * (encabezado + fila de filtros + lista) para que el cambio de pantalla se
 * sienta inmediato aunque la consulta tarde.
 */
export default function CargandoSeccion() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
