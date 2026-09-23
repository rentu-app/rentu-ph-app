import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Documentos indexados de la copropiedad activa. */
export const getDocumentosPHDeCopropiedad = cache(
  async (copropiedadId: string) => {
    return prisma.documentoPH.findMany({
      where: { copropiedadId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tipo: true,
        titulo: true,
        createdAt: true,
        _count: { select: { chunks: true } },
      },
    });
  }
);

export type DocumentoPHIndexado = Awaited<
  ReturnType<typeof getDocumentosPHDeCopropiedad>
>[number];

export type ChunkRelevante = {
  id: string;
  documentoId: string;
  contenido: string;
  titulo: string;
  tipo: string;
  similitud: number;
};

/**
 * Búsqueda por similitud coseno en pgvector (operador `<=>`, índice HNSW —
 * ver migración en `prisma/schema.prisma` / setup manual del índice).
 * `vectorConsulta` ya viene embebido (ver `src/lib/ai/embeddings.ts`) — esta
 * función solo hace la consulta SQL, nunca llama al modelo.
 */
export async function buscarChunksRelevantes(
  copropiedadId: string,
  vectorConsulta: number[],
  limite = 6
): Promise<ChunkRelevante[]> {
  const literal = `[${vectorConsulta.join(",")}]`;

  return prisma.$queryRaw<ChunkRelevante[]>`
    SELECT c.id, c."documentoId", c.contenido, d.titulo, d.tipo::text AS tipo,
           1 - (c.embedding <=> ${literal}::vector) AS similitud
    FROM documento_ph_chunks c
    JOIN documentos_ph d ON d.id = c."documentoId"
    WHERE d."copropiedadId" = ${copropiedadId}::uuid AND d."deletedAt" IS NULL
    ORDER BY c.embedding <=> ${literal}::vector
    LIMIT ${limite}
  `;
}
