import Link from "next/link";
import { Logo } from "@/components/ui/logo";

/**
 * Cabecera de las pantallas de acceso: logo (link a la landing), marca
 * "RentuPH" como en el header y una línea que explica la pantalla.
 */
export function MarcaAuth({ descripcion }: { descripcion: string }) {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <Link href="/" aria-label="Volver al inicio" className="rounded-md">
        <Logo altura={48} />
      </Link>
      <p className="mt-3 text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
        Rentu<span className="text-accent-500">PH</span>
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{descripcion}</p>
    </div>
  );
}
