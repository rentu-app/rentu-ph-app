import { EstadoCuenta } from "@prisma/client";
import { getResidenteActual } from "@/lib/session";
import { getCarteraDeResidente } from "@/lib/data/cartera-residente";
import { EstadoCuentaBadge } from "@/components/dashboard/estado-badge";
import {
  Dato,
  EncabezadoPagina,
  EstadoVacio,
  Tarjeta,
} from "@/components/ui/primitivos";
import { formatearFecha, formatearMoneda, formatearPeriodo } from "@/lib/formatters";

export const metadata = {
  title: "Mi cartera · Rentu",
};

export default async function CarteraResidentePage() {
  const { inmuebleActivo } = await getResidenteActual();

  if (!inmuebleActivo) {
    return (
      <EstadoVacio
        titulo="No tienes una unidad vinculada"
        descripcion="Contacta a la administración de tu conjunto para que te vincule a tu apartamento."
      />
    );
  }

  const cartera = await getCarteraDeResidente(inmuebleActivo.inmueble.id);

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Mi cartera"
        descripcion={`${inmuebleActivo.inmueble.identificador} · saldo pendiente ${formatearMoneda(
          cartera.saldoTotal
        )}`}
      />

      {cartera.cuentas.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no tienes cuentas de cobro"
          descripcion="Cuando la administración genere las cuotas del periodo, aparecerán acá con su estado y sus pagos."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {cartera.cuentas.map((cuenta) => {
            const estaPagada = cuenta.estado === EstadoCuenta.PAGADA;

            return (
              <li key={cuenta.id}>
                <Tarjeta className="flex flex-col gap-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-zinc-900">
                        {formatearPeriodo(cuenta.periodo)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Vence {formatearFecha(cuenta.fechaLimitePago)}
                      </p>
                    </div>
                    <EstadoCuentaBadge estado={cuenta.estado} />
                  </div>

                  {/* Dos columnas en móvil y cuatro desde `sm`: cuatro cifras
                      en pesos no caben legibles en 375 px. */}
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
                    <Dato etiqueta="Recargos de mora">
                      <span className="tabular-nums">
                        {formatearMoneda(cuenta.recargosMora)}
                      </span>
                    </Dato>
                    <Dato etiqueta="Saldo pendiente">
                      <span className="font-semibold tabular-nums">
                        {estaPagada ? "—" : formatearMoneda(cuenta.saldoPendiente)}
                      </span>
                    </Dato>
                  </div>

                  {cuenta.pagos.length > 0 ? (
                    <div className="rounded-lg bg-zinc-50 p-3">
                      <p className="text-xs font-medium text-zinc-500">
                        Pagos registrados
                      </p>
                      <ul className="mt-1 flex flex-col gap-1">
                        {cuenta.pagos.map((pago) => (
                          <li
                            key={pago.id}
                            className="flex justify-between gap-2 text-xs text-zinc-600"
                          >
                            <span>
                              {formatearFecha(pago.fechaPago)} · {pago.metodo}
                            </span>
                            <span className="font-medium tabular-nums">
                              {formatearMoneda(pago.monto)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </Tarjeta>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-zinc-500">
        El saldo pendiente de cada cuota es el total facturado más los recargos
        de mora, menos los pagos que la administración ya registró. Si hiciste un
        pago que no aparece, radícalo por PQRS con el soporte.
      </p>
    </div>
  );
}
