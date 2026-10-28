"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarClock,
  FileStack,
  HardHat,
  LayoutDashboard,
  UserRound,
  MessagesSquare,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ENLACES: { href: string; etiqueta: string; corta: string; icono: LucideIcon }[] = [
  { href: "/dashboard", etiqueta: "Resumen", corta: "Resumen", icono: LayoutDashboard },
  { href: "/dashboard/cartera", etiqueta: "Cartera", corta: "Cartera", icono: Wallet },
  { href: "/dashboard/unidades", etiqueta: "Unidades", corta: "Unidades", icono: Building2 },
  { href: "/dashboard/reservas", etiqueta: "Reservas", corta: "Reservas", icono: CalendarClock },
  { href: "/dashboard/pqrs", etiqueta: "PQRS", corta: "PQRS", icono: MessagesSquare },
  { href: "/dashboard/residentes", etiqueta: "Residentes", corta: "Residentes", icono: Users },
  { href: "/dashboard/prestadores", etiqueta: "Prestadores", corta: "Prestadores", icono: HardHat },
  { href: "/dashboard/documentos", etiqueta: "Documentos", corta: "Docs", icono: FileStack },
  { href: "/dashboard/cuenta", etiqueta: "Cuenta", corta: "Cuenta", icono: UserRound },
] as const;

/**
 * Una sola barra de navegación para todos los tamaños: en móvil scrollea
 * horizontalmente, desde `lg` cabe completa.
 *
 * Antes eran dos navegaciones (barra de iconos + menú hamburguesa con
 * `useState`) y la píldora activa se animaba con `layoutId` de
 * framer-motion. Eso significaba: JS para abrir/cerrar, un panel absoluto
 * que tapaba el contenido, y una animación de layout en cada navegación.
 * Una fila scrolleable no necesita estado, deja las secciones a un toque
 * de distancia y no anima nada.
 */
export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones del dashboard"
      data-tour="menu"
      className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 text-sm font-medium sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {ENLACES.map((enlace) => {
        const activo = pathname === enlace.href;
        const Icono = enlace.icono;
        return (
          <Link
            key={enlace.href}
            data-tour={`nav-${enlace.href.split("/").pop()}`}
            href={enlace.href}
            aria-current={activo ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-3 transition-colors ${
              enlace.href.endsWith("/cuenta") ? "ml-auto" : ""
            } ${
              activo
                ? "bg-brand-50 text-brand-700"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            }`}
          >
            <Icono className="h-4 w-4 shrink-0" />
            <span className="lg:hidden">{enlace.corta}</span>
            <span className="hidden lg:inline">{enlace.etiqueta}</span>
          </Link>
        );
      })}

    </nav>
  );
}
