"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * En mobile se comporta como bottom sheet (pegado abajo, esquinas
 * redondeadas solo arriba, ancho completo) porque un modal centrado
 * diminuto es incómodo de alcanzar con el pulgar; desde `sm` (640px) es un
 * modal centrado normal. El encabezado queda fijo y el contenido scrollea
 * aparte, para que formularios largos no empujen el botón de cerrar fuera
 * de una pantalla de 375×667 (iPhone SE).
 *
 * Animación: clases CSS (`fundido` / `subir-hoja`) en vez de framer-motion.
 * No hay animación de salida — el nodo se desmonta de inmediato. Es un
 * intercambio deliberado: mantener el modal montado para animar la salida
 * exigía estado extra y un `AnimatePresence` que en móvil dejaba el overlay
 * capturando toques unos milisegundos más de lo debido.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") onClose();
    }
    document.addEventListener("keydown", alPresionarTecla);

    // Bloquea el scroll del documento mientras el sheet está abierto: sin
    // esto, en iOS el gesto de scroll sobre el overlay arrastra la página de
    // atrás y el modal "salta".
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    contenedorRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", alPresionarTecla);
      document.body.style.overflow = overflowPrevio;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={-1}
        onClick={onClose}
        className="fundido fixed inset-0 cursor-default bg-zinc-900/50"
      />
      <div
        ref={contenedorRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rentu-modal-title"
        tabIndex={-1}
        className="subir-hoja relative z-10 flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10 outline-none sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex justify-center pt-2 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-zinc-200" />
        </div>

        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="rentu-modal-title"
              className="text-lg font-bold text-zinc-900"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-zinc-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
