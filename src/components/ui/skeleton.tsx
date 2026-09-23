/**
 * Placeholder con shimmer (barrido de luz) para usar en `<Suspense fallback>`.
 * Puro CSS (keyframe `rentu-shimmer` en globals.css) — no requiere "use client".
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-zinc-100 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[rentu-shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}
