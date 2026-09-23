import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `@xenova/transformers` (embeddings del RAG) depende del binario nativo
  // de `onnxruntime-node`. El tracing automático de Next/Vercel no lo
  // detecta porque se resuelve en runtime según SO/arquitectura, así que
  // hay que incluirlo a mano o la función serverless truena en producción
  // con "libonnxruntime.so...: No such file or directory".
  //
  // Acotado a las dos rutas que realmente importan `@/lib/ai/embeddings`:
  // `/dashboard/[section]` (la sección `documentos` indexa con
  // `documentos.ts`) y `/api/copiloto` (hace la búsqueda RAG). Un glob "/*"
  // que cubra todas las rutas le impide a Vercel agrupar las demás páginas
  // en una sola función y dispara el límite de 12 funciones serverless del
  // plan Hobby.
  //
  // `/dashboard` ya no aparece acá: el Copiloto y la indexación se movieron
  // de la página de resumen a la sección `documentos`.
  outputFileTracingIncludes: {
    "/dashboard/[section]": ["node_modules/**/onnxruntime-node/bin/**/*"],
    "/api/copiloto": ["node_modules/**/onnxruntime-node/bin/**/*"],
  },
};

export default nextConfig;
