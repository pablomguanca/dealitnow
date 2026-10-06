// Utilidades puras de texto, números, fechas y DOM.

export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export const obtener = (obj, ruta) => ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
export const asignar = (obj, ruta, valor) => {
  const claves = ruta.split('.');
  const ultima = claves.pop();
  const destino = claves.reduce((o, k) => (o[k] ??= {}), obj);
  destino[ultima] = valor;
};

export const numero = v => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export const texto = v => (typeof v === 'string' ? v : v == null ? '' : String(v));

export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const lineas = t => texto(t).split('\n').map(l => l.replace(/^[\s\-•*·]+/, '').trim()).filter(Boolean);

export const parrafos = t => texto(t)
  .split(/\n\s*\n/)
  .map(p => p.trim())
  .filter(Boolean)
  .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
  .join('');

export const dinero = (n, moneda) => {
  const decimales = Math.round(n * 100) % 100 !== 0 ? 2 : 0;
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda, minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(n);
  } catch {
    return `${moneda} ${n.toFixed(decimales)}`;
  }
};

export const cantidadTexto = n => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n);

export const desdeISO = iso => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null;
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
};

export const fechaLarga = fecha => (fecha ? fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
