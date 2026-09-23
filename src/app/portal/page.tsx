import Link from "next/link";
import { EstadoPQRS, EstadoReserva } from "@prisma/client";
import { CalendarClock, CheckCircle2, MessagesSquare, Wallet } from "lucide-react";
import { getResidenteActual } from "@/lib/session";
import { getCarteraDeResidente } from "@/lib/data/cartera-residente";
import { getPqrsDeResidente } from "@/lib/data/pqrs";
import { getReservasDeResidente } from "@/lib/data/reservas";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  EncabezadoPagina,
  EstadoVacio,
  Tarjeta,
} from "@/components/ui/primitivos";
import { formatearMoneda } from "@/lib/formatters";

export const metadata = {
  title: "Mi portal · Rentu",
};

export default async function PortalHomePage() {
  const { usuario, inmuebleActivo } = await getResidenteActual();

  if (!inmuebleActivo) {
    return (
      <EstadoVacio
        titulo="No tienes una unidad vinculada"
        descripcion="Contacta a la administración de tu conjunto para que te vincule a tu apartamento."
      />
    );
  }

  const [cartera, pqrs, reservas] = await Promise.all([
    getCarteraDeResidente(inmuebleActivo.inmueble.id),
    getPqrsDeResidente(usuario.id, inmuebleActivo.inmueble.id),
    getReservasDeResidente(inmuebleActivo.inmueble.id),
  ]);

  const pqrsAbiertas = pqrs.filter((item) => item.estado !== EstadoPQRS.CERRADO).length;
  const ahora = new Date();
  const proximasReservas = reservas.filter(
    (reserva) =>
      reserva.estado !== EstadoReserva.CANCELADA &&
      new Date(reserva.fechaInicio) > ahora
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo={`Hola, ${usuario.nombre.split(" ")[0]}`}
        descripcion={`${inmuebleActivo.inmueble.identificador} · ${inmuebleActivo.inmueble.copropiedad.nombre}`}
      />

      {/*
        La tarjeta de paz y salvo va primero y siempre visible: es la
        información que le evita al residente intentar reservar y chocarse con
        un bloqueo que no entiende. Explica la razón y el camino de salida,
        sin lenguaje de cobranza.
      */}
      <Tarjeta
        className={`flex flex-col gap-2 p-4 sm:p-5 ${
          cartera.aPazYSalvo ? "border-emerald-200" : "border-amber-300"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              cartera.aPazYSalvo
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {cartera.aPazYSalvo ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Wallet className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900">
              {cartera.aPazYSalvo
                ? "Estás a paz y salvo"
                : "Tienes cuotas vencidas"}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              {cartera.aPazYSalvo
                ? "Puedes reservar zonas comunes sin restricción. Solo se valida que el horario esté libre."
                : "Mientras haya cuotas vencidas no puedes reservar zonas comunes: es la regla del reglamento de la copropiedad. En cuanto la administración registre el pago, la reserva se habilita sola."}
            </p>
            {!cartera.aPazYSalvo ? (
              <p className="mt-2 text-sm text-zinc-600">
                Si ya pagaste o tienes un acuerdo con la administración,{" "}
                <Link
                  href="/portal/pqrs"
                  className="font-medium text-brand-700 hover:underline"
                >
                  radica una PQRS
                </Link>{" "}
                con el soporte y lo revisan.
              </p>
            ) : null}
          </div>
        </div>
      </Tarjeta>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          etiqueta="Saldo pendiente"
          valor={formatearMoneda(cartera.saldoTotal)}
          detalle={
            cartera.saldoTotal > 0
              ? "Incluye recargos de mora si aplican"
              : "Sin saldo pendiente"
          }
          tono={cartera.saldoTotal > 0 ? "alerta" : "positivo"}
          icono={Wallet}
        />
        <StatCard
          etiqueta="PQRS sin cerrar"
          valor={String(pqrsAbiertas)}
          tono={pqrsAbiertas > 0 ? "alerta" : "positivo"}
          icono={MessagesSquare}
        />
        <StatCard
          etiqueta="Próximas reservas"
          valor={String(proximasReservas)}
          icono={CalendarClock}
        />
      </div>
    </div>
  );
}
