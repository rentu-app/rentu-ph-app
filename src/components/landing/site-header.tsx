import Link from "next/link";
import { Building2 } from "lucide-react";
import { MobileNav } from "@/components/landing/mobile-nav";
import { ENLACES_NAV } from "@/components/landing/nav-links";

/**
 * Header sólido, no `bg-white/90 backdrop-blur`: un desenfoque de fondo en un
 * elemento `sticky` obliga al navegador a recomponer el blur de todo lo que
 * pasa por debajo en cada frame del scroll, y en Safari móvil eso se siente
 * como scroll a tirones.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white pt-[env(safe-area-inset-top)]">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-zinc-900 sm:text-xl">
            Rentu<span className="text-accent-500">PH</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 md:flex">
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

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/registro"
            className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Registrarse
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Ingresar
          </Link>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
