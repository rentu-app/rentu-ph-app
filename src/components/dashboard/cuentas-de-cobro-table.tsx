import type { ReactNode } from "react";
import { EstadoCuenta } from "@prisma/client";
import {
  calcularSaldoPendiente,
  type CuentaDeCobroReciente,
} from "@/lib/data/cuentas-cobro";
import { EstadoCuentaBadge } from "@/components/dashboard/estado-badge";
import { RegistrarPagoForm } from "@/components/dashboard/registrar-pago-form";
import { formatearFecha, formatearMoneda, formatearPeriodo } from "@/lib/formatters";
import { FadeIn } from "@/components/ui/motion";

export function CuentasDeCobroTable({
  cuentas,
}: {
  cuentas: CuentaDeCobroReciente[];
}) {
  if (cuentas.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No hay cuentas de cobro registradas todavía.
      </p>
    );
  }

  return (
    <FadeIn className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-900/60">
          <tr>
            <Th>Inmueble</Th>
            <Th>Copropiedad</Th>
            <Th>Periodo</Th>
            <Th className="text-right">Total a pagar</Th>
            <Th className="text-right">Saldo pendiente</Th>
            <Th>Vence</Th>
            <Th>Estado</Th>
            <Th>Acciones</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
          {cuentas.map((cuenta) => {
            const recargoActivo = cuenta.recargosMora.find(
              (recargo) => !recargo.congelado
            );
            const saldoPendiente = calcularSaldoPendiente(cuenta);
            const estaPagada = cuenta.estado === EstadoCuenta.PAGADA;

            return (
              <tr key={cuenta.id}>
                <Td className="font-medium text-zinc-900 dark:text-zinc-50">
                  {cuenta.inmueble.identificador}
                </Td>
                <Td className="text-zinc-500 dark:text-zinc-400">
                  {cuenta.inmueble.copropiedad.nombre}
                </Td>
                <Td>{formatearPeriodo(cuenta.periodo)}</Td>
                <Td className="text-right tabular-nums">
                  {formatearMoneda(cuenta.totalAPagar)}
                  {recargoActivo ? (
                    <span className="ml-1 text-xs text-red-500">
                      +{formatearMoneda(recargoActivo.monto)} mora
                    </span>
                  ) : null}
                </Td>
                <Td className="text-right font-medium tabular-nums">
                  {estaPagada ? "—" : formatearMoneda(saldoPendiente)}
                </Td>
                <Td>{formatearFecha(cuenta.fechaLimitePago)}</Td>
                <Td>
                  <EstadoCuentaBadge estado={cuenta.estado} />
                </Td>
                <Td>
                  {estaPagada ? (
                    <span className="text-xs text-zinc-400">—</span>
                  ) : (
                    <RegistrarPagoForm
                      cuentaDeCobroId={cuenta.id}
                      saldoPendiente={saldoPendiente.toFixed(2)}
                    />
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </FadeIn>
  );
}

function Th({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 ${className}`}>
      {children}
    </td>
  );
}
