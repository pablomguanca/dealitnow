// Subida de imágenes del editor: logo, foto del emisor, portadas, galerías y fotos de
// cada ítem. Con cuenta van a Firebase Storage; sin cuenta quedan dentro del documento.

import { $ } from '../lib/formato.js';
import { LISTAS, LISTAS_PORTAFOLIO } from '../modelo.js';
import {
  LOGO_MAX_ARCHIVO,
  FOTO_MAX_ARCHIVO,
  reducirLogo,
  logoParaSubir,
  procesarImagenProyecto
} from '../lib/imagenes.js';
import { ctx, AteneaDB, docActivo, nube } from './contexto.js';
import { avisarExito, avisarError } from './avisos.js';
import {
  actualizarLogo,
  actualizarImagenGenericaItem,
  actualizarImagenProyectoItem,
  renderLista,
  renderListaPortafolio
} from './formulario.js';
import { actualizar } from './documento.js';

const subiendoLogo = estaSubiendo => {
  $('#logo-texto').textContent = estaSubiendo ? 'Subiendo logo…' : (docActivo().emisor.logo ? 'Cambiar logo' : 'Subir logo');
  $('#campo-logo').disabled = estaSubiendo;
};

// Logos guardados dentro de la propuesta (versiones anteriores o subidas fallidas)
// se pasan a Storage al abrirla. Si falla, se reintenta la próxima vez.
export const migrarLogo = async () => {
  const id = ctx.propuestaId;
  const logo = ctx.estado.emisor.logo;
  if (!nube() || !id || !logo.startsWith('data:')) return;
  try {
    const blob = await (await fetch(logo)).blob();
    const url = await AteneaDB.logos.subir(/^image\/(png|jpeg|webp)$/.test(blob.type) ? blob : await logoParaSubir(blob));
    if (ctx.propuestaId !== id || ctx.estado.emisor.logo !== logo) return;
    ctx.estado.emisor.logo = url;
    actualizarLogo();
    actualizar();
  } catch (e) {
    console.warn('No se pudo pasar el logo a Storage:', e);
  }
};

const subirOComprimirFoto = async (archivo, dims = {}) => {
  if (!archivo || !archivo.type.startsWith('image/')) {
    avisarError('Elegí una imagen en formato PNG, JPG o WebP.');
    return '';
  }
  if (archivo.size > FOTO_MAX_ARCHIVO) {
    avisarError('La imagen supera los 50 MB. Probá con un archivo de hasta 50 MB.');
    return '';
  }
  const db = nube();
  if (db && db.logos) {
    try {
      return await db.logos.subir(await procesarImagenProyecto(archivo, true, dims));
    } catch {
      return procesarImagenProyecto(archivo, false, dims);
    }
  }
  return procesarImagenProyecto(archivo, false, dims);
};

// Foto única (emisor o portada): mientras sube, el botón muestra «Subiendo…».
const vincularFotoUnica = (selectorCampo, selectorTexto, dims, guardar, mensajeError) => {
  const campo = $(selectorCampo);
  if (!campo) return;
  campo.addEventListener('change', async () => {
    const archivo = campo.files?.[0];
    campo.value = '';
    if (!archivo) return;
    if ($(selectorTexto)) $(selectorTexto).textContent = 'Subiendo…';
    campo.disabled = true;
    try {
      const url = await subirOComprimirFoto(archivo, dims);
      if (url) {
        guardar(url);
        actualizarLogo();
        actualizar();
      }
    } catch {
      avisarError(mensajeError);
    } finally {
      campo.disabled = false;
      actualizarLogo();
    }
  });
};

// Foto de un ítem de lista (galería, servicio, servicio web, testimonio).
const subirFotoItem = async (input, { prefijo, lista, dims, campo = 'imagen' }) => {
  const archivo = input.files?.[0];
  input.value = '';
  if (!archivo) return;
  const nodoPf = input.closest('[data-indice-pf]');
  const nodoProp = input.closest('[data-indice]');
  const esPf = !!nodoPf;
  const nodo = nodoPf || nodoProp;
  if (!nodo) return;
  const destino = esPf ? lista.portafolio : lista.propuesta;
  if (!destino) return;
  const idx = Number(esPf ? nodo.dataset.indicePf : nodo.dataset.indice);
  const item = (esPf ? ctx.estadoPortafolio : ctx.estado)[destino]?.[idx];
  if (!item) return;
  const txt = $(`[${prefijo}-texto]`, nodo);
  if (txt) txt.textContent = 'Subiendo…';
  input.disabled = true;
  try {
    const u = await subirOComprimirFoto(archivo, dims);
    if (u) {
      item[campo] = u;
      actualizarImagenGenericaItem(nodo, item[campo], prefijo);
      actualizar();
    }
  } finally {
    input.disabled = false;
    actualizarImagenGenericaItem(nodo, item[campo], prefijo);
  }
};

const subirPortadaProyecto = async inputImg => {
  const archivo = inputImg.files?.[0];
  inputImg.value = '';
  if (!archivo) return;
  const nodo = inputImg.closest('[data-indice-pf]');
  if (!nodo) return;
  const idx = Number(nodo.dataset.indicePf);
  const proyecto = ctx.estadoPortafolio.proyectos[idx];
  if (!proyecto) return;
  const txt = $('[data-pf-img-texto]', nodo);
  if (txt) txt.textContent = 'Subiendo…';
  inputImg.disabled = true;
  try {
    const urlImg = await subirOComprimirFoto(archivo);
    if (urlImg && ctx.estadoPortafolio.proyectos[idx] === proyecto) {
      proyecto.imagen = urlImg;
      actualizarImagenProyectoItem(nodo, proyecto);
      actualizar();
    }
  } catch {
    avisarError('No se pudo cargar la imagen. Probá con otra.');
  } finally {
    inputImg.disabled = false;
    if (ctx.estadoPortafolio.proyectos[idx] === proyecto) actualizarImagenProyectoItem(nodo, proyecto);
  }
};

const subirGaleriaProyecto = async inputGalProy => {
  const archivos = [...(inputGalProy.files || [])];
  inputGalProy.value = '';
  if (!archivos.length) return;
  const nodo = inputGalProy.closest('[data-indice-pf]');
  if (!nodo) return;
  const proyecto = ctx.estadoPortafolio.proyectos[Number(nodo.dataset.indicePf)];
  if (!proyecto) return;
  proyecto.galeria = Array.isArray(proyecto.galeria) ? proyecto.galeria : [];
  const cupo = Math.max(0, 8 - proyecto.galeria.length);
  if (!cupo) {
    avisarError('Cada proyecto admite hasta 8 fotos adicionales.');
    return;
  }
  inputGalProy.disabled = true;
  try {
    for (const arch of archivos.slice(0, cupo)) {
      const u = await subirOComprimirFoto(arch);
      if (u) proyecto.galeria.push(u);
    }
    actualizarImagenProyectoItem(nodo, proyecto);
    actualizar();
  } finally {
    inputGalProy.disabled = false;
  }
};

// Varias fotos de una vez a la galería libre (propuesta o portfolio).
const subirGaleriaMultiple = async inputMultiGal => {
  const archivos = [...(inputMultiGal.files || [])];
  inputMultiGal.value = '';
  if (!archivos.length) return;
  const esPf = inputMultiGal.dataset.galeriaMulti === 'portafolio';
  const destino = esPf ? ctx.estadoPortafolio : ctx.estado;
  const conf = esPf ? LISTAS_PORTAFOLIO.galeria : LISTAS.galeria;
  inputMultiGal.disabled = true;
  try {
    for (const arch of archivos.slice(0, 12)) {
      const u = await subirOComprimirFoto(arch);
      if (u) {
        const nuevoItem = conf.nuevo();
        nuevoItem.imagen = u;
        nuevoItem.proporcion = destino.opciones?.galeriaProporcion || 'panoramica';
        destino.galeria.push(nuevoItem);
      }
    }
    if (esPf) renderListaPortafolio('galeria');
    else renderLista('galeria');
    actualizar();
    avisarExito(`${archivos.length === 1 ? 'Foto agregada' : 'Fotos agregadas'} a la galería.`);
  } finally {
    inputMultiGal.disabled = false;
  }
};

export const instalarSubidas = () => {
  const campoLogo = $('#campo-logo');
  campoLogo.addEventListener('change', async () => {
    const archivo = campoLogo.files[0];
    campoLogo.value = '';
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      avisarError('El logo tiene que ser una imagen PNG, JPG, SVG o WebP.');
      return;
    }
    if (archivo.size > LOGO_MAX_ARCHIVO) {
      avisarError('El logo supera los 25 MB. Elegí un archivo más liviano.');
      return;
    }
    const db = nube();
    const id = ctx.propuestaId;
    let logo;
    subiendoLogo(true);
    try {
      if (db) {
        try {
          logo = await db.logos.subir(await logoParaSubir(archivo));
        } catch (e) {
          // Sin conexión o sin Storage: el logo queda dentro de la propuesta y
          // se sube solo la próxima vez que se abra.
          console.error('No se pudo subir el logo:', e);
          logo = await reducirLogo(archivo);
          avisarError('No se pudo subir el logo a tu cuenta, así que quedó guardado dentro de la propuesta.', 6000);
        }
      } else {
        logo = await reducirLogo(archivo);
      }
    } catch {
      avisarError('No se pudo leer la imagen. Probá con otra.');
    }
    if (logo && ctx.propuestaId === id) {
      docActivo().emisor.logo = logo;
      actualizarLogo();
      actualizar();
    }
    subiendoLogo(false);
  });

  vincularFotoUnica('#campo-foto-emisor', '#foto-emisor-texto', { anchoMax: 480, altoMax: 480 },
    url => { docActivo().emisor.foto = url; }, 'No se pudo cargar la foto.');
  vincularFotoUnica('#campo-portada-prop', '#portada-prop-texto', { anchoMax: 1920, altoMax: 1080, calidad: 0.88 },
    url => { ctx.estado.propuesta.imagenPortada = url; }, 'No se pudo cargar la foto de portada.');
  vincularFotoUnica('#campo-portada-pf', '#portada-pf-texto', { anchoMax: 1920, altoMax: 1080, calidad: 0.88 },
    url => { ctx.estadoPortafolio.portafolio.imagenPortada = url; }, 'No se pudo cargar la foto de portada.');

  $('#formulario').addEventListener('change', ev => {
    const t = ev.target;
    const input = sel => t.closest(sel);
    if (input('[data-pf-img-input]')) return subirPortadaProyecto(input('[data-pf-img-input]'));
    if (input('[data-pf-galeria-input]')) return subirGaleriaProyecto(input('[data-pf-galeria-input]'));
    if (input('[data-gal-img-input]')) return subirFotoItem(input('[data-gal-img-input]'), { prefijo: 'data-gal-img', lista: { propuesta: 'galeria', portafolio: 'galeria' } });
    if (input('[data-galeria-multi]')) return subirGaleriaMultiple(input('[data-galeria-multi]'));
    if (input('[data-srv-img-input]')) return subirFotoItem(input('[data-srv-img-input]'), { prefijo: 'data-srv-img', lista: { propuesta: 'servicios' } });
    if (input('[data-sweb-img-input]')) return subirFotoItem(input('[data-sweb-img-input]'), { prefijo: 'data-sweb-img', lista: { portafolio: 'serviciosWeb' } });
    if (input('[data-test-img-input]')) return subirFotoItem(input('[data-test-img-input]'), { prefijo: 'data-test-img', lista: { propuesta: 'testimonios', portafolio: 'testimonios' }, dims: { anchoMax: 320, altoMax: 320 }, campo: 'avatar' });
  });
};
