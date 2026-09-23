import { HardHat } from "lucide-react";
import type { PqrsConDetalle } from "@/lib/data/pqrs";
import type { PrestadorConOrdenes } from "@/lib/data/prestadores";
import { EstadoPqrsBadge } from "@/components/pqrs/estado-pqrs-badge";
import { ResponderPqrsForm } from "@/components/pqrs/responder-pqrs-form";
import { CrearOrdenForm } from "@/components/prestadores/crear-orden-form";
import { FormPanel } from "@/components/ui/form-panel";
import { EstadoVacio, Etiqueta } from "@/components/ui/primitivos";
import { ETIQUETAS_ESTADO_ORDEN } from "@/lib/validations/prestadores";
import { formatearFecha } from "@/lib/formatters";

const ETIQUETAS_TIPO: Record<string, string> = {
  PETICION: "Petición",
  QUEJA: "Queja",
  RECLAMO: "Reclamo",
  SUGERENCIA: "Sugerencia",
  FALLA: "Falla",
};

/**
 * Listado de PQRS del administrador.
 *
 * `prestadores` llega opcionalmente: cuando hay prestadores en el
 * directorio, cada PQRS ofrece "Escalar a prestador". Esa conversión es
 * SIEMPRE manual y explícita — una queja no se convierte sola en orden de
 * servicio ni, mucho menos, en una multa.
 */
export function PqrsList({
  items,
  prestadores = [],
}: {
  items: PqrsConDetalle[];
  prestadores?: PrestadorConOrdenes[];
}) {
  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay PQRS con este filtro"
        descripcion="Cuando un residente radique una petición, queja o reclamo desde su portal, aparecerá acá."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((pqrs) => (
        <li
          key={pqrs.id}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-xs text-zinc-400">
                {pqrs.codigoRadicado}
              </p>
              <h3 className="font-semibold text-zinc-900">{pqrs.titulo}</h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                {ETIQUETAS_TIPO[pqrs.tipo] ?? pqrs.tipo} ·{" "}
                {pqrs.inmueble.identificador} ({pqrs.inmueble.torre}) · radicada
                por {pqrs.radicadoPor.nombre}
                {pqrs.dirigidoA ? ` · dirigida a ${pqrs.dirigidoA.nombre}` : ""} ·{" "}
                {formatearFecha(pqrs.createdAt)}
              </p>
            </div>
            <div className="shrink-0">
              <EstadoPqrsBadge estado={pqrs.estado} />
            </div>
          </div>

          <p className="whitespace-pre-wrap text-sm text-zinc-700">
            {pqrs.descripcion}
          </p>

          {pqrs.respuestaAdmin ? (
            <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
              <p className="text-xs font-medium text-zinc-500">
                Respuesta de la administración
                {pqrs.respondidoEn ? ` · ${formatearFecha(pqrs.respondidoEn)}` : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{pqrs.respuestaAdmin}</p>
            </div>
          ) : null}

          {pqrs.ordenesServicio.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {pqrs.ordenesServicio.map((orden) => (
                <Etiqueta key={orden.id} tono="marca">
                  <HardHat className="h-3 w-3" />
                  {orden.prestador.nombre} ·{" "}
                  {ETIQUETAS_ESTADO_ORDEN[orden.estado]}
                </Etiqueta>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3">
            <ResponderPqrsForm
              pqrsId={pqrs.id}
              estadoActual={pqrs.estado}
              respuestaActual={pqrs.respuestaAdmin}
            />

            {prestadores.length > 0 ? (
              <FormPanel
                triggerLabel="Escalar a prestador"
                title="Crear orden de servicio"
                description={`A partir de ${pqrs.codigoRadicado}. La orden queda vinculada a la PQRS para seguir el caso completo.`}
                icon={<HardHat className="h-4 w-4" />}
                variant="accent"
              >
                <CrearOrdenForm
                  prestadores={prestadores}
                  pqrsFija={{
                    id: pqrs.id,
                    codigoRadicado: pqrs.codigoRadicado,
                    titulo: pqrs.titulo,
                  }}
                />
              </FormPanel>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
