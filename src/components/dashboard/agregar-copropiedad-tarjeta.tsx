"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { CrearCopropiedadForm } from "@/components/dashboard/crear-copropiedad-form";

/** Última tarjeta de la grilla: abre el formulario de creación en un modal. */
export function AgregarCopropiedadTarjeta({ indice }: { indice: number }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div
      className="aparecer h-full"
      style={{ animationDelay: `${Math.min(indice, 8) * 60}ms` }}
    >
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="group flex h-full min-h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-300 bg-white/60 p-6 text-zinc-500 transition duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-700 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:outline-none"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 transition-colors group-hover:bg-brand-100">
          <Plus className="h-6 w-6" />
        </span>
        <span className="text-sm font-semibold">Agregar copropiedad</span>
      </button>

      <Modal
        open={abierto}
        onClose={() => setAbierto(false)}
        title="Agregar copropiedad"
        description="Queda como tu copropiedad activa y luego cargas sus unidades."
      >
        <CrearCopropiedadForm />
      </Modal>
    </div>
  );
}
