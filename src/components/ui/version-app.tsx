/**
 * Versión de Rentu, abajo al centro, solo para saber qué build se está viendo.
 * Píldora discreta: nombre y versión en gris, commit en mono más tenue. No
 * intercepta clics ni se imprime, y respeta el área segura inferior de iOS
 * (barra de inicio) para no quedar bajo ella en modo standalone.
 */
export function VersionApp() {
  return (
    <p
      aria-hidden="true"
      className="pointer-events-none fixed bottom-[calc(0.375rem+env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 select-none items-center gap-1.5 rounded-full border border-zinc-200/60 bg-white/60 px-2.5 py-0.5 text-[10px] leading-4 text-zinc-500 opacity-60 backdrop-blur-sm print:hidden"
    >
      <span className="font-medium tracking-wide">Rentu</span>
      <span className="tabular-nums">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
      <span className="h-0.5 w-0.5 rounded-full bg-zinc-400" />
      <span className="font-mono text-zinc-400">{process.env.NEXT_PUBLIC_APP_COMMIT}</span>
    </p>
  );
}
