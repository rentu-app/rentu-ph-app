import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { esCuentaDemo } from "@/lib/demo";
import { getAdministradorActual } from "@/lib/session";
import { getCopropiedadesDeAdministrador } from "@/lib/data/copropiedad";
import { getMetricasCopropiedades } from "@/lib/data/metricas-copropiedades";
import { TarjetaCopropiedad } from "@/components/dashboard/tarjeta-copropiedad";
import { AgregarCopropiedadTarjeta } from "@/components/dashboard/agregar-copropiedad-tarjeta";

export const metadata: Metadata = {
  title: "Elige tu copropiedad · Rentu",
};

/**
 * Primera pantalla después de iniciar sesión, aunque el administrador tenga
 * una sola copropiedad. Sin copropiedades no hay nada que elegir: se manda al
 * dashboard, que muestra su propio estado vacío.
 */
export default async function SeleccionarCopropiedadPage() {
  const administrador = await getAdministradorActual();
  const copropiedades = await getCopropiedadesDeAdministrador(administrador.id);

  if (copropiedades.length === 0) redirect("/dashboard");

  const metricas = await getMetricasCopropiedades(copropiedades.map((c) => c.id));
  const puedeCrear = !esCuentaDemo(administrador.email);
  const nombre = administrador.nombre.split(" ")[0];

  return (
    <div className="min-h-full bg-zinc-50 px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))] sm:px-6 sm:py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:gap-10">
        <header className="flex flex-col gap-4">
          <Logo altura={40} />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              Hola, {nombre}.
            </h1>
            <p className="mt-1 text-base text-zinc-600 sm:text-lg">
              ¿Qué copropiedad vas a gestionar hoy?
            </p>
          </div>
        </header>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {copropiedades.map((copropiedad, indice) => (
            <li key={copropiedad.id}>
              <TarjetaCopropiedad
                id={copropiedad.id}
                nombre={copropiedad.nombre}
                direccion={copropiedad.direccion}
                ciudad={copropiedad.ciudad}
                metricas={metricas.get(copropiedad.id)}
                indice={indice}
              />
            </li>
          ))}
          {puedeCrear ? (
            <li>
              <AgregarCopropiedadTarjeta indice={copropiedades.length} />
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
