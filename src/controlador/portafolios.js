// Panel «Mis portfolios» y apertura, creación, duplicado y borrado de portfolios.
// Con cuenta viven en Firestore; sin cuenta, en esta pestaña.

import { $, texto } from '../lib/formato.js';
import { vacioPortafolio, ejemploPortafolio, PLANTILLAS_PORTAFOLIO } from '../modelo.js';
import { fechaDe, sinAcentos, portafolioItemHTML, esqueletoFilasHTML } from '../lib/paneles.js';
import { ctx, AteneaDB, nube, normalizarPf } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisarExito, avisarError, confirmar } from './avisos.js';
import {
  cargarPortafoliosLocales,
  guardarPortafoliosLocales,
  crearPortafolioEnCuentaOLocal,
  registrarEscritura,
  sincronizarPortafolioEnPropuesta,
  mostrarEstadoGuardado
} from './guardado.js';
import { llenarFormulario, actualizarSelectorPortafolio } from './formulario.js';
import { renderDocumento } from './vista.js';
import { emisorDeCuenta } from './cuenta.js';
import { disenoProPermitido } from './plan.js';
import { irRuta, mostrarVista, cerrarEdicion, cambiarPestana, clicComun } from './navegacion.js';

let dejarDeEscucharPortafolios = null;

export const renderPanelPortafolios = () => {
  const elPortafolios = $('#portafolios');
  if (!elPortafolios || elPortafolios.hidden) return;
  const { portafolios } = ctx;
  const campoBuscar = $('#portafolios-buscar');
  const filtro = sinAcentos(campoBuscar?.value.trim() || '');
  const visibles = portafolios.filter(pf => !filtro || sinAcentos(`${pf.title} ${pf.subtitle}`).includes(filtro));
  const hay = portafolios.length > 0;

  const elHerramientas = $('#portafolios-herramientas');
  const elVacio = $('#portafolios-vacio');
  if (elHerramientas) elHerramientas.hidden = !hay;
  if (elVacio) elVacio.hidden = ctx.portafoliosCargando || ctx.portafoliosError || hay;

  const elEstado = $('#portafolios-estado');
  const cargando = ctx.portafoliosCargando && !ctx.portafoliosError;
  elEstado.classList.toggle('visualmente-oculto', cargando);
  if (ctx.portafoliosError) {
    elEstado.textContent = 'No pudimos cargar tus portfolios. Revisá tu conexión.';
  } else if (ctx.portafoliosCargando) {
    elEstado.textContent = 'Cargando tus portfolios…';
  } else if (filtro && !visibles.length) {
    elEstado.textContent = `No hay portfolios que coincidan con «${campoBuscar.value.trim()}».`;
  } else {
    elEstado.textContent = '';
  }
  const elLista = $('#lista-portafolios');
  if (elLista) elLista.innerHTML = cargando && nube()
    ? esqueletoFilasHTML(2)
    : visibles.map(pf => portafolioItemHTML(pf, { conNube: !!nube() })).join('');
};

export const escucharPortafoliosNube = () => {
  if (!AteneaDB?.portfolios) return;
  if (dejarDeEscucharPortafolios) dejarDeEscucharPortafolios();
  ctx.portafolios = [];
  ctx.portafoliosCargando = true;
  ctx.portafoliosError = false;
  renderPanelPortafolios();
  dejarDeEscucharPortafolios = AteneaDB.portfolios.escuchar(docs => {
    ctx.portafolios = docs.sort((a, b) => (fechaDe(b.updatedAt) || 0) - (fechaDe(a.updatedAt) || 0));
    ctx.portafoliosCargando = false;
    ctx.portafoliosError = false;
    sincronizarPortafolioEnPropuesta();
    renderPanelPortafolios();
    actualizarSelectorPortafolio();
    if (ctx.editando && ctx.modoEditor === 'propuesta') renderDocumento();
  }, () => {
    ctx.portafolios = [];
    ctx.portafoliosCargando = false;
    ctx.portafoliosError = true;
    renderPanelPortafolios();
    actualizarSelectorPortafolio();
  });
};

// Al cerrar sesión o cambiar de cuenta.
export const reiniciarPortafolios = () => {
  if (dejarDeEscucharPortafolios) { dejarDeEscucharPortafolios(); dejarDeEscucharPortafolios = null; }
  ctx.portafolios = [];
  const elLista = $('#lista-portafolios');
  if (elLista) elLista.innerHTML = '';
};

export const irAPortafolios = ({ historial = true } = {}) => {
  cerrarEdicion();
  if (!nube() && !ctx.portafolios.length) ctx.portafolios = cargarPortafoliosLocales();
  if (historial && location.pathname !== '/portafolios') {
    irRuta('/portafolios');
  }
  mostrarVista('portafolios');
  renderPanelPortafolios();
  const elPortafolios = $('#portafolios');
  if (elPortafolios) elPortafolios.scrollTop = 0;
};

const mostrarEditorPortafolio = (id, contenido, { historial = true } = {}) => {
  ctx.modoEditor = 'portafolio';
  ctx.portafolioId = id;
  ctx.propuestaId = null;
  ctx.estadoPortafolio = normalizarPf(contenido);
  ctx.errorGuardado = '';
  ctx.avisoError = false;
  if (historial) {
    irRuta(`/editar-portafolio/${encodeURIComponent(id)}`);
  }
  mostrarVista('editor');
  cambiarPestana(false);
  llenarFormulario();
  renderDocumento();
  const { portafolio } = ctx.estadoPortafolio;
  document.title = `${portafolio.nombreInterno.trim() || portafolio.titulo.trim() || 'Portfolio'} | Dealit`;
  $('#editor-cuerpo').scrollTop = 0;
  ctx.editando = true;
  mostrarEstadoGuardado();
  $('#editor-aceptada').hidden = true;
};

// conDatosDeCuenta: false solo al abrir un archivo o duplicar, que traen sus propios datos.
export const nuevoPortafolio = (base, { conDatosDeCuenta = true } = {}) => {
  cerrarEdicion();
  const nuevo = normalizarPf(base || vacioPortafolio());
  if (conDatosDeCuenta) nuevo.emisor = emisorDeCuenta(nuevo.emisor);
  const creado = crearPortafolioEnCuentaOLocal(nuevo);
  if (creado) mostrarEditorPortafolio(creado.id, nuevo);
};

export const abrirPortafolio = async (id, opciones) => {
  cerrarEdicion();
  if (!nube() && !ctx.portafolios.length) ctx.portafolios = cargarPortafoliosLocales();
  let doc = ctx.portafolios.find(x => x.id === id);
  if (!doc && nube() && AteneaDB?.portfolios) {
    doc = await AteneaDB.portfolios.obtener(id).catch(() => null);
  }
  if (!doc) {
    avisarError('No encontramos ese portfolio.');
    irAPortafolios({ historial: false });
    return;
  }
  mostrarEditorPortafolio(id, normalizarPf(doc.payload), opciones);
};

const duplicarPortafolio = id => {
  const original = ctx.portafolios.find(x => x.id === id);
  if (!original) return;
  const copia = normalizarPf(original.payload);
  const baseNombre = copia.portafolio.nombreInterno.trim() || copia.portafolio.titulo.trim() || 'Portfolio';
  copia.portafolio.nombreInterno = `${baseNombre} (copia)`;
  if (crearPortafolioEnCuentaOLocal(copia)) {
    renderPanelPortafolios();
    avisarExito('Portfolio duplicado. Ahora podés adaptarlo para otro cliente o rubro.');
  }
};

const borrarPortafolio = async id => {
  const pf = ctx.portafolios.find(x => x.id === id);
  const titulo = texto(pf?.title).trim();
  const ok = await confirmar({
    titulo: '¿Borrar este portfolio?',
    texto: `Se borra ${titulo ? `«${titulo}»` : 'este portfolio'} y no se puede recuperar.`,
    aceptar: 'Borrar',
    peligro: true
  });
  if (!ok) return;
  if (nube() && AteneaDB?.portfolios) {
    registrarEscritura(AteneaDB.portfolios.borrar(id), 'No se pudo borrar el portfolio.')
      .then(borrado => { if (borrado) avisarExito('Portfolio borrado.'); });
  } else {
    ctx.portafolios = ctx.portafolios.filter(x => x.id !== id);
    guardarPortafoliosLocales();
    renderPanelPortafolios();
    avisarExito('Portfolio borrado.');
  }
};

export const instalarPortafolios = () => {
  $('#portafolios-buscar')?.addEventListener('input', renderPanelPortafolios);

  registrarAcciones({
    'nuevo-portafolio': () => nuevoPortafolio(),
    'nuevo-portafolio-ejemplo': () => nuevoPortafolio(ejemploPortafolio()),
    'crear-pf-rubro': async boton => {
      const tpl = PLANTILLAS_PORTAFOLIO[boton.dataset.rubro];
      if (!tpl) return;
      // Como en las propuestas: en Gratis, una plantilla PRO ofrece Pro y no se aplica.
      if (tpl.plan === 'pro' && !(await disenoProPermitido(tpl.nombre))) return;
      nuevoPortafolio({ ...tpl.crear(), plantilla: boton.dataset.rubro });
    },
    'abrir-portafolio': (boton, ev) => {
      if (boton.tagName === 'A') {
        if (!clicComun(ev)) return;
        ev.preventDefault();
      }
      abrirPortafolio(boton.dataset.id);
    },
    'duplicar-portafolio': boton => duplicarPortafolio(boton.dataset.id),
    'borrar-portafolio': boton => borrarPortafolio(boton.dataset.id)
  });
};
