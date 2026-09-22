"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ENLACES_NAV } from "@/components/landing/nav-links";

export function MobileNav() {
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
        <div className="absolute inset-x-0 top-full border-b border-zinc-200 bg-white px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 shadow-lg">
          <nav className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            {ENLACES_NAV.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                onClick={() => setAbierto(false)}
                className="flex min-h-11 items-center"
              >
                {enlace.etiqueta}
              </Link>
            ))}
            <Link
              href="/registro"
              onClick={() => setAbierto(false)}
              className="mt-2 flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-4 text-center font-semibold text-zinc-700"
            >
              Registrarse
            </Link>
            <Link
              href="/login"
              onClick={() => setAbierto(false)}
              className="flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-center font-semibold text-white"
            >
              Ingresar al Portal
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
