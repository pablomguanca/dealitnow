// Lee las redirecciones y reescrituras de vercel.json y resuelve a qué archivo va una ruta,
// igual que Vercel. Lo usa el servidor de Vite (vite.config.js) para que en local la raíz se
// comporte como en producción: la landing sin la cookie de la app, la app con ella.
// Solo cubre lo que usa Dealit: parámetros :nombre y :nombre*, y condiciones `has` de cookie
// y de query (por presencia) y de cabecera (con `value`, una expresión regular).
// Los destinos externos (https://…) se ignoran.

const aRegex = fuente => new RegExp(`^${fuente
  .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  .replace(/\/:(\w+)\*/g, '(?<$1>/.*)?')
  .replace(/:(\w+)/g, '(?<$1>[^/]+)')}/?$`);

const cumple = (condiciones = [], { query, cookies, cabeceras }) => condiciones.every(c => {
  if (c.type === 'cookie') return Object.hasOwn(cookies, c.key);
  if (c.type === 'query') return query.has(c.key);
  if (c.type === 'header') {
    const valor = cabeceras[c.key.toLowerCase()];
    return valor !== undefined && (c.value === undefined || new RegExp(`^(?:${c.value})$`).test(valor));
  }
  return false;
});

// Los :parámetros de la fuente, en el destino.
const completar = (destino, valores = {}) => destino.replace(/:(\w+)/g, (todo, nombre) =>
  (nombre in valores ? valores[nombre] ?? '' : todo));

export const leerCookies = (cabecera = '') => Object.fromEntries(cabecera.split(';')
  .map(par => par.trim().split('='))
  .filter(([clave]) => clave)
  .map(([clave, ...valor]) => [clave, valor.join('=')]));

// → { redirigir: '/…' } | { destino: '/archivo' } | null (sigue como está)
export const resolverRuta = (config, { ruta, query = new URLSearchParams(), cookies = {}, cabeceras = {} }) => {
  const contexto = { query, cookies, cabeceras };
  for (const r of config.redirects || []) {
    const m = aRegex(r.source).exec(ruta);
    if (m && cumple(r.has, contexto)) return { redirigir: completar(r.destination, m.groups) };
  }
  for (const r of config.rewrites || []) {
    if (/^https?:/.test(r.destination)) continue;
    const m = aRegex(r.source).exec(ruta);
    if (m && cumple(r.has, contexto)) return { destino: completar(r.destination, m.groups) };
  }
  return null;
};
