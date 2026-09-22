"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cerrarSesion } from "@/lib/actions/auth";

const ENLACES: { href: string; etiqueta: string; icono: LucideIcon }[] = [
  { href: "/dashboard", etiqueta: "Dashboard", icono: LayoutDashboard },
  { href: "/dashboard/pqrs", etiqueta: "PQRS", icono: MessagesSquare },
  { href: "/dashboard/reservas", etiqueta: "Reservas", icono: CalendarClock },
  { href: "/dashboard/propiedades", etiqueta: "Propiedades", icono: Building2 },
  { href: "/dashboard/residentes", etiqueta: "Residentes", icono: Users },
] as const;

/**
 * Por debajo de `sm` (640px) los 5 enlaces + logout no caben junto al logo
 * "Rentu" del header sin apretarse o encimarse — así que ahí se colapsa a
 * un botón hamburguesa (mismo patrón que
 * src/components/landing/mobile-nav.tsx). De `sm` en adelante se muestra la
 * barra de iconos con la píldora activa animada.
 */
export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden items-center gap-1 text-sm font-medium text-zinc-500 sm:flex dark:text-zinc-400">
        {ENLACES.map((enlace) => {
          const activo = pathname === enlace.href;
          const Icono = enlace.icono;
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              className={`relative flex min-h-11 items-center gap-1.5 rounded-md px-3 py-2 transition-colors ${
                activo
                  ? "text-brand-700 dark:text-brand-400"
                  : "hover:text-brand-700 dark:hover:text-brand-400"
              }`}
            >
              {activo ? (
                <motion.span
                  layoutId="rentu-nav-pill"
                  className="absolute inset-0 rounded-md bg-brand-50 dark:bg-brand-950/40"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                />
              ) : null}
              <Icono className="relative h-4 w-4" />
              <span className="relative hidden lg:inline">{enlace.etiqueta}</span>
            </Link>
          );
        })}

        <span className="hidden items-center gap-1.5 px-3 py-2 text-zinc-300 opacity-60 lg:flex dark:text-zinc-700">
          <Building2 className="h-4 w-4" />
          Copropiedades
        </span>
        <span className="hidden items-center gap-1.5 px-3 py-2 text-zinc-300 opacity-60 lg:flex dark:text-zinc-700">
          <Wallet className="h-4 w-4" />
          Cartera
        </span>

        <form action={cerrarSesion} className="ml-1">
          <button
            type="submit"
            className="flex min-h-11 items-center gap-1.5 rounded-md px-3 py-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Cerrar sesión</span>
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
        className="flex h-11 w-11 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {abierto ? (
        <div className="absolute inset-x-0 top-full z-40 border-b border-zinc-200 bg-white px-4 py-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <nav className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {ENLACES.map((enlace) => {
              const activo = pathname === enlace.href;
              const Icono = enlace.icono;
              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  onClick={() => setAbierto(false)}
                  className={`flex min-h-11 items-center gap-3 rounded-md px-3 ${
                    activo
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icono className="h-4 w-4 shrink-0" />
                  {enlace.etiqueta}
                </Link>
              );
            })}

            <span className="flex min-h-11 items-center gap-3 px-3 text-zinc-300 opacity-60 dark:text-zinc-700">
              <Building2 className="h-4 w-4 shrink-0" />
              Copropiedades
            </span>
            <span className="flex min-h-11 items-center gap-3 px-3 text-zinc-300 opacity-60 dark:text-zinc-700">
              <Wallet className="h-4 w-4 shrink-0" />
              Cartera
            </span>

            <form action={cerrarSesion} className="mt-1 border-t border-zinc-100 pt-1 dark:border-zinc-800">
              <button
                type="submit"
                className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
