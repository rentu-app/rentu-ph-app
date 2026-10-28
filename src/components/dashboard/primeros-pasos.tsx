import Link from "next/link";
import { Building2, Check, ReceiptText, Users, CalendarPlus } from "lucide-react";
import type { ReactNode } from "react";
import type { ProgresoPrimerosPasos } from "@/lib/data/primeros-pasos";
import { FormPanel } from "@/components/ui/form-panel";
import { GenerarCuentasForm } from "@/components/dashboard/generar-cuentas-form";
import { Tarjeta } from "@/components/ui/primitivos";

const CLASES_BOTON =
  "inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-md px-4 text-sm font-semibold shadow-sm transition-colors sm:w-auto";

function Paso({
  hecho,
  icono,
  titulo,
  descripcion,
  accion,
}: {
  hecho: boolean;
  icono: ReactNode;
  titulo: string;
  descripcion: string;
  accion: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            hecho ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
          }`}
          aria-hidden="true"
        >
          {hecho ? <Check className="h-4 w-4" /> : icono}
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${hecho ? "text-zinc-500 line-through" : "text-zinc-900"}`}>
            {titulo}
            <span className="sr-only">{hecho ? " (completado)" : " (pendiente)"}</span>
          </p>
          <p className="mt-0.5 text-sm text-zinc-500">{descripcion}</p>
        </div>
      </div>
      {hecho ? null : accion}
    </li>
  );
}

/**
 * Checklist de arranque. Se pinta mientras falte algún paso y el dashboard
 * deja de renderizarla cuando los cuatro están completos. Server Component: el
 * progreso viene de la base (`getProgresoPrimerosPasos`), no del cliente.
 */
export function PrimerosPasos({
  progreso,
  totalUnidades,
}: {
  progreso: ProgresoPrimerosPasos;
  totalUnidades: number;
}) {
  const hechos = Object.values(progreso).filter(Boolean).length;
  const enlace = `${CLASES_BOTON} bg-brand-600 text-white hover:bg-brand-700`;

  return (
    <Tarjeta className="p-4 sm:p-6">
      <div data-tour="primeros-pasos">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-900">Primeros pasos</h2>
          <p className="text-sm text-zinc-500">
            {hechos} de 4 completados
          </p>
        </div>
        <p className="mt-0.5 text-sm text-zinc-500">
          Deja lista tu copropiedad. Cada paso se marca solo cuando se cumple.
        </p>

        <ul className="mt-2 divide-y divide-zinc-100">
          <Paso
            hecho={progreso.unidades}
            icono={<Building2 className="h-4 w-4" />}
            titulo="Agregar unidades"
            descripcion="Sube el padrón en CSV o créalas una por una."
            accion={
              <Link href="/dashboard/unidades" className={enlace}>
                Agregar unidades
              </Link>
            }
          />
          <Paso
            hecho={progreso.ocupantes}
            icono={<Users className="h-4 w-4" />}
            titulo="Registrar ocupantes"
            descripcion="Invita a propietarios e inquilinos a su unidad."
            accion={
              progreso.unidades ? (
                <Link href="/dashboard/residentes" className={enlace}>
                  Registrar ocupantes
                </Link>
              ) : (
                <span className="text-xs text-zinc-400">Primero agrega unidades</span>
              )
            }
          />
          <Paso
            hecho={progreso.cuentaDeCobro}
            icono={<ReceiptText className="h-4 w-4" />}
            titulo="Generar la primera cuenta de cobro"
            descripcion="Crea las cuentas del periodo para todas las unidades."
            accion={
              progreso.unidades ? (
                <FormPanel
                  triggerLabel="Generar cuentas"
                  title="Generar cuentas de cobro del periodo"
                  description="Crea una cuenta por cada unidad activa, repartiendo el total de administración según el coeficiente y arrastrando el saldo pendiente."
                  icon={<ReceiptText className="h-4 w-4" />}
                >
                  <GenerarCuentasForm totalUnidades={totalUnidades} />
                </FormPanel>
              ) : (
                <span className="text-xs text-zinc-400">Primero agrega unidades</span>
              )
            }
          />
          <Paso
            hecho={progreso.zonaComun}
            icono={<CalendarPlus className="h-4 w-4" />}
            titulo="Crear una zona común"
            descripcion="Salón social, BBQ, cancha… para que los residentes reserven."
            accion={
              <Link href="/dashboard/reservas" className={enlace}>
                Crear zona común
              </Link>
            }
          />
        </ul>
      </div>
    </Tarjeta>
  );
}
