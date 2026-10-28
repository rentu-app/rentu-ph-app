import { z } from "zod";
import { EstadoInmueble } from "@prisma/client";
import { convertirCoeficiente } from "@/lib/coeficientes";
import { filaUnidadSchema } from "@/lib/validations/cartera";

export const ETIQUETAS_ESTADO_INMUEBLE: Record<EstadoInmueble, string> = {
  OCUPADO: "Ocupado",
  DESOCUPADO: "Desocupado",
};

/**
 * Alta/edición manual de una unidad. Reutiliza los campos de la fila del CSV
 * (`filaUnidadSchema`) para que ambas vías apliquen exactamente las mismas
 * reglas de identificador, coeficiente (> 0, hasta 5 decimales) y área; solo
 * cambia que aquí la torre es opcional y se elige el estado.
 */
export const unidadManualSchema = z.object({
  torre: z
    .string()
    .trim()
    .max(60, "Máximo 60 caracteres")
    .optional()
    .transform((valor) => valor ?? ""),
  identificador: filaUnidadSchema.shape.identificador,
  // El administrador escribe porcentaje (4.167); el resto del sistema recibe
  // la fracción como string de 5 decimales ("0.04167").
  coeficiente: z.string().transform((valor, ctx) => {
    const resultado = convertirCoeficiente(valor, "porcentaje");
    if (!resultado.ok) {
      ctx.issues.push({ code: "custom", message: resultado.error, input: valor });
      return z.NEVER;
    }
    return resultado.fraccion;
  }),
  areaM2: filaUnidadSchema.shape.areaM2,
  estado: z.enum(EstadoInmueble),
});

export const editarUnidadSchema = unidadManualSchema.extend({
  inmuebleId: z.uuid("Unidad inválida"),
});

export const copropiedadNuevaSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre").max(160, "Máximo 160 caracteres"),
  nit: z
    .string()
    .trim()
    .max(30, "Máximo 30 caracteres")
    .optional()
    .transform((valor) => valor || null),
  direccion: z.string().trim().min(3, "Escribe la dirección").max(200, "Máximo 200 caracteres"),
  ciudad: z.string().trim().min(2, "Escribe la ciudad").max(100, "Máximo 100 caracteres"),
});
