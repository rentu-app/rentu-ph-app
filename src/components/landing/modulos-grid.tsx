import { Bot, CalendarClock, HardHat, MessagesSquare, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MODULOS: {
  id?: string;
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  destacado?: boolean;
}[] = [
  {
    icono: Wallet,
    titulo: "Cartera por torre y apartamento",
    descripcion:
      "Cartera total, mora, recaudo del mes y antigüedad de la deuda. Entra a una unidad y ves su estado de cuenta, sus pagos, sus residentes y todo lo que ya se hizo para cobrarle.",
    destacado: true,
  },
  {
    icono: MessagesSquare,
    titulo: "Gestión de cobro con bitácora",
    descripcion:
      "Cada llamada, visita, acuerdo o aviso queda registrado con autor y fecha. La etapa de seguimiento (recordatorio, persuasivo, acuerdo, prejurídico) la mueves tú: nada escala solo.",
  },
  {
    icono: CalendarClock,
    titulo: "Reservas con regla de paz y salvo",
    descripcion:
      "Una unidad con cuotas vencidas no puede reservar zonas comunes, y el residente ve la razón explicada en su portal. Al registrar el pago se habilita, si el horario está libre.",
  },
  {
    icono: HardHat,
    titulo: "PQRS y prestadores externos",
    descripcion:
      "Radicación con número de radicado y respuesta trazable. Una solicitud de mantenimiento se puede convertir —de forma explícita— en una orden de servicio para seguridad, aseo, jardinería u obra.",
  },
  {
    id: "copiloto",
    icono: Bot,
    titulo: "Copiloto sobre tus documentos",
    descripcion:
      "Pregúntale al reglamento, al manual de convivencia o a las actas en lenguaje natural. Responde solo con lo que está en los documentos indexados y lo dice cuando no encuentra la respuesta.",
  },
];

export function ModulosGrid() {
  return (
    <section id="modulos" className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
            Todo gira alrededor de la cartera
          </h2>
          <p className="mt-3 text-base text-zinc-600 sm:text-lg">
            Rentu no intenta ser un ERP contable. Resuelve la pregunta que un
            administrador tiene todos los días: quién debe, desde cuándo y qué
            sigue.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6">
          {MODULOS.map((modulo) => (
            <div
              key={modulo.titulo}
              id={modulo.id}
              className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${
                modulo.destacado
                  ? "border-brand-200 bg-brand-50 sm:col-span-2"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  modulo.destacado
                    ? "bg-brand-600 text-white"
                    : "bg-zinc-900 text-white"
                }`}
              >
                <modulo.icono className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-zinc-900">
                {modulo.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {modulo.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
