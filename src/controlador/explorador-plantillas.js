// Explorador de plantillas del editor («Explorar más plantillas»): ocupa la columna del
// editor (en celular, la hoja) con todas las plantillas de propuesta en miniatura, para
// probarlas sobre la propuesta abierta sin salir de ella. Elegir una pasa por
// elegirPlantillaPropuesta (el mismo «Solo aplicar el diseño / Cargar texto y diseño»
// de los atajos, y se puede deshacer). El explorador queda abierto para seguir probando.

import { $, $$, esc } from '../lib/formato.js';
import { PLANTILLAS } from '../modelo.js';
import { ctx } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { elegirPlantillaPropuesta, marcarPlantillaActiva } from './diseno.js';
import { fijarHoja } from './hoja.js';
import {
  CATEGORIAS,
  coincide,
  dibujarPlantilla,
  escalarMiniatura,
  observadorTamano
} from './galeria-plantillas.js';

let armado = false;
let categoriaActiva = 'todas';
let scrollEditor = 0;

const abierto = () => !$('#explorador-plantillas')?.hidden;

const filtrar = () => {
  const busqueda = $('#explorador-buscar')?.value.trim() || '';
  let visibles = 0;
  $$('#explorador-grilla > .explorador-card').forEach(li => {
    const ok = coincide(li.dataset.id, PLANTILLAS[li.dataset.id], categoriaActiva, busqueda);
    li.hidden = !ok;
    if (ok) visibles++;
  });
  $$('#explorador-categorias [data-categoria]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.categoria === categoriaActiva)));
  const vacio = $('#explorador-vacio');
  if (vacio) {
    vacio.hidden = visibles > 0;
    vacio.textContent = busqueda
      ? `No hay plantillas para «${busqueda}». Probá con otra palabra.`
      : 'No hay plantillas en esta categoría.';
  }
};

const tarjetaHTML = ([id, tpl]) => `
  <li class="explorador-card" data-id="${esc(id)}">
    <div class="explorador-card__lienzo" inert aria-hidden="true">
      <article class="doc doc--web doc--estatico doc--miniatura" data-miniatura="${esc(id)}"></article>
    </div>
    ${tpl.plan === 'pro' ? '<em class="insignia-pro explorador-card__pro" aria-hidden="true">PRO</em>' : ''}
    <span class="explorador-card__nombre">${esc(tpl.nombre)}</span>
    <span class="explorador-card__rubro">${esc(tpl.rubro)}</span>
    <button type="button" class="explorador-card__boton" data-accion="probar-plantilla" data-id="${esc(id)}" title="${esc(tpl.desc || tpl.nombre)}" aria-label="Probar «${esc(tpl.nombre)}»${tpl.plan === 'pro' ? ' (PRO)' : ''}"></button>
  </li>`;

// Se arma la primera vez que se abre. Las miniaturas se dibujan de a una para no trabar.
const armar = () => {
  if (armado) return;
  const grilla = $('#explorador-grilla');
  if (!grilla) return;
  armado = true;
  const ordenadas = Object.entries(PLANTILLAS).sort(([, a], [, b]) => (a.plan === 'gratis' ? 0 : 1) - (b.plan === 'gratis' ? 0 : 1));
  grilla.innerHTML = ordenadas.map(tarjetaHTML).join('');
  const cuenta = $('#explorador-cuenta');
  if (cuenta) cuenta.textContent = String(ordenadas.length);
  const chips = $('#explorador-categorias');
  if (chips) {
    chips.innerHTML = CATEGORIAS.map(c => {
      const total = Object.entries(PLANTILLAS).filter(([id, tpl]) => coincide(id, tpl, c.id, '')).length;
      return `<button type="button" class="galeria-chip${c.id === 'pro' ? ' galeria-chip--pro' : ''}" data-categoria="${esc(c.id)}" aria-pressed="${c.id === categoriaActiva}">${esc(c.nombre)} <span class="galeria-chip__cuenta">${total}</span></button>`;
    }).join('');
  }
  filtrar();
  grilla.querySelectorAll('.explorador-card__lienzo').forEach(lienzo => {
    escalarMiniatura(lienzo);
    observadorTamano?.observe(lienzo);
  });
  [...grilla.querySelectorAll('[data-miniatura]')].forEach((article, i) => {
    setTimeout(() => dibujarPlantilla(article, article.dataset.miniatura), 40 * i);
  });
};

export const abrirExplorador = () => {
  const explorador = $('#explorador-plantillas');
  const cuerpo = $('#editor-cuerpo');
  if (!explorador || !cuerpo) return;
  scrollEditor = cuerpo.scrollTop;
  cuerpo.hidden = true;
  explorador.hidden = false;
  if (document.body.dataset.hoja === 'cerrada') fijarHoja('media');
  armar();
  // Al abrir, ya se dibujó la grilla: se reajusta la escala por si estaba oculta.
  $$('#explorador-grilla .explorador-card__lienzo').forEach(escalarMiniatura);
  marcarPlantillaActiva(ctx.estado?.plantilla || '');
  $('#explorador-cuerpo')?.scrollTo({ top: 0 });
  explorador.querySelector('.explorador__volver')?.focus({ preventScroll: true });
};

export const cerrarExplorador = () => {
  const explorador = $('#explorador-plantillas');
  const cuerpo = $('#editor-cuerpo');
  if (!explorador || explorador.hidden) return;
  const teniaFoco = explorador.contains(document.activeElement);
  explorador.hidden = true;
  if (cuerpo) {
    cuerpo.hidden = false;
    cuerpo.scrollTop = scrollEditor;
  }
  if (teniaFoco) $('[data-accion="explorar-plantillas"]')?.focus({ preventScroll: true });
};

export const instalarExplorador = () => {
  registrarAcciones({
    'explorar-plantillas': () => abrirExplorador(),
    'cerrar-explorador': () => cerrarExplorador(),
    'probar-plantilla': boton => elegirPlantillaPropuesta(boton.dataset.id)
  });
  $('#explorador-categorias')?.addEventListener('click', ev => {
    const chip = ev.target.closest('[data-categoria]');
    if (!chip) return;
    categoriaActiva = chip.dataset.categoria;
    filtrar();
  });
  $('#explorador-buscar')?.addEventListener('input', () => filtrar());
  // Escape vuelve al editor (si no hay un diálogo abierto, que se cierra primero).
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && abierto() && !document.querySelector('dialog[open]')) cerrarExplorador();
  });
  // En celular, tocar una sección de la hoja vuelve al editor en esa sección.
  $('#hoja-secciones')?.addEventListener('click', () => cerrarExplorador(), true);
};
