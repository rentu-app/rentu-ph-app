"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, Home, LogOut, MessagesSquare, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cerrarSesion } from "@/lib/actions/auth";

const ENLACES: { href: string; etiqueta: string; icono: LucideIcon }[] = [
  { href: "/portal", etiqueta: "Inicio", icono: Home },
  { href: "/portal/cartera", etiqueta: "Mi cartera", icono: Wallet },
  { href: "/portal/pqrs", etiqueta: "Mis PQRS", icono: MessagesSquare },
  { href: "/portal/reservas", etiqueta: "Reservas", icono: CalendarClock },
] as const;

/**
 * Misma decisión que en el dashboard: una sola barra scrolleable en vez de
 * barra + menú hamburguesa con estado. Con cuatro enlaces cabe completa
 * incluso en 375 px, así que el residente nunca tiene que abrir un menú para
 * ver su cartera.
 */
export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones del portal"
      className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 text-sm font-medium sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {ENLACES.map((enlace) => {
        const activo = pathname === enlace.href;
        const Icono = enlace.icono;
        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            aria-current={activo ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-3 transition-colors ${
              activo
                ? "bg-brand-50 text-brand-700"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            }`}
          >
            <Icono className="h-4 w-4 shrink-0" />
            {enlace.etiqueta}
          </Link>
        );
      })}

      <form action={cerrarSesion} className="ml-auto shrink-0 pl-2">
        <button
          type="submit"
          aria-label="Cerrar sesión"
          className="flex min-h-11 items-center gap-1.5 rounded-md px-3 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </form>
    </nav>
  );
}
