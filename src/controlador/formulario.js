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
import { MODALIDADES, LISTAS, LISTAS_PORTAFOLIO, totalServicio, copiaPortafolioDesactualizada, proyectosConContenido } from '../modelo.js';
import { ctx, docActivo, esLogoValido, normalizarPf } from './contexto.js';
import { ofrecerDeshacer } from './historial.js';
import { registrarAcciones } from './acciones.js';
import { copiarPortafolioEnPropuesta } from './guardado.js';
import { actualizar } from './documento.js';
import { llenarTemaEditor } from './diseno.js';
import { actualizarSeccionesHoja } from './hoja.js';
import { pintarCobroEditor } from './cobro.js';
import { pintarEstadosVideo } from './video.js';
import { cerrarExplorador } from './explorador-plantillas.js';

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
  // Ajustes de la foto de «Sobre mí» (solo en el portfolio; el CSS los oculta en propuestas).
  const pfDatos = ctx.estadoPortafolio?.portafolio;
  if ($('#foto-emisor-ajustes')) $('#foto-emisor-ajustes').hidden = !(ctx.modoEditor === 'portafolio' && actual.emisor.foto);
  if ($('#foto-emisor-zoom-val')) $('#foto-emisor-zoom-val').textContent = `${pfDatos?.zoomFotoSobre ?? 100}%`;
  if ($('#foto-emisor-zoom-wrap')) $('#foto-emisor-zoom-wrap').hidden = pfDatos?.ajusteFotoSobre === 'entera';

  // Foto de portada Hero de la propuesta y del portfolio
  [['portada-prop', ctx.estado.propuesta], ['portada-pf', ctx.estadoPortafolio.portafolio]].forEach(([prefijo, datos]) => {
    const img = datos?.imagenPortada || '';
    pintarImagen(prefijo, img, 'Subir foto de portada', 'Cambiar foto de portada');
    if ($(`#${prefijo}-opacidad-wrap`)) $(`#${prefijo}-opacidad-wrap`).hidden = !img;
    if ($(`#${prefijo}-opacidad-val`)) $(`#${prefijo}-opacidad-val`).textContent = `${datos?.opacidadPortada ?? 35}%`;
    // Ajustes de la foto (solo en el portfolio): se ven cuando hay foto; el zoom, al recortar.
    if ($(`#${prefijo}-ajustes`)) $(`#${prefijo}-ajustes`).hidden = !img;
    if ($(`#${prefijo}-zoom-val`)) $(`#${prefijo}-zoom-val`).textContent = `${datos?.zoomPortada ?? 100}%`;
    if ($(`#${prefijo}-zoom-wrap`)) $(`#${prefijo}-zoom-wrap`).hidden = datos?.ajustePortada === 'entera';
  });
};

// Si el portfolio de la propuesta cambió desde que se copió, o ya no existe. La copia que ve
// el cliente no se toca sola: el dueño decide si trae los cambios.
const pintarAvisoPortafolio = () => {
  const aviso = $('#portafolio-aviso');
  if (!aviso) return;
  const { estado, portafolios } = ctx;
  const pfId = estado.opciones?.portafolioId || '';
  const copia = pfId ? estado.opciones?.portafolio : null;
  const pfDoc = portafolios.find(pf => pf.id === pfId);
  let mensaje = '';
  let conBoton = false;
  if (copia && !ctx.portafoliosCargando && !ctx.portafoliosError) {
    if (!pfDoc) mensaje = 'El portfolio original ya no está en tus portfolios. La propuesta sigue mostrando los proyectos que tenía.';
    else if (copiaPortafolioDesactualizada(copia, pfDoc, { logoValido: esLogoValido, proyectos: estado.opciones.portafolioProyectos })) {
      mensaje = 'Este portfolio cambió desde que lo sumaste. La propuesta muestra la versión anterior.';
      conBoton = true;
    }
  }
  aviso.hidden = !mensaje;
  $('#portafolio-aviso-texto').textContent = mensaje;
  $('#portafolio-aviso-boton').hidden = !conBoton;
};

// ---------- Proyectos del portfolio que van en la propuesta ----------
// opciones.portafolioProyectos: ids elegidos, en el orden en que se muestran. Sin lista, van
// todos. Elegir o reordenar arma de nuevo la copia con el portfolio actual.

const proyectosDelPortafolio = () => {
  const pfId = ctx.estado.opciones?.portafolioId || '';
  const pfDoc = pfId ? ctx.portafolios.find(pf => pf.id === pfId) : null;
  return pfDoc ? proyectosConContenido(normalizarPf(pfDoc.payload).proyectos) : null;
};

const proyectosElegidos = proyectos => {
  const ids = new Set(proyectos.map(p => p.id));
  const seleccion = ctx.estado.opciones?.portafolioProyectos;
  return Array.isArray(seleccion) ? seleccion.filter(id => ids.has(id)) : proyectos.map(p => p.id);
};

const pintarProyectosPortafolio = () => {
  const caja = $('#portafolio-proyectos');
  if (!caja) return;
  const proyectos = proyectosDelPortafolio();
  caja.hidden = !proyectos?.length;
  if (!proyectos?.length) {
    caja.innerHTML = '';
    return;
  }
  const elegidos = proyectosElegidos(proyectos);
  const porId = new Map(proyectos.map(p => [p.id, p]));
  const orden = [...elegidos.map(id => porId.get(id)), ...proyectos.filter(p => !elegidos.includes(p.id))];
  const fila = p => {
    const pos = elegidos.indexOf(p.id);
    const elegido = pos >= 0;
    const titulo = p.titulo.trim() || 'Proyecto sin título';
    return `
      <li class="pf-elegir__item${elegido ? ' pf-elegir__item--elegido' : ''}">
        <label class="pf-elegir__dato">
          <input type="checkbox" data-pf-proyecto="${esc(p.id)}"${elegido ? ' checked' : ''}>
          ${p.imagen ? `<img class="pf-elegir__mini" src="${esc(p.imagen)}" alt="">` : '<span class="pf-elegir__mini pf-elegir__mini--vacia" aria-hidden="true"></span>'}
          <span class="pf-elegir__texto">
            <span class="pf-elegir__titulo">${esc(titulo)}</span>
            ${p.categoria.trim() ? `<span class="pf-elegir__cat">${esc(p.categoria.trim())}</span>` : ''}
          </span>
        </label>
        ${elegido ? `
          <span class="pf-elegir__orden">
            <button type="button" class="icono-boton" data-accion="pf-proyecto-subir" data-id="${esc(p.id)}" aria-label="Subir «${esc(titulo)}»"${pos === 0 ? ' disabled' : ''}>↑</button>
            <button type="button" class="icono-boton" data-accion="pf-proyecto-bajar" data-id="${esc(p.id)}" aria-label="Bajar «${esc(titulo)}»"${pos === elegidos.length - 1 ? ' disabled' : ''}>↓</button>
          </span>` : ''}
      </li>`;
  };
  caja.innerHTML = `
    <p class="pf-elegir__cabecera">
      <span class="campo__etiqueta">Proyectos que ve tu cliente</span>
      <span class="pf-elegir__cuenta">${elegidos.length} de ${proyectos.length}</span>
    </p>
    <ul class="pf-elegir__lista">${orden.map(fila).join('')}</ul>`;
};

const pintarPortafolioPropuesta = () => {
  pintarAvisoPortafolio();
  pintarProyectosPortafolio();
};

const cambiarProyectosElegidos = cambiar => {
  const proyectos = proyectosDelPortafolio();
  if (!proyectos) return;
  ctx.estado.opciones.portafolioProyectos = cambiar(proyectosElegidos(proyectos));
  copiarPortafolioEnPropuesta();
  pintarPortafolioPropuesta();
  actualizar();
};

const moverProyectoElegido = (id, paso) => cambiarProyectosElegidos(lista => {
  const i = lista.indexOf(id);
  const j = i + paso;
  if (i < 0 || j < 0 || j >= lista.length) return lista;
  const nueva = [...lista];
  [nueva[i], nueva[j]] = [nueva[j], nueva[i]];
  return nueva;
});

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
  // Un portfolio borrado: la propuesta conserva su copia y el selector la sigue mostrando.
  const copia = valorActual ? estado.opciones?.portafolio : null;
  if (valorActual && !existe && copia) {
    const nombre = texto(copia.nombre).trim() || texto(copia.titulo).trim() || 'Portfolio';
    opcionesHTML.push(`<option value="${esc(valorActual)}">${esc(nombre)} (copia guardada en la propuesta)</option>`);
  } else if (valorActual && !existe && !ctx.portafoliosCargando) {
    estado.opciones.portafolioId = '';
  }
  sel.innerHTML = opcionesHTML.join('');
  sel.value = existe || copia ? valorActual : '';
  pintarPortafolioPropuesta();
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
  if (esPf) cerrarExplorador();
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
  // Casilla de un proyecto del portfolio (solo en «change»: la casilla también avisa «input»).
  if (el.dataset.pfProyecto !== undefined) {
    if (ev.type !== 'change') return;
    const id = el.dataset.pfProyecto;
    cambiarProyectosElegidos(lista => (el.checked ? [...lista.filter(x => x !== id), id] : lista.filter(x => x !== id)));
    return;
  }
  if (ctx.modoEditor === 'portafolio') {
    const { estadoPortafolio } = ctx;
    if (el.dataset.campo && el.dataset.campo.startsWith('emisor.')) {
      asignar(estadoPortafolio, el.dataset.campo, leerValor(el));
      actualizar();
      return;
    }
    if (el.dataset.campoPf) {
      asignar(estadoPortafolio, el.dataset.campoPf, leerValor(el));
      if (/^portafolio\.((opacidad|zoom|ajuste)Portada|(zoom|ajuste)FotoSobre)$/.test(el.dataset.campoPf)) actualizarLogo();
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
    if (el.dataset.campo === 'opciones.portafolioId') {
      delete ctx.estado.opciones.portafolioProyectos;
      copiarPortafolioEnPropuesta();
      pintarPortafolioPropuesta();
    }
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

const FEMENINOS = new Set(['etapa', 'foto', 'pregunta']);
const textoQuitado = nombre => `Quitaste ${FEMENINOS.has(nombre) ? 'la' : 'el'} ${nombre}.`;

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
    if (accion === 'quitar') ofrecerDeshacer(textoQuitado(LISTAS_PORTAFOLIO[nombrePf].nombre));
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
  if (accion === 'quitar') ofrecerDeshacer(textoQuitado(LISTAS[nombre].nombre));
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
    // El portfolio de la propuesta cambió: el dueño trae sus cambios a la copia.
    'actualizar-portafolio-propuesta': () => {
      copiarPortafolioEnPropuesta();
      pintarPortafolioPropuesta();
      actualizar();
    },
    'pf-proyecto-subir': boton => moverProyectoElegido(boton.dataset.id, -1),
    'pf-proyecto-bajar': boton => moverProyectoElegido(boton.dataset.id, 1),
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
