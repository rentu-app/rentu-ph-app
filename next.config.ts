import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `@xenova/transformers` (embeddings del RAG) depende del binario nativo
  // de `onnxruntime-node`. El tracing automático de Next/Vercel no lo
  // detecta porque se resuelve en runtime según SO/arquitectura, así que
  // hay que incluirlo a mano o la función serverless truena en producción
  // con "libonnxruntime.so...: No such file or directory".
  outputFileTracingIncludes: {
    "/*": ["node_modules/**/onnxruntime-node/bin/**/*"],
  },
};

export default nextConfig;
