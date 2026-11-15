// Lee las redirecciones y reescrituras de vercel.json y resuelve a qué archivo va una ruta,
// igual que Vercel. Lo usa el servidor de Vite (vite.config.js) para que en local la raíz se
// comporte como en producción: la landing sin la cookie de la app, la app con ella.
// Solo cubre lo que usa Dealit: parámetros :nombre y :nombre*, y condiciones `has` de cookie
// y de query (por presencia). Los destinos externos (https://…) se ignoran.

const aRegex = fuente => new RegExp(`^${fuente
  .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  .replace(/\/:\w+\*/g, '(?:/.*)?')
  .replace(/:\w+/g, '[^/]+')}/?$`);

const cumple = (condiciones = [], { query, cookies }) => condiciones.every(c =>
  c.type === 'cookie' ? Object.hasOwn(cookies, c.key)
    : c.type === 'query' ? query.has(c.key)
      : false);

export const leerCookies = (cabecera = '') => Object.fromEntries(cabecera.split(';')
  .map(par => par.trim().split('='))
  .filter(([clave]) => clave)
  .map(([clave, ...valor]) => [clave, valor.join('=')]));

// → { redirigir: '/…' } | { destino: '/archivo.html' } | null (sigue como está)
export const resolverRuta = (config, { ruta, query = new URLSearchParams(), cookies = {} }) => {
  const contexto = { query, cookies };
  for (const r of config.redirects || []) {
    if (aRegex(r.source).test(ruta) && cumple(r.has, contexto)) return { redirigir: r.destination };
  }
  for (const r of config.rewrites || []) {
    if (/^https?:/.test(r.destination)) continue;
    if (aRegex(r.source).test(ruta) && cumple(r.has, contexto)) return { destino: r.destination };
  }
  return null;
};
