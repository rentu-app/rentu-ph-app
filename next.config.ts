import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `@xenova/transformers` (embeddings del RAG) depende del binario nativo
  // de `onnxruntime-node`. El tracing automático de Next/Vercel no lo
  // detecta porque se resuelve en runtime según SO/arquitectura, así que
  // hay que incluirlo a mano o la función serverless truena en producción
  // con "libonnxruntime.so...: No such file or directory".
  // Acotado solo a las rutas que realmente importan `@/lib/ai/embeddings`
  // (`/dashboard` sube documentos vía `documentos.ts`, `/api/copiloto` hace
  // RAG). Un glob "/*" que cubra todas las rutas le impide a Vercel agrupar
  // las demás páginas en una sola función y dispara el límite de 12
  // funciones serverless del plan Hobby.
  outputFileTracingIncludes: {
    "/dashboard": ["node_modules/**/onnxruntime-node/bin/**/*"],
    "/api/copiloto": ["node_modules/**/onnxruntime-node/bin/**/*"],
  },
};

export default nextConfig;
