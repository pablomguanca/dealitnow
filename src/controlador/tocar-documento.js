// Tocar el documento para editar (solo en el editor del dueño, en propuestas):
// - Tocar un texto de la vista previa abre en el editor el campo que lo arma (en celular,
//   con la hoja a media altura y el teclado abierto).
// - Enfocar un campo del editor resalta su bloque en la vista previa, y el resaltado se
//   mantiene mientras se escribe (el documento se redibuja con cada tecla).
// Las claves las pone render.js con { editable: true }: ver src/editar-documento.js.

import { $, $$ } from '../lib/formato.js';
import { selectorDeClave, claveDeCampo, clavesParaResaltar } from '../editar-documento.js';
import { ctx } from './contexto.js';
import { abrirEditorParaCampo, esCelular } from './hoja.js';
import { mostrarLugar } from './ir-a-campo.js';
import { cerrarExplorador } from './explorador-plantillas.js';
import { alDibujarPropuesta } from './vista.js';

const CLASE = 'doc-editando';
const INTERACTIVOS = 'a[href], button, input, select, textarea, label, summary, iframe, video, [data-accion], [data-lightbox-src], [data-video-embed], [data-scroll-interno], [data-enlace-cliente]';

let claveActiva = null; // campo enfocado en el editor (su bloque queda resaltado)

const enDocumento = clave => {
  try { return $$(`#documento [data-editar="${CSS.escape(clave)}"]`); } catch { return []; }
};

// Resalta en el documento el bloque del campo enfocado (o el ítem que lo contiene).
const remarcar = () => {
  $$(`#documento .${CLASE}`).forEach(el => el.classList.remove(CLASE));
  for (const clave of clavesParaResaltar(claveActiva)) {
    const els = enDocumento(clave);
    if (els.length) {
      els.forEach(el => el.classList.add(CLASE));
      return els[0];
    }
  }
  return null;
};

const reducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// En escritorio, si el bloque resaltado no se ve en la vista previa, se acerca.
const acercarEnEscritorio = el => {
  if (!el || esCelular()) return;
  const r = el.getBoundingClientRect();
  if (r.top >= 80 && r.bottom <= innerHeight - 24) return;
  el.scrollIntoView({ block: r.height > innerHeight * 0.6 ? 'start' : 'center', behavior: reducido() ? 'auto' : 'smooth' });
};

// En celular, el bloque tocado tiene que verse arriba de la hoja: si quedó tapado, sube.
const asegurarSobreLaHoja = el => {
  if (!el?.isConnected) return;
  const hoja = $('.editor')?.getBoundingClientRect();
  const tope = hoja ? hoja.top : innerHeight * 0.44;
  const r = el.getBoundingClientRect();
  if (r.top >= 64 && r.top <= tope - 48) return;
  el.scrollIntoView({ block: 'start', behavior: reducido() ? 'auto' : 'smooth' });
};

const alTocar = ev => {
  if (ctx.esCliente || ctx.modoEditor === 'portafolio' || ev.defaultPrevented || ev.button > 0) return;
  const doc = ev.target.closest?.('#documento');
  if (!doc || ev.target.closest(INTERACTIVOS)) return;
  // Seleccionar texto con el mouse no es pedir editarlo.
  const sel = window.getSelection?.();
  if (sel && !sel.isCollapsed && doc.contains(sel.anchorNode)) return;
  const bloque = ev.target.closest('[data-editar]');
  const clave = bloque?.dataset.editar;
  const lugar = selectorDeClave(clave);
  if (!lugar) return;

  cerrarExplorador();
  abrirEditorParaCampo();
  // Un campo o un ítem se enfoca para escribir; un paso o una lista entera solo se abren.
  const escribir = !/^(paso|lista):/.test(clave);
  const el = mostrarLugar(lugar, { enfocar: escribir });
  if (!el) return;
  if (!escribir) {
    // Sin campo enfocado no hay focusin: el bloque se resalta igual, un momento.
    claveActiva = clave;
    remarcar();
    setTimeout(() => { if (claveActiva === clave) { claveActiva = null; remarcar(); } }, 1400);
  }
  if (esCelular()) {
    asegurarSobreLaHoja(bloque);
    // La hoja sube con una transición y el teclado achica la pantalla: se revisa al final.
    setTimeout(() => asegurarSobreLaHoja(bloque.isConnected ? bloque : enDocumento(clave)[0]), 450);
  }
};

const claveDelCampo = el => {
  if (el.dataset.campo) return claveDeCampo({ campo: el.dataset.campo });
  const nodo = el.closest('[data-indice]');
  const lista = nodo?.closest('.lista')?.dataset.lista;
  return claveDeCampo({ lista, indice: nodo?.dataset.indice, item: el.dataset.item });
};

export const instalarTocarDocumento = () => {
  alDibujarPropuesta(() => { if (claveActiva) remarcar(); });
  document.addEventListener('click', alTocar);

  document.addEventListener('focusin', ev => {
    const el = ev.target;
    if (ctx.modoEditor === 'portafolio' || !el.closest?.('#editor-cuerpo') || !el.matches('input, textarea, select')) return;
    const clave = claveDelCampo(el);
    if (clave === claveActiva) return;
    claveActiva = clave;
    acercarEnEscritorio(remarcar());
  });
  document.addEventListener('focusout', ev => {
    if (!ev.target.closest?.('#editor-cuerpo')) return;
    // Si el foco pasa a otro campo, focusin ya marca el nuevo.
    setTimeout(() => {
      if (document.activeElement?.closest?.('#editor-cuerpo')) return;
      claveActiva = null;
      remarcar();
    }, 0);
  });
};
