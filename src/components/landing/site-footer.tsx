import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ENLACES_NAV } from "@/components/landing/nav-links";

export function SiteFooter() {
  const anio = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-8 text-center sm:px-6 sm:py-10 lg:flex-row lg:justify-between lg:text-left">
        <Link href="/" className="flex items-center gap-2">
          <Logo altura={30} className="shrink-0" />
          <span className="text-lg font-extrabold tracking-tight text-zinc-900">
            Rentu<span className="text-accent-500">PH</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
          {ENLACES_NAV.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="transition-colors hover:text-brand-700"
            >
              {enlace.etiqueta}
            </Link>
          ))}
          <Link
            href="/login"
            className="transition-colors hover:text-brand-700"
          >
            Ingresar
          </Link>
        </nav>

        <p className="text-xs text-zinc-400">
          © {anio} Rentu PH · Tablero operativo de propiedad horizontal
        </p>
      </div>
    </footer>
  );
}
