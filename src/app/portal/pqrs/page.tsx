import { getResidenteActual } from "@/lib/session";
import { getPqrsDeResidente } from "@/lib/data/pqrs";
import { CrearPqrsForm } from "@/components/portal/crear-pqrs-form";
import { PqrsList } from "@/components/portal/pqrs-list";
import {
  EncabezadoPagina,
  EstadoVacio,
  Seccion,
} from "@/components/ui/primitivos";

export const metadata = {
  title: "Mis PQRS · Rentu",
};

export default async function PqrsResidentePage() {
  const { usuario, inmuebleActivo } = await getResidenteActual();

  if (!inmuebleActivo) {
    return (
      <EstadoVacio
        titulo="No tienes una unidad vinculada"
        descripcion="Contacta a la administración de tu conjunto para que te vincule a tu apartamento."
      />
    );
  }

  const pqrs = await getPqrsDeResidente(usuario.id, inmuebleActivo.inmueble.id);

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Mis PQRS"
        descripcion={`Peticiones, quejas, reclamos y sugerencias de ${inmuebleActivo.inmueble.identificador}.`}
      />

      <CrearPqrsForm />

      <Seccion titulo={`Historial (${pqrs.length})`}>
        <PqrsList items={pqrs} usuarioId={usuario.id} />
      </Seccion>
    </div>
  );
}
