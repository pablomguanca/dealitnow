// Service worker de Dealit (app del dueño): hace instalable la app y muestra los avisos
// push que manda el servidor (api/_lib/push.js). No guarda nada en caché: la app siempre
// se carga de la red, así cada deploy llega al instante.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', evento => evento.waitUntil(self.clients.claim()));

// El mensaje llega como JSON: { titulo, cuerpo, url, tag }.
self.addEventListener('push', evento => {
  let datos;
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    datos = { cuerpo: evento.data ? evento.data.text() : '' };
  }
  evento.waitUntil(self.registration.showNotification(datos.titulo || 'Dealit', {
    body: datos.cuerpo || '',
    icon: '/iconos/icono-192.png',
    badge: '/iconos/insignia-96.png',
    lang: 'es',
    tag: datos.tag || undefined,
    renotify: !!datos.tag,
    data: { url: datos.url || '/' }
  }));
});

// Tocar el aviso abre la propuesta: en una ventana de la app que ya esté abierta, si hay.
// Solo se usa la ruta: siempre se abre en este mismo sitio.
self.addEventListener('notificationclick', evento => {
  evento.notification.close();
  let destino = '/';
  try {
    const url = new URL(evento.notification.data?.url || '/', self.location.origin);
    destino = `${url.pathname}${url.search}`;
  } catch { }
  const href = new URL(destino, self.location.origin).href;
  evento.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Una ventana de la app del dueño (no la vista de un cliente, /p/…).
    const ventana = ventanas.find(v => {
      const { origin, pathname } = new URL(v.url);
      return origin === self.location.origin && !pathname.startsWith('/p/') && !pathname.startsWith('/portafolio/');
    });
    if (ventana) {
      try {
        const enfocada = await ventana.focus();
        if (enfocada.navigate) return await enfocada.navigate(href);
        return enfocada;
      } catch { }
    }
    return self.clients.openWindow(href);
  })());
});
