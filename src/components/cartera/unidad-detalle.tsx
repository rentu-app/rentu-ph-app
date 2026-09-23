import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";
import type { DetalleUnidad } from "@/lib/data/cartera";
import { EstadoCuenta } from "@prisma/client";
import {
  DiasMoraBadge,
  EstadoCuentaBadge,
  EtapaCobroBadge,
} from "@/components/dashboard/estado-badge";
import { RegistrarPagoForm } from "@/components/dashboard/registrar-pago-form";
import { RegistrarGestionForm } from "@/components/cartera/registrar-gestion-form";
import { RegistrarAvisoForm } from "@/components/cartera/registrar-aviso-form";
import { FormPanel } from "@/components/ui/form-panel";
import {
  Dato,
  EstadoVacio,
  Etiqueta,
  Seccion,
  Tarjeta,
} from "@/components/ui/primitivos";
import {
  ETIQUETAS_CANAL,
  ETIQUETAS_ETAPA_COBRO,
  ETIQUETAS_TIPO_GESTION,
} from "@/lib/validations/cartera";
import { formatearFecha, formatearMoneda, formatearPeriodo } from "@/lib/formatters";

const ETIQUETAS_ROL: Record<string, string> = {
  PROPIETARIO: "Propietario",
  INQUILINO: "Inquilino",
};

/**
 * Detalle de una unidad: es la pantalla donde el administrador contesta
 * "¿cuánto debe, desde cuándo, quién vive ahí y qué se ha hecho?".
 *
 * Se renderiza como página completa (no como panel lateral) cuando la URL
 * trae `?unidad=`: un drawer lateral en 375 px termina ocupando la pantalla
 * completa de todas formas, y como página el enlace se puede compartir y el
 * botón "atrás" del teléfono funciona.
 */
export function UnidadDetalle({
  unidad,
  hrefVolver,
}: {
  unidad: DetalleUnidad;
  hrefVolver: string;
}) {
  const correos = unidad.residentes
    .map((residente) => residente.email)
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={hrefVolver}
          className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-medium text-brand-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la cartera
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              {unidad.identificador}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {unidad.torre} · coeficiente {unidad.coeficiente.toFixed(5)}
              {unidad.areaM2 ? ` · ${unidad.areaM2} m²` : ""} ·{" "}
              {unidad.estado === "OCUPADO" ? "Ocupada" : "Desocupada"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EtapaCobroBadge etapa={unidad.etapaCobro} />
            <DiasMoraBadge dias={unidad.diasMora} />
            {unidad.aPazYSalvo ? (
              <Etiqueta tono="exito">Puede reservar</Etiqueta>
            ) : (
              <Etiqueta tono="peligro">Reservas bloqueadas</Etiqueta>
            )}
          </div>
        </div>
      </div>

      <Tarjeta className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-5">
        <Dato etiqueta="Saldo total">
          <span className="font-semibold tabular-nums">
            {formatearMoneda(unidad.saldoTotal)}
          </span>
        </Dato>
        <Dato etiqueta="Saldo vencido">
          <span
            className={`font-semibold tabular-nums ${
              unidad.saldoVencido > 0 ? "text-red-600" : ""
            }`}
          >
            {formatearMoneda(unidad.saldoVencido)}
          </span>
        </Dato>
        <Dato etiqueta="Cuotas pendientes">{unidad.cuentasPendientes}</Dato>
        <Dato etiqueta="Último pago">
          {unidad.ultimoPago
            ? `${formatearFecha(unidad.ultimoPago.fechaPago)} · ${formatearMoneda(
                unidad.ultimoPago.monto
              )}`
            : "Sin pagos registrados"}
        </Dato>
      </Tarjeta>

      <div className="flex flex-col gap-2 sm:flex-row">
        <FormPanel
          triggerLabel="Registrar gestión"
          title={`Gestión de cobro · ${unidad.identificador}`}
          description="Deja constancia de la llamada, la visita o el acuerdo, y mueve la etapa de seguimiento si corresponde."
          icon={<ClipboardList className="h-4 w-4" />}
        >
          <RegistrarGestionForm
            inmuebleId={unidad.id}
            etapaActual={unidad.etapaCobro}
          />
        </FormPanel>

        <FormPanel
          triggerLabel="Redactar aviso"
          title={`Aviso de cobro · ${unidad.identificador}`}
          description="Se archiva en el historial de la unidad. En este MVP no se envía por ningún canal."
          icon={<Mail className="h-4 w-4" />}
          variant="accent"
        >
          <RegistrarAvisoForm
            inmuebleId={unidad.id}
            identificador={unidad.identificador}
            destinatarios={correos}
            saldoFormateado={formatearMoneda(unidad.saldoTotal)}
          />
        </FormPanel>
      </div>

      <Seccion
        titulo="Residentes vinculados"
        descripcion="Quien responde por la unidad hoy. El historial de cartera es de la unidad, no de la persona."
      >
        {unidad.residentes.length === 0 ? (
          <EstadoVacio
            titulo="Sin residentes vinculados"
            descripcion="Invita al propietario o inquilino desde la sección Residentes para que pueda ver su cartera en el portal."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {unidad.residentes.map((residente) => (
              <li
                key={residente.usuarioId}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                  <User className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900">
                    {residente.nombre}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {ETIQUETAS_ROL[residente.rol] ?? residente.rol} ·{" "}
                    {residente.email}
                    {residente.telefono ? ` · ${residente.telefono}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <Seccion
        titulo="Estado de cuenta"
        descripcion="Cada cuota con su saldo exigible (total + recargos − pagos)."
      >
        {unidad.cuentas.length === 0 ? (
          <EstadoVacio
            titulo="Sin cuentas de cobro"
            descripcion="Genera las cuentas del periodo desde el resumen para empezar a llevar la cartera de esta unidad."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {unidad.cuentas.map((cuenta) => {
              const estaPagada = cuenta.estado === EstadoCuenta.PAGADA;

              return (
                <li
                  key={cuenta.id}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-zinc-900">
                        {formatearPeriodo(cuenta.periodo)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Vence {formatearFecha(cuenta.fechaLimitePago)}
                        {cuenta.diasMora > 0
                          ? ` · ${cuenta.diasMora} día(s) de atraso`
                          : ""}
                      </p>
                    </div>
                    <EstadoCuentaBadge estado={cuenta.estado} />
                  </div>

                  {/* No se muestra "saldo anterior": las cuotas son
                      independientes y ese renglón siempre valdría 0 (ver la
                      nota en `generarCuentasDeCobroMensual`). */}
                  <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-3 sm:grid-cols-4">
                    <Dato etiqueta="Cuota del mes">
                      <span className="tabular-nums">
                        {formatearMoneda(cuenta.cuotaAdministracion + cuenta.expensas)}
                      </span>
                    </Dato>
                    <Dato etiqueta="Pagado">
                      <span className="tabular-nums">
                        {formatearMoneda(cuenta.montoPagado)}
                      </span>
                    </Dato>
                    <Dato etiqueta="Recargos">
                      <span className="tabular-nums">
                        {formatearMoneda(cuenta.recargosMora)}
                        {cuenta.tieneRecargoCongelado ? (
                          <span className="ml-1 text-xs text-zinc-400">
                            (congelado)
                          </span>
                        ) : null}
                      </span>
                    </Dato>
                    <Dato etiqueta="Saldo pendiente">
                      <span className="font-semibold tabular-nums">
                        {estaPagada ? "—" : formatearMoneda(cuenta.saldoPendiente)}
                      </span>
                    </Dato>
                  </div>

                  {cuenta.pagos.length > 0 ? (
                    <ul className="flex flex-col gap-1 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
                      {cuenta.pagos.map((pago) => (
                        <li key={pago.id} className="flex justify-between gap-2">
                          <span>
                            {formatearFecha(pago.fechaPago)} · {pago.metodo}
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatearMoneda(pago.monto)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {!estaPagada ? (
                    <div className="border-t border-zinc-100 pt-3">
                      <RegistrarPagoForm
                        cuentaDeCobroId={cuenta.id}
                        saldoPendiente={cuenta.saldoPendiente.toFixed(2)}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Seccion>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Seccion
          titulo="Bitácora de gestión"
          descripcion="Todo lo que se ha hecho con esta unidad, en orden."
        >
          {unidad.gestiones.length === 0 ? (
            <EstadoVacio
              titulo="Sin gestiones registradas"
              descripcion="Registra la primera llamada o visita para empezar el historial."
            />
          ) : (
            <ol className="flex flex-col gap-3">
              {unidad.gestiones.map((gestion) => (
                <li
                  key={gestion.id}
                  className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span className="font-medium text-zinc-700">
                        {ETIQUETAS_TIPO_GESTION[
                          gestion.tipo as keyof typeof ETIQUETAS_TIPO_GESTION
                        ] ?? gestion.tipo}
                      </span>
                      {formatearFecha(gestion.createdAt)} · {gestion.registradoPor}
                    </p>
                    {gestion.etapaNueva ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Etapa:{" "}
                        {gestion.etapaAnterior
                          ? `${ETIQUETAS_ETAPA_COBRO[gestion.etapaAnterior]} → `
                          : ""}
                        <span className="font-medium text-zinc-700">
                          {ETIQUETAS_ETAPA_COBRO[gestion.etapaNueva]}
                        </span>
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-zinc-700">{gestion.nota}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Seccion>

        <Seccion
          titulo="Avisos de cobro"
          descripcion="Historial de los mensajes redactados para esta unidad."
        >
          {unidad.notificaciones.length === 0 ? (
            <EstadoVacio
              titulo="Sin avisos redactados"
              descripcion="Los avisos quedan archivados acá como evidencia de la gestión."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {unidad.notificaciones.map((aviso) => (
                <li
                  key={aviso.id}
                  className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium text-zinc-900">
                      {aviso.asunto}
                    </p>
                    {aviso.simulada ? (
                      <Etiqueta tono="alerta">Simulación MVP</Etiqueta>
                    ) : (
                      <Etiqueta tono="exito">Enviado</Etiqueta>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {ETIQUETAS_CANAL[aviso.canal as keyof typeof ETIQUETAS_CANAL] ??
                      aviso.canal}{" "}
                    · {formatearFecha(aviso.createdAt)} · a {aviso.destinatarios}
                  </p>
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm text-zinc-600">
                    {aviso.cuerpo}
                  </p>
                  {aviso.simulada ? (
                    <p className="text-xs text-amber-700">
                      No se envió ningún mensaje real: Rentu aún no tiene
                      proveedor de correo ni WhatsApp conectado.
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Seccion>
      </div>
    </div>
  );
}
