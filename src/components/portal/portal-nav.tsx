"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, Home, LogOut, Menu, MessagesSquare, Wallet, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cerrarSesion } from "@/lib/actions/auth";

const ENLACES: { href: string; etiqueta: string; icono: LucideIcon }[] = [
  { href: "/portal", etiqueta: "Inicio", icono: Home },
  { href: "/portal/cartera", etiqueta: "Mi cartera", icono: Wallet },
  { href: "/portal/pqrs", etiqueta: "Mis PQRS", icono: MessagesSquare },
  { href: "/portal/reservas", etiqueta: "Mis reservas", icono: CalendarClock },
] as const;

/**
 * Igual que DashboardNav: por debajo de `sm` colapsa a hamburguesa (más
 * espacio para el selector de inmueble cuando el residente tiene varios).
 */
export function PortalNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden items-center gap-1 text-sm font-medium text-zinc-500 sm:flex">
        {ENLACES.map((enlace) => {
          const activo = pathname === enlace.href;
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              className={`flex min-h-11 items-center px-3 py-2 ${
                activo ? "text-brand-700" : "hover:text-brand-700"
              }`}
            >
              {enlace.etiqueta}
            </Link>
          );
        })}
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="flex min-h-11 items-center px-3 py-2 hover:text-zinc-700"
          >
            Cerrar sesión
          </button>
        </form>
      </nav>

      <MenuMovil pathname={pathname} />
    </>
  );
}

function MenuMovil({ pathname }: { pathname: string }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label="Abrir menú"
        className="flex h-11 w-11 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100"
      >
        {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {abierto ? (
        <div className="absolute inset-x-0 top-full z-40 border-b border-zinc-200 bg-white px-4 py-3 shadow-lg">
          <nav className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            {ENLACES.map((enlace) => {
              const activo = pathname === enlace.href;
              const Icono = enlace.icono;
              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  onClick={() => setAbierto(false)}
                  className={`flex min-h-11 items-center gap-3 rounded-md px-3 ${
                    activo ? "bg-brand-50 text-brand-700" : "hover:bg-zinc-50"
                  }`}
                >
                  <Icono className="h-4 w-4 shrink-0" />
                  {enlace.etiqueta}
                </Link>
              );
            })}

            <form action={cerrarSesion} className="mt-1 border-t border-zinc-100 pt-1">
              <button
                type="submit"
                className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-zinc-500 hover:bg-zinc-50"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Cerrar sesión
              </button>
            </form>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
