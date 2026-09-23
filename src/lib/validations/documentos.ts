import { z } from "zod";
import { TipoDocumentoPH } from "@prisma/client";

/** La copropiedad la resuelve el servidor desde la sesión, no el formulario. */
export const indexarDocumentoSchema = z.object({
  tipo: z.enum(TipoDocumentoPH),
  titulo: z.string().trim().min(3, "Escribe un título").max(200, "Máximo 200 caracteres"),
  contenido: z
    .string()
    .trim()
    .min(50, "Pega al menos un párrafo de contenido (mínimo 50 caracteres)")
    .max(200_000, "Máximo 200,000 caracteres"),
});

export type IndexarDocumentoInput = z.infer<typeof indexarDocumentoSchema>;
