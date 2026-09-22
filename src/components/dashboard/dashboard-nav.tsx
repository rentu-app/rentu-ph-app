"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  Users,
  Wallet,
  CalendarClock,
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

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
      {ENLACES.map((enlace) => {
        const activo = pathname === enlace.href;
        const Icono = enlace.icono;
        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            className={`relative flex items-center gap-1.5 rounded-md px-3 py-2 transition-colors ${
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
            <span className="relative hidden sm:inline">{enlace.etiqueta}</span>
          </Link>
        );
      })}

      <span className="hidden items-center gap-1.5 px-3 py-2 text-zinc-300 opacity-60 dark:text-zinc-700 md:flex">
        <Building2 className="h-4 w-4" />
        Copropiedades
      </span>
      <span className="hidden items-center gap-1.5 px-3 py-2 text-zinc-300 opacity-60 dark:text-zinc-700 md:flex">
        <Wallet className="h-4 w-4" />
        Cartera
      </span>

      <form action={cerrarSesion} className="ml-1">
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </form>
    </nav>
  );
}
