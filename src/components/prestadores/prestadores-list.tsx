import { HardHat, Mail, Phone } from "lucide-react";
import type {
  OrdenServicioConDetalle,
  PrestadorConOrdenes,
} from "@/lib/data/prestadores";
import { ActualizarEstadoOrdenForm } from "@/components/prestadores/actualizar-estado-orden-form";
import { EstadoVacio, Etiqueta, type TonoEtiqueta } from "@/components/ui/primitivos";
import {
  ETIQUETAS_ESTADO_ORDEN,
  ETIQUETAS_TIPO_PRESTADOR,
} from "@/lib/validations/prestadores";
import { formatearFecha, formatearMoneda } from "@/lib/formatters";

export function PrestadoresList({
  prestadores,
}: {
  prestadores: PrestadorConOrdenes[];
}) {
  if (prestadores.length === 0) {
    return (
      <EstadoVacio
        titulo="El directorio está vacío"
        descripcion="Agrega las empresas de seguridad, aseo, jardinería o mantenimiento con las que trabaja la copropiedad."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {prestadores.map((prestador) => (
        <li
          key={prestador.id}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-900">
                {prestador.nombre}
              </p>
              <p className="text-xs text-zinc-500">
                {ETIQUETAS_TIPO_PRESTADOR[prestador.tipo]}
                {prestador.contacto ? ` · ${prestador.contacto}` : ""}
              </p>
            </div>
            {prestador.activo ? null : <Etiqueta tono="neutro">Inactivo</Etiqueta>}
          </div>

          <div className="flex flex-col gap-1 text-xs text-zinc-600">
            {prestador.telefono ? (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0 text-zinc-400" />
                {prestador.telefono}
              </span>
            ) : null}
            {prestador.email ? (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0 text-zinc-400" />
                <span className="truncate">{prestador.email}</span>
              </span>
            ) : null}
          </div>

          {prestador.notas ? (
            <p className="text-xs text-zinc-500">{prestador.notas}</p>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
            <Etiqueta tono={prestador.ordenesAbiertas > 0 ? "marca" : "neutro"}>
              {prestador.ordenesAbiertas} orden(es) abierta(s)
            </Etiqueta>
            <span className="text-xs text-zinc-400">
              {prestador.ordenesTotales} en total
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const TONO_ORDEN: Record<string, TonoEtiqueta> = {
  ABIERTA: "alerta",
  EN_PROCESO: "info",
  CERRADA: "exito",
  CANCELADA: "neutro",
};

export function OrdenesServicioList({
  ordenes,
}: {
  ordenes: OrdenServicioConDetalle[];
}) {
  if (ordenes.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay órdenes de servicio"
        descripcion="Crea una orden para dejar por escrito qué se le pidió a un prestador y en qué va."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {ordenes.map((orden) => (
        <li
          key={orden.id}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900">{orden.titulo}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <HardHat className="h-3 w-3 shrink-0 text-zinc-400" />
                  {orden.prestador.nombre}
                </span>
                <span>· creada {formatearFecha(orden.createdAt)}</span>
                {orden.fechaProgramada ? (
                  <span>· programada {formatearFecha(orden.fechaProgramada)}</span>
                ) : null}
                {orden.costoEstimado ? (
                  <span>· est. {formatearMoneda(orden.costoEstimado)}</span>
                ) : null}
              </p>
              {orden.pqrs ? (
                <p className="mt-1 text-xs text-brand-700">
                  Viene de {orden.pqrs.codigoRadicado} — {orden.pqrs.titulo}
                </p>
              ) : null}
            </div>
            <div className="shrink-0">
              <Etiqueta tono={TONO_ORDEN[orden.estado] ?? "neutro"}>
                {ETIQUETAS_ESTADO_ORDEN[orden.estado]}
              </Etiqueta>
            </div>
          </div>

          {orden.descripcion ? (
            <p className="whitespace-pre-wrap text-sm text-zinc-700">
              {orden.descripcion}
            </p>
          ) : null}

          <div className="border-t border-zinc-100 pt-3">
            <ActualizarEstadoOrdenForm
              ordenId={orden.id}
              estadoActual={orden.estado}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
