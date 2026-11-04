/**
 * Versión de Rentu, abajo al centro y medio opaca, solo para saber qué build
 * se está viendo. No intercepta clics ni se imprime.
 */
export function VersionApp() {
  return (
    <p
      aria-hidden="true"
      className="pointer-events-none fixed bottom-[calc(0.25rem+env(safe-area-inset-bottom))] left-1/2 z-10 -translate-x-1/2 select-none text-[10px] tabular-nums text-zinc-500 opacity-50 print:hidden"
    >
      Rentu v{process.env.NEXT_PUBLIC_APP_VERSION} · {process.env.NEXT_PUBLIC_APP_COMMIT}
    </p>
  );
}
