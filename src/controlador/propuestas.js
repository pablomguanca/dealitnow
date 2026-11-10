// Panel «Mis propuestas» (lista en tiempo real, métricas, filtros y avisos de visitas
// o aceptaciones) y apertura, creación, duplicado y borrado de propuestas.

import { $, texto, fechaLarga } from '../lib/formato.js';
import { vacio, ejemplo } from '../modelo.js';
import { fechaDeAceptacion } from '../lib/render.js';
import {
  fechaDe,
  sinAcentos,
  propuestaHTML,
  filtrosHTML,
  metricasHTML,
  esqueletoFilasHTML
} from '../lib/paneles.js';
import { ctx, AteneaDB, nube, normalizar } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarError, avisarExito, celebrar, confirmar } from './avisos.js';
import { crearEnCuenta, registrarEscritura, mostrarEstadoGuardado } from './guardado.js';
import { llenarFormulario, actualizarAvisoPagos } from './formulario.js';
import { renderDocumento } from './vista.js';
import { irRuta, mostrarVista, cerrarEdicion, cambiarPestana, clicComun } from './navegacion.js';
import { nombreVisible, emisorDeCuenta } from './cuenta.js';
import { migrarLogo } from './subidas.js';
import { renderGaleriaPlantillas } from './galeria-plantillas.js';
import { linkCorto } from './compartir.js';
import { cargarFuente } from '../lib/tema.js';
import { restriccionesActivas } from './plan.js';

// La lista se escucha en tiempo real toda la sesión: refleja al instante lo que se
// edita, se duplica o se borra, también sin conexión.
let panelCargando = true;
let panelError = false;
let dejarDeEscuchar = null;
let filtroEstado = 'todas';
let seguimientoAnterior = null;
let pestana = 'propuestas';

const mostrarPestana = nombre => {
  pestana = nombre === 'plantillas' ? 'plantillas' : 'propuestas';
  ['propuestas', 'plantillas'].forEach(n => {
    $(`#pestana-${n}`).setAttribute('aria-selected', String(n === pestana));
    $(`#panel-${n}`).hidden = n !== pestana;
  });
  $('#panel-titulo').textContent = pestana === 'plantillas' ? 'Plantillas' : 'Mis propuestas';
  document.title = `${pestana === 'plantillas' ? 'Plantillas' : 'Mis propuestas'} | Dealit`;
  if (pestana === 'plantillas') renderGaleriaPlantillas();
};

const primerNombre = () => nombreVisible().split(' ')[0];

export const renderPanel = () => {
  const elPanel = $('#panel');
  if (elPanel.hidden) return;
  const { propuestas } = ctx;
  const campoBuscar = $('#panel-buscar');
  const filtro = sinAcentos(campoBuscar.value.trim());
  const visibles = propuestas
    .filter(p => filtroEstado === 'todas' || (p.status || 'draft') === filtroEstado)
    .filter(p => !filtro || sinAcentos(`${p.title} ${p.clientName}`).includes(filtro));
  const hay = propuestas.length > 0;

  $('#panel-saludo').textContent = primerNombre() ? `Hola, ${primerNombre()}` : 'Hola';
  $('#panel-resumen').textContent = hay ? `${propuestas.length} ${propuestas.length === 1 ? 'propuesta' : 'propuestas'}` : '';
  const elMetricas = $('#panel-metricas');
  elMetricas.hidden = !hay;
  const conSeguimiento = !restriccionesActivas();
  if (hay) elMetricas.innerHTML = `${metricasHTML(propuestas, { conSeguimiento })}<a class="metricas__mas" href="/resultados" data-accion="ir-resultados">Ver todos tus resultados →</a>`;
  $('#panel-herramientas').hidden = propuestas.length < 2;
  $('#panel-filtros').innerHTML = filtrosHTML(propuestas, filtroEstado);
  $('#panel-vacio').hidden = panelCargando || panelError || hay;

  const elPanelEstado = $('#panel-estado');
  // Cargando: se ven las filas de carga y el texto queda solo para los lectores de pantalla.
  elPanelEstado.classList.toggle('visualmente-oculto', panelCargando && !panelError);
  if (panelError) {
    elPanelEstado.innerHTML = 'No pudimos cargar tus propuestas. Revisá tu conexión. <button type="button" class="boton boton--texto boton--chico" data-accion="reintentar-panel">Reintentar</button>';
  } else if (panelCargando) {
    elPanelEstado.textContent = 'Cargando tus propuestas…';
  } else if (filtro && !visibles.length) {
    elPanelEstado.textContent = `No hay propuestas que coincidan con «${campoBuscar.value.trim()}».`;
  } else if (hay && !visibles.length) {
    elPanelEstado.textContent = 'No hay propuestas en este estado.';
  } else {
    elPanelEstado.textContent = '';
  }
  $('#lista-propuestas').innerHTML = panelCargando && !panelError
    ? esqueletoFilasHTML()
    : visibles.map(p => propuestaHTML(p, { conSeguimiento })).join('');
  $('#pestana-propuestas-cuenta').textContent = hay ? String(propuestas.length) : '';
  new Set(visibles.map(p => p.payload?.tema?.fuenteTitulos).filter(Boolean)).forEach(cargarFuente);
};

document.addEventListener('dealit:plan', () => renderPanel());

// Avisa en el momento cuando un cliente abre o acepta una propuesta. La primera
// carga solo registra cómo estaba todo, sin avisar.
const avisarNovedades = docs => {
  const actual = new Map(docs.map(p => [p.id, { aceptada: !!p.aceptacion, vistas: Number(p.vistas) || 0 }]));
  if (seguimientoAnterior) {
    for (const p of docs) {
      const antes = seguimientoAnterior.get(p.id);
      if (!antes) continue;
      const titulo = texto(p.title).trim() || 'tu propuesta';
      if (p.aceptacion && !antes.aceptada) celebrar(`${texto(p.aceptacion.nombre)} aceptó «${titulo}».`);
      else if ((Number(p.vistas) || 0) > antes.vistas && !restriccionesActivas()) avisar(`Tu cliente está viendo «${titulo}».`, 6000);
    }
  }
  seguimientoAnterior = actual;
};

// En el editor: si ya la aceptaron, el cliente sigue viendo la versión aceptada.
const actualizarAvisoAceptada = () => {
  const elAvisoAceptada = $('#editor-aceptada');
  const a = ctx.propuestaId ? ctx.propuestas.find(p => p.id === ctx.propuestaId)?.aceptacion : null;
  elAvisoAceptada.hidden = !a;
  if (!a) return;
  const fecha = fechaDeAceptacion(a);
  elAvisoAceptada.textContent = `${texto(a.nombre)} aceptó esta propuesta${fecha ? ` el ${fechaLarga(fecha)}` : ''}. Tu cliente sigue viendo la versión que aceptó: los cambios que hagas acá no le llegan.`;
};

export const escucharPropuestas = () => {
  if (dejarDeEscuchar) dejarDeEscuchar();
  panelCargando = true;
  panelError = false;
  renderPanel();
  dejarDeEscuchar = AteneaDB.proposals.escuchar(docs => {
    // Más recientes primero; las que tienen cambios sin confirmar traen fecha estimada.
    ctx.propuestas = docs.sort((a, b) => (fechaDe(b.updatedAt) || 0) - (fechaDe(a.updatedAt) || 0));
    document.dispatchEvent(new CustomEvent('dealit:propuestas'));
    panelCargando = false;
    panelError = false;
    avisarNovedades(docs);
    renderPanel();
    actualizarAvisoAceptada();
  }, () => {
    panelCargando = false;
    panelError = true;
    renderPanel();
  });
};

// Al cerrar sesión o cambiar de cuenta: deja de escuchar y olvida lo que se mostró.
export const reiniciarPanel = () => {
  if (dejarDeEscuchar) { dejarDeEscuchar(); dejarDeEscuchar = null; }
  seguimientoAnterior = null;
  ctx.propuestas = [];
  const elLista = $('#lista-propuestas');
  if (elLista) elLista.innerHTML = '';
};

export const irAlPanel = ({ historial = true, pestana: destino = 'propuestas' } = {}) => {
  cerrarEdicion();
  const ruta = destino === 'plantillas' ? '/plantillas' : '/';
  if (historial && (location.pathname !== ruta || location.search)) irRuta(ruta);
  mostrarVista('panel');
  mostrarPestana(destino);
  renderPanel();
  $('#panel').scrollTop = 0;
};

export const mostrarEditor = (id, contenido, { historial = true } = {}) => {
  ctx.modoEditor = 'propuesta';
  ctx.portafolioId = null;
  ctx.propuestaId = id;
  ctx.estado = contenido;
  ctx.seleccion = new Set();
  ctx.errorGuardado = '';
  ctx.avisoError = false;
  if (historial) irRuta(`/propuesta/${encodeURIComponent(id)}`);
  mostrarVista('editor');
  cambiarPestana(false);
  llenarFormulario();
  renderDocumento();
  actualizarAvisoPagos();
  document.title = `${ctx.estado.propuesta.titulo.trim() || 'Propuesta sin título'} | Dealit`;
  $('#editor-cuerpo').scrollTop = 0;
  ctx.editando = true;
  mostrarEstadoGuardado();
  actualizarAvisoAceptada();
  migrarLogo();
};

export const abrirPropuesta = async (id, opciones) => {
  cerrarEdicion();
  let doc = ctx.propuestas.find(p => p.id === id);
  if (!doc) doc = await AteneaDB.proposals.obtener(id).catch(e => {
    console.error('No se pudo abrir la propuesta:', e);
    return null;
  });
  if (!doc) {
    avisarError('No encontramos esa propuesta. Puede que se haya borrado.');
    irRuta('/', { reemplazar: true });
    irAlPanel({ historial: false });
    return;
  }
  mostrarEditor(id, normalizar(doc.payload), opciones);
};

// Tus datos de contacto se repiten en cada propuesta: la nueva toma los de Mi cuenta y,
// lo que falte (como el logo), de la última propuesta editada.
export const nuevaPropuesta = base => {
  cerrarEdicion();
  const nueva = base ? normalizar(base) : vacio();
  if (!base) nueva.emisor = emisorDeCuenta(nueva.emisor);
  const creada = crearEnCuenta(nueva);
  if (creada) mostrarEditor(creada.id, nueva);
};

const duplicarPropuesta = id => {
  const original = ctx.propuestas.find(p => p.id === id);
  if (!original) return;
  const copia = normalizar(original.payload);
  copia.propuesta.titulo = `${copia.propuesta.titulo.trim() || 'Sin título'} (copia)`;
  if (crearEnCuenta(copia)) avisarExito('Propuesta duplicada.');
};

const borrarPropuesta = async id => {
  const p = ctx.propuestas.find(x => x.id === id);
  const titulo = texto(p?.title).trim();
  const ok = await confirmar({
    titulo: '¿Borrar la propuesta?',
    texto: `Se borra ${titulo ? `«${titulo}»` : 'esta propuesta'} de tu cuenta y no se puede recuperar.${p?.publico ? ' El link que compartiste deja de funcionar.' : ''}`,
    aceptar: 'Borrar',
    peligro: true
  });
  if (!ok) return;
  registrarEscritura(AteneaDB.proposals.borrar(id), 'No se pudo borrar la propuesta.')
    .then(borrada => { if (borrada) avisarExito('Propuesta borrada.'); });
};

// Sin cuenta hay un único editor de propuesta (no hay panel).
export const volverAEditorPropuestaInvitado = nuevaBase => {
  cerrarEdicion();
  ctx.modoEditor = 'propuesta';
  if (nuevaBase) ctx.estado = normalizar(nuevaBase);
  mostrarVista('editor');
  cambiarPestana(false);
  llenarFormulario();
  renderDocumento();
  actualizarAvisoPagos();
  ctx.editando = true;
  mostrarEstadoGuardado();
};

export const instalarPropuestas = () => {
  $('#panel-buscar').addEventListener('input', renderPanel);

  registrarAcciones({
    'filtrar': boton => {
      filtroEstado = boton.dataset.estado;
      renderPanel();
      $(`.filtro[data-estado="${CSS.escape(filtroEstado)}"]`)?.focus();
    },
    'nueva': () => {
      if (nube()) nuevaPropuesta();
      else {
        volverAEditorPropuestaInvitado(vacio());
        avisarExito('Nueva propuesta en blanco lista.');
      }
    },
    'nueva-ejemplo': () => {
      if (!nube()) return;
      const conDatos = normalizar(ejemplo());
      conDatos.plantilla = 'diseno-web';
      conDatos.emisor = emisorDeCuenta(conDatos.emisor);
      nuevaPropuesta(conDatos);
    },
    'duplicar-propuesta': boton => duplicarPropuesta(boton.dataset.id),
    'borrar-propuesta': boton => borrarPropuesta(boton.dataset.id),
    'reintentar-panel': () => escucharPropuestas(),
    'panel-pestana': (boton, ev) => {
      if (!clicComun(ev)) return;
      ev.preventDefault();
      irAlPanel({ pestana: boton.dataset.pestana });
    },
    'previsualizar-propuesta': async boton => {
      const p = ctx.propuestas.find(x => x.id === boton.dataset.id);
      if (p?.publico) {
        window.open(linkCorto(p.id), '_blank', 'noopener');
        return;
      }
      await abrirPropuesta(boton.dataset.id);
      cambiarPestana(true);
      avisar('Así la va a ver tu cliente. Para mandársela, tocá «Compartir link».');
    },
    'abrir-propuesta': (boton, ev) => {
      if (!clicComun(ev)) return;
      ev.preventDefault();
      abrirPropuesta(boton.dataset.id);
    }
  });
};
