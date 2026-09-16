import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EstadoPQRS, EstadoReserva } from "@prisma/client";
import { getAdministradorActual } from "@/lib/session";
import { getCopropiedadesDelAdministrador } from "@/lib/data/copropiedades";
import {
  getCopropiedadesConInmueblesParaPqrs,
  getPqrsDeAdministrador,
  getResumenPqrs,
} from "@/lib/data/pqrs";
import { getInmueblesDelAdministradorParaMarketplace } from "@/lib/data/propiedades";
import {
  getReservasDeAdministrador,
  getZonasComunesDeAdministrador,
} from "@/lib/data/reservas";
import {
  getCopropiedadesConInmueblesParaInvitar,
  getResidentesDeAdministrador,
} from "@/lib/data/residentes";
import { StatCard } from "@/components/dashboard/stat-card";
import { CrearPqrsForm } from "@/components/pqrs/crear-pqrs-form";
import { PqrsList } from "@/components/pqrs/pqrs-list";
import { ETIQUETAS_ESTADO_PQRS } from "@/components/pqrs/estado-pqrs-badge";
import { InmueblesAdminList } from "@/components/propiedades/inmuebles-admin-list";
import { CrearZonaComunForm } from "@/components/reservas/crear-zona-comun-form";
import { ZonasComunesList } from "@/components/reservas/zonas-comunes-list";
import { AgendaReservas } from "@/components/reservas/agenda-reservas";
import { ETIQUETAS_ESTADO_RESERVA } from "@/components/reservas/estado-reserva-badge";
import { InvitarResidenteForm } from "@/components/dashboard/invitar-residente-form";
import { ResidentesList } from "@/components/dashboard/residentes-list";

/**
 * Las 4 subpáginas del dashboard (pqrs, propiedades, reservas, residentes)
 * viven en una sola ruta dinámica en vez de 4 carpetas separadas: cada
 * carpeta propia era su propia Serverless Function en Vercel, y el plan
 * Hobby limita a 12 por deployment — con `/dashboard` y `/api/copiloto` ya
 * cargando el binario de onnxruntime-node (lo que les impide agruparse con
 * el resto de páginas), esas 4 rutas sueltas hacían que el total se pasara.
 */
const SECCIONES = ["pqrs", "propiedades", "reservas", "residentes"] as const;
type Seccion = (typeof SECCIONES)[number];

function esSeccionValida(valor: string): valor is Seccion {
  return (SECCIONES as readonly string[]).includes(valor);
}

const TITULOS: Record<Seccion, string> = {
  pqrs: "PQRS · Rentu",
  propiedades: "Propiedades · Rentu",
  reservas: "Reservas · Rentu",
  residentes: "Residentes · Rentu",
};

export async function generateMetadata(
  props: PageProps<"/dashboard/[section]">
): Promise<Metadata> {
  const { section } = await props.params;
  if (!esSeccionValida(section)) return {};
  return { title: TITULOS[section] };
}

function esEstadoPqrsValido(valor: string | undefined): valor is EstadoPQRS {
  return !!valor && (Object.values(EstadoPQRS) as string[]).includes(valor);
}

function esEstadoReservaValido(valor: string | undefined): valor is EstadoReserva {
  return !!valor && (Object.values(EstadoReserva) as string[]).includes(valor);
}

const FILTROS_PQRS = [
  { valor: undefined, etiqueta: "Todas" },
  { valor: EstadoPQRS.ABIERTO, etiqueta: ETIQUETAS_ESTADO_PQRS.ABIERTO },
  { valor: EstadoPQRS.EN_PROCESO, etiqueta: ETIQUETAS_ESTADO_PQRS.EN_PROCESO },
  { valor: EstadoPQRS.CERRADO, etiqueta: ETIQUETAS_ESTADO_PQRS.CERRADO },
] as const;

const FILTROS_RESERVA = [
  { valor: undefined, etiqueta: "Todas" },
  { valor: EstadoReserva.PENDIENTE, etiqueta: ETIQUETAS_ESTADO_RESERVA.PENDIENTE },
  { valor: EstadoReserva.CONFIRMADA, etiqueta: ETIQUETAS_ESTADO_RESERVA.CONFIRMADA },
  { valor: EstadoReserva.CANCELADA, etiqueta: ETIQUETAS_ESTADO_RESERVA.CANCELADA },
] as const;

export default async function DashboardSeccionPage(
  props: PageProps<"/dashboard/[section]">
) {
  const { section } = await props.params;
  if (!esSeccionValida(section)) notFound();

  const administrador = await getAdministradorActual();

  switch (section) {
    case "pqrs":
      return <SeccionPqrs administradorId={administrador.id} searchParams={await props.searchParams} />;
    case "propiedades":
      return <SeccionPropiedades administradorId={administrador.id} />;
    case "reservas":
      return <SeccionReservas administradorId={administrador.id} searchParams={await props.searchParams} />;
    case "residentes":
      return <SeccionResidentes administradorId={administrador.id} />;
  }
}

async function SeccionPqrs({
  administradorId,
  searchParams,
}: {
  administradorId: string;
  searchParams: Awaited<PageProps<"/dashboard/[section]">["searchParams"]>;
}) {
  const estadoParam = typeof searchParams.estado === "string" ? searchParams.estado : undefined;
  const estadoFiltro = esEstadoPqrsValido(estadoParam) ? estadoParam : undefined;

  const [resumen, pqrs, copropiedades] = await Promise.all([
    getResumenPqrs(administradorId),
    getPqrsDeAdministrador(administradorId, estadoFiltro),
    getCopropiedadesConInmueblesParaPqrs(administradorId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          PQRS y convivencia
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Peticiones, quejas, reclamos y sugerencias de tus copropiedades.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          etiqueta={ETIQUETAS_ESTADO_PQRS.ABIERTO}
          valor={String(resumen.ABIERTO)}
          tono={resumen.ABIERTO > 0 ? "alerta" : "positivo"}
        />
        <StatCard etiqueta={ETIQUETAS_ESTADO_PQRS.EN_PROCESO} valor={String(resumen.EN_PROCESO)} />
        <StatCard etiqueta={ETIQUETAS_ESTADO_PQRS.CERRADO} valor={String(resumen.CERRADO)} tono="positivo" />
      </div>

      <CrearPqrsForm copropiedades={copropiedades} />

      <section className="flex flex-col gap-4">
        <nav className="flex flex-wrap gap-2">
          {FILTROS_PQRS.map((filtro) => {
            const activo = filtro.valor === estadoFiltro;
            return (
              <Link
                key={filtro.etiqueta}
                href={filtro.valor ? `/dashboard/pqrs?estado=${filtro.valor}` : "/dashboard/pqrs"}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  activo
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {filtro.etiqueta}
              </Link>
            );
          })}
        </nav>

        <PqrsList items={pqrs} />
      </section>
    </div>
  );
}

async function SeccionPropiedades({ administradorId }: { administradorId: string }) {
  const inmuebles = await getInmueblesDelAdministradorParaMarketplace(administradorId);
  const publicados = inmuebles.filter((i) => i.disponibleArriendo).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Propiedades en el marketplace
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Gestiona qué inmuebles aparecen publicados en{" "}
            <Link href="/propiedades" className="text-brand-700 underline underline-offset-2">
              /propiedades
            </Link>
            .
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">
          {publicados} de {inmuebles.length} publicados
        </span>
      </div>

      <InmueblesAdminList inmuebles={inmuebles} />
    </div>
  );
}

async function SeccionReservas({
  administradorId,
  searchParams,
}: {
  administradorId: string;
  searchParams: Awaited<PageProps<"/dashboard/[section]">["searchParams"]>;
}) {
  const estadoParam = typeof searchParams.estado === "string" ? searchParams.estado : undefined;
  const estadoFiltro = esEstadoReservaValido(estadoParam) ? estadoParam : undefined;

  const [zonas, reservas, copropiedades] = await Promise.all([
    getZonasComunesDeAdministrador(administradorId),
    getReservasDeAdministrador(administradorId, estadoFiltro),
    getCopropiedadesDelAdministrador(administradorId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Reservas de zonas comunes
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Los residentes radican sus propias reservas desde su portal. Un inmueble con cuentas
          en mora no puede solicitar ni confirmar reservas.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Zonas comunes</h2>
        <ZonasComunesList zonas={zonas} />
        <CrearZonaComunForm
          copropiedades={copropiedades.map(({ id, nombre }) => ({ id, nombre }))}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Agenda</h2>
        <nav className="flex flex-wrap gap-2">
          {FILTROS_RESERVA.map((filtro) => {
            const activo = filtro.valor === estadoFiltro;
            return (
              <Link
                key={filtro.etiqueta}
                href={filtro.valor ? `/dashboard/reservas?estado=${filtro.valor}` : "/dashboard/reservas"}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  activo
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {filtro.etiqueta}
              </Link>
            );
          })}
        </nav>
        <AgendaReservas reservas={reservas} />
      </section>
    </div>
  );
}

async function SeccionResidentes({ administradorId }: { administradorId: string }) {
  const [copropiedades, residentes] = await Promise.all([
    getCopropiedadesConInmueblesParaInvitar(administradorId),
    getResidentesDeAdministrador(administradorId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Residentes
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Invita a propietarios e inquilinos para que puedan entrar a su propio portal.
        </p>
      </div>

      <InvitarResidenteForm copropiedades={copropiedades} />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Residentes vinculados
        </h2>
        <ResidentesList residentes={residentes} />
      </section>
    </div>
  );
}
