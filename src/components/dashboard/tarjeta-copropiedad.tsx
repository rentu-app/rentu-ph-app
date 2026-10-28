import { MapPin, TriangleAlert } from "lucide-react";
import { seleccionarCopropiedad } from "@/lib/actions/copropiedades";
import { estiloPortada, iniciales } from "@/lib/portada";
import type { MetricasCopropiedad } from "@/lib/data/metricas-copropiedades";

type Props = {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  metricas: MetricasCopropiedad | undefined;
  /** Posición en la grilla: escalona la animación de entrada. */
  indice: number;
};

function Metrica({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-lg font-bold leading-tight tabular-nums text-zinc-900">{valor}</p>
      <p className="truncate text-[11px] leading-tight text-zinc-500">{etiqueta}</p>
    </div>
  );
}

/**
 * Tarjeta tipo producto. Toda la tarjeta es el botón de un `<form>` que llama
 * a `seleccionarCopropiedad`; el servidor valida la pertenencia antes de
 * escribir la cookie. Es un Server Component: no manda JavaScript al cliente.
 */
export function TarjetaCopropiedad({ id, nombre, direccion, ciudad, metricas, indice }: Props) {
  const sinUnidades = !metricas || metricas.unidades === 0;

  return (
    <form
      action={seleccionarCopropiedad}
      className="aparecer h-full"
      style={{ animationDelay: `${Math.min(indice, 8) * 60}ms` }}
    >
      <input type="hidden" name="copropiedadId" value={id} />
      <button
        type="submit"
        className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:outline-none"
      >
        <div
          className="relative flex h-28 items-end justify-between p-4 sm:h-32"
          style={estiloPortada(nombre)}
          aria-hidden="true"
        >
          <span className="text-4xl font-extrabold tracking-tight text-white/90 drop-shadow-sm sm:text-5xl">
            {iniciales(nombre)}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-snug text-zinc-900 group-hover:text-brand-700">
              {nombre}
            </h2>
            <p className="mt-1 flex items-start gap-1 text-sm text-zinc-500">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {direccion} · {ciudad}
              </span>
            </p>
          </div>

          <div className="mt-auto border-t border-zinc-100 pt-3">
            {sinUnidades ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                <TriangleAlert className="h-3.5 w-3.5" />
                Configuración pendiente
              </span>
            ) : (
              <div className="flex gap-3">
                <Metrica valor={String(metricas.unidades)} etiqueta="unidades" />
                <Metrica
                  valor={metricas.porcentajeAlDia === null ? "—" : `${metricas.porcentajeAlDia} %`}
                  etiqueta="cartera al día"
                />
                <Metrica valor={String(metricas.pqrsAbiertas)} etiqueta="PQRS abiertas" />
              </div>
            )}
          </div>
        </div>
      </button>
    </form>
  );
}
