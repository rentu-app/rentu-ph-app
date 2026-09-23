"use client";

import { useId, useState, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Send } from "lucide-react";
import { CLASES_CONTROL } from "@/components/ui/formulario";

function TextoDeMensaje({ parts }: { parts: { type: string; text?: string }[] }) {
  const texto = parts
    .filter((parte) => parte.type === "text")
    .map((parte) => parte.text ?? "")
    .join("");
  return <p className="whitespace-pre-wrap">{texto}</p>;
}

/**
 * Chat del Copiloto Administrativo (RAG sobre los documentos indexados).
 *
 * Ya no tiene selector de copropiedad: la app opera sobre una sola y el id
 * llega como prop desde el Server Component. El servidor
 * (`/api/copiloto`) revalida de todos modos que ese id pertenezca al
 * administrador autenticado.
 */
export function CopilotoChat({
  copropiedadId,
  nombreCopropiedad,
  tieneDocumentos,
}: {
  copropiedadId: string;
  nombreCopropiedad: string;
  tieneDocumentos: boolean;
}) {
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/copiloto",
        body: { copropiedadId },
      })
  );
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [entrada, setEntrada] = useState("");
  const inputId = useId();

  const cargando = status === "submitted" || status === "streaming";

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const texto = entrada.trim();
    if (!texto || cargando) return;
    sendMessage({ text: texto });
    setEntrada("");
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h3 className="flex items-center gap-2 font-semibold text-zinc-900">
          <Bot className="h-4 w-4 text-brand-600" />
          Copiloto Administrativo
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Responde únicamente con base en los documentos indexados de{" "}
          {nombreCopropiedad}. Si algo no está en ellos, lo dice en vez de
          inventarlo.
        </p>
      </div>

      {/* Altura fija con scroll propio: así el chat no estira la página cada
          vez que llega un token del stream. */}
      <div className="flex h-72 flex-col gap-3 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 sm:h-80 sm:p-4">
        {messages.length === 0 ? (
          <p className="m-auto max-w-sm text-center text-sm text-zinc-400">
            {tieneDocumentos
              ? "Pregúntale por el reglamento, el manual de convivencia o un acta. Por ejemplo: ¿hasta qué hora se puede usar el salón social?"
              : "Todavía no hay documentos indexados. Indexa el reglamento o el manual de convivencia para que el Copiloto tenga de dónde responder."}
          </p>
        ) : (
          messages.map((mensaje) => (
            <div
              key={mensaje.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                mensaje.role === "user"
                  ? "ml-auto bg-zinc-900 text-white"
                  : "mr-auto bg-white text-zinc-800 ring-1 ring-zinc-200"
              }`}
            >
              <TextoDeMensaje parts={mensaje.parts} />
            </div>
          ))
        )}
        {cargando ? (
          <p className="mr-auto text-xs text-zinc-400">
            El Copiloto está buscando en los documentos…
          </p>
        ) : null}
      </div>

      {status === "error" ? (
        <p role="status" className="text-xs font-medium text-red-600">
          {error?.message ?? "Ocurrió un error al consultar al Copiloto."}
        </p>
      ) : null}

      <form onSubmit={enviar} className="flex items-center gap-2">
        <label htmlFor={inputId} className="sr-only">
          Tu pregunta
        </label>
        <input
          id={inputId}
          type="text"
          value={entrada}
          onChange={(evento) => setEntrada(evento.target.value)}
          disabled={cargando}
          placeholder="ej. ¿Qué dice el reglamento sobre mascotas?"
          className={CLASES_CONTROL}
        />
        <button
          type="submit"
          disabled={cargando || !entrada.trim()}
          aria-label="Enviar pregunta"
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md bg-brand-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
