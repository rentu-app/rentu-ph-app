import type { NextConfig } from "next";

// `@xenova/transformers` (embeddings del RAG) depende del binario nativo de
// `onnxruntime-node`. El tracing automático de Next/Vercel no lo detecta
// porque se resuelve en runtime según SO/arquitectura, así que hay que
// incluirlo a mano o la función serverless truena en producción con
// "libonnxruntime.so...: No such file or directory".
// Con pnpm el paquete vive en `node_modules/.pnpm/...` (directorio oculto que
// `**` no recorre), por eso la ruta es explícita. Solo se incluye el binario
// de Linux x64, que es el que usa Vercel.
const ONNX_LINUX = [
  "node_modules/.pnpm/onnxruntime-node@*/node_modules/onnxruntime-node/bin/napi-v3/linux/x64/**/*",
];

const nextConfig: NextConfig = {
  // Claves = rutas (picomatch), con los corchetes del segmento dinámico
  // escapados. Acotado a las rutas que importan `@/lib/ai/embeddings`
  // (`/dashboard/[section]`: la sección `documentos` indexa con `documentos.ts`,
  // `/api/copiloto` hace RAG). Un glob "/*" impide a Vercel agrupar las demás
  // páginas y dispara el límite de 12 funciones del plan Hobby.
  outputFileTracingIncludes: {
    "/dashboard/\\[section\\]": ONNX_LINUX,
    "/api/copiloto": ONNX_LINUX,
  },
};

export default nextConfig;
