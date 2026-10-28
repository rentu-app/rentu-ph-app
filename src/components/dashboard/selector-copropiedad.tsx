"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, MapPin, Plus } from "lucide-react";
import { seleccionarCopropiedad } from "@/lib/actions/copropiedades";
import { Modal } from "@/components/ui/modal";
import { CrearCopropiedadForm } from "@/components/dashboard/crear-copropiedad-form";

type CopropiedadResumen = {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  totalUnidades: number;
};

/**
 * Selector del header: muestra la copropiedad activa y permite cambiar a otra
 * sin cerrar sesión, o crear una nueva. Cambiar es un `<form>` por opción que
 * llama a `seleccionarCopropiedad`; el servidor valida que el administrador
 * pertenezca a esa copropiedad antes de escribir la cookie, así que manipular
 * el `value` del input no da acceso a nada.
 */
export function SelectorCopropiedad({
  copropiedades,
  activaId,
}: {
  copropiedades: CopropiedadResumen[];
  activaId: string | undefined;
}) {
  const [abierto, setAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const activa = copropiedades.find((copropiedad) => copropiedad.id === activaId);

  useEffect(() => {
    if (!abierto) return;

    function alPresionar(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) setAbierto(false);
    }
    function alTeclear(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", alPresionar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alPresionar);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  return (
    <div ref={contenedorRef} className="relative min-w-0" data-tour="selector-copropiedad">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className="-mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center gap-2 rounded-md px-2 text-left transition-colors hover:bg-zinc-100"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-tight text-zinc-900">
            {activa?.nombre ?? "Rentu"}
          </span>
          {activa ? (
            <span className="flex items-center gap-1 truncate text-xs leading-tight text-zinc-500">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {activa.direccion} · {activa.ciudad} · {activa.totalUnidades} unidades
              </span>
            </span>
          ) : null}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-zinc-400" />
      </button>

      {abierto ? (
        <div className="absolute left-0 top-full z-40 mt-1 w-full min-w-64 max-w-sm rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg sm:w-80">
          <ul role="listbox" aria-label="Copropiedades" className="flex flex-col">
            {copropiedades.map((copropiedad) => {
              const esActiva = copropiedad.id === activaId;
              return (
                <li key={copropiedad.id}>
                  <form action={seleccionarCopropiedad}>
                    <input type="hidden" name="copropiedadId" value={copropiedad.id} />
                    <button
                      type="submit"
                      role="option"
                      aria-selected={esActiva}
                      className={`flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${
                        esActiva ? "bg-brand-50" : "hover:bg-zinc-100"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-900">
                          {copropiedad.nombre}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">
                          {copropiedad.totalUnidades} unidades · {copropiedad.ciudad}
                        </span>
                      </span>
                      {esActiva ? <Check className="h-4 w-4 shrink-0 text-brand-600" /> : null}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => {
              setAbierto(false);
              setCreando(true);
            }}
            className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-md border-t border-zinc-100 px-2.5 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            <Plus className="h-4 w-4" />
            Agregar otra copropiedad
          </button>
        </div>
      ) : null}

      <Modal
        open={creando}
        onClose={() => setCreando(false)}
        title="Agregar otra copropiedad"
        description="Queda como tu copropiedad activa y puedes volver a las otras desde este mismo selector."
      >
        <CrearCopropiedadForm />
      </Modal>
    </div>
  );
}
