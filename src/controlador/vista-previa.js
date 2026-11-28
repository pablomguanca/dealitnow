// Editor: el «ojito» de la barra de arriba y las migas «‹ Mis propuestas / Título».
// La vista previa muestra el documento a pantalla completa, como lo ve el cliente: sin el
// editor ni las barras, y sin «tocar para editar». Se sale con «Volver a editar», Escape o
// «atrás» en Android (nativo.js). Entre Computadora y Celular se puede cambiar ahí mismo;
// si estaba en PDF, entra como Computadora y al salir vuelve a PDF.

import { $, texto } from '../lib/formato.js';
import { ctx } from './contexto.js';
import { registrarAcciones, ejecutarAccion } from './acciones.js';
import { renderDocumento, alDibujarPropuesta } from './vista.js';
import { estaAbiertoLightbox } from '../lib/lightbox.js';

let veniaDePdf = false;
let foco = null;

export const enVistaPrevia = () => document.body.classList.contains('vista-previa-completa');

const nombreDocumento = () => {
  if (ctx.modoEditor === 'portafolio') {
    const pf = ctx.estadoPortafolio?.portafolio || {};
    return texto(pf.nombreInterno).trim() || texto(pf.titulo).trim() || 'Portfolio sin título';
  }
  return texto(ctx.estado?.propuesta?.titulo).trim() || 'Propuesta sin título';
};

// Se llama cada vez que se dibuja el documento del editor: el título cambia mientras se escribe.
export const actualizarMigas = () => {
  const esPf = ctx.modoEditor === 'portafolio';
  const volver = $('#barra-volver');
  if (volver) {
    volver.dataset.accion = esPf ? 'ir-portafolios' : 'ir-panel';
    volver.setAttribute('href', esPf ? '/portafolios' : '/');
  }
  const textoVolver = $('#barra-volver-texto');
  if (textoVolver) textoVolver.textContent = esPf ? 'Mis portfolios' : 'Mis propuestas';
  const actual = $('#barra-documento');
  if (actual) {
    const nombre = nombreDocumento();
    if (actual.textContent !== nombre) actual.textContent = nombre;
    actual.title = nombre;
  }
};

export const salirVistaPrevia = ({ redibujar = true } = {}) => {
  if (!enVistaPrevia()) return;
  document.body.classList.remove('vista-previa-completa');
  ctx.vistaPrevia = false;
  if (veniaDePdf) {
    veniaDePdf = false;
    ejecutarAccion('vista', { dataset: { vista: 'pdf' } });
  } else if (redibujar) renderDocumento();
  if (foco?.isConnected) foco.focus({ preventScroll: true });
  foco = null;
};

const entrarVistaPrevia = boton => {
  if (enVistaPrevia()) return;
  foco = boton instanceof HTMLElement ? boton : null;
  document.body.classList.add('vista-previa-completa');
  ctx.vistaPrevia = true;
  // Los portfolios no tienen PDF; las propuestas en PDF se ven como en la computadora.
  veniaDePdf = ctx.vista === 'pdf';
  if (veniaDePdf) ejecutarAccion('vista', { dataset: { vista: 'escritorio' } });
  else renderDocumento();
  $('.visor')?.scrollTo({ top: 0 });
  $('#previa-salir')?.focus({ preventScroll: true });
};

export const instalarVistaPrevia = () => {
  alDibujarPropuesta(actualizarMigas);

  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape' || !enVistaPrevia() || estaAbiertoLightbox()) return;
    if (document.querySelector('dialog[open]')) return;
    ev.preventDefault();
    salirVistaPrevia();
  });

  registrarAcciones({
    'vista-previa': boton => entrarVistaPrevia(boton),
    'salir-vista-previa': () => salirVistaPrevia()
  });
};
