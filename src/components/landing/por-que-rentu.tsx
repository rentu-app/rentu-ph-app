import Link from "next/link";
import { Eye, ListChecks, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const DIFERENCIADORES: { icono: LucideIcon; titulo: string; descripcion: string }[] = [
  {
    icono: Eye,
    titulo: "Una sola versión de la verdad",
    descripcion:
      "El saldo de una unidad se calcula siempre igual: total facturado más recargos, menos pagos registrados. Lo mismo ve la administración en el tablero y el residente en su portal.",
  },
  {
    icono: ListChecks,
    titulo: "Trazabilidad de la gestión",
    descripcion:
      "Cuando alguien pregunta qué se hizo con el apartamento 302, la respuesta está en su bitácora: quién llamó, qué se acordó y cuándo. No en la memoria de quien estaba antes.",
  },
  {
    icono: Users,
    titulo: "Reglas que se aplican solas",
    descripcion:
      "El bloqueo de reservas por cartera vencida se valida en el servidor cada vez que se radica y cada vez que se confirma. No depende de que alguien lo recuerde.",
  },
];

export function PorQueRentu() {
  return (
    <section id="por-que-rentu" className="bg-zinc-50 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
            ¿Por qué Rentu?
          </h2>
          <p className="mt-3 text-base text-zinc-600 sm:text-lg">
            Menos hojas de cálculo sueltas y menos WhatsApp perdido, sin cambiar
            la forma en que ya trabaja la administración.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:mt-12 sm:grid-cols-3">
          {DIFERENCIADORES.map((item) => (
            <div key={item.titulo}>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
                <item.icono className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-zinc-900">
                {item.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {item.descripcion}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 rounded-2xl bg-brand-700 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-lg font-bold text-white sm:text-xl">
              ¿Quieres ver cómo se lee la cartera de un conjunto?
            </p>
            <p className="mt-1 text-sm text-brand-100">
              Entra con el usuario de demostración y recorre un conjunto ficticio
              de tres torres y 24 apartamentos.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-md bg-accent-400 px-6 text-base font-semibold text-zinc-900 transition-colors hover:bg-accent-300"
          >
            Entrar a la demo
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Rentu no es un sistema de contabilidad, facturación electrónica, pagos
          bancarios, nómina, firma de contratos ni gestión judicial. Las etapas
          prejurídico y jurídico son clasificaciones de seguimiento, no asesoría
          legal.
        </p>
      </div>
    </section>
  );
}
