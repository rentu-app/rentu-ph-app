import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getAdministradorActual } from "@/lib/session";
import { getCopropiedadPorId } from "@/lib/data/copropiedad";
import { generarEmbedding } from "@/lib/ai/embeddings";
import { buscarChunksRelevantes } from "@/lib/data/documentos-ph";

export const maxDuration = 30;

// Gemini Flash (capa gratuita de Google AI Studio) en vez de Anthropic, para
// que el Copiloto no dependa de una API de pago. `GEMINI_API_KEY` es el
// nombre de variable que entrega Google AI Studio; el SDK por defecto busca
// `GOOGLE_GENERATIVE_AI_API_KEY`, así que se pasa explícito.
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  const { messages, copropiedadId } = (await request.json()) as {
    messages: UIMessage[];
    copropiedadId?: string;
  };

  if (!copropiedadId) {
    return new Response("Falta copropiedadId", { status: 400 });
  }

  // Igual que en las Server Actions: nunca confiamos en que el cliente tenga
  // acceso a la copropiedad solo porque la mandó en el body.
  const administrador = await getAdministradorActual();
  const copropiedad = await getCopropiedadPorId(copropiedadId, administrador.id);
  if (!copropiedad) {
    return new Response("Copropiedad no encontrada o sin acceso", { status: 403 });
  }

  const ultimoMensajeUsuario = [...messages].reverse().find((m) => m.role === "user");
  const textoConsulta = (ultimoMensajeUsuario?.parts ?? [])
    .filter((parte): parte is { type: "text"; text: string } => parte.type === "text")
    .map((parte) => parte.text)
    .join(" ")
    .trim();

  let contexto = "(No se encontraron fragmentos relevantes para esta consulta.)";
  if (textoConsulta) {
    // Embedding local (sin API de pago) de la última pregunta del usuario.
    const vectorConsulta = await generarEmbedding(textoConsulta);
    const chunks = await buscarChunksRelevantes(copropiedadId, vectorConsulta, 6);
    if (chunks.length > 0) {
      contexto = chunks
        .map(
          (chunk, i) =>
            `[Fragmento ${i + 1} — ${chunk.titulo} (${chunk.tipo})]\n${chunk.contenido}`
        )
        .join("\n\n---\n\n");
    }
  }

  const system = `Eres el Copiloto Administrativo de Rentu para la copropiedad "${copropiedad.nombre}". Ayudas al Administrador a resolver dudas sobre el reglamento de propiedad horizontal, el manual de convivencia y las actas de asamblea de ESTA copropiedad.

Reglas estrictas:
- Responde ÚNICAMENTE con base en los fragmentos de contexto de abajo.
- Si la respuesta no está en los fragmentos, dilo explícitamente ("No encontré esto en los documentos indexados de esta copropiedad") — nunca inventes normas, montos ni acuerdos.
- Cuando cites algo, menciona de qué documento sale (ej. "según el Reglamento de PH...").
- Sé conciso: el Administrador está ocupado.

Fragmentos de contexto disponibles:
${contexto}`;

  const result = streamText({
    model: google("gemini-3.6-flash"),
    system,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
