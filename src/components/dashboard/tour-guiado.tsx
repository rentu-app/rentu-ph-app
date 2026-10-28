"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import "driver.js/dist/driver.css";
import { marcarTourVisto } from "@/lib/actions/tour";

export const EVENTO_INICIAR_TOUR = "rentu:iniciar-tour";

const PASOS = [
  {
    element: '[data-tour="cambiar-copropiedad"]',
    title: "Cambia de copropiedad",
    description: "Aquí vuelves a la lista para gestionar otra copropiedad sin cerrar sesión.",
  },
  {
    element: '[data-tour="menu"]',
    title: "Tu menú",
    description: "Desde aquí llegas a cada módulo. Deslízalo si no caben todos.",
  },
  {
    element: '[data-tour="nav-cartera"]',
    title: "Cartera",
    description: "Saldo, mora y gestión de cobro de cada unidad, y las cuentas de cobro del periodo.",
  },
  {
    element: '[data-tour="nav-pqrs"]',
    title: "PQRS",
    description: "Peticiones, quejas y reclamos de los residentes, con su respuesta.",
  },
  {
    element: '[data-tour="nav-reservas"]',
    title: "Reservas",
    description: "Zonas comunes y solicitudes por aprobar.",
  },
  {
    element: '[data-tour="primeros-pasos"]',
    title: "Primeros pasos",
    description: "Tu lista para dejar lista la copropiedad. Se marca sola a medida que avanzas.",
  },
];

/**
 * Tour guiado con driver.js, cargado con `import()` solo en el cliente. Se
 * lanza solo la primera vez (`autoLanzar`, decidido en el servidor desde
 * `user_metadata.tour_visto`) y cuando se pulsa "Ver tutorial" (evento
 * `EVENTO_INICIAR_TOUR`). Al terminar o saltar se marca como visto.
 */
export function TourGuiado({ autoLanzar }: { autoLanzar: boolean }) {
  const pathname = usePathname();
  const activo = useRef(false);

  const iniciar = useCallback(async () => {
    if (activo.current) return;

    const pasos = PASOS.filter((paso) => document.querySelector(paso.element));
    if (pasos.length === 0) return;
    activo.current = true;

    const { driver } = await import("driver.js");
    const sinAnimacion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tour = driver({
      steps: pasos.map((paso) => ({
        element: paso.element,
        popover: { title: paso.title, description: paso.description },
      })),
      overlayColor: "#2563eb",
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 10,
      animate: !sinAnimacion,
      smoothScroll: !sinAnimacion,
      allowClose: false,
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      showButtons: ["previous", "next"],
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Listo",
      popoverClass: "rentu-tour",
      // El menú scrollea en horizontal en móvil: se trae la pestaña a la vista
      // ANTES de resaltarla para que el recuadro caiga sobre ella.
      onHighlightStarted: (elemento) => {
        elemento?.scrollIntoView({ block: "nearest", inline: "center", behavior: "instant" });
      },
      onPopoverRender: (popover, { driver: instancia }) => {
        const saltar = document.createElement("button");
        saltar.type = "button";
        saltar.textContent = "Saltar";
        saltar.className = "rentu-tour-saltar";
        saltar.addEventListener("click", () => instancia.destroy());
        popover.footerButtons.prepend(saltar);
      },
      onDestroyed: () => {
        activo.current = false;
        void marcarTourVisto();
      },
    });
    tour.drive();
  }, []);

  useEffect(() => {
    function alPedirTour() {
      void iniciar();
    }
    window.addEventListener(EVENTO_INICIAR_TOUR, alPedirTour);
    return () => window.removeEventListener(EVENTO_INICIAR_TOUR, alPedirTour);
  }, [iniciar]);

  useEffect(() => {
    if (!autoLanzar || pathname !== "/dashboard") return;
    // Espera a que se pinte el dashboard (Suspense) antes de buscar los elementos.
    const temporizador = window.setTimeout(() => void iniciar(), 900);
    return () => window.clearTimeout(temporizador);
  }, [autoLanzar, pathname, iniciar]);

  return null;
}
