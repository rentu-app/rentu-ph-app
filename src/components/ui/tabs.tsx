"use client";

import { useState, type ReactNode } from "react";

/**
 * Tabs livianas: todos los paneles (cada uno ya trae su propio
 * <Suspense> resuelto por el Server Component que los arma) se montan una
 * sola vez y solo se ocultan con `hidden` al cambiar de pestaña — así no se
 * vuelven a pedir los datos al servidor cada vez que el usuario cambia de
 * tab.
 *
 * El subrayado de la pestaña activa es un borde estático. Antes era un
 * `motion.span layoutId` de framer-motion: animar `layout` obliga al
 * navegador a medir y recalcular posiciones en cada frame, y en móvil ese
 * era uno de los puntos donde la interfaz se sentía trabada.
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
      {/* `-mx-4 px-4` deja que la fila sangre hasta el borde en móvil: así se
          ve que hay más pestañas para scrollear en vez de cortarse contra el
          padding del contenedor. */}
      <div
        role="tablist"
        className="-mx-4 flex gap-1 overflow-x-auto border-b border-zinc-200 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const seleccionada = activo === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={seleccionada}
              onClick={() => setActivo(tab.id)}
              className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors ${
                seleccionada
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" hidden={activo !== tab.id}>
          {panels[tab.id]}
        </div>
      ))}
    </div>
  );
}
