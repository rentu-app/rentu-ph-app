import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  CalendarPlus,
  FileStack,
  HardHat,
  MessageSquarePlus,
  UserPlus,
} from "lucide-react";
import {
  EstadoOrdenServicio,
  EstadoPQRS,
  EstadoReserva,
} from "@prisma/client";
import { getContextoAdministrador } from "@/lib/session";
import type { CopropiedadActiva } from "@/lib/data/copropiedad";
import {
  getDetalleUnidad,
  getResumenCartera,
  getUnidadesFiltradas,
} from "@/lib/data/cartera";
import {
  getPqrsDeCopropiedad,
  getResumenPqrs,
  getUnidadesConResidentes,
} from "@/lib/data/pqrs";
import { getReservasDeCopropiedad, getZonasComunes } from "@/lib/data/reservas";
import {
  getResidentesDeCopropiedad,
  getResidentesHistoricos,
  getUnidadesParaInvitar,
} from "@/lib/data/residentes";
import {
  getOrdenesServicio,
  getPqrsEscalables,
  getPrestadores,
} from "@/lib/data/prestadores";
import { getDocumentosPHDeCopropiedad } from "@/lib/data/documentos-ph";
import { KpisCartera } from "@/components/cartera/resumen-cartera";
import { UnidadesTabla } from "@/components/cartera/unidades-tabla";
import { UnidadDetalle } from "@/components/cartera/unidad-detalle";
import { CrearPqrsForm } from "@/components/pqrs/crear-pqrs-form";
import { PqrsList } from "@/components/pqrs/pqrs-list";
import { ETIQUETAS_ESTADO_PQRS } from "@/components/pqrs/estado-pqrs-badge";
import { ETIQUETAS_ESTADO_RESERVA } from "@/components/reservas/estado-reserva-badge";
import { CrearZonaComunForm } from "@/components/reservas/crear-zona-comun-form";
import { ZonasComunesList } from "@/components/reservas/zonas-comunes-list";
import { AgendaReservas } from "@/components/reservas/agenda-reservas";
import { InvitarResidenteForm } from "@/components/dashboard/invitar-residente-form";
import {
  ResidentesHistoricosList,
  ResidentesList,
} from "@/components/dashboard/residentes-list";
import { CrearPrestadorForm } from "@/components/prestadores/crear-prestador-form";
import { CrearOrdenForm } from "@/components/prestadores/crear-orden-form";
import {
  OrdenesServicioList,
  PrestadoresList,
} from "@/components/prestadores/prestadores-list";
import { SubirDocumentoForm } from "@/components/dashboard/subir-documento-form";
import { DocumentosPHList } from "@/components/dashboard/documentos-ph-list";
import { CopilotoChat } from "@/components/dashboard/copiloto-chat";
import { FormPanel } from "@/components/ui/form-panel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EncabezadoPagina,
  EstadoVacio,
  FilaFiltros,
  FiltroPill,
  Seccion,
} from "@/components/ui/primitivos";

/**
 * Las seis subpáginas del dashboard viven en una sola ruta dinámica en vez de
 * seis carpetas: cada carpeta propia sería su propia Serverless Function en
 * Vercel, y el plan Hobby limita a 12 por deployment. Acá además la sección
 * `documentos` es la que carga el binario de onnxruntime-node (embeddings del
 * Copiloto), así que `next.config.ts` acota el tracing a esta ruta.
 */
const SECCIONES = [
  "cartera",
  "reservas",
  "pqrs",
  "residentes",
  "prestadores",
  "documentos",
] as const;
type Seccion = (typeof SECCIONES)[number];

function esSeccionValida(valor: string): valor is Seccion {
  return (SECCIONES as readonly string[]).includes(valor);
}

const TITULOS: Record<Seccion, string> = {
  cartera: "Cartera · Rentu",
  reservas: "Reservas · Rentu",
  pqrs: "PQRS · Rentu",
  residentes: "Residentes · Rentu",
  prestadores: "Prestadores · Rentu",
  documentos: "Documentos y Copiloto · Rentu",
};

export async function generateMetadata(
  props: PageProps<"/dashboard/[section]">
): Promise<Metadata> {
  const { section } = await props.params;
  if (!esSeccionValida(section)) return {};
  return { title: TITULOS[section] };
}

type SearchParams = Awaited<PageProps<"/dashboard/[section]">["searchParams"]>;

function leerParam(searchParams: SearchParams, clave: string): string | undefined {
  const valor = searchParams[clave];
  return typeof valor === "string" && valor.length > 0 ? valor : undefined;
}

export default async function DashboardSeccionPage(
  props: PageProps<"/dashboard/[section]">
) {
  const { section } = await props.params;
  if (!esSeccionValida(section)) notFound();

  const { copropiedad } = await getContextoAdministrador();
  const searchParams = await props.searchParams;

  if (!copropiedad) {
    return (
      <EstadoVacio
        titulo="Todavía no tienes una copropiedad asignada"
        descripcion="Pídele a quien administra Rentu que te asigne la copropiedad que vas a gestionar."
      />
    );
  }

  switch (section) {
    case "cartera":
      return <SeccionCartera copropiedad={copropiedad} searchParams={searchParams} />;
    case "reservas":
      return <SeccionReservas copropiedad={copropiedad} searchParams={searchParams} />;
    case "pqrs":
      return <SeccionPqrs copropiedad={copropiedad} searchParams={searchParams} />;
    case "residentes":
      return <SeccionResidentes copropiedad={copropiedad} />;
    case "prestadores":
      return <SeccionPrestadores copropiedad={copropiedad} />;
    case "documentos":
      return <SeccionDocumentos copropiedad={copropiedad} />;
  }
}

// ----------------------------------- CARTERA --------------------------------

const SITUACIONES = [
  { valor: undefined, etiqueta: "Todas" },
  { valor: "con-saldo", etiqueta: "Con saldo" },
  { valor: "en-mora", etiqueta: "En mora" },
  { valor: "al-dia", etiqueta: "Al día" },
] as const;

/**
 * La cartera y el detalle de una unidad comparten ruta: `?unidad=<id>` abre
 * el detalle como página completa (en 375 px un panel lateral acaba tapando
 * todo igual, y como página el enlace se puede compartir y el botón "atrás"
 * del teléfono funciona). Los filtros viven en la URL, así que no hay estado
 * en el cliente y cada vista es enlazable.
 */
async function SeccionCartera({
  copropiedad,
  searchParams,
}: {
  copropiedad: CopropiedadActiva;
  searchParams: SearchParams;
}) {
  const unidadId = leerParam(searchParams, "unidad");
  const torre = leerParam(searchParams, "torre");
  const situacionParam = leerParam(searchParams, "situacion");
  const situacion = SITUACIONES.some((item) => item.valor === situacionParam)
    ? situacionParam
    : undefined;

  const parametrosLista = new URLSearchParams();
  if (torre) parametrosLista.set("torre", torre);
  if (situacion) parametrosLista.set("situacion", situacion);
  const sufijoLista = parametrosLista.toString();
  const hrefLista = `/dashboard/cartera${sufijoLista ? `?${sufijoLista}` : ""}`;

  if (unidadId) {
    const unidad = await getDetalleUnidad(copropiedad.id, unidadId);
    if (!unidad) notFound();
    return <UnidadDetalle unidad={unidad} hrefVolver={hrefLista} />;
  }

  function hrefCon(cambios: { torre?: string; situacion?: string }) {
    const parametros = new URLSearchParams();
    const torreFinal = "torre" in cambios ? cambios.torre : torre;
    const situacionFinal = "situacion" in cambios ? cambios.situacion : situacion;
    if (torreFinal) parametros.set("torre", torreFinal);
    if (situacionFinal) parametros.set("situacion", situacionFinal);
    const sufijo = parametros.toString();
    return `/dashboard/cartera${sufijo ? `?${sufijo}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Cartera"
        descripcion="Saldo, mora y etapa de gestión de cada unidad. Abre una para ver su historial y registrar lo que hiciste."
      />

      <Suspense fallback={<Skeleton className="h-28" />}>
        <KpisDeCartera copropiedadId={copropiedad.id} />
      </Suspense>

      <div className="flex flex-col gap-3">
        <FilaFiltros etiquetaAccesible="Filtrar por torre">
          <FiltroPill href={hrefCon({ torre: undefined })} activo={!torre}>
            Todas las torres
          </FiltroPill>
          {copropiedad.torres.map((item) => (
            <FiltroPill
              key={item.nombre}
              href={hrefCon({ torre: item.nombre })}
              activo={torre === item.nombre}
            >
              {item.nombre} ({item.unidades})
            </FiltroPill>
          ))}
        </FilaFiltros>

        <FilaFiltros etiquetaAccesible="Filtrar por situación de cartera">
          {SITUACIONES.map((item) => (
            <FiltroPill
              key={item.etiqueta}
              href={hrefCon({ situacion: item.valor })}
              activo={situacion === item.valor}
            >
              {item.etiqueta}
            </FiltroPill>
          ))}
        </FilaFiltros>
      </div>

      <Suspense fallback={<Skeleton className="h-64" />}>
        <ListaUnidades
          copropiedadId={copropiedad.id}
          torre={torre}
          situacion={situacion}
          sufijoLista={sufijoLista}
        />
      </Suspense>
    </div>
  );
}

async function KpisDeCartera({ copropiedadId }: { copropiedadId: string }) {
  const resumen = await getResumenCartera(copropiedadId);
  return <KpisCartera resumen={resumen} />;
}

async function ListaUnidades({
  copropiedadId,
  torre,
  situacion,
  sufijoLista,
}: {
  copropiedadId: string;
  torre?: string;
  situacion?: string;
  sufijoLista: string;
}) {
  const unidades = await getUnidadesFiltradas(copropiedadId, { torre, situacion });

  return (
    <Seccion
      titulo={`${unidades.length} unidad(es)`}
      descripcion="Ordenadas por saldo pendiente."
    >
      <UnidadesTabla
        unidades={unidades}
        hrefDe={(id) =>
          `/dashboard/cartera?unidad=${id}${sufijoLista ? `&${sufijoLista}` : ""}`
        }
      />
    </Seccion>
  );
}

// ---------------------------------- RESERVAS --------------------------------

const FILTROS_RESERVA = [
  { valor: undefined, etiqueta: "Todas" },
  { valor: EstadoReserva.PENDIENTE, etiqueta: ETIQUETAS_ESTADO_RESERVA.PENDIENTE },
  { valor: EstadoReserva.CONFIRMADA, etiqueta: ETIQUETAS_ESTADO_RESERVA.CONFIRMADA },
  { valor: EstadoReserva.CANCELADA, etiqueta: ETIQUETAS_ESTADO_RESERVA.CANCELADA },
] as const;

async function SeccionReservas({
  copropiedad,
  searchParams,
}: {
  copropiedad: CopropiedadActiva;
  searchParams: SearchParams;
}) {
  const estadoParam = leerParam(searchParams, "estado");
  const estadoFiltro = (Object.values(EstadoReserva) as string[]).includes(
    estadoParam ?? ""
  )
    ? (estadoParam as EstadoReserva)
    : undefined;

  const [zonas, reservas] = await Promise.all([
    getZonasComunes(copropiedad.id),
    getReservasDeCopropiedad(copropiedad.id, estadoFiltro),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina
        titulo="Reservas de zonas comunes"
        descripcion="Los residentes radican desde su portal. Una unidad con cuotas vencidas o en mora no puede radicar ni confirmar reservas hasta ponerse a paz y salvo."
        accion={
          <FormPanel
            triggerLabel="Nueva zona común"
            title="Crear zona común"
            description="ej. Salón social, zona BBQ, cancha múltiple."
            icon={<CalendarPlus className="h-4 w-4" />}
            variant="accent"
          >
            <CrearZonaComunForm />
          </FormPanel>
        }
      />

      <Seccion titulo="Zonas comunes">
        <ZonasComunesList zonas={zonas} />
      </Seccion>

      <Seccion
        titulo="Agenda"
        descripcion="Confirmar una reserva vuelve a validar la cartera y el cruce de horario en el servidor."
      >
        <FilaFiltros etiquetaAccesible="Filtrar reservas por estado">
          {FILTROS_RESERVA.map((filtro) => (
            <FiltroPill
              key={filtro.etiqueta}
              href={
                filtro.valor
                  ? `/dashboard/reservas?estado=${filtro.valor}`
                  : "/dashboard/reservas"
              }
              activo={filtro.valor === estadoFiltro}
            >
              {filtro.etiqueta}
            </FiltroPill>
          ))}
        </FilaFiltros>
        <AgendaReservas reservas={reservas} />
      </Seccion>
    </div>
  );
}

// ------------------------------------ PQRS ----------------------------------

const FILTROS_PQRS = [
  { valor: undefined, etiqueta: "Todas" },
  { valor: EstadoPQRS.ABIERTO, etiqueta: ETIQUETAS_ESTADO_PQRS.ABIERTO },
  { valor: EstadoPQRS.EN_PROCESO, etiqueta: ETIQUETAS_ESTADO_PQRS.EN_PROCESO },
  { valor: EstadoPQRS.CERRADO, etiqueta: ETIQUETAS_ESTADO_PQRS.CERRADO },
] as const;

async function SeccionPqrs({
  copropiedad,
  searchParams,
}: {
  copropiedad: CopropiedadActiva;
  searchParams: SearchParams;
}) {
  const estadoParam = leerParam(searchParams, "estado");
  const estadoFiltro = (Object.values(EstadoPQRS) as string[]).includes(
    estadoParam ?? ""
  )
    ? (estadoParam as EstadoPQRS)
    : undefined;

  const [resumen, pqrs, unidades, prestadores] = await Promise.all([
    getResumenPqrs(copropiedad.id),
    getPqrsDeCopropiedad(copropiedad.id, estadoFiltro),
    getUnidadesConResidentes(copropiedad.id),
    getPrestadores(copropiedad.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="PQRS y convivencia"
        descripcion={`${resumen.total} radicadas en total · ${resumen.ABIERTO} pendientes · ${resumen.EN_PROCESO} en gestión.`}
        accion={
          <FormPanel
            triggerLabel="Radicar PQRS"
            title="Radicar PQRS"
            description="Registra una petición, queja, reclamo o sugerencia dirigida a un residente."
            icon={<MessageSquarePlus className="h-4 w-4" />}
          >
            <CrearPqrsForm unidades={unidades} />
          </FormPanel>
        }
      />

      <FilaFiltros etiquetaAccesible="Filtrar PQRS por estado">
        {FILTROS_PQRS.map((filtro) => (
          <FiltroPill
            key={filtro.etiqueta}
            href={
              filtro.valor ? `/dashboard/pqrs?estado=${filtro.valor}` : "/dashboard/pqrs"
            }
            activo={filtro.valor === estadoFiltro}
          >
            {filtro.etiqueta}
          </FiltroPill>
        ))}
      </FilaFiltros>

      <PqrsList items={pqrs} prestadores={prestadores} />
    </div>
  );
}

// --------------------------------- RESIDENTES -------------------------------

async function SeccionResidentes({
  copropiedad,
}: {
  copropiedad: CopropiedadActiva;
}) {
  const [residentes, historicos, unidades] = await Promise.all([
    getResidentesDeCopropiedad(copropiedad.id),
    getResidentesHistoricos(copropiedad.id),
    getUnidadesParaInvitar(copropiedad.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina
        titulo="Residentes"
        descripcion="Propietarios e inquilinos con acceso a su portal. La cartera pertenece a la unidad, no a la persona."
        accion={
          <FormPanel
            triggerLabel="Invitar residente"
            title="Invitar residente"
            description="Le crea acceso a su portal y lo vincula a una unidad."
            icon={<UserPlus className="h-4 w-4" />}
          >
            <InvitarResidenteForm unidades={unidades} />
          </FormPanel>
        }
      />

      <Seccion titulo={`Vinculados (${residentes.length})`}>
        <ResidentesList residentes={residentes} />
      </Seccion>

      <Seccion
        titulo="Historial de vínculos"
        descripcion="Vínculos revocados. Nunca se borran: son parte de la trazabilidad de la unidad."
      >
        <ResidentesHistoricosList residentes={historicos} />
      </Seccion>
    </div>
  );
}

// --------------------------------- PRESTADORES ------------------------------

async function SeccionPrestadores({
  copropiedad,
}: {
  copropiedad: CopropiedadActiva;
}) {
  const [prestadores, ordenes, pqrsEscalables] = await Promise.all([
    getPrestadores(copropiedad.id),
    getOrdenesServicio(copropiedad.id),
    getPqrsEscalables(copropiedad.id),
  ]);

  const abiertas = ordenes.filter(
    (orden) =>
      orden.estado === EstadoOrdenServicio.ABIERTA ||
      orden.estado === EstadoOrdenServicio.EN_PROCESO
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina
        titulo="Prestadores y órdenes"
        descripcion="Seguridad, aseo, jardinería, mantenimiento y obra. En este MVP los prestadores no inician sesión: sus datos y sus órdenes las administras tú."
        accion={
          <div className="flex flex-col gap-2 sm:flex-row">
            <FormPanel
              triggerLabel="Agregar prestador"
              title="Agregar prestador al directorio"
              description="Queda disponible para asignarle órdenes de servicio."
              icon={<HardHat className="h-4 w-4" />}
            >
              <CrearPrestadorForm />
            </FormPanel>
            <FormPanel
              triggerLabel="Nueva orden"
              title="Crear orden de servicio"
              description="Deja por escrito qué se le pidió a un prestador. Puedes vincularla a una PQRS de mantenimiento."
              icon={<HardHat className="h-4 w-4" />}
              variant="accent"
            >
              <CrearOrdenForm
                prestadores={prestadores}
                pqrsDisponibles={pqrsEscalables}
              />
            </FormPanel>
          </div>
        }
      />

      <Seccion titulo={`Directorio (${prestadores.length})`}>
        <PrestadoresList prestadores={prestadores} />
      </Seccion>

      <Seccion
        titulo={`Órdenes de servicio (${abiertas} abiertas)`}
        descripcion="El costo estimado es una referencia de presupuesto: Rentu no hace pagos, conciliación ni contabilidad."
      >
        <OrdenesServicioList ordenes={ordenes} />
      </Seccion>
    </div>
  );
}

// --------------------------------- DOCUMENTOS -------------------------------

async function SeccionDocumentos({
  copropiedad,
}: {
  copropiedad: CopropiedadActiva;
}) {
  const documentos = await getDocumentosPHDeCopropiedad(copropiedad.id);

  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina
        titulo="Documentos y Copiloto"
        descripcion="Reglamento, manual de convivencia y actas indexados para consultarlos en lenguaje natural."
        accion={
          <FormPanel
            triggerLabel="Indexar documento"
            title="Indexar documento de la copropiedad"
            description="Se trocea el texto y se generan embeddings con un modelo local (sin costo por consulta)."
            icon={<FileStack className="h-4 w-4" />}
          >
            <SubirDocumentoForm />
          </FormPanel>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Seccion titulo={`Documentos indexados (${documentos.length})`}>
          <DocumentosPHList documentos={documentos} />
        </Seccion>

        <CopilotoChat
          copropiedadId={copropiedad.id}
          nombreCopropiedad={copropiedad.nombre}
          tieneDocumentos={documentos.length > 0}
        />
      </div>
    </div>
  );
}
