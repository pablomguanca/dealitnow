import {
  texto,
  esc,
  dinero
} from './formato.js';
import { TEMAS } from '../modelo.js';
import { fechaDeAceptacion } from './render.js';

export const ESTADOS_PROPUESTA = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada'
};

export const FILTROS_PANEL = [
  ['todas', 'Todas'],
  ['draft', 'Borradores'],
  ['sent', 'Enviadas'],
  ['accepted', 'Aceptadas'],
  ['rejected', 'Rechazadas']
];

export const fechaDe = ts => (ts && typeof ts.toDate === 'function' ? ts.toDate() : null);

export const sinAcentos = t => texto(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const haceCuanto = fecha => {
  if (!fecha) return '';
  const segundos = Math.round((fecha - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const unidades = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60]
  ];
  for (const [unidad, s] of unidades) {
    if (Math.abs(segundos) >= s) return rtf.format(Math.round(segundos / s), unidad);
  }
  return 'recién';
};

export const tiempoHTML = (fecha, etiqueta) =>
  `<time datetime="${fecha.toISOString()}" title="${esc(fecha.toLocaleString('es-AR'))}">${esc(etiqueta)}</time>`;

// Qué pasó con la propuesta, en una línea: aceptada, vista, sin abrir o solo editada.
export const seguimientoHTML = p => {
  if (p.aceptacion) {
    const fecha = fechaDeAceptacion(p.aceptacion);
    const nombre = texto(p.aceptacion.nombre).split(' ')[0];
    return `<strong class="propuesta__hito">${fecha ? tiempoHTML(fecha, `Aceptada por ${nombre} ${haceCuanto(fecha)}`) : `Aceptada por ${esc(nombre)}`}</strong>`;
  }
  const vistas = Number(p.vistas) || 0;
  const vista = fechaDe(p.vistoUltimo);
  if (vistas > 0 && vista) return tiempoHTML(vista, `${vistas === 1 ? 'Vista 1 vez' : `Vista ${vistas} veces`} · ${haceCuanto(vista)}`);
  if (p.publico === true) return 'Sin abrir todavía';
  const editada = fechaDe(p.updatedAt);
  return editada ? tiempoHTML(editada, `Editada ${haceCuanto(editada)}`) : '';
};

// Color estable por cliente para el avatar con su inicial.
export const tonoDe = nombre => [...texto(nombre)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) % 6;

export const estadoDe = p => (ESTADOS_PROPUESTA[p.status] ? p.status : 'draft');

export const propuestaHTML = p => {
  const titulo = texto(p.title).trim() || 'Sin título';
  const cliente = texto(p.clientName).trim();
  const moneda = p.aceptacion?.moneda || p.payload?.inversion?.moneda || 'USD';
  const importe = p.aceptacion ? Number(p.aceptacion.inicial) : Number(p.amount);
  const monto = importe > 0 ? dinero(importe, moneda) : '';
  const estadoP = estadoDe(p);
  const inicial = (cliente || titulo).trim().charAt(0).toUpperCase() || '·';
  return `
    <li class="propuesta">
      <a class="propuesta__abrir" href="/propuesta/${encodeURIComponent(p.id)}" data-accion="abrir-propuesta" data-id="${esc(p.id)}">
        <span class="propuesta__avatar" data-tono="${tonoDe(cliente || titulo)}" aria-hidden="true">${esc(inicial)}</span>
        <span class="propuesta__textos">
          <span class="propuesta__titulo">${esc(titulo)}</span>
          <span class="propuesta__cliente">${cliente ? esc(cliente) : 'Sin cliente'}</span>
        </span>
      </a>
      <span class="propuesta__monto">${esc(monto)}</span>
      <span class="propuesta__estado propuesta__estado--${estadoP}">${ESTADOS_PROPUESTA[estadoP]}</span>
      <span class="propuesta__fecha">${seguimientoHTML(p)}</span>
      <span class="propuesta__acciones">
        ${p.publico === true ? `<button type="button" class="icono-boton icono-boton--activo" data-accion="copiar-link-propuesta" data-id="${esc(p.id)}" aria-label="Copiar el link de «${esc(titulo)}»" title="Link activo: copiar">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.8 9.2a3 3 0 0 0 4.3 0l2-2a3 3 0 0 0-4.3-4.3l-.9.9M9.2 6.8a3 3 0 0 0-4.3 0l-2 2a3 3 0 0 0 4.3 4.3l.9-.9"/></svg>
        </button>` : ''}
        <button type="button" class="icono-boton" data-accion="duplicar-propuesta" data-id="${esc(p.id)}" aria-label="Duplicar «${esc(titulo)}»" title="Duplicar">
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.2"/><path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"/></svg>
        </button>
        <button type="button" class="icono-boton icono-boton--peligro" data-accion="borrar-propuesta" data-id="${esc(p.id)}" aria-label="Borrar «${esc(titulo)}»" title="Borrar">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/></svg>
        </button>
      </span>
    </li>`;
};

export const filtrosHTML = (propuestas = [], filtroEstado = 'todas') => {
  const cuenta = id => (id === 'todas' ? propuestas.length : propuestas.filter(p => estadoDe(p) === id).length);
  return FILTROS_PANEL
    .filter(([id]) => id !== 'rejected' || cuenta(id) > 0)
    .map(([id, nombre]) => `<button type="button" class="filtro" data-accion="filtrar" data-estado="${id}" aria-pressed="${filtroEstado === id}">${nombre} <span class="filtro__cuenta">${cuenta(id)}</span></button>`)
    .join('');
};

// Montos por moneda: el principal grande y el resto debajo.
export const montosPorMoneda = lista => {
  const sumas = new Map();
  lista.forEach(p => {
    const m = p.aceptacion.moneda || 'USD';
    sumas.set(m, (sumas.get(m) || 0) + (Number(p.aceptacion.inicial) || 0));
  });
  return [...sumas].sort((a, b) => b[1] - a[1]).map(([m, total]) => dinero(total, m));
};

export const metricaHTML = (valor, etiqueta, detalle, destacada = false) => `
  <div class="metrica${destacada ? ' metrica--destacada' : ''}">
    <span class="metrica__etiqueta">${esc(etiqueta)}</span>
    <span class="metrica__valor">${esc(valor)}</span>
    <span class="metrica__detalle">${esc(detalle)}</span>
  </div>`;

export const metricasHTML = (propuestas = []) => {
  const ahora = Date.now();
  const esperando = propuestas.filter(p => p.status === 'sent' && !p.aceptacion);
  const sinAbrir = esperando.filter(p => !(Number(p.vistas) > 0)).length;
  const abiertasSemana = propuestas.filter(p => {
    const f = fechaDe(p.vistoUltimo);
    return f && ahora - f < 7 * 86400000;
  }).length;
  const aceptadas = propuestas.filter(p => p.aceptacion);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const delMes = aceptadas.filter(p => (fechaDeAceptacion(p.aceptacion) || 0) >= inicioMes);
  const enviadas = propuestas.filter(p => ['sent', 'accepted', 'rejected'].includes(p.status)).length;
  const tasa = enviadas ? Math.round((aceptadas.length / enviadas) * 100) : null;
  const [montoPrincipal, ...otrosMontos] = montosPorMoneda(delMes);
  return [
    metricaHTML(esperando.length, 'Esperando respuesta', esperando.length ? (sinAbrir ? `${sinAbrir} sin abrir todavía` : 'Todas abiertas') : 'Nada pendiente'),
    metricaHTML(abiertasSemana, 'Abiertas esta semana', 'Propuestas que tus clientes miraron'),
    metricaHTML(delMes.length, 'Aceptadas este mes', tasa === null ? 'Todavía no enviaste ninguna' : `${tasa} % de las que enviaste`),
    metricaHTML(montoPrincipal || '—', 'Aceptado este mes', otrosMontos.length ? `y ${otrosMontos.join(' · ')}` : 'Total inicial aceptado', true)
  ].join('');
};

export const portafolioItemHTML = (pf, { conNube = false } = {}) => {
  const titulo = texto(pf.title).trim() || 'Portfolio sin título';
  const subtitulo = texto(pf.subtitle).trim() || 'Sin subtítulo';
  const cant = Number(pf.projectCount) || (pf.payload?.proyectos?.length || 0);
  const cantTexto = cant === 1 ? '1 proyecto' : `${cant} proyectos`;
  const temaNombre = TEMAS[pf.theme]?.nombre || 'Elegante oscuro';
  const inicial = titulo.charAt(0).toUpperCase() || 'P';
  const editada = fechaDe(pf.updatedAt) || (typeof pf.updatedAt === 'string' ? new Date(pf.updatedAt) : null);
  const tiempo = editada && !Number.isNaN(editada.getTime()) ? tiempoHTML(editada, `Editado ${haceCuanto(editada)}`) : '';
  const esNube = !!(conNube && /^[A-Za-z0-9]{20}$/.test(pf.id));
  return `
    <li class="propuesta">
      <a class="propuesta__abrir" href="/editar-portafolio/${encodeURIComponent(pf.id)}" data-accion="abrir-portafolio" data-id="${esc(pf.id)}">
        <span class="propuesta__avatar" data-tono="${tonoDe(titulo)}" aria-hidden="true">${esc(inicial)}</span>
        <span class="propuesta__textos">
          <span class="propuesta__titulo">${esc(titulo)}</span>
          <span class="propuesta__cliente">${esc(subtitulo)}</span>
        </span>
      </a>
      <span class="propuesta__monto">${esc(cantTexto)}</span>
      <span class="propuesta__estado propuesta__estado--sent">${esc(temaNombre)}</span>
      <span class="propuesta__fecha">${tiempo}</span>
      <span class="propuesta__acciones">
        ${esNube && pf.publico === true ? `<button type="button" class="icono-boton icono-boton--activo" data-accion="copiar-link-portafolio" data-id="${esc(pf.id)}" aria-label="Copiar link de «${esc(titulo)}»" title="Link activo: copiar">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.8 9.2a3 3 0 0 0 4.3 0l2-2a3 3 0 0 0-4.3-4.3l-.9.9M9.2 6.8a3 3 0 0 0-4.3 0l-2 2a3 3 0 0 0 4.3 4.3l.9-.9"/></svg>
        </button>` : ''}
        <button type="button" class="icono-boton" data-accion="duplicar-portafolio" data-id="${esc(pf.id)}" aria-label="Duplicar «${esc(titulo)}»" title="Duplicar para otro tipo de cliente">
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.2"/><path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"/></svg>
        </button>
        <button type="button" class="icono-boton icono-boton--peligro" data-accion="borrar-portafolio" data-id="${esc(pf.id)}" aria-label="Borrar «${esc(titulo)}»" title="Borrar">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/></svg>
        </button>
      </span>
    </li>`;
};
