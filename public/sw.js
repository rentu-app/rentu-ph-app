/*
 * Service worker mínimo de Rentu PH.
 *
 * Reglas (no negociables):
 *  - Solo se cachean ESTÁTICOS del mismo origen: /_next/static, /brand, /icons
 *    y fuentes. Estrategia network-first (siempre se intenta la red primero).
 *  - NUNCA se cachean páginas, /api, server actions ni nada con cookies: los
 *    datos de la copropiedad siempre vienen frescos del servidor.
 *  - Sin conexión, una navegación muestra /offline (página estática).
 */
const VERSION = "rentu-sw-v1";
const CACHE = `${VERSION}-estaticos`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/brand/logo.svg", "/icons/icon-192.png"];

const RUTAS_ESTATICAS = [/^\/_next\/static\//, /^\/brand\//, /^\/icons\//, /\.(?:woff2?|ttf|otf)$/];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

function esEstatico(url) {
  return RUTAS_ESTATICAS.some((patron) => patron.test(url.pathname));
}

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.method !== "GET") return; // server actions y formularios: directo a la red

  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  // Server actions y RSC llevan estas cabeceras: nunca se tocan.
  if (peticion.headers.has("next-action") || peticion.headers.has("rsc")) return;

  // Navegación: red siempre; solo si falla (sin conexión) se muestra /offline.
  if (peticion.mode === "navigate") {
    evento.respondWith(
      fetch(peticion).catch(async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(OFFLINE_URL)) ?? Response.error();
      })
    );
    return;
  }

  if (!esEstatico(url)) return; // todo lo demás pasa sin intervenir

  // Estáticos: network-first con respaldo en caché.
  evento.respondWith(
    fetch(peticion)
      .then((respuesta) => {
        if (respuesta.ok && respuesta.type === "basic") {
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put(peticion, copia));
        }
        return respuesta;
      })
      .catch(async () => (await caches.match(peticion)) ?? Response.error())
  );
});
