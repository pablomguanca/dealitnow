// Documento tal como lo ve el cliente: render de la propuesta o el portfolio y lo que se
// puede hacer sobre él (sumar opcionales, visor de imágenes, links internos, imprimir).
// Lo usan la vista del cliente y la vista previa del editor.

import { $ } from '../lib/formato.js';
import { aplicarTema } from '../lib/tema.js';
import { observarElementos, generarPortafolioHTML, generarPropuestaHTML } from '../lib/render.js';
import {
  abrirLightboxDesdeNodo,
  moverLightbox,
  cerrarLightbox,
  estaAbiertoLightbox
} from '../lib/lightbox.js';
import { ctx, aceptada } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar } from './avisos.js';

// En el editor, antes de dibujar la propuesta se actualiza el portfolio adjunto con la
// lista del dueño. El cliente no tiene esa lista: usa el resumen guardado en la propuesta.
let prepararPropuesta = () => { };
export const alPrepararPropuesta = fn => { prepararPropuesta = fn; };

// La primera vez que se dibuja, el documento entra con animación; después queda estático.
const marcarAnimacionInicial = (doc, web) => {
  if (!ctx.animacionInicialLista && web) {
    ctx.animacionInicialLista = true;
    setTimeout(() => doc.classList.add('doc--estatico'), 1400);
  }
};

const prepararDocumento = tema => {
  const web = !ctx.imprimiendo && (ctx.esCliente || ctx.vista !== 'pdf');
  const doc = $('#documento');
  doc.classList.toggle('doc--web', web);
  aplicarTema(doc, tema);
  if (ctx.animacionInicialLista) doc.classList.add('doc--estatico');
  return {
    doc,
    web,
    tipoDecoracion: doc.dataset.decoracion || 'marco',
    tipoPortada: doc.dataset.portada || 'editorial'
  };
};

const terminarDocumento = (doc, web) => {
  if (web) observarElementos(doc, ctx.esCliente);
  marcarAnimacionInicial(doc, web);
};

export const renderPortafolio = () => {
  const { doc, web, tipoDecoracion, tipoPortada } = prepararDocumento(ctx.estadoPortafolio.tema);
  doc.innerHTML = generarPortafolioHTML(ctx.estadoPortafolio, { web, tipoDecoracion, tipoPortada });
  terminarDocumento(doc, web);
};

export const renderDocumento = () => {
  if (ctx.modoEditor === 'portafolio') return renderPortafolio();
  const { doc, web, tipoDecoracion, tipoPortada } = prepararDocumento(ctx.estado.tema);
  prepararPropuesta();
  doc.innerHTML = generarPropuestaHTML(ctx.estado, {
    web,
    seleccion: ctx.seleccion,
    compartida: ctx.compartida,
    tipoDecoracion,
    tipoPortada
  });
  terminarDocumento(doc, web);
};

export const instalarVista = () => {
  window.addEventListener('beforeprint', () => {
    ctx.imprimiendo = true;
    renderDocumento();
  });
  window.addEventListener('afterprint', () => {
    ctx.imprimiendo = false;
    renderDocumento();
  });

  document.addEventListener('click', ev => {
    const linkScroll = ev.target.closest('[data-scroll-interno]');
    if (linkScroll) {
      ev.preventDefault();
      const destinoId = (linkScroll.getAttribute('href') || '').replace(/^#/, '');
      const elDestino = destinoId ? document.getElementById(destinoId) : null;
      if (elDestino) elDestino.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const nodoLb = ev.target.closest('[data-lightbox-src]');
    if (nodoLb && !ev.target.closest('a[href]')) {
      ev.preventDefault();
      abrirLightboxDesdeNodo(nodoLb);
      return;
    }
    const enlaceCliente = ev.target.closest('[data-enlace-cliente]');
    if (enlaceCliente && !ctx.esCliente) {
      ev.preventDefault();
      avisar('Así lo ve tu cliente. En el link, este enlace le abre una conversación con vos.');
    }
  });

  document.addEventListener('keydown', ev => {
    if (!estaAbiertoLightbox()) return;
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); moverLightbox(-1); }
    if (ev.key === 'ArrowRight') { ev.preventDefault(); moverLightbox(1); }
  });

  registrarAcciones({
    'sumar': boton => {
      if (aceptada()) return;
      const id = boton.dataset.id;
      if (ctx.seleccion.has(id)) ctx.seleccion.delete(id);
      else ctx.seleccion.add(id);
      renderDocumento();
      const nuevo = $(`.servicio__sumar[data-id="${CSS.escape(id)}"]`);
      if (nuevo) nuevo.focus({ preventScroll: true });
    },
    'lightbox-cerrar': () => cerrarLightbox(),
    'lightbox-fondo': (boton, ev) => { if (ev.target === boton) cerrarLightbox(); },
    'lightbox-ant': () => moverLightbox(-1),
    'lightbox-sig': () => moverLightbox(1)
  });
};
