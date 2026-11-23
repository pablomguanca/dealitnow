// Guía de primeros pasos del editor sin cuenta (reglas en src/guia.js; marcado en
// EditorSidebar.jsx y DocumentPreview.jsx). Reemplaza la caja «Estás probando Dealit sin
// cuenta» mientras está abierta: tres pasos que se tildan solos y un aviso arriba de la vista
// previa, «Tocá cualquier texto para cambiarlo», hasta que toca uno o lo cierra.
// Se guarda en este navegador (dealit-guia). Se reinicia al elegir un rubro en la bienvenida.

import { ctx } from './contexto.js';
import { registrarAcciones, ejecutarAccion } from './acciones.js';
import { esCelular, fijarHoja } from './hoja.js';
import { PASOS_GUIA, huellaGuia, pasosHechos, pasoActual } from '../guia.js';

const CLAVE_GUIA = 'dealit-guia';
let guia = null;

const leer = () => {
  try { return JSON.parse(localStorage.getItem(CLAVE_GUIA)) || null; } catch { return null; }
};
const escribir = () => {
  try { localStorage.setItem(CLAVE_GUIA, JSON.stringify(guia)); } catch { }
};

const activa = () => !!guia && ctx.invitado && !guia.cerrada;

// Arranca (o retoma) la guía con lo que hay en el editor como punto de partida. `nueva`:
// recién eligió un rubro, empieza de cero aunque la hubiera cerrado antes.
export const empezarGuia = ({ nueva = false } = {}) => {
  if (!ctx.invitado) return;
  guia = nueva ? null : leer();
  if (!guia?.base) {
    guia = { base: huellaGuia(ctx.estado), hechos: [], cerrada: false, tip: false };
    escribir();
  }
  pintarGuia();
};

const marcar = paso => {
  if (!activa() || guia.hechos.includes(paso)) return;
  guia.hechos.push(paso);
  escribir();
  pintarGuia();
};

const verTip = () => {
  if (!guia || guia.tip) return;
  guia.tip = true;
  escribir();
  pintarGuia();
};

// Se llama con cada cambio del editor (guardarLuego).
export const pintarGuia = () => {
  const el = document.getElementById('guia');
  if (!el) return;
  const mostrar = activa();
  el.hidden = !mostrar;
  document.body.classList.toggle('guia-activa', mostrar);
  const tip = document.getElementById('guia-tip');
  if (tip) tip.hidden = !mostrar || !!guia.tip;
  if (!mostrar) return;

  const hechos = pasosHechos(guia, ctx.estado);
  // Lograr «editar» queda anotado: deshacer después no lo destilda.
  if (hechos.includes('editar') && !guia.hechos.includes('editar')) {
    guia.hechos.push('editar');
    escribir();
  }
  const actual = pasoActual(guia, ctx.estado);
  el.querySelectorAll('[data-paso-guia]').forEach(li => {
    const paso = li.dataset.pasoGuia;
    li.classList.toggle('guia__paso--hecho', hechos.includes(paso));
    li.classList.toggle('guia__paso--actual', paso === actual);
    if (paso === actual) li.setAttribute('aria-current', 'step');
    else li.removeAttribute('aria-current');
  });
  const barra = document.getElementById('guia-barra');
  if (barra) barra.style.setProperty('--avance', String(hechos.length / PASOS_GUIA.length));
};

export const instalarGuia = () => {
  registrarAcciones({
    'guia-cerrar': () => {
      if (!guia) return;
      guia.cerrada = true;
      escribir();
      pintarGuia();
    },
    // «Ver cómo la ve»: en celular baja la hoja (queda el documento entero); en la compu pasa
    // la vista previa a Celular, que es como la abre la mayoría.
    'guia-ver': () => {
      marcar('ver');
      if (esCelular()) fijarHoja('cerrada');
      else ejecutarAccion('vista', { dataset: { vista: 'celular' } });
    },
    'guia-tip-cerrar': verTip
  });

  // Los pasos también se tildan si los hace por su cuenta.
  document.addEventListener('click', ev => {
    if (!activa()) return;
    const objetivo = ev.target instanceof Element ? ev.target : null;
    if (!objetivo) return;
    const vista = objetivo.closest('[data-accion="vista"]');
    if (vista && vista.dataset.vista !== 'escritorio') marcar('ver');
    if (objetivo.closest('#documento [data-editar]')) verTip();
  }, true);
  new MutationObserver(() => {
    if (activa() && esCelular() && document.body.dataset.hoja === 'cerrada') marcar('ver');
  }).observe(document.body, { attributes: true, attributeFilter: ['data-hoja'] });
};
