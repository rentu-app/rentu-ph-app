"use client";

import { useActionState } from "react";
import { EstadoOrdenServicio } from "@prisma/client";
import { actualizarEstadoOrden } from "@/lib/actions/prestadores";
import { ESTADO_INICIAL_ACCION } from "@/lib/types/estado-accion";
import { BotonSubmit } from "@/components/ui/boton";

/**
 * Mueve una orden entre estados. Se usan varios `<button name="estado">` en
 * un mismo formulario: el navegador solo envía el par del botón presionado,
 * así no hace falta estado en el cliente ni un select extra.
 */
export function ActualizarEstadoOrdenForm({
  ordenId,
  estadoActual,
}: {
  ordenId: string;
  estadoActual: EstadoOrdenServicio;
}) {
  const [estado, accion] = useActionState(
    actualizarEstadoOrden,
    ESTADO_INICIAL_ACCION
  );

  const transiciones: {
    valor: EstadoOrdenServicio;
    etiqueta: string;
    variante: "brand" | "neutro";
  }[] = [
    {
      valor: EstadoOrdenServicio.EN_PROCESO,
      etiqueta: "Marcar en proceso",
      variante: "brand",
    },
    { valor: EstadoOrdenServicio.CERRADA, etiqueta: "Cerrar", variante: "brand" },
    {
      valor: EstadoOrdenServicio.CANCELADA,
      etiqueta: "Cancelar",
      variante: "neutro",
    },
    {
      valor: EstadoOrdenServicio.ABIERTA,
      etiqueta: "Reabrir",
      variante: "neutro",
    },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <form action={accion} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="ordenId" value={ordenId} />
        {transiciones
          .filter((transicion) => transicion.valor !== estadoActual)
          .map((transicion) => (
            <BotonSubmit
              key={transicion.valor}
              name="estado"
              value={transicion.valor}
              variante={transicion.variante}
              tamanio="sm"
              pendiente="…"
            >
              {transicion.etiqueta}
            </BotonSubmit>
          ))}
      </form>
      {estado.status === "error" ? (
        <p role="status" className="text-xs font-medium text-red-600">
          {estado.message}
        </p>
      ) : null}
    </div>
  );
}
