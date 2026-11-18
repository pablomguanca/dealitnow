// Tocar el documento para editar (solo en el editor del dueño, en propuestas):
// - Tocar un texto de la vista previa abre en el editor el campo que lo arma. En celular,
//   la hoja pasa al modo foco: solo ese campo, arriba del teclado, con «anterior»,
//   «siguiente» (en el orden del documento) y «Listo». Un paso o una lista entera (tocar el
//   resumen de la inversión, por ejemplo) abren la hoja a media altura.
// - Enfocar un campo del editor resalta su bloque en la vista previa, y el resaltado se
//   mantiene mientras se escribe (el documento se redibuja con cada tecla).
// Las claves las pone render.js con { editable: true }: ver src/editar-documento.js.

import { $, $$ } from '../lib/formato.js';
import { selectorDeClave, claveDeCampo, clavesParaResaltar, clavesNavegables, claveVecina, primerCampoDe } from '../editar-documento.js';
import { ctx } from './contexto.js';
import { abrirEditorParaCampo, esCelular, fijarHoja, hojaEnFoco, alSalirDelFoco } from './hoja.js';
import { registrarAcciones } from './acciones.js';
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
  // Un campo o un ítem se enfoca para escribir; un paso o una lista entera solo se abren.
  const escribir = !/^(paso|lista):/.test(clave);
  if (escribir && esCelular()) {
    entrarEnFoco(primerCampoDe(navegables(), clave));
    return;
  }
  if (hojaEnFoco()) fijarHoja('media');
  abrirEditorParaCampo();
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

// ---------- Modo foco (celular) ----------

let claveFoco = null;

const navegables = () => clavesNavegables($$('#documento [data-editar]').map(el => el.dataset.editar));

const limpiarCamino = () => {
  $$('#editor-cuerpo .foco-camino, #editor-cuerpo.foco-camino').forEach(el => el.classList.remove('foco-camino'));
  $$('#editor-cuerpo .foco-campo').forEach(el => el.classList.remove('foco-campo'));
};

// Marca el campo y sus contenedores: el CSS del modo foco esconde todo lo demás.
const marcarCamino = el => {
  limpiarCamino();
  const campo = el.closest('.campo') || el;
  campo.classList.add('foco-campo');
  for (let n = campo.parentElement; n; n = n.parentElement) {
    n.classList.add('foco-camino');
    if (n.id === 'editor-cuerpo') break;
  }
  // El título de la barra: dónde está el campo («Servicio 3») y qué es («Precio»).
  const etiqueta = $('.campo__etiqueta', campo)?.textContent.trim() || '';
  const donde = el.closest('.item')?.querySelector('.item__titulo')?.textContent.trim()
    || el.closest('details.paso')?.querySelector('.paso__titulo')?.textContent.trim() || '';
  const titulo = $('#hoja-foco-titulo');
  if (titulo) titulo.innerHTML = `${donde ? `<span>${donde.replace(/[<>&]/g, '')}</span>` : ''}${etiqueta.replace(/[<>&]/g, '')}`;
};

const pintarBotonesFoco = () => {
  const claves = navegables();
  $('[data-accion="foco-anterior"]')?.toggleAttribute('disabled', !claveVecina(claves, claveFoco, -1));
  $('[data-accion="foco-siguiente"]')?.toggleAttribute('disabled', !claveVecina(claves, claveFoco, 1));
};

// Con el teclado abierto, la hoja va arriba de él: en Android (Chrome) y en iPhone el
// teclado no achica la página, solo lo que se ve (visualViewport).
const ajustarAlTeclado = () => {
  const vv = window.visualViewport;
  if (!vv || !hojaEnFoco()) return;
  const teclado = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop));
  document.body.style.setProperty('--teclado', `${teclado}px`);
  document.body.style.setProperty('--vv-alto', `${Math.round(vv.height)}px`);
  clearTimeout(ajustarAlTeclado.espera);
  ajustarAlTeclado.espera = setTimeout(() => asegurarSobreLaHoja(enDocumento(claveFoco)[0]), 120);
};

const entrarEnFoco = clave => {
  const lugar = selectorDeClave(clave);
  if (!lugar) return;
  fijarHoja('foco');
  // El campo anterior escondía a los demás: se desmarca antes de buscar el nuevo (todo pasa
  // antes de que se dibuje, así que no se ve el editor entero ni un instante).
  limpiarCamino();
  const el = mostrarLugar(lugar, { enfocar: true });
  if (!el) {
    fijarHoja('media');
    return;
  }
  claveFoco = clave;
  // Sin esperar a focusin: si el campo ya tenía el foco (tocar dos veces el mismo texto), no hay.
  claveActiva = clave;
  remarcar();
  marcarCamino(el);
  $('#editor-cuerpo')?.scrollTo({ top: 0 });
  pintarBotonesFoco();
  ajustarAlTeclado();
  asegurarSobreLaHoja(enDocumento(clave)[0]);
  // La hoja cambia de alto y el teclado tarda en abrir: se revisa al final.
  setTimeout(() => asegurarSobreLaHoja(enDocumento(claveFoco)[0]), 450);
};

const moverFoco = paso => {
  const siguiente = claveVecina(navegables(), claveFoco, paso);
  if (siguiente) entrarEnFoco(siguiente);
};

// «Listo» (o bajar la hoja, o «atrás» en Android): se cierra el teclado y la hoja, y el
// bloque editado se ilumina un momento para ver cómo quedó.
const terminarFoco = () => {
  const clave = claveFoco;
  document.activeElement?.blur?.();
  fijarHoja('cerrada');
  const bloque = enDocumento(clave)[0];
  if (!bloque) return;
  bloque.classList.remove('historial-destello');
  void bloque.offsetWidth;
  bloque.classList.add('historial-destello');
  setTimeout(() => bloque.classList.remove('historial-destello'), 1400);
};

const alSalir = () => {
  claveFoco = null;
  limpiarCamino();
  document.body.style.removeProperty('--teclado');
  document.body.style.removeProperty('--vv-alto');
};

// Si el formulario se redibujó (deshacer, por ejemplo), el camino se vuelve a marcar.
const revisarCamino = () => {
  if (!hojaEnFoco() || !claveFoco || $('#editor-cuerpo .foco-campo')?.isConnected) return;
  let el = null;
  try { el = document.querySelector(`#editor-cuerpo ${selectorDeClave(claveFoco)}`); } catch { }
  if (el) marcarCamino(el);
  else fijarHoja('media');
};

const claveDelCampo = el => {
  if (el.dataset.campo) return claveDeCampo({ campo: el.dataset.campo });
  const nodo = el.closest('[data-indice]');
  const lista = nodo?.closest('.lista')?.dataset.lista;
  return claveDeCampo({ lista, indice: nodo?.dataset.indice, item: el.dataset.item });
};

export const instalarTocarDocumento = () => {
  alDibujarPropuesta(() => {
    if (claveActiva) remarcar();
    revisarCamino();
  });
  document.addEventListener('click', alTocar);

  alSalirDelFoco(alSalir);
  window.visualViewport?.addEventListener('resize', ajustarAlTeclado);
  window.visualViewport?.addEventListener('scroll', ajustarAlTeclado);
  // Los botones de la barra no se llevan el foco: el teclado queda abierto al pasar de campo.
  $('#hoja-foco')?.addEventListener('pointerdown', ev => { if (ev.target.closest('button')) ev.preventDefault(); });
  $('#hoja-foco')?.addEventListener('mousedown', ev => { if (ev.target.closest('button')) ev.preventDefault(); });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && hojaEnFoco()) terminarFoco();
  });
  registrarAcciones({
    'foco-anterior': () => moverFoco(-1),
    'foco-siguiente': () => moverFoco(1),
    'foco-listo': () => terminarFoco()
  });

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
