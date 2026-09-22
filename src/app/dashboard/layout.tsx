import { Building2 } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <div className="relative min-h-full overflow-x-clip bg-zinc-50 dark:bg-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-brand-50 via-accent-50/30 to-transparent dark:from-brand-950/30 dark:via-accent-950/10 dark:to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 -z-10 h-72 w-72 rounded-full bg-accent-200/30 blur-3xl dark:bg-accent-500/10"
      />

      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
                Rentu
              </p>
              <p className="text-xs leading-tight text-zinc-500 dark:text-zinc-400">
                Hub Operativo de PH
              </p>
            </div>
          </div>
          <DashboardNav />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
