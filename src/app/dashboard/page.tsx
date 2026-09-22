import { Suspense } from "react";
import { Building2, FileStack, Home, ReceiptText, Wallet } from "lucide-react";
import { getAdministradorActual } from "@/lib/session";
import { getCopropiedadesDelAdministrador } from "@/lib/data/copropiedades";
import { getResumenInmuebles } from "@/lib/data/inmuebles";
import {
  getCuentasDeCobroRecientes,
  getResumenCartera,
} from "@/lib/data/cuentas-cobro";
import { getDocumentosPHDelAdministrador } from "@/lib/data/documentos-ph";
import { StatCard } from "@/components/dashboard/stat-card";
import { CopropiedadesGrid } from "@/components/dashboard/copropiedades-grid";
import { CuentasDeCobroTable } from "@/components/dashboard/cuentas-de-cobro-table";
import { GenerarCuentasForm } from "@/components/dashboard/generar-cuentas-form";
import { SubirDocumentoForm } from "@/components/dashboard/subir-documento-form";
import { DocumentosPHList } from "@/components/dashboard/documentos-ph-list";
import { CopilotoChat } from "@/components/dashboard/copiloto-chat";
import { FormPanel } from "@/components/ui/form-panel";
import { FadeIn } from "@/components/ui/motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { formatearMoneda } from "@/lib/formatters";

export const metadata = {
  title: "Dashboard · Rentu",
};

export default async function DashboardPage() {
  const administrador = await getAdministradorActual();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Hola, {administrador.nombre.split(" ")[0]}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Este es el resumen operativo de tus copropiedades.
        </p>
      </div>

      <Suspense fallback={<KpisSkeleton />}>
        <Kpis administradorId={administrador.id} />
      </Suspense>

      <Tabs
        tabs={[
          { id: "resumen", label: "Resumen", icon: <Building2 className="h-4 w-4" /> },
          { id: "cartera", label: "Cartera", icon: <Wallet className="h-4 w-4" /> },
          {
            id: "documentos",
            label: "Documentos & Copiloto",
            icon: <FileStack className="h-4 w-4" />,
          },
        ]}
        panels={{
          resumen: (
            <Suspense fallback={<SeccionSkeleton lineas={3} />}>
              <SeccionCopropiedades administradorId={administrador.id} />
            </Suspense>
          ),
          cartera: (
            <div className="flex flex-col gap-4">
              <Suspense fallback={<Skeleton className="h-10 w-48" />}>
                <SeccionGenerarCuentas administradorId={administrador.id} />
              </Suspense>
              <Suspense fallback={<SeccionSkeleton lineas={5} />}>
                <SeccionCuentasDeCobro administradorId={administrador.id} />
              </Suspense>
            </div>
          ),
          documentos: (
            <Suspense fallback={<SeccionSkeleton lineas={2} />}>
              <SeccionCopiloto administradorId={administrador.id} />
            </Suspense>
          ),
        }}
      />
    </div>
  );
}

async function SeccionCopiloto({ administradorId }: { administradorId: string }) {
  const [copropiedades, documentos] = await Promise.all([
    getCopropiedadesDelAdministrador(administradorId),
    getDocumentosPHDelAdministrador(administradorId),
  ]);
  const opcionesCopropiedad = copropiedades.map(({ id, nombre }) => ({ id, nombre }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Documentos indexados
          </h2>
          {opcionesCopropiedad.length > 0 ? (
            <FormPanel
              triggerLabel="Indexar documento"
              title="Indexar documento de la copropiedad"
              description="Pega el texto del reglamento, manual de convivencia o acta. Se trocea y se indexa con un modelo de embeddings local (sin costo) para que el Copiloto pueda responder preguntas sobre él."
              icon={<FileStack className="h-4 w-4" />}
            >
              <SubirDocumentoForm copropiedades={opcionesCopropiedad} />
            </FormPanel>
          ) : null}
        </div>
        <DocumentosPHList documentos={documentos} />
      </div>
      <FadeIn delay={0.1}>
        <CopilotoChat copropiedades={opcionesCopropiedad} />
      </FadeIn>
    </div>
  );
}

async function SeccionGenerarCuentas({
  administradorId,
}: {
  administradorId: string;
}) {
  const copropiedades = await getCopropiedadesDelAdministrador(administradorId);
  if (copropiedades.length === 0) return null;

  return (
    <FormPanel
      triggerLabel="Generar cuentas del periodo"
      title="Generar cuentas de cobro del periodo"
      description="Crea una cuenta por cada inmueble activo, repartiendo el total de administración según el coeficiente y arrastrando saldos pendientes."
      icon={<ReceiptText className="h-4 w-4" />}
    >
      <GenerarCuentasForm
        copropiedades={copropiedades.map(({ id, nombre }) => ({ id, nombre }))}
      />
    </FormPanel>
  );
}

async function Kpis({ administradorId }: { administradorId: string }) {
  const [resumenInmuebles, resumenCartera, copropiedades] = await Promise.all([
    getResumenInmuebles(administradorId),
    getResumenCartera(administradorId),
    getCopropiedadesDelAdministrador(administradorId),
  ]);

  return (
    <FadeIn className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        etiqueta="Copropiedades"
        valor={String(copropiedades.length)}
        icono={Building2}
      />
      <StatCard
        etiqueta="Inmuebles"
        valor={String(resumenInmuebles.total)}
        detalle={`${resumenInmuebles.ocupados} ocupados · ${resumenInmuebles.desocupados} desocupados`}
        icono={Home}
      />
      <StatCard
        etiqueta="Cartera por cobrar"
        valor={formatearMoneda(resumenCartera.totalPorCobrar)}
        detalle={`${resumenCartera.cantidadPorCobrar} cuentas`}
        icono={Wallet}
      />
      <StatCard
        etiqueta="En mora"
        valor={formatearMoneda(resumenCartera.totalEnMora)}
        detalle={`${resumenCartera.cantidadEnMora} cuentas en mora`}
        tono={resumenCartera.cantidadEnMora > 0 ? "alerta" : "positivo"}
        icono={ReceiptText}
      />
    </FadeIn>
  );
}

async function SeccionCopropiedades({
  administradorId,
}: {
  administradorId: string;
}) {
  const copropiedades = await getCopropiedadesDelAdministrador(administradorId);
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Copropiedades administradas
      </h2>
      <CopropiedadesGrid copropiedades={copropiedades} />
    </div>
  );
}

async function SeccionCuentasDeCobro({
  administradorId,
}: {
  administradorId: string;
}) {
  const cuentas = await getCuentasDeCobroRecientes(administradorId);
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Cuentas de cobro recientes
      </h2>
      <CuentasDeCobroTable cuentas={cuentas} />
    </div>
  );
}

function KpisSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

function SeccionSkeleton({ lineas }: { lineas: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lineas }).map((_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  );
}
