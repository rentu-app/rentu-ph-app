/**
 * Vista previa ilustrativa del tablero de cartera — no es una captura real,
 * es un mockup en HTML/Tailwind para el Hero. Las cifras son inventadas y no
 * corresponden a ninguna copropiedad.
 */
export function DashboardMockup() {
  const torres = [
    { nombre: "Torre 1", porcentaje: 54, monto: "$6,8M" },
    { nombre: "Torre 2", porcentaje: 31, monto: "$3,9M" },
    { nombre: "Torre 3", porcentaje: 15, monto: "$1,9M" },
  ];

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg">
      <div className="flex items-center gap-1.5 pb-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
        <span className="ml-2 text-[10px] font-medium text-zinc-400">
          Cartera · Conjunto ficticio
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-brand-50 p-2.5">
          <p className="text-[10px] font-medium text-brand-700">Por cobrar</p>
          <p className="text-base font-bold tabular-nums text-brand-700">$12,6M</p>
        </div>
        <div className="rounded-lg bg-red-50 p-2.5">
          <p className="text-[10px] font-medium text-red-700">Vencida</p>
          <p className="text-base font-bold tabular-nums text-red-700">$7,4M</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2.5">
          <p className="text-[10px] font-medium text-emerald-700">Recaudo</p>
          <p className="text-base font-bold tabular-nums text-emerald-700">86%</p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
        <p className="text-[10px] font-semibold text-zinc-600">
          Cartera por torre
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {torres.map((torre) => (
            <div key={torre.nombre} className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-zinc-600">
                <span>{torre.nombre}</span>
                <span className="tabular-nums">{torre.monto}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="barra-valor h-full rounded-full bg-brand-600"
                  style={{ "--valor": torre.porcentaje } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
        <div>
          <p className="text-[11px] font-semibold text-zinc-800">Apto 302</p>
          <p className="text-[10px] text-zinc-500">Torre 3 · 74 días de mora</p>
        </div>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
          Cobro persuasivo
        </span>
      </div>
    </div>
  );
}
