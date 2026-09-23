import { Skeleton } from "@/components/ui/skeleton";

/**
 * Sin este archivo, al hacer clic en una sección del dashboard el navegador se
 * queda en la pantalla anterior hasta que el servidor termina de renderizar
 * (las páginas son dinámicas: leen sesión y base de datos). Con el límite de
 * carga, el shell —header y navegación— cambia de inmediato y el contenido
 * aparece en su lugar cuando llega.
 *
 * Es la diferencia entre "el clic no hizo nada" y "está cargando".
 */
export default function CargandoResumen() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
