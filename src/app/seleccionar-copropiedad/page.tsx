import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building2, MapPin, Plus } from "lucide-react";
import { getAdministradorActual } from "@/lib/session";
import { getCopropiedadesDeAdministrador } from "@/lib/data/copropiedad";
import { seleccionarCopropiedad } from "@/lib/actions/copropiedades";
import { Logo } from "@/components/ui/logo";
import { FormPanel } from "@/components/ui/form-panel";
import { CrearCopropiedadForm } from "@/components/dashboard/crear-copropiedad-form";

export const metadata: Metadata = {
  title: "Elige tu copropiedad · Rentu",
};

/**
 * Pantalla intermedia para administradores con 2 o más copropiedades. Con 0 o
 * 1 no tiene sentido pasar por aquí y se manda directo al dashboard (que
 * resuelve el caso de cero copropiedades con su propio estado vacío).
 */
export default async function SeleccionarCopropiedadPage() {
  const administrador = await getAdministradorActual();
  const copropiedades = await getCopropiedadesDeAdministrador(administrador.id);

  if (copropiedades.length < 2) redirect("/dashboard");

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-10 sm:py-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo altura={44} />
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
            ¿Qué copropiedad vas a gestionar?
          </h1>
          <p className="text-sm text-zinc-500">
            Puedes cambiar de copropiedad en cualquier momento desde el encabezado.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {copropiedades.map((copropiedad) => (
            <li key={copropiedad.id}>
              <form action={seleccionarCopropiedad} className="h-full">
                <input type="hidden" name="copropiedadId" value={copropiedad.id} />
                <button
                  type="submit"
                  className="flex h-full min-h-32 w-full flex-col items-start gap-3 rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-brand-500 hover:bg-brand-50/40 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:outline-none"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-zinc-900">
                      {copropiedad.nombre}
                    </span>
                    <span className="mt-1 flex items-start gap-1 text-sm text-zinc-500">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {copropiedad.direccion} · {copropiedad.ciudad}
                    </span>
                  </span>
                  <span className="mt-auto text-xs font-medium text-zinc-600">
                    {copropiedad.totalUnidades}{" "}
                    {copropiedad.totalUnidades === 1 ? "unidad" : "unidades"}
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>

        <div className="flex justify-center">
          <FormPanel
            triggerLabel="Agregar otra copropiedad"
            title="Agregar otra copropiedad"
            description="Queda como tu copropiedad activa."
            icon={<Plus className="h-4 w-4" />}
          >
            <CrearCopropiedadForm />
          </FormPanel>
        </div>
      </div>
    </div>
  );
}
