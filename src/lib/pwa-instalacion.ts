/**
 * Estado de instalación de la PWA, compartido por los componentes cliente.
 * `beforeinstallprompt` se dispara una sola vez por carga de página (y puede
 * llegar antes de que el aviso se monte), por eso se captura aquí desde el
 * layout raíz y se guarda hasta que alguien lo use.
 */
type EventoInstalacion = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const CLAVE_CERRADO = "rentu_instalar_cerrado";
const oyentes = new Set<() => void>();
let evento: EventoInstalacion | null = null;
let capturando = false;

function notificar() {
  oyentes.forEach((oyente) => oyente());
}

export function iniciarCapturaInstalacion() {
  if (capturando || typeof window === "undefined") return;
  capturando = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    evento = e as EventoInstalacion;
    notificar();
  });
  window.addEventListener("appinstalled", () => {
    evento = null;
    notificar();
  });
}

export function suscribirInstalacion(oyente: () => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

export type ModoInstalacion = "android" | "ios" | null;

/** Qué aviso mostrar: null si ya está instalada, se cerró, no es móvil o no se puede instalar. */
export function leerModoInstalacion(): ModoInstalacion {
  if (typeof window === "undefined") return null;

  try {
    if (window.localStorage.getItem(CLAVE_CERRADO) === "1") return null;
  } catch {
    // localStorage bloqueado (modo privado): el aviso funciona igual, solo no recuerda el cierre.
  }

  return leerModoDisponible();
}

/** Igual que `leerModoInstalacion` pero ignora si el aviso se cerró: alimenta el botón permanente. */
export function leerModoDisponible(): ModoInstalacion {
  if (typeof window === "undefined") return null;

  const instalada =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (instalada) return null;

  const esMovil =
    window.matchMedia("(max-width: 1023px)").matches && window.matchMedia("(pointer: coarse)").matches;
  if (!esMovil) return null;

  if (evento) return "android";

  const ua = navigator.userAgent;
  const esIos = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return esIos ? "ios" : null;
}

export async function instalarApp() {
  if (!evento) return;
  await evento.prompt();
  await evento.userChoice;
  evento = null;
  notificar();
}

export function cerrarAvisoInstalacion() {
  try {
    window.localStorage.setItem(CLAVE_CERRADO, "1");
  } catch {
    // sin localStorage: se oculta solo hasta recargar.
  }
  // El evento se conserva: el botón permanente "Instalar app" lo sigue usando.
  notificar();
}
