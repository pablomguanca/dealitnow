// Deshacer y rehacer en el editor (propuesta y portfolio): botones de la barra de arriba,
// Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y (⌘ en Mac) y el aviso «Quitaste… · Deshacer».
//
// Cada cambio que se guarda pasa por guardarLuego, que llama a registrarCambio: ahí se
// anota una foto del documento (src/historial.js). Deshacer pone la foto anterior en el
// estado, vuelve a llenar el formulario y muestra dónde fue el cambio. El historial es de
// esta pestaña: dura mientras se edita y se guarda uno por documento abierto.

import { $$ } from '../lib/formato.js';
import { crearHistorial } from '../historial.js';
import { ctx, docActivo } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisarConAccion, cerrarAviso } from './avisos.js';
import { llenarFormulario } from './formulario.js';
import { actualizar } from './documento.js';
import { mostrarLugar } from './ir-a-campo.js';

const DOCUMENTOS_MAX = 5;
const MARCA_VIGENCIA = 2000;
const AVISO = 'historial';

const historiales = new Map(); // clave del documento → historial
let marca = null; // dónde fue lo último que se tocó: { lugar, grupo, cuando }
let posicionAviso = null; // paso que deshace el botón del aviso «Quitaste…»

const claveDoc = () => (ctx.modoEditor === 'portafolio'
  ? `pf:${ctx.portafolioId || 'local'}`
  : `p:${ctx.propuestaId || 'local'}`);

const foto = () => JSON.stringify(docActivo());

const historialActual = () => {
  const clave = claveDoc();
  let h = historiales.get(clave);
  if (!h) {
    h = crearHistorial();
    historiales.set(clave, h);
    if (historiales.size > DOCUMENTOS_MAX) historiales.delete(historiales.keys().next().value);
  }
  return h;
};

const editorActivo = () => ctx.editando && !ctx.esCliente && !document.body.classList.contains('vista-inicio');

const esMac = () => /Mac|iPhone|iPad/.test(navigator.userAgentData?.platform || navigator.platform || '');

export const pintarBotonesHistorial = () => {
  const h = historiales.get(claveDoc());
  const puede = { deshacer: !!h?.puedeDeshacer(), rehacer: !!h?.puedeRehacer() };
  Object.entries(puede).forEach(([accion, si]) => {
    $$(`[data-accion="${accion}"]`).forEach(b => { b.disabled = !si; });
  });
};

// Al abrir un documento en el editor. Si se vuelve a uno que ya se editó en esta pestaña
// y no cambió afuera, conserva su historial.
export const abrirHistorial = () => {
  const h = historialActual();
  const actual = foto();
  if (h.actual() !== actual) h.iniciar(actual);
  else h.cortar();
  marca = null;
  posicionAviso = null;
  cerrarAviso(AVISO);
  pintarBotonesHistorial();
};

// Se llama con cada cambio que se va a guardar.
export const registrarCambio = () => {
  if (!editorActivo()) return;
  const h = historialActual();
  const vigente = marca && Date.now() - marca.cuando < MARCA_VIGENCIA ? marca : null;
  marca = null;
  const sumo = h.registrar(foto(), { grupo: vigente?.grupo || null, lugar: vigente?.lugar || null });
  if (sumo && posicionAviso !== null && h.posicion() !== posicionAviso) {
    posicionAviso = null;
    cerrarAviso(AVISO);
  }
  pintarBotonesHistorial();
};

// ---------- Dónde fue el cambio ----------

// Selector estable del campo o del ítem de lista: sobrevive a que el formulario se redibuje.
const selectorDe = el => {
  const nodo = el.closest('[data-indice], [data-indice-pf]');
  const lista = nodo?.closest('.lista');
  if (nodo && lista) {
    const pf = nodo.hasAttribute('data-indice-pf');
    const base = pf
      ? `.lista[data-lista-pf="${lista.dataset.listaPf}"] > [data-indice-pf="${nodo.dataset.indicePf}"]`
      : `.lista[data-lista="${lista.dataset.lista}"] > [data-indice="${nodo.dataset.indice}"]`;
    const campo = pf ? el.dataset.itemPf : el.dataset.item;
    if (campo) return `${base} [data-item${pf ? '-pf' : ''}="${campo}"]`;
    return base;
  }
  if (el.dataset.campo) return `[data-campo="${el.dataset.campo}"]`;
  if (el.dataset.campoPf) return `[data-campo-pf="${el.dataset.campoPf}"]`;
  if (el.id) return `#${CSS.escape(el.id)}`;
  return null;
};

const esEscritura = el => el.matches('textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="file"])');

const marcar = (el, agrupar) => {
  const lugar = selectorDe(el);
  marca = { lugar, grupo: agrupar && lugar ? lugar : null, cuando: Date.now() };
};

// ---------- Deshacer y rehacer ----------

const aplicar = paso => {
  if (!paso) return;
  const datos = JSON.parse(paso.foto);
  if (ctx.modoEditor === 'portafolio') ctx.estadoPortafolio = datos;
  else {
    ctx.estado = datos;
    const ids = new Set((datos.servicios || []).filter(s => s.opcional).map(s => s.id));
    ctx.seleccion = new Set([...ctx.seleccion].filter(id => ids.has(id)));
  }
  llenarFormulario();
  actualizar();
  mostrarLugar(paso.lugar);
  pintarBotonesHistorial();
};

const mover = sentido => {
  if (!editorActivo()) return;
  registrarCambio(); // lo último que se escribió y todavía no se anotó
  const h = historialActual();
  const paso = sentido === 'atras' ? h.deshacer() : h.rehacer();
  if (!paso) return;
  posicionAviso = null;
  cerrarAviso(AVISO);
  aplicar(paso);
};

export const deshacer = () => mover('atras');
export const rehacer = () => mover('adelante');

// Aviso después de quitar algo, con el botón para recuperarlo. Si después se hace otro
// cambio, el aviso se cierra: su botón ya no deshace lo mismo.
export const ofrecerDeshacer = mensaje => {
  if (!editorActivo()) return;
  registrarCambio();
  const h = historialActual();
  if (!h.puedeDeshacer()) return;
  const posicion = h.posicion();
  posicionAviso = posicion;
  avisarConAccion(mensaje, {
    id: AVISO,
    accion: 'Deshacer',
    alTocar: () => {
      if (posicionAviso === posicion && h === historialActual() && h.posicion() === posicion) deshacer();
    }
  });
};

export const instalarHistorial = () => {
  const mac = esMac();
  const atajos = {
    deshacer: `Deshacer (${mac ? '⌘Z' : 'Ctrl+Z'})`,
    rehacer: `Rehacer (${mac ? '⇧⌘Z' : 'Ctrl+Y'})`
  };
  Object.entries(atajos).forEach(([accion, titulo]) => {
    $$(`[data-accion="${accion}"]`).forEach(b => { b.title = titulo; });
  });

  registrarAcciones({ deshacer, rehacer });

  // Dónde fue el cambio: se anota antes de que lo atienda cualquier otro oyente.
  const enEditor = ev => ev.target instanceof Element && ev.target.closest('#editor-cuerpo');
  document.addEventListener('input', ev => { if (enEditor(ev)) marcar(ev.target, esEscritura(ev.target)); }, true);
  document.addEventListener('change', ev => { if (enEditor(ev) && !esEscritura(ev.target)) marcar(ev.target, false); }, true);
  document.addEventListener('click', ev => {
    const boton = enEditor(ev) && ev.target.closest('[data-accion], button');
    if (boton) marcar(boton, false);
  }, true);

  document.addEventListener('keydown', ev => {
    if (ev.defaultPrevented || ev.isComposing || ev.altKey || !(ev.ctrlKey || ev.metaKey)) return;
    const tecla = ev.key.toLowerCase();
    const atras = tecla === 'z' && !ev.shiftKey;
    const adelante = (tecla === 'z' && ev.shiftKey) || (tecla === 'y' && ev.ctrlKey && !ev.shiftKey);
    if (!atras && !adelante) return;
    if (!editorActivo() || document.querySelector('dialog[open]')) return;
    // En campos de fuera del editor (buscadores, diálogos propios) sigue el deshacer del navegador.
    const t = ev.target;
    if (t instanceof Element && t !== document.body && !t.closest('#app')) return;
    ev.preventDefault();
    if (atras) deshacer();
    else rehacer();
  });

  // Deshacer del sistema que no pasa por el teclado (menú contextual, gesto en iPad).
  document.addEventListener('beforeinput', ev => {
    if (ev.inputType !== 'historyUndo' && ev.inputType !== 'historyRedo') return;
    if (!editorActivo() || !enEditor(ev)) return;
    ev.preventDefault();
    if (ev.inputType === 'historyUndo') deshacer();
    else rehacer();
  });
};
