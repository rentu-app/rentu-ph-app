"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";

/**
 * Patrón reutilizable "botón + modal" para cualquier formulario de creación
 * del portal: el listado queda al frente y el formulario solo aparece
 * cuando el usuario lo pide. Para agregar un formulario nuevo basta con
 * envolverlo en <FormPanel> — no requiere tocar el formulario en sí.
 *
 * `icon` recibe el ícono ya renderizado (ej. `<UserPlus className="h-4
 * w-4" />`), no la referencia al componente: los Server Components que usan
 * este Client Component no pueden pasarle una función/forwardRef (el
 * componente de lucide-react) como prop, solo un elemento JSX ya armado.
 */
export function FormPanel({
  triggerLabel,
  title,
  description,
  icon = <Plus className="h-4 w-4" />,
  variant = "brand",
  children,
}: {
  triggerLabel: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  variant?: "brand" | "accent";
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  const estilosBoton =
    variant === "accent"
      ? "bg-accent-500 text-zinc-900 shadow-accent-600/20 hover:bg-accent-400"
      : "bg-brand-600 text-white shadow-brand-600/20 hover:bg-brand-700";

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] sm:w-auto ${estilosBoton}`}
      >
        {icon}
        {triggerLabel}
      </button>
      <Modal
        open={abierto}
        onClose={() => setAbierto(false)}
        title={title}
        description={description}
      >
        {children}
      </Modal>
    </>
  );
}
