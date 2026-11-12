// Formulario del editor: campos, listas dinámicas (servicios, etapas, proyectos…),
// vistas previas de imágenes y modo propuesta / portfolio.

import {
  $,
  $$,
  obtener,
  asignar,
  numero,
  texto,
  esc,
  dinero,
  cantidadTexto
} from '../lib/formato.js';
import { MODALIDADES, LISTAS, LISTAS_PORTAFOLIO, totalServicio } from '../modelo.js';
import { ctx, docActivo } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { sincronizarPortafolioEnPropuesta } from './guardado.js';
import { actualizar } from './documento.js';
import { llenarTemaEditor } from './diseno.js';
import { actualizarSeccionesHoja } from './hoja.js';
import { pintarCobroEditor } from './cobro.js';
import { pintarEstadosVideo } from './video.js';

export const actualizarImagenGenericaItem = (nodo, urlImg, prefijo, textoSubir = 'Subir foto', textoCambiar = 'Cambiar foto') => {
  const img = $(`[${prefijo}-vista]`, nodo);
  const btnQuitar = $(`[${prefijo}-quitar]`, nodo);
  const txt = $(`[${prefijo}-texto]`, nodo);
  const tiene = !!urlImg;
  if (img) {
    img.hidden = !tiene;
    if (tiene) img.src = urlImg;
    else img.removeAttribute('src');
  }
  if (btnQuitar) btnQuitar.hidden = !tiene;
  if (txt) txt.textContent = tiene ? textoCambiar : textoSubir;
};

const actualizarItemServicio = (nodo, s) => {
  const modo = MODALIDADES[s.modalidad] || MODALIDADES.unico;
  const esIncluido = s.modalidad === 'incluido';
  const wrapCant = $('[data-campo-cantidad]', nodo);
  const wrapPrecio = $('[data-campo-precio]', nodo);
  if (wrapCant) wrapCant.hidden = esIncluido;
  if (wrapPrecio) wrapPrecio.hidden = esIncluido;
  $('[data-etiqueta-cantidad]', nodo).textContent = modo.cantidad;
  $('[data-etiqueta-precio]', nodo).textContent = modo.precio;
  const sufijo = s.modalidad === 'mensual' ? ' por mes' : '';
  const subEl = $('[data-subtotal]', nodo);
  if (subEl) {
    subEl.textContent = esIncluido
      ? 'Incluido en el fee / inversión general'
      : (totalServicio(s) > 0 ? dinero(totalServicio(s), ctx.estado.inversion.moneda) + sufijo : 'Sin precio individual (incluido)');
  }
  nodo.classList.toggle('item--opcional', !!s.opcional);
  actualizarImagenGenericaItem(nodo, s.imagen, 'data-srv-img');
};

// Arma los controles de orden (subir, bajar, quitar) de un ítem de lista.
const agregarControles = (nodo, i, total, nombreItem) => {
  const controles = $('[data-controles]', nodo);
  controles.append($('#tpl-controles').content.cloneNode(true));
  const [subir, bajar, quitar] = controles.children;
  subir.disabled = i === 0;
  bajar.disabled = i === total - 1;
  subir.setAttribute('aria-label', `Subir ${nombreItem} ${i + 1}`);
  bajar.setAttribute('aria-label', `Bajar ${nombreItem} ${i + 1}`);
  quitar.setAttribute('aria-label', `Quitar ${nombreItem} ${i + 1}`);
};

export const renderLista = nombre => {
  const conf = LISTAS[nombre];
  const contenedor = $(`.lista[data-lista="${nombre}"]`);
  const plantilla = $(`#tpl-${nombre}`);
  const arr = obtener(ctx.estado, conf.ruta);
  const nodos = arr.map((item, i) => {
    const nodo = plantilla.content.firstElementChild.cloneNode(true);
    nodo.dataset.indice = i;
    $$('[data-item]', nodo).forEach(el => {
      const v = item[el.dataset.item];
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = v ?? '';
    });
    const orden = $('[data-orden]', nodo);
    if (orden) orden.textContent = i + 1;
    agregarControles(nodo, i, arr.length, conf.nombre);
    if (nombre === 'servicios') actualizarItemServicio(nodo, item);
    if (nombre === 'galeria') actualizarImagenGenericaItem(nodo, item.imagen, 'data-gal-img');
    if (nombre === 'testimonios') actualizarImagenGenericaItem(nodo, item.avatar, 'data-test-img');
    return nodo;
  });
  contenedor.replaceChildren(...nodos);
};

const renderListas = () => Object.keys(LISTAS).forEach(renderLista);

export const actualizarSubtotales = () => {
  $$('.lista[data-lista="servicios"] > .item').forEach(nodo => {
    const s = ctx.estado.servicios[Number(nodo.dataset.indice)];
    if (s) actualizarItemServicio(nodo, s);
  });
};

export const actualizarAvisoPagos = () => {
  const el = $('#aviso-pagos');
  const pagos = ctx.estado.inversion.pagos;
  const suma = Math.round(pagos.reduce((t, p) => t + numero(p.porcentaje), 0) * 100) / 100;
  el.hidden = !pagos.length || suma === 100;
  if (!el.hidden) el.textContent = `Los porcentajes suman ${cantidadTexto(suma)}%. Ajustalos para que lleguen a 100%.`;
};

// Muestra una imagen subida (o la oculta) junto a sus botones de cambiar y quitar.
const pintarImagen = (prefijo, url, textoSubir, textoCambiar) => {
  const vista = $(`#${prefijo}-vista`);
  if (vista) {
    vista.hidden = !url;
    if (url) vista.src = url;
    else vista.removeAttribute('src');
  }
  if ($(`#${prefijo}-quitar`)) $(`#${prefijo}-quitar`).hidden = !url;
  if ($(`#${prefijo}-texto`)) $(`#${prefijo}-texto`).textContent = url ? textoCambiar : textoSubir;
};

export const actualizarLogo = () => {
  const actual = docActivo();
  pintarImagen('logo', actual.emisor.logo, 'Subir logo', 'Cambiar logo');
  pintarImagen('foto-emisor', actual.emisor.foto || '', 'Subir foto', 'Cambiar foto');

  // Foto de portada Hero de la propuesta y del portfolio
  [['portada-prop', ctx.estado.propuesta], ['portada-pf', ctx.estadoPortafolio.portafolio]].forEach(([prefijo, datos]) => {
    const img = datos?.imagenPortada || '';
    pintarImagen(prefijo, img, 'Subir foto de portada', 'Cambiar foto de portada');
    if ($(`#${prefijo}-opacidad-wrap`)) $(`#${prefijo}-opacidad-wrap`).hidden = !img;
    if ($(`#${prefijo}-opacidad-val`)) $(`#${prefijo}-opacidad-val`).textContent = `${datos?.opacidadPortada ?? 35}%`;
  });
};

export const actualizarSelectorPortafolio = () => {
  const sel = $('#propuesta-portafolio-select');
  if (!sel) return;
  const { estado, portafolios } = ctx;
  const valorActual = estado.opciones?.portafolioId || '';
  const opcionesHTML = [
    '<option value="">No incluir portfolio en esta propuesta</option>',
    ...portafolios.map(pf => {
      const nombre = texto(pf.title).trim() || 'Portfolio sin título';
      const cant = Number(pf.projectCount) || (pf.payload?.proyectos?.length || 0);
      const detalle = cant === 1 ? '1 proyecto' : `${cant} proyectos`;
      return `<option value="${esc(pf.id)}">${esc(nombre)} (${detalle})</option>`;
    })
  ];
  const existe = portafolios.some(pf => pf.id === valorActual);
  if (valorActual && !existe && !ctx.portafoliosCargando) {
    estado.opciones.portafolioId = '';
    delete estado.opciones.portafolio;
  }
  sel.innerHTML = opcionesHTML.join('');
  sel.value = existe ? valorActual : '';
};

export const actualizarImagenProyectoItem = (nodo, item) => {
  actualizarImagenGenericaItem(nodo, item.imagen, 'data-pf-img', 'Subir portada', 'Cambiar portada');
  const galLista = $('[data-pf-galeria-lista]', nodo);
  if (galLista) {
    const fotos = Array.isArray(item.galeria) ? item.galeria : [];
    galLista.innerHTML = fotos.map((src, idxFoto) => `
      <div class="proyecto-galeria-mini__item">
        <img src="${esc(src)}" alt="Foto ${idxFoto + 1}">
        <button type="button" class="proyecto-galeria-mini__quitar" data-accion="quitar-foto-galeria-proyecto" data-foto-idx="${idxFoto}" aria-label="Quitar foto ${idxFoto + 1}">×</button>
      </div>`).join('');
  }
};

export const renderListaPortafolio = nombre => {
  const conf = LISTAS_PORTAFOLIO[nombre];
  const contenedor = $(`.lista[data-lista-pf="${nombre}"]`);
  const plantilla = $(`#tpl-${nombre}`);
  if (!conf || !contenedor || !plantilla) return;
  const arr = obtener(ctx.estadoPortafolio, conf.ruta);
  const nodos = arr.map((item, i) => {
    const nodo = plantilla.content.firstElementChild.cloneNode(true);
    nodo.dataset.indicePf = i;
    $$('[data-item-pf]', nodo).forEach(el => {
      const v = item[el.dataset.itemPf];
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = v ?? '';
    });
    const orden = $('[data-orden]', nodo);
    if (orden) orden.textContent = i + 1;
    agregarControles(nodo, i, arr.length, conf.nombre);
    if (nombre === 'proyectos') actualizarImagenProyectoItem(nodo, item);
    if (nombre === 'galeria') actualizarImagenGenericaItem(nodo, item.imagen, 'data-gal-img');
    if (nombre === 'serviciosWeb') actualizarImagenGenericaItem(nodo, item.imagen, 'data-sweb-img');
    if (nombre === 'testimonios') actualizarImagenGenericaItem(nodo, item.avatar, 'data-test-img');
    return nodo;
  });
  contenedor.replaceChildren(...nodos);
};

const renderListasPortafolio = () => Object.keys(LISTAS_PORTAFOLIO).forEach(renderListaPortafolio);

const sincronizarModoEditorUI = () => {
  const esPf = ctx.modoEditor === 'portafolio';
  const pasosProp = $('#pasos-propuesta');
  const pasosPf = $('#pasos-portafolio');
  const wrapTplProp = $('#plantillas-propuesta-wrap');
  const wrapTplPf = $('#plantillas-portafolio-wrap');
  const campoVincularPf = $('#campo-vincular-portafolio');
  const subtituloBarra = $('#barra-subtitulo');
  const tituloEditor = $('#editor-titulo');
  const bajadaEditor = $('#editor-bajada');
  const volverLink = $('#editor-volver');
  const volverTexto = $('#editor-volver-texto');
  const btnOtraSeccion = $('#editor-ir-otra-seccion');
  const grupoActual = $('#menu-grupo-actual');

  if (pasosProp) pasosProp.hidden = esPf;
  if (pasosPf) pasosPf.hidden = !esPf;
  if (wrapTplProp) wrapTplProp.hidden = esPf;
  if (wrapTplPf) wrapTplPf.hidden = !esPf;
  const wrapFormato = $('#formato-propuesta-wrap');
  if (wrapFormato) wrapFormato.hidden = esPf;
  aplicarFormatoEditor();
  if (campoVincularPf) campoVincularPf.hidden = esPf;
  if (subtituloBarra) subtituloBarra.textContent = esPf ? 'Armá tu portfolio' : 'Generá tu propuesta';
  if (tituloEditor) tituloEditor.textContent = esPf ? 'Armá tu portfolio' : 'Armá tu propuesta';
  if (bajadaEditor) {
    bajadaEditor.textContent = esPf
      ? 'Creá un portfolio a medida para cada rubro o tipo de cliente. Podés compartirlo como link propio o sumarlo a tus propuestas.'
      : 'Elegí una plantilla, escribí tus datos y mandala como link interactivo: el diseño se arma solo.';
  }
  if (volverLink) {
    volverLink.dataset.accion = esPf ? 'ir-portafolios' : 'ir-panel';
    volverLink.href = esPf ? '/portafolios' : '/';
  }
  if (volverTexto) volverTexto.textContent = esPf ? 'Mis portfolios' : 'Mis propuestas';
  if (btnOtraSeccion) {
    btnOtraSeccion.dataset.accion = esPf ? 'ir-panel' : 'ir-portafolios';
    btnOtraSeccion.textContent = esPf ? 'Ir a Mis propuestas →' : 'Ir a Mis portfolios →';
  }
  if (grupoActual) grupoActual.textContent = esPf ? 'Portfolio actual' : 'Propuesta actual';
  actualizarSeccionesHoja();
};

// Formato Presupuesto: el editor muestra solo lo que aparece en la hoja (lo marcado con
// data-solo-propuesta se oculta y aparece lo marcado con data-solo-presupuesto).
export const aplicarFormatoEditor = () => {
  const presupuesto = ctx.modoEditor !== 'portafolio' && ctx.estado?.opciones?.formato === 'presupuesto';
  const cambio = document.body.classList.contains('formato-presupuesto') !== presupuesto;
  document.body.classList.toggle('formato-presupuesto', presupuesto);
  const paso = $('#paso-objetivos');
  if (paso) paso.dataset.corto = presupuesto ? 'Detalle' : 'Objetivos';
  if (cambio) actualizarSeccionesHoja();
};

export const llenarFormulario = () => {
  sincronizarModoEditorUI();
  if (ctx.modoEditor === 'portafolio') {
    $$('[data-campo^="emisor."]').forEach(el => {
      const v = obtener(ctx.estadoPortafolio, el.dataset.campo);
      el.value = v ?? '';
    });
    $$('[data-campo-pf]').forEach(el => {
      const v = obtener(ctx.estadoPortafolio, el.dataset.campoPf);
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = v ?? '';
    });
    actualizarLogo();
    renderListasPortafolio();
    llenarTemaEditor();
    pintarEstadosVideo();
    return;
  }
  actualizarSelectorPortafolio();
  $$('[data-campo]').forEach(el => {
    const v = obtener(ctx.estado, el.dataset.campo);
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v ?? '';
  });
  actualizarLogo();
  renderListas();
  llenarTemaEditor();
  pintarCobroEditor();
  pintarEstadosVideo();
};

export const reemplazarEstado = nuevo => {
  ctx.estado = nuevo;
  ctx.seleccion = new Set();
  llenarFormulario();
  actualizar();
};

const leerValor = el => {
  if (el.type === 'checkbox') return el.checked;
  if (el.dataset.tipo === 'numero') return numero(el.value);
  return el.value;
};

const alEditar = ev => {
  const el = ev.target;
  if (ctx.modoEditor === 'portafolio') {
    const { estadoPortafolio } = ctx;
    if (el.dataset.campo && el.dataset.campo.startsWith('emisor.')) {
      asignar(estadoPortafolio, el.dataset.campo, leerValor(el));
      actualizar();
      return;
    }
    if (el.dataset.campoPf) {
      asignar(estadoPortafolio, el.dataset.campoPf, leerValor(el));
      if (el.dataset.campoPf === 'portafolio.opacidadPortada') actualizarLogo();
      actualizar();
      return;
    }
    if (el.dataset.itemPf) {
      const nodo = el.closest('[data-indice-pf]');
      const lista = el.closest('.lista');
      if (!nodo || !lista) return;
      const conf = LISTAS_PORTAFOLIO[lista.dataset.listaPf];
      if (!conf) return;
      const item = obtener(estadoPortafolio, conf.ruta)[Number(nodo.dataset.indicePf)];
      if (!item) return;
      item[el.dataset.itemPf] = leerValor(el);
      actualizar();
      return;
    }
  }
  if (el.dataset.campo) {
    asignar(ctx.estado, el.dataset.campo, leerValor(el));
    if (el.dataset.campo === 'opciones.portafolioId') sincronizarPortafolioEnPropuesta();
    if (el.dataset.campo === 'propuesta.opacidadPortada') actualizarLogo();
    if (el.dataset.campo === 'opciones.formato') aplicarFormatoEditor();
    actualizar();
    return;
  }
  if (el.dataset.item) {
    const nodo = el.closest('[data-indice]');
    const lista = el.closest('.lista');
    if (!nodo || !lista) return;
    const item = obtener(ctx.estado, LISTAS[lista.dataset.lista].ruta)[Number(nodo.dataset.indice)];
    if (!item) return;
    item[el.dataset.item] = leerValor(el);
    if (el.dataset.item === 'opcional' && !el.checked) ctx.seleccion.delete(item.id);
    actualizar();
  }
};

const enfocarUltimo = nombre => {
  const ultimo = $(`.lista[data-lista="${nombre}"] > :last-child`);
  const campo = ultimo && $('input, textarea', ultimo);
  if (campo) campo.focus();
};

// Subir, bajar o quitar un ítem de cualquier lista del editor.
const moverItem = (boton, accion) => {
  const nodoPf = boton.closest('[data-indice-pf]');
  if (nodoPf) {
    const nombrePf = boton.closest('.lista').dataset.listaPf;
    const arrPf = obtener(ctx.estadoPortafolio, LISTAS_PORTAFOLIO[nombrePf].ruta);
    const i = Number(nodoPf.dataset.indicePf);
    const j = accion === 'subir' ? i - 1 : i + 1;
    if (accion === 'quitar') arrPf.splice(i, 1);
    else {
      if (j < 0 || j >= arrPf.length) return;
      [arrPf[i], arrPf[j]] = [arrPf[j], arrPf[i]];
    }
    renderListaPortafolio(nombrePf);
    actualizar();
    return;
  }
  const nodo = boton.closest('[data-indice]');
  const nombre = boton.closest('.lista').dataset.lista;
  const arr = obtener(ctx.estado, LISTAS[nombre].ruta);
  const i = Number(nodo.dataset.indice);
  const j = accion === 'subir' ? i - 1 : i + 1;
  if (accion === 'quitar') arr.splice(i, 1);
  else {
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  renderLista(nombre);
  if (accion !== 'quitar') {
    const destino = $(`.lista[data-lista="${nombre}"] > [data-indice="${j}"] [data-accion="${accion}"]`);
    if (destino && !destino.disabled) destino.focus();
  }
  actualizar();
};

// Ítem de lista (propuesta o portfolio) al que pertenece un botón.
const itemDeBoton = (boton, listaPropuesta, listaPortafolio) => {
  const nodoPf = boton.closest('[data-indice-pf]');
  const nodoProp = boton.closest('[data-indice]');
  const nodo = nodoPf || nodoProp;
  if (!nodo) return {};
  const lista = nodoPf ? ctx.estadoPortafolio[listaPortafolio] : ctx.estado[listaPropuesta];
  return { nodo, item: lista?.[Number(nodoPf ? nodo.dataset.indicePf : nodo.dataset.indice)] };
};

const quitarImagenItem = (boton, { propuesta, portafolio, campo = 'imagen', prefijo }) => {
  const { nodo, item } = itemDeBoton(boton, propuesta, portafolio);
  if (!item) return;
  item[campo] = '';
  actualizarImagenGenericaItem(nodo, '', prefijo);
  actualizar();
};

const quitarImagen = cambiar => () => {
  cambiar();
  actualizarLogo();
  actualizar();
};

export const instalarFormulario = () => {
  const formulario = $('#formulario');
  formulario.addEventListener('input', alEditar);
  formulario.addEventListener('change', alEditar);
  formulario.addEventListener('submit', ev => ev.preventDefault());

  registrarAcciones({
    'subir': boton => moverItem(boton, 'subir'),
    'bajar': boton => moverItem(boton, 'bajar'),
    'quitar': boton => moverItem(boton, 'quitar'),
    'agregar': boton => {
      const nombre = boton.dataset.lista;
      obtener(ctx.estado, LISTAS[nombre].ruta).push(LISTAS[nombre].nuevo());
      renderLista(nombre);
      enfocarUltimo(nombre);
      actualizar();
    },
    'agregar-pf': boton => {
      const nombrePf = boton.dataset.listaPf;
      const confPf = LISTAS_PORTAFOLIO[nombrePf];
      if (!confPf) return;
      obtener(ctx.estadoPortafolio, confPf.ruta).push(confPf.nuevo());
      renderListaPortafolio(nombrePf);
      const ultimoPf = $(`.lista[data-lista-pf="${nombrePf}"] > :last-child input`);
      if (ultimoPf) ultimoPf.focus();
      actualizar();
    },
    'quitar-img-proyecto': boton => {
      const nodoPf = boton.closest('[data-indice-pf]');
      if (!nodoPf) return;
      const itemPf = ctx.estadoPortafolio.proyectos[Number(nodoPf.dataset.indicePf)];
      if (!itemPf) return;
      itemPf.imagen = '';
      actualizarImagenProyectoItem(nodoPf, itemPf);
      actualizar();
    },
    'quitar-foto-galeria-proyecto': boton => {
      const nodoPf = boton.closest('[data-indice-pf]');
      if (!nodoPf) return;
      const itemPf = ctx.estadoPortafolio.proyectos[Number(nodoPf.dataset.indicePf)];
      const idxFoto = Number(boton.dataset.fotoIdx);
      if (!itemPf || !Array.isArray(itemPf.galeria)) return;
      itemPf.galeria.splice(idxFoto, 1);
      actualizarImagenProyectoItem(nodoPf, itemPf);
      actualizar();
    },
    'quitar-img-galeria': boton => quitarImagenItem(boton, { propuesta: 'galeria', portafolio: 'galeria', prefijo: 'data-gal-img' }),
    'quitar-img-servicio': boton => quitarImagenItem(boton, { propuesta: 'servicios', prefijo: 'data-srv-img' }),
    'quitar-img-sweb': boton => quitarImagenItem(boton, { portafolio: 'serviciosWeb', prefijo: 'data-sweb-img' }),
    'quitar-img-testimonio': boton => quitarImagenItem(boton, { propuesta: 'testimonios', portafolio: 'testimonios', campo: 'avatar', prefijo: 'data-test-img' }),
    'quitar-foto-emisor': quitarImagen(() => { docActivo().emisor.foto = ''; }),
    'quitar-portada-prop': quitarImagen(() => { ctx.estado.propuesta.imagenPortada = ''; }),
    'quitar-portada-pf': quitarImagen(() => { ctx.estadoPortafolio.portafolio.imagenPortada = ''; }),
    'quitar-logo': quitarImagen(() => { docActivo().emisor.logo = ''; })
  });
};
