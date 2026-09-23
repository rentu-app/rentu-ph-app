import { Suspense } from "react";
import Link from "next/link";
import {
  CalendarClock,
  FileUp,
  MessagesSquare,
  ReceiptText,
} from "lucide-react";
import { EstadoPQRS, EstadoReserva } from "@prisma/client";
import { getContextoAdministrador } from "@/lib/session";
import {
  getCarteraPorTorre,
  getResumenCartera,
  getUnidadesPrioritarias,
} from "@/lib/data/cartera";
import { getResumenPqrs } from "@/lib/data/pqrs";
import { getReservasDeCopropiedad } from "@/lib/data/reservas";
import {
  AntiguedadCartera,
  CarteraPorTorre,
  KpisCartera,
} from "@/components/cartera/resumen-cartera";
import { UnidadesPrioritarias } from "@/components/cartera/unidades-tabla";
import { GenerarCuentasForm } from "@/components/dashboard/generar-cuentas-form";
import { ImportarUnidadesForm } from "@/components/cartera/importar-unidades-form";
import { FormPanel } from "@/components/ui/form-panel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EncabezadoPagina,
  EstadoVacio,
  Seccion,
  Tarjeta,
} from "@/components/ui/primitivos";
import { formatearPeriodo } from "@/lib/formatters";

export const metadata = {
  title: "Resumen de cartera · Rentu",
};

/**
 * Pantalla de entrada del administrador.
 *
 * Una sola pregunta la organiza: ¿cómo está la cartera de esta copropiedad
 * hoy? Primero las cifras del periodo, después de dónde viene la mora
 * (antigüedad y torre), después qué unidades hay que llamar, y al final lo
 * pendiente de convivencia (reservas por aprobar y PQRS abiertas), que apoya
 * la historia sin competir con ella.
 *
 * Los bloques van en `<Suspense>` separados para que las cifras aparezcan en
 * cuanto estén listas sin esperar al resto; dentro de cada bloque las
 * consultas van en paralelo con `Promise.all`.
 */
export default async function DashboardPage() {
  const { administrador, copropiedad } = await getContextoAdministrador();

  if (!copropiedad) {
    return (
      <EstadoVacio
        titulo="Todavía no tienes una copropiedad asignada"
        descripcion="Pídele a quien administra Rentu que te asigne la copropiedad que vas a gestionar. Sin eso no hay cartera que mostrar."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina
        titulo={`Hola, ${administrador.nombre.split(" ")[0]}`}
        descripcion={`Estado de la cartera de ${copropiedad.nombre}.`}
        accion={
          <div className="flex flex-col gap-2 sm:flex-row">
            <FormPanel
              triggerLabel="Generar cuentas"
              title="Generar cuentas de cobro del periodo"
              description="Crea una cuenta por cada unidad activa, repartiendo el total de administración según el coeficiente y arrastrando el saldo pendiente."
              icon={<ReceiptText className="h-4 w-4" />}
            >
              <GenerarCuentasForm totalUnidades={copropiedad.totalUnidades} />
            </FormPanel>
            <FormPanel
              triggerLabel="Importar unidades"
              title="Importar unidades desde CSV"
              description="Carga el padrón de apartamentos con su torre y coeficiente. Primero se valida y se muestra la vista previa; nada se guarda hasta que confirmes."
              icon={<FileUp className="h-4 w-4" />}
              variant="accent"
            >
              <ImportarUnidadesForm />
            </FormPanel>
          </div>
        }
      />

      <Suspense fallback={<EsqueletoKpis />}>
        <BloqueCartera copropiedadId={copropiedad.id} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-48" />}>
        <BloqueGestion copropiedadId={copropiedad.id} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-32" />}>
        <BloquePendientes copropiedadId={copropiedad.id} />
      </Suspense>
    </div>
  );
}

async function BloqueCartera({ copropiedadId }: { copropiedadId: string }) {
  const [resumen, torres] = await Promise.all([
    getResumenCartera(copropiedadId),
    getCarteraPorTorre(copropiedadId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <KpisCartera resumen={resumen} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AntiguedadCartera resumen={resumen} />
        <CarteraPorTorre torres={torres} />
      </div>
      <p className="text-xs text-zinc-500">
        Cifras del periodo {formatearPeriodo(resumen.periodoVigente)}. El saldo
        de cada unidad es total facturado + recargos de mora − pagos
        registrados.
      </p>
    </div>
  );
}

async function BloqueGestion({ copropiedadId }: { copropiedadId: string }) {
  const unidades = await getUnidadesPrioritarias(copropiedadId, 6);

  return (
    <Seccion
      titulo="Unidades para gestionar hoy"
      descripcion="Ordenadas por saldo vencido. Abre una para ver su historial y registrar la gestión."
      accion={
        <Link
          href="/dashboard/cartera"
          className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700 hover:underline"
        >
          Ver toda la cartera
        </Link>
      }
    >
      <UnidadesPrioritarias
        unidades={unidades}
        hrefDe={(id) => `/dashboard/cartera?unidad=${id}`}
      />
    </Seccion>
  );
}

async function BloquePendientes({ copropiedadId }: { copropiedadId: string }) {
  const [reservasPendientes, resumenPqrs] = await Promise.all([
    getReservasDeCopropiedad(copropiedadId, EstadoReserva.PENDIENTE),
    getResumenPqrs(copropiedadId),
  ]);

  const pqrsAbiertas = resumenPqrs[EstadoPQRS.ABIERTO];
  const pqrsEnProceso = resumenPqrs[EstadoPQRS.EN_PROCESO];

  return (
    <Seccion
      titulo="Pendientes de convivencia"
      descripcion="Lo que espera una decisión tuya fuera de la cartera."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Tarjeta className="flex flex-col gap-2 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <CalendarClock className="h-4 w-4" />
            Reservas por aprobar
          </div>
          <p className="text-2xl font-semibold tabular-nums text-zinc-900">
            {reservasPendientes.length}
          </p>
          <p className="text-sm text-zinc-500">
            {reservasPendientes.length === 0
              ? "No hay solicitudes esperando respuesta."
              : `${reservasPendientes[0].inmueble.identificador} y ${
                  reservasPendientes.length - 1
                } más.`}
          </p>
          <Link
            href="/dashboard/reservas?estado=PENDIENTE"
            className="mt-auto inline-flex min-h-11 items-center text-sm font-medium text-brand-700 hover:underline"
          >
            Revisar reservas
          </Link>
        </Tarjeta>

        <Tarjeta className="flex flex-col gap-2 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <MessagesSquare className="h-4 w-4" />
            PQRS sin cerrar
          </div>
          <p className="text-2xl font-semibold tabular-nums text-zinc-900">
            {pqrsAbiertas + pqrsEnProceso}
          </p>
          <p className="text-sm text-zinc-500">
            {pqrsAbiertas} sin abrir · {pqrsEnProceso} en proceso
          </p>
          <Link
            href="/dashboard/pqrs?estado=ABIERTO"
            className="mt-auto inline-flex min-h-11 items-center text-sm font-medium text-brand-700 hover:underline"
          >
            Revisar PQRS
          </Link>
        </Tarjeta>
      </div>
    </Seccion>
  );
}

function EsqueletoKpis() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}
