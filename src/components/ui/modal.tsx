"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * En mobile se comporta como bottom sheet (pegado abajo, esquinas
 * redondeadas solo arriba, ancho completo) porque un modal centrado
 * diminuto es incómodo de alcanzar con el pulgar; desde `sm` (640px) es un
 * modal centrado normal. El título/botón de cerrar quedan fijos arriba
 * (`sticky`) y el contenido scrollea aparte, para que formularios largos
 * (CrearPqrsForm, GenerarCuentasForm) no empujen el botón de cerrar fuera
 * de una pantalla de 375×667 (iPhone SE).
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
  useEffect(() => {
    if (!open) return;
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") onClose();
    }
    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rentu-modal-title"
            className="relative z-10 flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10 sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
          >
            <div className="flex justify-center pt-2 sm:hidden">
              <span className="h-1.5 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            </div>

            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-100 bg-white px-5 py-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <h2
                  id="rentu-modal-title"
                  className="text-lg font-bold text-zinc-900 dark:text-zinc-50"
                >
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6">
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
