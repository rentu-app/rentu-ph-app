import Link from "next/link";
import { getResidenteActual } from "@/lib/session";
import { getCarteraDeResidente } from "@/lib/data/cartera-residente";
import {
  getReservasDeResidente,
  getZonasComunesDeCopropiedad,
} from "@/lib/data/reservas";
import { CrearReservaForm } from "@/components/portal/crear-reserva-form";
import { ReservasList } from "@/components/portal/reservas-list";
import {
  EncabezadoPagina,
  EstadoVacio,
  Seccion,
  Tarjeta,
} from "@/components/ui/primitivos";
import { formatearMoneda } from "@/lib/formatters";

export const metadata = {
  title: "Mis reservas · Rentu",
};

export default async function ReservasResidentePage() {
  const { inmuebleActivo } = await getResidenteActual();

  if (!inmuebleActivo) {
    return (
      <EstadoVacio
        titulo="No tienes una unidad vinculada"
        descripcion="Contacta a la administración de tu conjunto para que te vincule a tu apartamento."
      />
    );
  }

  const [zonas, reservas, cartera] = await Promise.all([
    getZonasComunesDeCopropiedad(inmuebleActivo.inmueble.copropiedad.id),
    getReservasDeResidente(inmuebleActivo.inmueble.id),
    getCarteraDeResidente(inmuebleActivo.inmueble.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Reservas"
        descripcion="Zonas comunes de tu conjunto. La administración confirma cada solicitud."
      />

      {/*
        El bloqueo se explica ANTES de que el residente llene el formulario, no
        como error después de enviarlo. El servidor lo revalida igual al
        radicar (`inmuebleNoEstaAPazYSalvo`): esto es la explicación, no el
        control de seguridad.
      */}
      {cartera.aPazYSalvo ? (
        <CrearReservaForm zonas={zonas} />
      ) : (
        <Tarjeta className="flex flex-col gap-2 border-amber-300 p-4 sm:p-5">
          <p className="font-semibold text-zinc-900">
            Por ahora no puedes radicar reservas
          </p>
          <p className="text-sm text-zinc-600">
            Tu unidad tiene cuotas vencidas por {formatearMoneda(cartera.saldoTotal)}
            , y el reglamento de la copropiedad pide estar a paz y salvo para
            usar las zonas comunes. No es una sanción: en cuanto la
            administración registre el pago, el formulario se habilita
            automáticamente.
          </p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/portal/cartera"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Ver mi cartera
            </Link>
            <Link
              href="/portal/pqrs"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Ya pagué, quiero avisar
            </Link>
          </div>
        </Tarjeta>
      )}

      <Seccion
        titulo="Mis solicitudes"
        descripcion="Una solicitud queda pendiente hasta que la administración la confirme."
      >
        <ReservasList reservas={reservas} />
      </Seccion>
    </div>
  );
}
