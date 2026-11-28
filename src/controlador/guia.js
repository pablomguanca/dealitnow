// Guía de primeros pasos (reglas en src/guia.js; marcado en EditorSidebar.jsx y
// DocumentPreview.jsx). Tres pasos que se tildan solos y un aviso arriba de la vista previa,
// «Tocá cualquier texto para cambiarlo», hasta que toca uno o lo cierra.
// - Sin cuenta: acompaña el editor de prueba; reemplaza la caja «Estás probando Dealit sin
//   cuenta» y se reinicia al elegir un rubro en la bienvenida. «Compartir» pide la cuenta.
// - Con cuenta: acompaña la primera propuesta (la que crea sin tener ninguna, desde el panel
//   vacío, la IA o una plantilla; o la que armó sin cuenta y pasó a la cuenta). Solo se ve en
//   esa propuesta y el tercer paso se tilda al activar el link.
// Se guarda en este navegador (dealit-guia); se borra al cerrar sesión.

import { ctx } from './contexto.js';
import { registrarAcciones, ejecutarAccion } from './acciones.js';
import { esCelular, fijarHoja } from './hoja.js';
import { PASOS_GUIA, huellaGuia, pasosHechos, pasoActual } from '../guia.js';

export const CLAVE_GUIA = 'dealit-guia';
let guia = null;

const leer = () => {
  try { return JSON.parse(localStorage.getItem(CLAVE_GUIA)) || null; } catch { return null; }
};
const escribir = () => {
  try { localStorage.setItem(CLAVE_GUIA, JSON.stringify(guia)); } catch { }
};
const nuevaGuia = (contenido, extra = {}) => ({ base: huellaGuia(contenido), hechos: [], cerrada: false, tip: false, ...extra });

const activa = () => {
  if (!guia || guia.cerrada || ctx.modoEditor !== 'propuesta') return false;
  if (ctx.invitado) return !guia.propuestaId;
  return !!guia.propuestaId && guia.propuestaId === ctx.propuestaId;
};

// Sin cuenta: arranca (o retoma) la guía con lo que hay en el editor como punto de partida.
// `nueva`: recién eligió un rubro, empieza de cero aunque la hubiera cerrado antes.
export const empezarGuia = ({ nueva = false } = {}) => {
  if (!ctx.invitado) return;
  guia = nueva ? null : leer();
  // La de una cuenta (con propuestaId) no sirve para el editor sin cuenta.
  if (!guia?.base || guia.propuestaId) {
    guia = nuevaGuia(ctx.estado);
    escribir();
  }
  pintarGuia();
};

// Con cuenta: su primera propuesta. Con la IA, el cliente y los precios ya vienen de lo que
// dictó: el primer paso arranca hecho.
export const guiaPrimeraPropuesta = (id, contenido, { origen } = {}) => {
  if (ctx.invitado || !id) return;
  guia = nuevaGuia(contenido, { propuestaId: id, hechos: origen === 'ia' ? ['editar'] : [] });
  escribir();
  pintarGuia();
};

// Lo que armó sin cuenta pasó a la cuenta: la guía sigue con esa propuesta, con lo que ya hizo.
export const adoptarGuia = id => {
  const guardada = leer();
  if (!id || !guardada?.base || guardada.cerrada || guardada.propuestaId) return;
  guia = { ...guardada, propuestaId: id };
  escribir();
  pintarGuia();
};

export const marcarPasoGuia = paso => {
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

const textos = (invitado, completa) => ({
  titulo: completa ? '¡Listo! Mandaste tu primera propuesta' : 'Tu primera propuesta en 3 pasos',
  compartir: invitado
    ? 'Creás tu cuenta gratis, te damos el link y te avisamos cuando la acepte.'
    : 'Te damos el link para mandarle por WhatsApp o email, y te avisamos cuando la acepte.',
  pie: completa
    ? 'Te avisamos cuando tu cliente la acepte. Podés cerrar esta guía.'
    : (invitado ? 'Se guarda en este navegador mientras la armás.' : 'Se guarda sola en tu cuenta mientras la armás.')
});

const ponerTexto = (id, valor) => {
  const el = document.getElementById(id);
  if (el && el.textContent !== valor) el.textContent = valor;
};

// Se llama con cada cambio del editor (guardarLuego) y al cambiar de vista o de propuesta.
export const pintarGuia = () => {
  const el = document.getElementById('guia');
  if (!el) return;
  if (!guia) guia = leer();
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
  const t = textos(ctx.invitado, actual === null);
  ponerTexto('guia-titulo', t.titulo);
  ponerTexto('guia-compartir-detalle', t.compartir);
  ponerTexto('guia-pie', t.pie);
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
    // «Ver como cliente»: en celular baja la hoja (queda el documento entero); en la compu pasa
    // la vista previa a Celular, que es como la abre la mayoría.
    'guia-ver': () => {
      marcarPasoGuia('ver');
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
    if (vista && vista.dataset.vista !== 'escritorio') marcarPasoGuia('ver');
    if (objetivo.closest('[data-accion="vista-previa"]')) marcarPasoGuia('ver');
    if (objetivo.closest('#documento [data-editar]')) verTip();
  }, true);
  new MutationObserver(() => {
    if (activa() && esCelular() && document.body.dataset.hoja === 'cerrada') marcarPasoGuia('ver');
  }).observe(document.body, { attributes: true, attributeFilter: ['data-hoja'] });
};
