"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getContextoAdministrador } from "@/lib/session";
import { generarEmbeddings } from "@/lib/ai/embeddings";
import { trocearTexto } from "@/lib/ai/chunking";
import { indexarDocumentoSchema } from "@/lib/validations/documentos";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";

export type EstadoAccionDocumento = EstadoAccionFormulario;

/**
 * Indexa un documento de la PH: lo trocea, genera un embedding local por
 * fragmento (sin llamar a ninguna API de pago) y guarda documento + chunks
 * en una sola transacción. El chat del Copiloto Administrativo
 * (`/api/copiloto`) busca sobre estos chunks por similitud coseno.
 */
export async function indexarDocumento(
  _prevState: EstadoAccionDocumento,
  formData: FormData
): Promise<EstadoAccionDocumento> {
  const validado = indexarDocumentoSchema.safeParse({
    tipo: formData.get("tipo"),
    titulo: formData.get("titulo"),
    contenido: formData.get("contenido"),
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { tipo, titulo, contenido } = validado.data;

  try {
    const { administrador, copropiedad } = await getContextoAdministrador();

    if (!copropiedad) {
      return {
        status: "error",
        message: "No tienes una copropiedad asignada todavía.",
      };
    }

    const copropiedadId = copropiedad.id;

    const fragmentos = trocearTexto(contenido);
    if (fragmentos.length === 0) {
      return { status: "error", message: "No se pudo extraer contenido indexable del texto." };
    }

    // Trabajo de CPU (modelo local) fuera de la transacción de base de datos.
    const vectores = await generarEmbeddings(fragmentos);

    await prisma.$transaction(async (tx) => {
      const documento = await tx.documentoPH.create({
        data: { copropiedadId, tipo, titulo, contenido, subidoPorId: administrador.id },
      });

      for (let indice = 0; indice < fragmentos.length; indice++) {
        const literal = `[${vectores[indice].join(",")}]`;
        await tx.$executeRaw`
          INSERT INTO documento_ph_chunks (id, "documentoId", indice, contenido, embedding, "createdAt")
          VALUES (${randomUUID()}::uuid, ${documento.id}::uuid, ${indice}, ${fragmentos[indice]}, ${literal}::vector, now())
        `;
      }
    });

    revalidatePath("/dashboard/documentos");

    return {
      status: "success",
      message: `"${titulo}" indexado en ${fragmentos.length} fragmento(s).`,
    };
  } catch (error) {
    console.error("indexarDocumento", error);
    return { status: "error", message: "No se pudo indexar el documento." };
  }
}
