"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Tabs livianas: todos los paneles (cada uno ya trae su propio
 * <Suspense> resuelto por el Server Component que los arma) se montan una
 * sola vez y solo se ocultan con `hidden` al cambiar de pestaña — así no se
 * vuelven a pedir los datos al servidor cada vez que el usuario cambia de
 * tab.
 *
 * `icon` recibe el ícono ya renderizado (ej. `<Building2 className="h-4
 * w-4" />`), no la referencia al componente: un Server Component no puede
 * pasarle una función (el componente de lucide-react) como prop a este
 * Client Component, pero un elemento JSX ya armado sí es serializable.
 */
export function Tabs({
  tabs,
  panels,
}: {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  panels: Record<string, ReactNode>;
}) {
  const [activo, setActivo] = useState(tabs[0]?.id ?? "");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => {
          const seleccionada = activo === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivo(tab.id)}
              className={`relative flex min-h-11 shrink-0 items-center gap-2 px-4 text-sm font-medium transition-colors ${
                seleccionada
                  ? "text-brand-700 dark:text-brand-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {tab.icon}
              {tab.label}
              {seleccionada ? (
                <motion.span
                  layoutId="rentu-tab-underline"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600 dark:bg-brand-400"
                  transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div key={tab.id} hidden={activo !== tab.id}>
          {panels[tab.id]}
        </div>
      ))}
    </div>
  );
}
