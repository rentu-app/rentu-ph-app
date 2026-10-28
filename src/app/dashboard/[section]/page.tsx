import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { cerrarSesion } from "@/lib/actions/auth";
import {
  CalendarPlus,
  Download,
  FileStack,
  LogOut,
  HardHat,
  MessageSquarePlus,
  UserPlus,
} from "lucide-react";
import {
  EstadoOrdenServicio,
  EstadoPQRS,
  EstadoReserva,
} from "@prisma/client";
import { esCuentaDemo } from "@/lib/demo";
import { EliminarCuenta } from "@/components/dashboard/eliminar-cuenta";
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
import { getUnidadesDeCopropiedad } from "@/lib/data/unidades";
import { getDocumentosPHDeCopropiedad } from "@/lib/data/documentos-ph";
import { UnidadForm } from "@/components/unidades/unidad-form";
import { AccionesUnidad } from "@/components/unidades/acciones-unidad";
import { SumaCoeficientes } from "@/components/unidades/suma-coeficientes";
import { ImportarUnidadesForm } from "@/components/cartera/importar-unidades-form";
import { ETIQUETAS_ESTADO_INMUEBLE } from "@/lib/validations/unidades";
import { FILA_CSV_ESPERADA } from "@/lib/validations/cartera";
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
  Etiqueta,
  FiltroPill,
  Seccion,
  TablaScroll,
  Tarjeta,
  Td,
  Th,
} from "@/components/ui/primitivos";
import { etiquetaTorre, TORRE_VACIA_PARAM } from "@/lib/formatters";

/**
 * Las subpáginas del dashboard viven en una sola ruta dinámica en vez de
 * seis carpetas: cada carpeta propia sería su propia Serverless Function en
 * Vercel, y el plan Hobby limita a 12 por deployment. Acá además la sección
 * `documentos` es la que carga el binario de onnxruntime-node (embeddings del
 * Copiloto), así que `next.config.ts` acota el tracing a esta ruta.
 */
const SECCIONES = [
  "cartera",
  "unidades",
  "reservas",
  "pqrs",
  "residentes",
  "prestadores",
  "documentos",
  "cuenta",
] as const;
type Seccion = (typeof SECCIONES)[number];

function esSeccionValida(valor: string): valor is Seccion {
  return (SECCIONES as readonly string[]).includes(valor);
}

const TITULOS: Record<Seccion, string> = {
  cartera: "Cartera · Rentu",
  unidades: "Unidades · Rentu",
  reservas: "Reservas · Rentu",
  pqrs: "PQRS · Rentu",
  residentes: "Residentes · Rentu",
  prestadores: "Prestadores · Rentu",
  documentos: "Documentos y Copiloto · Rentu",
  cuenta: "Cuenta · Rentu",
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
  // La sección se llamaba "configuracion": se conservan los enlaces viejos.
  if (section === "configuracion") redirect("/dashboard/cuenta");
  if (!esSeccionValida(section)) notFound();

  const { administrador, copropiedad } = await getContextoAdministrador();
  const searchParams = await props.searchParams;

  // Cuenta es de la persona, no de una copropiedad: se muestra aunque no haya una activa.
  if (section === "cuenta") {
    return (
      <div className="flex flex-col gap-8">
        <EncabezadoPagina titulo="Cuenta" descripcion="Tu acceso a Rentu." />
        <Tarjeta className="flex flex-col gap-1 p-5">
          <p className="text-sm font-semibold text-zinc-900">{administrador.nombre}</p>
          <p className="text-sm text-zinc-500">{administrador.email}</p>
          <form action={cerrarSesion} className="mt-3">
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 sm:w-auto"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </form>
        </Tarjeta>
        <Tarjeta className="flex flex-col gap-3 border-red-200 p-5">
          <div>
            <h2 className="text-base font-semibold text-red-700">Eliminar mi cuenta</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Cierra tu acceso y elimina las copropiedades que solo tú administras. Podrás volver a
              registrarte con el mismo correo.
            </p>
          </div>
          <div>
            <EliminarCuenta email={administrador.email} esDemo={esCuentaDemo(administrador.email)} />
          </div>
        </Tarjeta>
      </div>
    );
  }

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
    case "unidades":
      return <SeccionUnidades copropiedad={copropiedad} />;
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
  // "sin-torre" en la URL = unidades con torre "" (el filtro vacío ya significa "todas").
  const torreFiltro = torre === TORRE_VACIA_PARAM ? "" : torre;
  const hayTorres = !(copropiedad.torres.length === 1 && copropiedad.torres[0].nombre === "");
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
        {hayTorres ? (
          <FilaFiltros etiquetaAccesible="Filtrar por torre">
            <FiltroPill href={hrefCon({ torre: undefined })} activo={!torre}>
              Todas las torres
            </FiltroPill>
            {copropiedad.torres.map((item) => {
              const valor = item.nombre === "" ? TORRE_VACIA_PARAM : item.nombre;
              return (
                <FiltroPill
                  key={valor}
                  href={hrefCon({ torre: valor })}
                  activo={torre === valor}
                >
                  {etiquetaTorre(item.nombre)} ({item.unidades})
                </FiltroPill>
              );
            })}
          </FilaFiltros>
        ) : null}

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
          torre={torreFiltro}
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

// ---------------------------------- UNIDADES --------------------------------

const PLANTILLA_CSV = `${FILA_CSV_ESPERADA}\nApto 101,Torre 1,4.167,72.50\nApto 102,Torre 1,4.167,72.50\nApto 201,Torre 2,4.167,68.00\n`;
const HREF_PLANTILLA = `data:text/csv;charset=utf-8,${encodeURIComponent(PLANTILLA_CSV)}`;

/**
 * Alta de unidades por dos caminos que escriben lo mismo: CSV (con plantilla
 * descargable) o una por una. Debajo, el padrón con la suma de coeficientes.
 */
async function SeccionUnidades({ copropiedad }: { copropiedad: CopropiedadActiva }) {
  const { unidades, sumaCoeficientes } = await getUnidadesDeCopropiedad(copropiedad.id);

  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina
        titulo="Unidades"
        descripcion={`Padrón de apartamentos y casas de ${copropiedad.nombre}.`}
      />

      <SumaCoeficientes suma={sumaCoeficientes} totalUnidades={unidades.length} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Tarjeta className="flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Subir CSV</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Ideal si ya tienes el padrón en Excel. El coeficiente puede ir en porcentaje o en
              fracción (se detecta por la suma del archivo). Primero se muestra una vista previa;
              nada se guarda hasta que confirmes.
            </p>
            <a
              href={HREF_PLANTILLA}
              download="plantilla-unidades.csv"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800 sm:min-h-9"
            >
              <Download className="h-4 w-4" />
              Descargar plantilla CSV
            </a>
          </div>
          <ImportarUnidadesForm />
        </Tarjeta>

        <Tarjeta className="flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Agregar manualmente</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Una por una. Al guardar, el formulario queda listo para la siguiente.
            </p>
          </div>
          <UnidadForm modo="crear" />
        </Tarjeta>
      </div>

      <Seccion titulo={`${unidades.length} unidad(es) registradas`}>
        {unidades.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no hay unidades"
            descripcion="Sube un CSV o agrégalas manualmente con los formularios de arriba."
          />
        ) : (
          <TablaScroll>
            <table className="w-full min-w-[40rem] border-collapse">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <Th>Unidad</Th>
                  <Th>Torre</Th>
                  <Th className="text-right">Coeficiente</Th>
                  <Th className="text-right">Área m²</Th>
                  <Th>Estado</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {unidades.map((unidad) => (
                  <tr key={unidad.id}>
                    <Td className="font-medium text-zinc-900">{unidad.identificador}</Td>
                    <Td>{etiquetaTorre(unidad.torre)}</Td>
                    <Td className="text-right tabular-nums">{unidad.coeficiente} %</Td>
                    <Td className="text-right tabular-nums">{unidad.areaM2 || "—"}</Td>
                    <Td>
                      <Etiqueta tono={unidad.estado === "OCUPADO" ? "exito" : "neutro"}>
                        {ETIQUETAS_ESTADO_INMUEBLE[unidad.estado]}
                      </Etiqueta>
                    </Td>
                    <Td>
                      <AccionesUnidad unidad={unidad} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TablaScroll>
        )}
      </Seccion>
    </div>
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
