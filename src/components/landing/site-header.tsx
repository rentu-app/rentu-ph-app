import Link from "next/link";
import { Building2 } from "lucide-react";
import { MobileNav } from "@/components/landing/mobile-nav";
import { ENLACES_NAV } from "@/components/landing/nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-zinc-900">
            Rentu<span className="text-accent-500">PH</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 sm:flex">
          {ENLACES_NAV.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="transition-colors hover:text-brand-700"
            >
              {enlace.etiqueta}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/registro"
            className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Registrarse
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Ingresar al Portal
          </Link>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
