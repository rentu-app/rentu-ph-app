import { Suspense } from "react";
import { AvisoCuentaEliminada } from "@/components/landing/aviso-cuenta-eliminada";
import { SiteHeader } from "@/components/landing/site-header";
import { HeroSection } from "@/components/landing/hero-section";
import { ModulosGrid } from "@/components/landing/modulos-grid";
import { PorQueRentu } from "@/components/landing/por-que-rentu";
import { SiteFooter } from "@/components/landing/site-footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={null}>
        <AvisoCuentaEliminada />
      </Suspense>
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <ModulosGrid />
        <PorQueRentu />
      </main>
      <SiteFooter />
    </div>
  );
}
