// Documento en el editor: redibujo tras cada cambio, cambios de tema sin reconstruir
// todo, vista escritorio / celular / PDF y descarga en PDF.

import { $, $$, texto } from '../lib/formato.js';
import { decoracionPortadaSVG } from '../lib/decoraciones.js';
import { resolverColoresTema, aplicarTema } from '../lib/tema.js';
import { proyectoConContenido, observarElementos } from '../lib/render.js';
import { ctx, docActivo } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar } from './avisos.js';
import { guardarLuego, sincronizarPortafolioEnPropuesta } from './guardado.js';
import { actualizarSubtotales, actualizarAvisoPagos } from './formulario.js';
import { renderDocumento, alPrepararPropuesta } from './vista.js';
import { abrirRegistro } from './sesion.js';

// Se llama en cada cambio que hace quien edita (no en la carga inicial).
export const actualizar = () => {
  if (ctx.invitado) ctx.invitadoEdito = true;
  if (ctx.renderPendiente) return;
  ctx.renderPendiente = true;
  requestAnimationFrame(() => {
    ctx.renderPendiente = false;
    renderDocumento();
    actualizarSubtotales();
    actualizarAvisoPagos();
    guardarLuego();
  });
};

// Actualiza colores, tipografías, decoración SVG, portada y estilo de bloques en vivo
// sin reconstruir todo el documento ni reiniciar las animaciones de entrada.
export const actualizarTemaEnVivo = () => {
  if (ctx.invitado) ctx.invitadoEdito = true;
  const doc = $('#documento');
  if (!doc || !doc.querySelector('.portada')) {
    actualizar();
    return;
  }
  doc.classList.add('doc--estatico');
  ctx.animacionInicialLista = true;
  observarElementos(doc, ctx.esCliente);
  const actual = docActivo();
  aplicarTema(doc, actual.tema);
  const col = resolverColoresTema(actual.tema);
  const tipoDecoracion = doc.dataset.decoracion || 'marco';
  const tipoPortada = doc.dataset.portada || 'editorial';
  const seccionPortada = doc.querySelector('.portada');
  if (seccionPortada) {
    seccionPortada.className = `portada portada--${tipoPortada}`;
    const deco = seccionPortada.querySelector('.portada__decoracion');
    if (deco) {
      deco.style.color = col.colorSvg;
      deco.innerHTML = decoracionPortadaSVG(tipoDecoracion, col.opacidadSvg, col.colorSvg);
    }
    const existenteAgua = seccionPortada.querySelector('.portada__marca-agua');
    const numTexto = ctx.modoEditor === 'portafolio'
      ? String((ctx.estadoPortafolio.proyectos || []).filter(proyectoConContenido).length || '01').padStart(2, '0')
      : ctx.estado.propuesta.numero.trim();
    if (tipoPortada === 'impacto' && numTexto) {
      if (existenteAgua) {
        existenteAgua.textContent = numTexto;
      } else {
        const span = document.createElement('span');
        span.className = 'portada__marca-agua';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = numTexto;
        seccionPortada.insertBefore(span, seccionPortada.querySelector('.portada__superior'));
      }
    } else if (existenteAgua) {
      existenteAgua.remove();
    }
  }
  guardarLuego();
};

// Ajustes que no cambian la estructura (escalas y espaciados): sin re-render.
export const congelarAnimaciones = () => {
  const doc = $('#documento');
  if (doc) {
    doc.classList.add('doc--estatico');
    ctx.animacionInicialLista = true;
  }
  return doc;
};

const cambiarVista = nueva => {
  ctx.vista = nueva;
  const escenario = $('#escenario');
  ['escritorio', 'celular', 'pdf'].forEach(v => escenario.classList.toggle(`visor__escenario--${v}`, v === nueva));
  $$('.segmento').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.vista === nueva)));
  $('#visor-nota').textContent = nueva === 'pdf'
    ? 'Versión para imprimir. Los saltos de página se ajustan solos.'
    : 'Así ve tu cliente la propuesta cuando abre el link.';
  renderDocumento();
};

export const nombreArchivo = () => {
  const { estado, estadoPortafolio } = ctx;
  const esPf = ctx.modoEditor === 'portafolio';
  const base = esPf
    ? [estadoPortafolio.portafolio.nombreInterno || estadoPortafolio.portafolio.titulo, estadoPortafolio.emisor.nombre].map(x => texto(x).trim()).filter(Boolean).join(' ')
    : [estado.propuesta.numero, estado.cliente.empresa || estado.cliente.nombre].map(x => texto(x).trim()).filter(Boolean).join(' ');
  return (base || (esPf ? 'portfolio' : 'propuesta')).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
};

export const descargarPDF = () => {
  const tituloOriginal = document.title;
  document.title = nombreArchivo();
  window.addEventListener('afterprint', () => { document.title = tituloOriginal; }, { once: true });
  avisar('Elegí «Guardar como PDF» como destino y desactivá «Encabezados y pies de página».', 7000);
  setTimeout(() => window.print(), 350);
};

export const instalarDocumento = () => {
  // En el editor, el portfolio adjunto se toma siempre de la lista actualizada del dueño.
  alPrepararPropuesta(sincronizarPortafolioEnPropuesta);

  registrarAcciones({
    'vista': boton => cambiarVista(boton.dataset.vista),
    'pdf': () => {
      if (ctx.invitado) abrirRegistro('pdf');
      else descargarPDF();
    }
  });
};
