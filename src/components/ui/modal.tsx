"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10 sm:items-center">
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
            className="relative z-10 w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
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
                className="shrink-0 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
