import {
  numero,
  texto,
  esc,
  lineas,
  parrafos,
  dinero,
  cantidadTexto,
  desdeISO,
  fechaLarga
} from './formato.js';
import { firmaSVG, pideFirma } from '../firma.js';
import { puedePagar } from '../pagos.js';
import {
  PROPORCIONES_IMAGEN,
  LAYOUTS_GALERIA,
  DISPOSICIONES_FOTOS,
  ENCUADRES_IMAGEN,
  totalServicio,
  calcularTotales,
  cobraPorTransferencia,
  cobraConMercadoPago
} from '../modelo.js';
import { decoracionPortadaSVG } from './decoraciones.js';
import { analizarVideo } from '../video.js';
import { resolverColoresTema } from './tema.js';
import { atributoEditar } from '../editar-documento.js';

export const ICONO_SUMAR = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>';
export const ICONO_SUMADO = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
export const ICONO_CHECK = '<svg class="icono-check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6.5"/></svg>';
export const ICONO_EXTERNO = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5h6.5V10M12 4L4.5 11.5"/></svg>';

// Video («Contale un poco más a tu cliente con un video»). En la web, una portada con el
// botón de play: el reproductor se carga recién al tocarla (vista.js), así la propuesta abre
// rápido y el editor no recarga el video con cada tecla. En el PDF, el link para verlo.
const ICONO_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.8v12.4a.9.9 0 0 0 1.37.77l10.1-6.2a.9.9 0 0 0 0-1.54l-10.1-6.2a.9.9 0 0 0-1.37.77z"/></svg>';

export const videoSeccionHTML = (datos, web = true) => {
  const v = analizarVideo(datos?.url);
  if (!v) return '';
  const texto = (datos.texto || '').trim();
  const intro = texto ? `<p class="video-bloque__texto">${esc(texto).replace(/\n/g, '<br>')}</p>` : '';
  if (!web) {
    return `
      <div class="video-bloque video-bloque--impreso">
        ${intro}
        <p class="video-bloque__enlace">Mirá el video en ${esc(v.nombre)}: <a href="${esc(v.enlace)}">${esc(v.enlace)}</a></p>
      </div>`;
  }
  return `
    <div class="video-bloque${v.vertical ? ' video-bloque--vertical' : ''}">
      ${intro}
      <div class="video-bloque__marco video-bloque__marco--${esc(v.proveedor)}" data-video-embed="${esc(v.embed || '')}" data-video-archivo="${esc(v.archivo || '')}" data-video-titulo="${esc(datos.titulo?.trim() || 'Video')}">
        <button type="button" class="video-bloque__play" data-video-reproducir aria-label="Reproducir el video">
          ${v.miniatura ? `<img class="video-bloque__miniatura" src="${esc(v.miniatura)}" alt="" loading="lazy" decoding="async">` : '<span class="video-bloque__fondo" aria-hidden="true"></span>'}
          <span class="video-bloque__boton" aria-hidden="true">${ICONO_PLAY}</span>
          <span class="video-bloque__fuente">${esc(v.nombre)}</span>
        </button>
      </div>
    </div>`;
};

export const vacioHTML = t => `<span class="doc__vacio">${esc(t)}</span>`;

export const servicioConContenido = s => s && (s.nombre.trim() || s.descripcion?.trim() || s.entregables?.trim() || numero(s.precio) > 0);

export const proyectoConContenido = p => p && (p.titulo.trim() || p.descripcion.trim() || p.imagen || (Array.isArray(p.galeria) && p.galeria.length > 0));

export const calcularVigencia = (propuesta = {}) => {
  const fecha = desdeISO(propuesta.fecha);
  const dias = Math.max(0, Math.round(numero(propuesta.validez)));
  if (!fecha || !dias) return { fecha, vence: null, restantes: null, vencida: false };
  const vence = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const restantes = Math.round((vence - hoy) / 86400000);
  return { fecha, vence, restantes, vencida: restantes < 0 };
};

export const digitosWhatsApp = (em = {}) => (em?.telefono || '').replace(/\D/g, '');

export const armarEnlaceWhatsApp = (mensaje, em = {}) => {
  const d = digitosWhatsApp(em);
  return d.length >= 8 ? `https://wa.me/${d}?text=${encodeURIComponent(mensaje)}` : '';
};

export const armarEnlaceEmail = (asunto, mensaje, em = {}) => {
  const mail = (em?.email || '').trim();
  return mail ? `mailto:${mail}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}` : '';
};

export const fechaDeAceptacion = a => {
  const f = a?.fecha;
  const d = f && typeof f.toDate === 'function' ? f.toDate() : f ? new Date(f) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

export const textoRestantes = n => (n === 0 ? 'Vence hoy' : n === 1 ? 'Queda 1 día' : `Quedan ${n} días`);

export const normalizarUrlRed = (valor, tipo) => {
  const v = texto(valor).trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  const limpio = v.replace(/^@/, '');
  if (tipo === 'instagram' && !limpio.includes('/')) return `https://instagram.com/${limpio}`;
  if (tipo === 'linkedin' && !limpio.includes('.')) return `https://linkedin.com/in/${limpio}`;
  if (tipo === 'behance' && !limpio.includes('.')) return `https://behance.net/${limpio}`;
  return `https://${limpio}`;
};

export const redesEmisorHTML = (e = {}, web = true) => {
  const items = [];
  if (e.instagram?.trim()) {
    const u = normalizarUrlRed(e.instagram, 'instagram');
    const etq = e.instagram.trim().startsWith('@')
      ? e.instagram.trim()
      : `@${e.instagram.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '')}`;
    items.push({ url: u, texto: etq, icono: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.2" y="2.2" width="11.6" height="11.6" rx="3.2"/><circle cx="8" cy="8" r="2.6"/><circle cx="11.4" cy="4.6" r="0.6" fill="currentColor"/></svg>' });
  }
  if (e.linkedin?.trim()) {
    const u = normalizarUrlRed(e.linkedin, 'linkedin');
    items.push({ url: u, texto: 'LinkedIn', icono: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2"/><path d="M5.2 7v4.2M5.2 4.9v.1M8 11.2V8.6c0-1 .7-1.7 1.6-1.7s1.5.6 1.5 1.7v2.6"/></svg>' });
  }
  if (e.behance?.trim()) {
    const u = normalizarUrlRed(e.behance, 'behance');
    const esGh = /github/i.test(e.behance);
    items.push({ url: u, texto: esGh ? 'GitHub' : 'Portfolio / Red', icono: ICONO_EXTERNO });
  }
  if (e.web?.trim()) {
    const u = /^https?:\/\//i.test(e.web.trim()) ? e.web.trim() : `https://${e.web.trim()}`;
    items.push({ url: u, texto: e.web.trim().replace(/^https?:\/\//i, ''), icono: ICONO_EXTERNO });
  }
  if (!items.length) return '';
  return `<ul class="sobre-mi__redes">${items.map(it => `<li><a class="sobre-mi__red" href="${esc(it.url)}" target="_blank" rel="noopener"${web ? ' data-enlace-cliente' : ''}>${it.icono}<span>${esc(it.texto)}</span></a></li>`).join('')}</ul>`;
};

export const sobreMiBloqueHTML = (e = {}, especialidades = [], web = true, lightbox = true) => {
  const tieneFoto = !!e.foto;
  const tieneTexto = !!e.presentacion?.trim();
  const espValidas = (especialidades || []).filter(x => x.texto?.trim());
  const redes = redesEmisorHTML(e, web);
  const ubic = e.ubicacion?.trim()
    ? `<span class="sobre-mi__ubicacion"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 9.8 8 14 8 14z"/><circle cx="8" cy="6.5" r="1.5"/></svg>${esc(e.ubicacion.trim())}</span>`
    : '';
  const avatarHTML = tieneFoto
    ? `<div class="sobre-mi__avatar-wrap">
        <img class="sobre-mi__avatar" src="${esc(e.foto)}" alt="${esc(e.nombre || 'Foto de perfil')}"${web && lightbox ? ` data-lightbox-src="${esc(e.foto)}" data-lightbox-caption="${esc(e.nombre || '')}"` : ''}>
        ${ubic}
      </div>`
    : '';
  return `
    <div class="sobre-mi${tieneFoto ? '' : ' sobre-mi--sin-foto'}">
      ${avatarHTML}
      <div class="sobre-mi__cuerpo">
        ${!tieneFoto && ubic ? `<div style="margin-bottom:0.65em">${ubic}</div>` : ''}
        ${tieneTexto ? `<div class="presentacion-bloque">${parrafos(e.presentacion)}</div>` : ''}
        ${espValidas.length ? `<ul class="especialidades-chips">${espValidas.map(esp => `<li class="especialidad-chip">${esc(esp.texto.trim())}</li>`).join('')}</ul>` : ''}
        ${redes}
      </div>
    </div>`;
};

// editar (opcional, en las cuatro de abajo): arma el atributo de edición de cada ítem, para
// tocar el documento en el editor del portfolio: editar(item) o editar(item, 'campo').
export const galeriaSeccionHTML = (fotos = [], opciones = {}, web = true, { editar = () => '' } = {}) => {
  const validas = (fotos || []).filter(g => g && g.imagen);
  if (!validas.length) return '';
  const layout = LAYOUTS_GALERIA[opciones.galeriaLayout] ? opciones.galeriaLayout : 'bento';
  const propDef = PROPORCIONES_IMAGEN[opciones.galeriaProporcion] ? opciones.galeriaProporcion : 'panoramica';
  const usaLightbox = web && opciones.lightbox !== false;
  const sub = opciones.galeriaSubtitulo?.trim() ? `<p class="galeria-subtitulo">${esc(opciones.galeriaSubtitulo.trim())}</p>` : '';
  const items = validas.map((g, idx) => {
    const prop = PROPORCIONES_IMAGEN[g.proporcion] ? g.proporcion : propDef;
    const encuadreGal = (ENCUADRES_IMAGEN[g.encuadre] || ENCUADRES_IMAGEN.centro).css;
    const cap = [g.titulo?.trim(), g.descripcion?.trim()].filter(Boolean).join(' — ');
    return `
      <figure class="galeria-item"${editar(g)}>
        <div class="galeria-item__media media-ratio--${esc(prop)}"${usaLightbox ? ` data-lightbox-src="${esc(g.imagen)}" data-lightbox-caption="${esc(cap)}" data-lightbox-group="galeria"` : ''}>
          <img src="${esc(g.imagen)}" alt="${esc(g.titulo?.trim() || `Imagen ${idx + 1}`)}" style="object-position:${esc(encuadreGal)}">
        </div>
        ${(g.titulo?.trim() || g.descripcion?.trim()) ? `
          <figcaption class="galeria-item__pie">
            ${g.titulo?.trim() ? `<p class="galeria-item__titulo">${esc(g.titulo.trim())}</p>` : ''}
            ${g.descripcion?.trim() ? `<p class="galeria-item__desc">${esc(g.descripcion.trim())}</p>` : ''}
          </figcaption>` : ''}
      </figure>`;
  }).join('');
  return `${sub}<div class="galeria-web galeria-web--${esc(layout)}">${items}</div>`;
};

export const testimoniosSeccionHTML = (lista = [], web = true, lightbox = true, { editar = () => '' } = {}) => {
  const validos = (lista || []).filter(t => t && (t.texto?.trim() || t.autor?.trim()));
  if (!validos.length) return '';
  return `<div class="testimonios-grilla">${validos.map(t => {
    const inicial = (t.autor?.trim() || 'C').charAt(0).toUpperCase();
    const avatar = t.avatar
      ? `<img class="testimonio-card__avatar" src="${esc(t.avatar)}" alt="${esc(t.autor || 'Cliente')}"${web && lightbox ? ` data-lightbox-src="${esc(t.avatar)}" data-lightbox-caption="${esc(t.autor || '')}"` : ''}>`
      : `<span class="testimonio-card__inicial" aria-hidden="true">${esc(inicial)}</span>`;
    return `
      <blockquote class="testimonio-card"${editar(t)}>
        ${t.texto?.trim() ? `<p class="testimonio-card__texto"${editar(t, 'texto')}>“${esc(t.texto.trim()).replace(/\n/g, '<br>')}”</p>` : ''}
        <footer class="testimonio-card__autor">
          ${avatar}
          <div>
            <span class="testimonio-card__nombre"${editar(t, 'autor')}>${esc(t.autor?.trim() || 'Cliente')}</span>
            ${t.rol?.trim() ? `<span class="testimonio-card__rol"${editar(t, 'rol')}>${esc(t.rol.trim())}</span>` : ''}
          </div>
        </footer>
      </blockquote>`;
  }).join('')}</div>`;
};

export const faqsSeccionHTML = (lista = [], web = true, { editar = () => '' } = {}) => {
  const validas = (lista || []).filter(f => f && (f.pregunta?.trim() || f.respuesta?.trim()));
  if (!validas.length) return '';
  return `<div class="faqs-lista">${validas.map((f, i) => `
    <details class="faq-item"${!web || i === 0 ? ' open' : ''}${editar(f)}>
      <summary class="faq-item__pregunta">${esc(f.pregunta?.trim() || 'Pregunta frecuente')}</summary>
      <div class="faq-item__respuesta"${editar(f, 'respuesta')}>${parrafos(f.respuesta || '')}</div>
    </details>`).join('')}</div>`;
};

// Fotos de un proyecto (o su portada tipográfica, si no tiene): las usan la tarjeta del
// proyecto (portfolio adjunto a una propuesta) y el caso de la página del portfolio.
export const proyectoMediaHTML = (p, idx, web, lightbox = true) => {
  const prop = PROPORCIONES_IMAGEN[p.proporcion] ? p.proporcion : 'panoramica';
  const extras = Array.isArray(p.galeria) ? p.galeria.filter(Boolean) : [];
  const imagenPrincipal = p.imagen || extras[0] || '';
  const todasLasFotos = [p.imagen, ...extras].filter(Boolean);
  const grupoLb = `proy-${p.id || idx}`;
  const usaLb = web && lightbox;
  const capBase = [p.titulo?.trim(), p.subtitulo?.trim(), p.destacado?.trim()].filter(Boolean).join(' · ');
  const encuadre = (ENCUADRES_IMAGEN[p.encuadre] || ENCUADRES_IMAGEN.centro).css;
  const disposicion = DISPOSICIONES_FOTOS[p.disposicionFotos] ? p.disposicionFotos : 'grilla';
  // Con varias fotos y una disposición que no sea «destacada», se ven todas por igual.
  const variasVisibles = todasLasFotos.length > 1 && disposicion !== 'destacada';
  const atributosLb = (src, i) => (usaLb
    ? ` data-lightbox-src="${esc(src)}" data-lightbox-caption="${esc(capBase ? `${capBase} (${i + 1}/${todasLasFotos.length})` : '')}" data-lightbox-group="${esc(grupoLb)}"`
    : '');

  const fotosVisibles = variasVisibles
    ? `<div class="proyecto-fotos proyecto-fotos--${esc(disposicion)}" data-cantidad="${Math.min(todasLasFotos.length, 9)}">${todasLasFotos.map((src, i) => `
        <div class="proyecto-fotos__item${disposicion === 'mosaico' ? '' : ` media-ratio--${esc(prop)}`}"${atributosLb(src, i)}>
          <img src="${esc(src)}" alt="${esc(`${p.titulo || 'Proyecto'} — foto ${i + 1}`)}" style="object-position:${esc(encuadre)}" loading="lazy">
        </div>`).join('')}</div>`
    : '';

  const media = fotosVisibles || (imagenPrincipal
    ? `<div class="proyecto-card__media media-ratio--${esc(prop)}"${usaLb ? ` data-lightbox-src="${esc(imagenPrincipal)}" data-lightbox-caption="${esc(capBase)}" data-lightbox-group="${esc(grupoLb)}"` : ''}>
        <img src="${esc(imagenPrincipal)}" alt="${esc(p.titulo || 'Proyecto')}" style="object-position:${esc(encuadre)}">
        ${todasLasFotos.length > 1 ? `<span class="proyecto-card__contador-fotos">${todasLasFotos.length} fotos</span>` : ''}
      </div>`
    : `<div class="proyecto-card__arte" aria-hidden="true">
        <div class="proyecto-card__arte-top">
          <span class="proyecto-card__arte-indice">${String(idx + 1).padStart(2, '0')}</span>
          ${p.destacado.trim() ? `<span class="proyecto-card__destacado">${esc(p.destacado.trim())}</span>` : ''}
        </div>
        <span class="proyecto-card__arte-titular">${esc(p.titulo.trim() || 'Proyecto destacado')}</span>
      </div>`);

  const tiraExtras = extras.length && !variasVisibles
    ? `<div class="proyecto-card__tira">${extras.map((imgUrl, iEx) => `
        <button type="button" class="proyecto-card__mini"${usaLb ? ` data-lightbox-src="${esc(imgUrl)}" data-lightbox-caption="${esc(capBase ? `${capBase} (${iEx + 2}/${todasLasFotos.length})` : '')}" data-lightbox-group="${esc(grupoLb)}"` : ''} aria-label="Ver foto ${iEx + 2} de ${esc(p.titulo || 'proyecto')}">
          <img src="${esc(imgUrl)}" alt="" style="object-position:${esc(encuadre)}">
        </button>`).join('')}</div>`
    : '';

  return { media, tiraExtras, imagenPrincipal };
};

export const proyectoTagsYLink = p => {
  const tags = texto(p.tags).split(/[,\n]/).map(t => t.trim()).filter(Boolean);
  const urlRaw = texto(p.enlace).trim();
  const url = urlRaw ? (/^https?:\/\//i.test(urlRaw) ? urlRaw : `https://${urlRaw}`) : '';
  return { tags, url };
};

export const proyectoCardHTML = (p, idx, web, lightbox = true) => {
  const { media, tiraExtras, imagenPrincipal } = proyectoMediaHTML(p, idx, web, lightbox);
  const { tags, url } = proyectoTagsYLink(p);
  return `
    <article class="proyecto-card">
      ${media}
      ${tiraExtras}
      <div class="proyecto-card__cuerpo">
        ${(p.categoria.trim() || (imagenPrincipal && p.destacado.trim())) ? `
          <div class="proyecto-card__chips">
            ${p.categoria.trim() ? `<span class="proyecto-card__chip">${esc(p.categoria.trim())}</span>` : ''}
            ${imagenPrincipal && p.destacado.trim() ? `<span class="proyecto-card__destacado">${esc(p.destacado.trim())}</span>` : ''}
          </div>` : ''}
        <h3 class="proyecto-card__titulo">${p.titulo.trim() ? esc(p.titulo) : vacioHTML('Proyecto sin título')}</h3>
        ${p.subtitulo.trim() ? `<p class="proyecto-card__subtitulo">${esc(p.subtitulo.trim())}</p>` : ''}
        ${p.descripcion.trim() ? `<p class="proyecto-card__desc">${esc(p.descripcion.trim()).replace(/\n/g, '<br>')}</p>` : ''}
        ${tags.length ? `<ul class="proyecto-card__tags">${tags.map(t => `<li class="proyecto-card__tag">${esc(t)}</li>`).join('')}</ul>` : ''}
        ${url ? `<div class="proyecto-card__pie"><a class="proyecto-card__link" href="${esc(url)}" target="_blank" rel="noopener" data-enlace-cliente><span>${esc(p.textoEnlace.trim() || 'Ver proyecto')}</span>${ICONO_EXTERNO}</a></div>` : ''}
      </div>
    </article>`;
};

// intro: texto propio de la propuesta arriba de los casos. sinGaleria: no muestra la galería
// general del portfolio (solo los proyectos elegidos).
export const bloquePortafolioEnPropuestaHTML = (pfResumen, web, lightbox = true, { intro = '', sinGaleria = false, ed = () => '' } = {}) => {
  const proyectos = (pfResumen?.proyectos || []).filter(proyectoConContenido);
  const galeriaPf = sinGaleria ? [] : (pfResumen?.galeria || []).filter(g => g && g.imagen);
  if (!proyectos.length && !galeriaPf.length) return '';
  const textoIntro = texto(intro).trim();
  const origen = typeof location !== 'undefined' ? location.origin : '';
  const linkPublico = pfResumen.publico && pfResumen.id && /^[A-Za-z0-9]{20}$/.test(pfResumen.id)
    ? `${origen}/portafolio/${pfResumen.id}`
    : '';
  return `
    ${textoIntro ? `<div class="portafolio-embebido__intro"${ed('opciones.portafolioIntro')}>${parrafos(textoIntro)}</div>` : ''}
    ${(pfResumen.subtitulo || linkPublico) ? `
      <div class="portafolio-embebido__cabecera">
        ${pfResumen.subtitulo ? `<p class="portafolio-embebido__sub">${esc(pfResumen.subtitulo)}</p>` : '<span></span>'}
        ${web && linkPublico ? `<a class="portafolio-embebido__ver-mas" href="${esc(linkPublico)}" target="_blank" rel="noopener" data-enlace-cliente><span>Ver página completa</span>${ICONO_EXTERNO}</a>` : ''}
      </div>` : ''}
    ${proyectos.length ? `<div class="portafolio-grilla">${proyectos.map((p, idx) => proyectoCardHTML(p, idx, web, lightbox)).join('')}</div>` : ''}
    ${galeriaPf.length ? `<div style="margin-top:${proyectos.length ? '1.6em' : '0'}">${galeriaSeccionHTML(galeriaPf, { galeriaLayout: 'bento', lightbox }, web)}</div>` : ''}`;
};

export const servicioHTML = (s, moneda, web, { seleccion = new Set(), esAceptada = false, lightbox = true, ed = () => '', indice = -1 } = {}) => {
  const k = campo => (indice >= 0 ? ed(`servicios:${indice}${campo ? `:${campo}` : ''}`) : '');
  const precio = numero(s.precio);
  const cantidad = numero(s.cantidad);
  let modo = 'Pago único';
  if (s.modalidad === 'mensual') modo = cantidad === 1 ? 'por mes' : `${cantidadTexto(cantidad)} × ${dinero(precio, moneda)} por mes`;
  else if (s.modalidad === 'hora') modo = `${cantidadTexto(cantidad)} h × ${dinero(precio, moneda)}`;
  else if (cantidad !== 1) modo = `${cantidadTexto(cantidad)} × ${dinero(precio, moneda)}`;
  const sumado = s.opcional && seleccion.has(s.id);
  if (sumado && !web) modo += ', sumado por el cliente';
  const entregables = lineas(s.entregables);
  const etiquetaModalidad = s.modalidad === 'mensual' ? 'Abono mensual' : s.modalidad === 'hora' ? 'Por hora' : 'Incluido';
  const insignia = s.opcional
    ? `<span class="servicio__chip servicio__chip--opcional">${sumado ? 'Opcional sumado' : 'Opcional'}</span>`
    : `<span class="servicio__chip">${etiquetaModalidad}</span>`;
  const boton = web && s.opcional && esAceptada
    ? (sumado ? `<span class="servicio__incluido">${ICONO_SUMADO} Incluido en la aceptación</span>` : '')
    : web && s.opcional
    ? `<button type="button" class="servicio__sumar" data-accion="sumar" data-id="${esc(s.id)}" aria-pressed="${sumado}">${sumado ? `${ICONO_SUMADO} Sumado a la propuesta` : `${ICONO_SUMAR} Sumar a la propuesta`}</button>`
    : '';
  const usaLightbox = web && lightbox;
  const mediaSrv = s.imagen
    ? `<div class="servicio__media"${usaLightbox ? ` data-lightbox-src="${esc(s.imagen)}" data-lightbox-caption="${esc(s.nombre || 'Servicio')}"` : ''}><img src="${esc(s.imagen)}" alt="${esc(s.nombre || 'Servicio')}"></div>`
    : '';
  const totalItem = totalServicio(s);
  const mostrarPrecio = s.modalidad !== 'incluido' && totalItem > 0;
  const bloquePrecio = mostrarPrecio
    ? `<p class="servicio__precio"${k('precio')}>${dinero(totalItem, moneda)}<span class="servicio__modo">${esc(modo)}</span></p>`
    : '';
  return `
    <div class="servicio${s.opcional ? ' servicio--opcional' : ''}${sumado ? ' servicio--sumado' : ''}"${k()}>
      ${mediaSrv}
      <div class="servicio__cabecera">
        <div class="servicio__titular">
          ${insignia}
          <h3 class="servicio__nombre"${k('nombre')}>${s.nombre.trim() ? esc(s.nombre) : vacioHTML('Servicio sin nombre')}</h3>
        </div>
        ${bloquePrecio}
      </div>
      ${s.descripcion.trim() ? `<p class="servicio__desc"${k('descripcion')}>${esc(s.descripcion.trim()).replace(/\n/g, '<br>')}</p>` : ''}
      ${entregables.length ? `<ul class="doc-lista servicio__entregables"${k('entregables')}>${entregables.map(e => `<li>${ICONO_CHECK}<span>${esc(e)}</span></li>`).join('')}</ul>` : ''}
      ${boton}
    </div>`;
};

export const filasResumenHTML = (b, c, inversion = {}, sufijo = '') => {
  const filas = [];
  const m = inversion.moneda;
  if (c.descuento > 0 || c.impuesto > 0) filas.push(['Subtotal', dinero(b.base, m)]);
  if (c.descuento > 0) filas.push([`Descuento (${cantidadTexto(c.descuento * 100)}%)`, `−${dinero(b.desc, m)}`]);
  if (c.impuesto > 0) filas.push([`${(inversion.impuestoNombre || '').trim() || 'Impuestos'} (${cantidadTexto(c.impuesto * 100)}%)`, dinero(b.imp, m)]);
  return `
    <dl class="resumen__filas">
      ${filas.map(([a, v]) => `<div class="resumen__fila"><dt>${esc(a)}</dt><dd>${v}</dd></div>`).join('')}
      <div class="resumen__fila resumen__fila--total"><dt>Total</dt><dd>${dinero(b.total, m)}${sufijo ? `<span class="resumen__sufijo"> ${sufijo}</span>` : ''}</dd></div>
    </dl>`;
};

export const barraClienteHTML = (c, vig, { moneda = 'USD', esAceptada = false, consultaUrl = '', que = 'propuesta', conFirma = false } = {}) => {
  if (c.inicial.base <= 0 && c.mensual.base <= 0) return '';
  let etiqueta;
  let monto;
  let extra = '';
  if (c.inicial.base > 0) {
    etiqueta = c.mensual.base > 0 ? 'Inversión inicial' : 'Inversión total';
    monto = dinero(c.inicial.total, moneda);
    if (c.mensual.base > 0) extra = `+ ${dinero(c.mensual.total, moneda)} por mes`;
  } else {
    etiqueta = 'Servicio mensual';
    monto = dinero(c.mensual.total, moneda);
    extra = 'por mes';
  }
  const accion = esAceptada
    ? '<span class="barra-cliente__aceptada">Propuesta aceptada</span>'
    : vig.vencida
    ? (consultaUrl ? `<a class="boton boton--primario" href="${esc(consultaUrl)}" target="_blank" rel="noopener" data-enlace-cliente>Pedir una actualización</a>` : '')
    : `<button type="button" class="boton boton--primario" data-accion="aceptar">${conFirma ? 'Aceptar y firmar' : `Aceptar ${que}`}</button>`;
  return `
    <div class="barra-cliente">
      <div>
        <span class="barra-cliente__etiqueta">${etiqueta}</span>
        <span class="barra-cliente__monto">${monto}</span>
        ${extra ? `<span class="barra-cliente__extra">${extra}</span>` : ''}
      </div>
      ${accion}
    </div>`;
};

// Tarjeta con los datos para transferir (método de cobro «transferencia»). La ve el
// cliente al aceptar la propuesta y cada vez que vuelve a abrir el link aceptado.
// pago: { concepto, monto } del primer pago (o el total), ya con formato.
export const tarjetaCobroHTML = (cobro, { pago = null, conCopiar = true } = {}) => {
  if (!cobro) return '';
  const copiar = (valor, que) => (conCopiar && valor
    ? `<button type="button" class="cobro-tarjeta__copiar" data-accion="copiar-dato-cobro" data-valor="${esc(valor)}" data-que="${esc(que)}">Copiar</button>`
    : '');
  const fila = (etiqueta, valor, que, clase = '', visible = valor) => (valor ? `
    <div class="cobro-tarjeta__fila">
      <dt>${esc(etiqueta)}</dt>
      <dd class="${clase}"><span>${esc(visible)}</span>${copiar(valor, que)}</dd>
    </div>` : '');
  return `
    <div class="cobro-tarjeta">
      <p class="cobro-tarjeta__titulo">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6.2L8 3l6 3.2M3 6.5v5.5M6.3 6.5v5.5M9.7 6.5v5.5M13 6.5v5.5M2 13.2h12"/></svg>
        Datos para la transferencia
      </p>
      <p class="cobro-tarjeta__texto">Para dar inicio al servicio, realizá la transferencia a esta cuenta.</p>
      ${pago ? `<p class="cobro-tarjeta__monto"><span>${esc(pago.concepto)}</span><strong>${esc(pago.monto)}</strong></p>` : ''}
      <dl class="cobro-tarjeta__datos">
        ${fila('Titular', cobro.titular, 'titular')}
        ${fila('CBU / CVU', cobro.cbu, 'CBU', 'cobro-tarjeta__cbu', cobro.cbu.length === 22 ? `${cobro.cbu.slice(0, 8)} ${cobro.cbu.slice(8)}` : cobro.cbu)}
        ${fila('Alias', cobro.alias, 'alias')}
      </dl>
    </div>`;
};

// Lugar para la marca oficial de Mercado Pago (Brand Brick, lib/mp-marca.js). Adentro va
// un texto que queda si el Brick no carga.
export const marcaMpHTML = () => `
    <div class="mp-marca" data-mp-marca><span class="mp-marca__respaldo">Pagá con <strong>Mercado Pago</strong>: tarjeta o dinero en cuenta</span></div>`;

// «Medios de pago» antes de aceptar: el cliente sabe desde el principio cómo va a pagar.
// En el PDF, solo el texto.
export const mediosPagoHTML = (s, web, esAceptada) => {
  if (esAceptada || !pagaConMp(s)) return '';
  const transferencia = cobraPorTransferencia(s) ? ' o por transferencia bancaria' : '';
  if (!web) return `<p class="doc-nota medios-pago__pdf">Medios de pago: Mercado Pago (tarjeta o dinero en cuenta)${transferencia}.</p>`;
  return `
    <div class="medios-pago">
      <h3 class="doc-subtitulo">Medios de pago</h3>
      ${marcaMpHTML()}
      ${transferencia ? '<p class="doc-nota">También podés pagar por transferencia bancaria.</p>' : ''}
    </div>`;
};

// Botón para pagar con Mercado Pago (cuenta del freelancer vinculada). El link de pago lo
// crea el servidor (api/cobro-mp) al tocarlo, con el monto que calcula él.
export const pagoMpHTML = (pago, { conTransferencia = false, reintento = false } = {}) => `
    <div class="pago-mp">
      <button type="button" class="pago-mp__boton" data-accion="pagar-mp">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12.5" rx="2.2"/><path d="M3 10h18M6.5 15h4"/></svg>
        <span>${reintento ? 'Volver a intentar el pago' : 'Pagar con Mercado Pago'}</span>
      </button>
      <p class="pago-mp__nota">${pago ? `${esc(pago.concepto)}: <strong>${esc(pago.monto)}</strong>. ` : ''}Con tarjeta o dinero en cuenta, en Mercado Pago.${conTransferencia ? ' O, si preferís, transferí:' : ''}</p>
      ${marcaMpHTML()}
    </div>`;

// Estado del pago con Mercado Pago en el link aceptado. Sale del servidor (`pago` de la
// propuesta, que se escribe recién después de consultar a Mercado Pago), nunca de la URL de
// vuelta. verificando: volvió de Mercado Pago y todavía no llegó la confirmación.
// sinConfirmar: esperó y no llegó (puede tardar unos minutos).
const TEXTOS_PAGO = {
  pendiente: ['Pago pendiente', 'Mercado Pago todavía lo está procesando. Si elegiste pagar en efectivo, se acredita cuando lo abones. Si no lo completaste, podés intentarlo de nuevo.'],
  'en-proceso': ['Pago en revisión', 'Mercado Pago lo está revisando. Suele resolverse en minutos; cuando se acredite, lo vas a ver acá.'],
  acreditado: ['Pago acreditado', ''],
  rechazado: ['El pago no se completó', 'Mercado Pago lo rechazó. Podés intentarlo de nuevo, con otro medio de pago si hace falta.'],
  cancelado: ['El pago se canceló', 'Podés intentarlo de nuevo cuando quieras.'],
  'en-mediacion': ['Pago en reclamo', 'Hay un reclamo abierto en Mercado Pago sobre este pago.'],
  reembolsado: ['Pago devuelto', 'El pago se devolvió a tu medio de pago.'],
  contracargo: ['Pago desconocido', 'El pago se desconoció ante la tarjeta.']
};
export const estadoPagoHTML = (pago, { verificando = false, sinConfirmar = false } = {}) => {
  let estado = pago?.estado;
  let [titulo, textoEstado] = TEXTOS_PAGO[estado] || [];
  if (verificando && estado !== 'acreditado') {
    estado = 'verificando';
    titulo = 'Estamos verificando tu pago';
    textoEstado = 'Mercado Pago nos está confirmando la operación. Tarda unos segundos.';
  } else if (!titulo && sinConfirmar) {
    estado = 'sin-confirmar';
    titulo = 'Todavía no recibimos la confirmación';
    textoEstado = 'Si pagaste, Mercado Pago puede tardar unos minutos en avisarnos: volvé a abrir este link en un rato. Si no completaste el pago, podés hacerlo desde el botón.';
  }
  if (!titulo) return '';
  if (estado === 'acreditado') {
    const fecha = pago.aprobado && !Number.isNaN(Date.parse(pago.aprobado)) ? new Date(pago.aprobado) : null;
    textoEstado = `${esc(pago.concepto || 'Pago')}: <strong>${esc(dinero(pago.monto, pago.moneda))}</strong>${fecha ? `, acreditado el ${esc(fechaLarga(fecha))}` : ''}. Mercado Pago te manda el comprobante por email.`;
  } else textoEstado = esc(textoEstado);
  return `
    <div class="pago-estado pago-estado--${esc(estado)}" role="status">
      <p class="pago-estado__titulo">${esc(titulo)}</p>
      <p class="pago-estado__texto">${textoEstado}</p>
    </div>`;
};

// El primer pago a transferir: el primero de la forma de pago, o el total si no hay pagos.
// Mercado Pago cobra en pesos: el botón se ofrece solo en las propuestas en ARS.
export const pagaConMp = s => cobraConMercadoPago(s) && s.inversion?.moneda === 'ARS';

export const primerPagoTexto = (s, c) => {
  const m = s.inversion.moneda;
  if (!(c.inicial.total > 0)) return null;
  const pago = s.inversion.pagos.find(x => numero(x.porcentaje) > 0);
  if (!pago) return { concepto: 'Total a transferir', monto: dinero(c.inicial.total, m) };
  const pct = numero(pago.porcentaje);
  return {
    concepto: `${pago.concepto.trim() || 'Primer pago'} (${cantidadTexto(pct)} %)`,
    monto: dinero(c.inicial.total * pct / 100, m)
  };
};

// Firma del cliente en el PDF de una propuesta aceptada y firmada online: el trazo sobre
// la línea, con el nombre y la fecha. '' si no hay firma.
export const firmaAceptadaHTML = (aceptacion, { presupuesto = false } = {}) => {
  const firma = firmaSVG(aceptacion?.firma, { titulo: `Firma de ${aceptacion?.nombre || 'el cliente'}` });
  if (!firma) return '';
  const fecha = fechaDeAceptacion(aceptacion);
  const cuando = `Firmó online${fecha ? ` el ${esc(fechaLarga(fecha))}` : ''}`;
  if (presupuesto) {
    return `<div class="presu__firma-online">${firma}<p>${esc(aceptacion.nombre)} · ${cuando}</p></div>`;
  }
  return `<div class="firma__linea firma__linea--online">${firma}<p class="firma__quien">${esc(aceptacion.nombre)}</p><p class="firma__datos">${cuando}</p></div>`;
};

// Cierre del link: aceptada (con la firma y los datos de pago que entregó el servidor),
// vencida o la invitación a aceptar. Los textos del diálogo, en textoBotonConfirmar.
export const cierrePropuestaHTML = (vig, { compartida = null, nombreEmisor = '', consultaUrl = '', tipo = 'propuesta', conMp = false, pago = null, conFirma = false } = {}) => {
  const esAceptada = !!compartida?.aceptacion;
  const que = tipo === 'presupuesto' ? 'presupuesto' : 'propuesta';
  if (esAceptada) {
    const a = compartida.aceptacion;
    const fecha = fechaDeAceptacion(a);
    const firma = firmaSVG(a.firma, { titulo: `Firma de ${a.nombre || 'el cliente'}` });
    return `
      <div class="cierre cierre--aceptada">
        <p class="cierre__titulo">${que === 'presupuesto' ? 'Presupuesto aceptado' : 'Propuesta aceptada'}</p>
        <p class="cierre__texto">${firma ? 'Aceptada y firmada' : 'Aceptada'} por ${esc(a.nombre)}${fecha ? ` el ${esc(fechaLarga(fecha))}` : ''}. Esta es la versión que se aceptó.</p>
        ${firma ? `<figure class="cierre__firma">${firma}<figcaption>${esc(a.nombre)}</figcaption></figure>` : ''}
        ${conMp ? estadoPagoHTML(compartida.pago, { verificando: compartida.verificandoPago, sinConfirmar: compartida.pagoSinConfirmar }) : ''}
        ${conMp && !compartida.verificandoPago && puedePagar(compartida.pago) ? pagoMpHTML(pago, { conTransferencia: !!a.cobro, reintento: ['rechazado', 'cancelado'].includes(compartida.pago?.estado) }) : ''}
        ${tarjetaCobroHTML(a.cobro || null, { pago: conMp ? null : pago })}
        ${consultaUrl ? `<div class="cierre__acciones"><a class="boton boton--secundario boton--grande" href="${esc(consultaUrl)}" target="_blank" rel="noopener" data-enlace-cliente>Hacer una consulta</a></div>` : ''}
      </div>`;
  }
  if (vig.vencida) {
    // Sin link para escribirle, se le pide la versión actualizada desde acá (pedido de cambio).
    const pedir = consultaUrl
      ? `<a class="boton boton--primario boton--grande" href="${esc(consultaUrl)}" target="_blank" rel="noopener" data-enlace-cliente>Pedir una actualización</a>`
      : `<button type="button" class="boton boton--primario boton--grande" data-accion="pedir-cambio" data-vencida>Pedir una versión actualizada</button>`;
    return `
      <div class="cierre">
        <p class="cierre__titulo">${tipo === 'presupuesto' ? 'Este presupuesto venció' : 'Esta propuesta venció'}</p>
        <p class="cierre__texto">Los valores y plazos pueden haber cambiado. Pedile ${nombreEmisor ? `a ${esc(nombreEmisor)} ` : ''}una versión actualizada.</p>
        <div class="cierre__acciones">${pedir}</div>
      </div>`;
  }
  // Un solo botón protagónico (con firma, abre el recuadro para firmar) y, debajo, un único
  // link discreto para escribirle al dueño: su WhatsApp o email o, si no cargó ninguno, el
  // pedido de cambio (le llega con aviso).
  const quien = nombreEmisor ? esc(nombreEmisor) : 'Quien te la mandó';
  const cambios = Number(compartida?.respuesta?.cambios) || 0;
  const escribinos = consultaUrl
    ? `<a class="cierre__otra" href="${esc(consultaUrl)}" target="_blank" rel="noopener" data-enlace-cliente>¿Tenés alguna duda o querés ajustar algo? Escribinos</a>`
    : `<button type="button" class="cierre__otra" data-accion="pedir-cambio">¿Tenés alguna duda o querés ajustar algo? Escribinos</button>`;
  return `
    <div class="cierre">
      <p class="cierre__titulo">¿Avanzamos?</p>
      <p class="cierre__texto">Revisá los ítems elegidos y confirmá tu aceptación en pantalla. ${quien} recibe tu constancia al instante.</p>
      <div class="cierre__acciones">
        <button type="button" class="boton boton--primario boton--grande" data-accion="aceptar">${textoBotonAceptar(que, conFirma)}</button>
      </div>
      <div class="cierre__otras">${escribinos}</div>
      ${cambios ? `<p class="cierre__nota">Ya le escribiste a ${quien}. Cuando actualice ${que === 'presupuesto' ? 'el presupuesto' : 'la propuesta'}, la vas a ver en este mismo link.</p>` : ''}
    </div>`;
};

// El botón principal del cierre: «firmar» solo si el dueño pidió la firma del cliente.
export const textoBotonAceptar = (que = 'propuesta', conFirma = false) => `${conFirma ? 'Aceptar y firmar' : 'Aceptar'} ${que}`;

// El botón final del diálogo de aceptar: dice qué viene después (los datos para transferir o
// el pago con Mercado Pago).
export const textoBotonConfirmar = ({ conFirma = false, conCobro = false, conMp = false, que = 'propuesta' } = {}) => {
  if (conMp) return 'Confirmar y continuar al pago';
  if (conCobro) return conFirma ? 'Confirmar firma y ver datos de pago' : 'Confirmar y ver datos de pago';
  return conFirma ? 'Confirmar firma' : `Confirmar ${que === 'presupuesto' ? 'el presupuesto' : 'la propuesta'}`;
};

let observador;
const OBS_SEL = '.bloque, .resumen, .cierre, .pie, .doc-aviso, .pf-sec, .pf-caso';
const HIJO_SEL = '.servicio, .etapa, .proyecto-card, .galeria-item, .testimonio-card, .faq-item, .servicio-web-card';

// Muestra todo de una, sin animaciones de entrada (miniaturas y vistas previas de plantillas).
// No toca el observador del documento principal.
export const mostrarSinAnimar = raiz => {
  raiz?.querySelectorAll(`${OBS_SEL}, ${HIJO_SEL}`).forEach(el => el.classList.add('visible'));
};

export const observarElementos = (raiz, esCliente = false) => {
  if (!raiz) return;
  if (observador) observador.disconnect();
  const todos = raiz.querySelectorAll(`${OBS_SEL}, ${HIJO_SEL}`);
  const prefersReduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || raiz.classList.contains('doc--estatico')) {
    todos.forEach(el => {
      el.style.transitionDelay = '0s';
      el.classList.add('visible');
    });
    return;
  }
  const scrollRoot = esCliente ? null : raiz.closest('.visor');
  observador = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.querySelectorAll(HIJO_SEL).forEach((h, i) => {
          h.style.transitionDelay = `${i * 0.08}s`;
          h.classList.add('visible');
        });
        observador.unobserve(entry.target);
      }
    });
  }, { root: scrollRoot, rootMargin: '0px 0px 300px 0px', threshold: 0.01 });
  const viewH = scrollRoot ? scrollRoot.clientHeight : window.innerHeight;
  const rootTop = scrollRoot ? scrollRoot.getBoundingClientRect().top : 0;
  const targets = raiz.querySelectorAll(OBS_SEL);
  let delay = 0;
  targets.forEach(el => {
    const rect = el.getBoundingClientRect();
    const enVista = rect.top - rootTop < viewH;
    if (enVista) {
      el.style.transitionDelay = `${delay}s`;
      delay += 0.07;
      el.querySelectorAll(HIJO_SEL).forEach((h, i) => {
        h.style.transitionDelay = `${delay + i * 0.08}s`;
      });
    }
    observador.observe(el);
  });
};
// Marca de Dealit al pie, con la tipografía del logo. Es solo texto (sin link), en el link y en el PDF.
export const creditoHTML = tipo => `<span class="pie__credito">${{ portafolio: 'Portfolio creado', presupuesto: 'Presupuesto creado' }[tipo] || 'Propuesta creada'} con <b class="pie__marca">Dealit</b></span>`;

// Marca de agua al imprimir (sin cuenta, o en Gratis con un diseño PRO): tres franjas por hoja.
export const marcaDeAguaHTML = tipo => `
  <div class="marca-agua" aria-hidden="true">
    ${Array.from({ length: 3 }, () => `<p><span>${tipo === 'portafolio' ? 'Portfolio creado' : 'Propuesta creada'} con</span><b>Dealit</b></p>`).join('')}
  </div>`;

// Presupuesto en tabla (opciones.formato === 'presupuesto'): una hoja como la de toda la
// vida, para cualquier oficio. Es el mismo link: el cliente suma opcionales y acepta online.
const generarPresupuestoHTML = (s, { web, seleccion, compartida, ed = () => '' }) => {
  const m = s.inversion.moneda;
  const c = calcularTotales(s, seleccion);
  const e = s.emisor;
  const cl = s.cliente;
  const p = s.propuesta;
  const vig = calcularVigencia(p);
  const esAceptada = !!compartida?.aceptacion;
  const nombreEm = (e.nombre || '').trim();
  const titulo = p.titulo.trim() || 'el presupuesto';
  const msgConsulta = `Hola${nombreEm ? ` ${nombreEm.split(' ')[0]}` : ''}, tengo una consulta sobre el presupuesto «${titulo}».`;
  const consultaUrl = armarEnlaceWhatsApp(msgConsulta, e) || armarEnlaceEmail(`Consulta sobre ${titulo}`, msgConsulta, e);

  const marca = e.logo
    ? `<img class="presu__logo"${ed('paso:Tus datos')} src="${esc(e.logo)}" alt="${esc(e.nombre || 'Logo')}">`
    : `<span class="presu__marca"${ed('emisor.nombre')}>${nombreEm ? esc(nombreEm) : vacioHTML('Tu nombre o tu negocio')}</span>`;
  const numero_ = p.numero.trim();

  const datos = (lista) => lista.filter(Boolean).map(x => `<span>${x}</span>`).join('');
  const de = datos([
    nombreEm ? `<strong>${esc(nombreEm)}</strong>` : '',
    e.telefono.trim() ? esc(e.telefono.trim()) : '',
    e.email.trim() ? esc(e.email.trim()) : ''
  ]);
  const para = datos([
    cl.nombre.trim() || cl.empresa.trim() ? `<strong>${esc(cl.nombre.trim() || cl.empresa.trim())}</strong>` : '—',
    cl.nombre.trim() && cl.empresa.trim() ? esc(cl.empresa.trim()) : ''
  ]);

  // Filas: concepto (con su descripción abajo), cantidad, precio unitario y subtotal.
  const fila = (x, i) => {
    const idx = s.servicios.indexOf(x);
    const k = campo => ed(`servicios:${idx}${campo ? `:${campo}` : ''}`);
    const cant = numero(x.cantidad);
    const precio = numero(x.precio);
    const incluido = x.modalidad === 'incluido';
    const sumado = x.opcional && seleccion.has(x.id);
    const cantTexto = incluido ? '—' : `${cantidadTexto(cant)}${x.modalidad === 'hora' ? ' h' : ''}`;
    const precioTexto = incluido ? '—' : `${dinero(precio, m)}${x.modalidad === 'mensual' ? ' /mes' : ''}`;
    const subtotal = incluido ? 'Incluido' : dinero(totalServicio(x), m);
    const boton = web && x.opcional
      ? (esAceptada
        ? (sumado ? `<span class="presu__sumado">${ICONO_SUMADO} Incluido en la aceptación</span>` : '')
        : `<button type="button" class="presu__sumar" data-accion="sumar" data-id="${esc(x.id)}" aria-pressed="${sumado}">${sumado ? `${ICONO_SUMADO} Sumado` : `${ICONO_SUMAR} Sumar`}</button>`)
      : (x.opcional && sumado ? '<span class="presu__sumado">Sumado por el cliente</span>' : '');
    return `
      <tr class="${x.opcional ? 'presu__fila--opcional' : ''}${sumado ? ' presu__fila--sumada' : ''}"${k()}>
        <td class="presu__num">${i}</td>
        <td class="presu__concepto">
          <span class="presu__nombre"${k('nombre')}>${x.nombre.trim() ? esc(x.nombre) : vacioHTML('Trabajo sin nombre')}</span>
          ${x.descripcion.trim() ? `<span class="presu__desc"${k('descripcion')}>${esc(x.descripcion.trim())}</span>` : ''}
          ${boton}
        </td>
        <td class="presu__cifra"${k('cantidad')}>${cantTexto}</td>
        <td class="presu__cifra"${k('precio')}>${precioTexto}</td>
        <td class="presu__cifra presu__subtotal">${subtotal}</td>
      </tr>`;
  };
  const incluidos = s.servicios.filter(x => !x.opcional && servicioConContenido(x));
  const opcionales = s.servicios.filter(x => x.opcional && servicioConContenido(x));
  const cabeza = '<thead><tr><th scope="col" class="presu__num">#</th><th scope="col">Concepto</th><th scope="col" class="presu__cifra">Cant.</th><th scope="col" class="presu__cifra">Precio</th><th scope="col" class="presu__cifra">Subtotal</th></tr></thead>';
  const tabla = incluidos.length
    ? `<table class="presu__tabla">${cabeza}<tbody>${incluidos.map((x, i) => fila(x, i + 1)).join('')}</tbody></table>`
    : '<p class="doc-nota">Cargá los trabajos en el paso «Servicios» del editor.</p>';
  const tablaOpcionales = opcionales.length ? `
    <h3 class="presu__subtitulo">Opcionales${web && !esAceptada ? ' <span>Sumalos con un toque y el total se actualiza</span>' : ''}</h3>
    <table class="presu__tabla presu__tabla--opcionales">${cabeza}<tbody>${opcionales.map((x, i) => fila(x, incluidos.length + i + 1)).join('')}</tbody></table>` : '';

  const totales = [];
  if (c.inicial.base > 0) totales.push(`<div class="presu__total">${filasResumenHTML(c.inicial, c, s.inversion)}</div>`);
  if (c.mensual.base > 0) totales.push(`<div class="presu__total"><p class="presu__total-titulo">Mensual</p>${filasResumenHTML(c.mensual, c, s.inversion, 'por mes')}</div>`);

  const pagos = s.inversion.pagos.filter(x => x.concepto.trim() || numero(x.porcentaje) > 0);
  const pagosHTML = pagos.length && c.inicial.total > 0 ? `
    <div class="presu__seccion"${ed('lista:pagos')}>
      <h3 class="presu__subtitulo">Forma de pago</h3>
      <ul class="presu__pagos">${pagos.map(x => `<li><span>${x.concepto.trim() ? esc(x.concepto) : 'Pago'} (${cantidadTexto(numero(x.porcentaje))} %)</span><strong>${dinero(c.inicial.total * numero(x.porcentaje) / 100, m)}</strong></li>`).join('')}</ul>
    </div>` : '';
  const condiciones = lineas(s.condiciones);
  const condicionesHTML = condiciones.length ? `
    <div class="presu__seccion"${ed('condiciones')}>
      <h3 class="presu__subtitulo">Condiciones</h3>
      <ul class="presu__condiciones">${condiciones.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>` : '';

  const firmaOnline = !web ? firmaAceptadaHTML(compartida?.aceptacion, { presupuesto: true }) : '';
  const firmas = !web && (s.opciones.firmas || firmaOnline) ? `
    <div class="presu__firmas">
      ${firmaOnline || '<p>Firma del cliente</p>'}
      ${s.opciones.firmas ? `<p>Firma de ${esc(nombreEm || 'quien presupuesta')}</p>` : ''}
    </div>` : '';

  const pie = `
    <footer class="presu__pie">
      ${vig.vence ? `<span${ed('propuesta.validez')}>${web && vig.vencida ? 'Venció el' : 'Válido hasta el'} ${esc(fechaLarga(vig.vence))}</span>` : ''}
      ${web ? '<button type="button" class="pie__pdf" data-accion="pdf">Descargar en PDF</button>' : ''}
      ${s.opciones.credito ? creditoHTML('presupuesto') : ''}
    </footer>`;

  const aviso = web && vig.vencida ? `<p class="doc-aviso">Este presupuesto venció el ${esc(fechaLarga(vig.vence))}. Los valores pueden haber cambiado.</p>` : '';
  const cierre = web ? `<div class="presu__cierre">${cierrePropuestaHTML(vig, { compartida, nombreEmisor: nombreEm, consultaUrl, tipo: 'presupuesto', conCobro: cobraPorTransferencia(s), conMp: pagaConMp(s), pago: primerPagoTexto(s, c), conFirma: pideFirma(s) })}</div>` : '';

  const hoja = `
    <section class="presu" id="sec-prop-inicio" aria-label="Presupuesto">
      ${aviso}
      <header class="presu__cabecera">
        <div class="presu__emisor">${marca}${e.rol.trim() ? `<span class="presu__rol"${ed('emisor.rol')}>${esc(e.rol.trim())}</span>` : ''}</div>
        <div class="presu__datos">
          <span class="presu__etiqueta">Presupuesto</span>
          ${numero_ ? `<strong class="presu__numero"${ed('propuesta.numero')}>${esc(numero_)}</strong>` : ''}
          ${vig.fecha ? `<span${ed('propuesta.fecha')}>${esc(fechaLarga(vig.fecha))}</span>` : ''}
        </div>
      </header>
      <div class="presu__partes">
        <div${ed('paso:Tus datos')}><span class="presu__etiqueta">De</span>${de || '—'}</div>
        <div${ed('paso:Cliente')}><span class="presu__etiqueta">Para</span>${para}</div>
      </div>
      ${p.titulo.trim() ? `<h1 class="presu__titulo"${ed('propuesta.titulo')}>${esc(p.titulo.trim())}</h1>` : ''}
      ${s.contexto.trim() ? `<p class="presu__detalle"${ed('contexto')}>${esc(s.contexto.trim()).replace(/\n/g, '<br>')}</p>` : ''}
      ${tabla}
      ${tablaOpcionales}
      ${totales.length ? `<div class="presu__totales"${ed('paso:Inversión')}>${totales.join('')}</div>` : ''}
      ${pagosHTML}
      ${mediosPagoHTML(s, web, esAceptada)}
      ${condicionesHTML}
      ${cierre}
      ${firmas}
      ${pie}
    </section>`;

  return hoja + (web ? barraClienteHTML(c, vig, { moneda: m, esAceptada, consultaUrl, que: 'presupuesto', conFirma: pideFirma(s) }) : '');
};

export const generarPropuestaHTML = (
  s,
  {
    web = true,
    seleccion = new Set(),
    compartida = null,
    tipoDecoracion = 'marco',
    tipoPortada = 'editorial',
    editable = false
  } = {}
) => {
  // En el editor, cada texto lleva la clave del campo que lo arma (ver editar-documento.js).
  const ed = atributoEditar(editable);
  if (s.opciones?.formato === 'presupuesto') return generarPresupuestoHTML(s, { web, seleccion, compartida, ed });
  const m = s.inversion.moneda;
  const c = calcularTotales(s, seleccion);
  const e = s.emisor;
  const cl = s.cliente;
  const p = s.propuesta;
  const vig = calcularVigencia(p);
  const esAceptada = !!compartida?.aceptacion;
  const nombreEm = (e.nombre || '').trim();
  const titProp = p.titulo.trim() || 'la propuesta';
  const msgConsulta = `Hola${nombreEm ? ` ${nombreEm.split(' ')[0]}` : ''}, tengo una consulta sobre la propuesta «${titProp}».`;
  const consultaUrl = armarEnlaceWhatsApp(msgConsulta, e) || armarEnlaceEmail(`Consulta sobre ${titProp}`, msgConsulta, e);
  const destinatario = cl.empresa.trim() || cl.nombre.trim();

  const marca = e.logo
    ? `<img class="portada__logo"${ed('paso:Tus datos')} src="${esc(e.logo)}" alt="${esc(e.nombre || 'Logo')}">`
    : `<span class="portada__marca"${ed('emisor.nombre')}>${e.nombre.trim() ? esc(e.nombre) : vacioHTML('Tu marca')}</span>`;

  const meta = [];
  if (cl.nombre.trim() || cl.empresa.trim()) {
    const sec = [cl.cargo.trim(), cl.empresa.trim() && cl.nombre.trim() ? cl.empresa.trim() : ''].filter(Boolean).join(', ');
    meta.push(['Preparada para', `${esc(cl.nombre.trim() || cl.empresa.trim())}${sec ? `<span>${esc(sec)}</span>` : ''}`, 'paso:Cliente']);
  }
  if (e.nombre.trim()) meta.push(['Preparada por', `${esc(e.nombre)}${e.rol.trim() ? `<span>${esc(e.rol)}</span>` : ''}`, 'paso:Tus datos']);
  if (vig.fecha) meta.push(['Fecha', esc(fechaLarga(vig.fecha)), 'propuesta.fecha']);
  if (vig.vence) {
    if (web && vig.vencida) meta.push(['Venció el', esc(fechaLarga(vig.vence)), 'propuesta.validez']);
    else {
      const urgente = web && vig.restantes !== null && vig.restantes <= 30 ? `<span class="portada__urgente">${textoRestantes(vig.restantes)}</span>` : '';
      meta.push(['Válida hasta', `${esc(fechaLarga(vig.vence))}${urgente}`, 'propuesta.validez']);
    }
  }

  const marcaAguaNumero = tipoPortada === 'impacto' && p.numero.trim()
    ? `<span class="portada__marca-agua" aria-hidden="true">${esc(p.numero.trim())}</span>`
    : '';

  const colTema = resolverColoresTema(s.tema);
  const usaLightbox = s.opciones?.lightbox !== false;
  const opPortada = Math.min(0.85, Math.max(0.08, (Number(p.opacidadPortada) || 35) / 100));
  const fondoFotoHTML = p.imagenPortada
    ? `<div class="portada__fondo-img" style="--portada-img-opacidad:${opPortada}" aria-hidden="true"><img src="${esc(p.imagenPortada)}" alt=""></div>`
    : '';
  const portada = `
    <section class="portada portada--${esc(tipoPortada)}" id="sec-prop-inicio" aria-label="Portada">
      ${fondoFotoHTML}
      <div class="portada__decoracion" style="color:${esc(colTema.colorSvg)}" aria-hidden="true">${decoracionPortadaSVG(tipoDecoracion, colTema.opacidadSvg, colTema.colorSvg)}</div>
      ${marcaAguaNumero}
      <div class="portada__superior">
        ${marca}
        ${p.numero.trim() ? `<p class="portada__numero"${ed('propuesta.numero')}>${esc(/^propuesta\b/i.test(p.numero.trim()) ? p.numero.trim() : `Propuesta ${p.numero.trim()}`)}</p>` : ''}
      </div>
      <div class="portada__centro">
        <p class="portada__para"><span class="portada__para-chip"${ed(cl.empresa.trim() ? 'cliente.empresa' : 'cliente.nombre')}>${destinatario ? `Propuesta para ${esc(destinatario)}` : 'Propuesta comercial'}</span></p>
        <h1 class="portada__titulo"${ed('propuesta.titulo')}>${p.titulo.trim() ? esc(p.titulo) : vacioHTML('Título de la propuesta')}</h1>
        <hr class="portada__regla">
      </div>
      ${meta.length ? `<dl class="portada__meta">${meta.map(([a, b, clave]) => `<div${ed(clave)}><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>` : ''}
    </section>`;

  const bloques = [];

  if (e.presentacion.trim() || e.foto || e.instagram?.trim() || e.linkedin?.trim() || e.behance?.trim()) {
    bloques.push({
      id: 'sec-prop-sobre',
      nav: 'Sobre mí',
      editar: 'emisor.presentacion',
      titulo: e.nombre.trim() ? `Sobre ${e.nombre.trim()}` : 'Quién presenta esta propuesta',
      html: sobreMiBloqueHTML(e, [], web, usaLightbox)
    });
  }

  const pfAdjunto = s.opciones?.portafolioId ? s.opciones?.portafolio : null;
  if (pfAdjunto) {
    const htmlPf = bloquePortafolioEnPropuestaHTML(pfAdjunto, web, usaLightbox, {
      intro: s.opciones.portafolioIntro,
      sinGaleria: s.opciones.portafolioSinGaleria === true,
      ed
    });
    if (htmlPf) {
      bloques.push({
        id: 'sec-prop-casos',
        nav: 'Casos',
        editar: 'opciones.portafolioId',
        titulo: pfAdjunto.titulo?.trim() || 'Trabajos y casos destacados',
        html: htmlPf
      });
    }
  }

  const videoProp = videoSeccionHTML(s.video, web);
  if (videoProp) {
    bloques.push({
      id: 'sec-prop-video',
      nav: 'Video',
      editar: 'video.titulo',
      titulo: s.video.titulo.trim() || 'Te lo cuento en video',
      html: videoProp
    });
  }

  if (s.contexto.trim()) {
    bloques.push({
      titulo: 'El punto de partida',
      editar: 'contexto',
      html: `<div class="contexto-bloque">${parrafos(s.contexto)}</div>`
    });
  }

  const objetivos = s.objetivos.filter(o => o.texto.trim());
  if (objetivos.length) {
    bloques.push({
      titulo: 'Qué queremos lograr',
      editar: 'lista:objetivos',
      html: `<ul class="doc-lista objetivos-lista">${objetivos.map((o, i) => `
        <li class="objetivo-item"${ed(`objetivos:${s.objetivos.indexOf(o)}:texto`)}>
          <span class="objetivo-item__indice" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <span class="objetivo-item__texto">${esc(o.texto.trim())}</span>
        </li>`).join('')}</ul>`
    });
  }

  const incluidos = s.servicios.filter(x => !x.opcional && servicioConContenido(x));
  const opcionales = s.servicios.filter(x => x.opcional && servicioConContenido(x));
  const srvOpts = x => ({ seleccion, esAceptada, lightbox: usaLightbox, ed, indice: s.servicios.indexOf(x) });
  if (incluidos.length || opcionales.length) {
    let html = `<div class="servicios-grilla">${incluidos.map(x => servicioHTML(x, m, web, srvOpts(x))).join('')}</div>`;
    if (opcionales.length) {
      const nota = web
        ? 'No están incluidos en la inversión base. Sumá los que quieras con un toque y el total se actualiza en el momento.'
        : 'No están incluidos en la inversión, salvo los que figuran como sumados. Se pueden agregar en cualquier momento del proyecto.';
      html += `
        <div class="doc-grupo">
          <div class="doc-grupo__cabecera">
            <h3 class="doc-subtitulo">Para sumar, si querés</h3>
            <span class="doc-grupo__badge">Interactivo</span>
          </div>
          <p class="doc-nota">${nota}</p>
          <div class="servicios-grilla servicios-grilla--opcionales">
            ${opcionales.map(x => servicioHTML(x, m, web, srvOpts(x))).join('')}
          </div>
        </div>`;
    }
    bloques.push({ titulo: 'Qué incluye la propuesta', editar: 'lista:servicios', html });
  }

  const etapas = s.etapas.filter(x => x.nombre.trim() || x.descripcion.trim() || x.duracion.trim());
  if (etapas.length) {
    bloques.push({
      titulo: 'Cómo vamos a trabajar',
      editar: 'lista:etapas',
      html: `<ol class="etapas">${etapas.map((x, i) => `
        <li class="etapa"${ed(`etapas:${s.etapas.indexOf(x)}`)}>
          <span class="etapa__num" aria-hidden="true">${i + 1}</span>
          <div class="etapa__cuerpo">
            <p class="etapa__nombre"${ed(`etapas:${s.etapas.indexOf(x)}:nombre`)}>${x.nombre.trim() ? esc(x.nombre) : vacioHTML('Etapa sin nombre')}</p>
            ${x.descripcion.trim() ? `<p class="etapa__desc"${ed(`etapas:${s.etapas.indexOf(x)}:descripcion`)}>${esc(x.descripcion.trim())}</p>` : ''}
          </div>
          ${x.duracion.trim() ? `<p class="etapa__duracion"${ed(`etapas:${s.etapas.indexOf(x)}:duracion`)}><span class="etapa__chip">${esc(x.duracion.trim())}</span></p>` : '<p class="etapa__duracion etapa__duracion--vacia"></p>'}
        </li>`).join('')}</ol>`
    });
  }

  if (c.inicial.base > 0 || c.mensual.base > 0) {
    const columnas = [];
    if (c.inicial.base > 0) columnas.push(`<div class="resumen__columna"><h3 class="resumen__titulo">${c.mensual.base > 0 ? 'Inversión inicial' : 'Inversión total'}</h3>${filasResumenHTML(c.inicial, c, s.inversion)}</div>`);
    if (c.mensual.base > 0) columnas.push(`<div class="resumen__columna"><h3 class="resumen__titulo">Servicio mensual</h3>${filasResumenHTML(c.mensual, c, s.inversion, 'por mes')}</div>`);
    let html = `<div class="resumen">${columnas.join('')}</div>`;
    const pagos = s.inversion.pagos.filter(x => x.concepto.trim() || numero(x.porcentaje) > 0);
    if (pagos.length && c.inicial.total > 0) {
      const barraSegmentos = pagos
        .filter(x => numero(x.porcentaje) > 0)
        .map((x, idx) => `<span class="pagos-barra__seg pagos-barra__seg--${(idx % 4) + 1}" style="flex:${Math.max(5, numero(x.porcentaje))}" title="${esc(x.concepto.trim() || `Pago ${idx + 1}`)}: ${cantidadTexto(numero(x.porcentaje))}%"><span>${cantidadTexto(numero(x.porcentaje))}%</span></span>`)
        .join('');
      html += `<h3 class="doc-subtitulo">Forma de pago</h3>
        ${barraSegmentos ? `<div class="pagos-barra" aria-hidden="true">${barraSegmentos}</div>` : ''}
        <table class="pagos">
          <thead><tr><th scope="col">Momento</th><th scope="col" class="pagos__num"><span class="pagos__largo">Porcentaje</span><span class="pagos__corto" aria-hidden="true">%</span></th><th scope="col" class="pagos__num">Monto</th></tr></thead>
          <tbody>${pagos.map(x => `<tr${ed(`pagos:${s.inversion.pagos.indexOf(x)}`)}><td${ed(`pagos:${s.inversion.pagos.indexOf(x)}:concepto`)}>${x.concepto.trim() ? esc(x.concepto) : vacioHTML('Pago sin descripción')}</td><td class="pagos__num"><span class="pagos__pct">${cantidadTexto(numero(x.porcentaje))}%</span></td><td class="pagos__num pagos__monto">${dinero(c.inicial.total * numero(x.porcentaje) / 100, m)}</td></tr>`).join('')}</tbody>
        </table>`;
      if (c.mensual.base > 0) html += '<p class="doc-nota">El servicio mensual se factura por mes adelantado, desde que empieza ese servicio.</p>';
    }
    html += mediosPagoHTML(s, web, esAceptada);
    bloques.push({ titulo: 'Inversión', editar: 'paso:Inversión', html });
  }

  const galeriaPropValida = (s.galeria || []).filter(g => g && g.imagen);
  if (galeriaPropValida.length) {
    bloques.push({
      id: 'sec-prop-galeria',
      nav: 'Galería',
      editar: 'paso:Galería',
      titulo: s.opciones?.galeriaTitulo?.trim() || 'Galería visual y referencias',
      html: galeriaSeccionHTML(galeriaPropValida, s.opciones, web)
    });
  }

  const testimoniosPropValidos = (s.testimonios || []).filter(t => t && (t.texto.trim() || t.autor.trim()));
  if (testimoniosPropValidos.length) {
    bloques.push({
      id: 'sec-prop-testimonios',
      nav: 'Testimonios',
      editar: 'lista:testimonios',
      titulo: 'Referencias y experiencias de clientes',
      html: testimoniosSeccionHTML(testimoniosPropValidos, web, usaLightbox)
    });
  }

  const faqsPropValidas = (s.faqs || []).filter(f => f && (f.pregunta.trim() || f.respuesta.trim()));
  if (faqsPropValidas.length) {
    bloques.push({
      id: 'sec-prop-faq',
      nav: 'Preguntas',
      editar: 'lista:faqs',
      titulo: 'Preguntas frecuentes',
      html: faqsSeccionHTML(faqsPropValidas, web)
    });
  }

  const condiciones = lineas(s.condiciones);
  if (condiciones.length) {
    bloques.push({ id: 'sec-prop-condiciones', titulo: 'Condiciones', editar: 'condiciones', html: `<ul class="doc-lista">${condiciones.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` });
  }

  const pasos = lineas(s.proximosPasos);
  // En el PDF de una propuesta firmada online, la firma del cliente va siempre (aunque no
  // estén las líneas de firma); la del emisor, solo con las líneas.
  const firmaOnline = !web ? firmaAceptadaHTML(compartida?.aceptacion) : '';
  const firmas = !web && (s.opciones.firmas || !!firmaOnline);
  if (pasos.length || firmas || web) {
    let html = pasos.length ? `<ol class="pasos"${ed('proximosPasos')}>${pasos.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '';
    if (web) html += cierrePropuestaHTML(vig, { compartida, nombreEmisor: nombreEm, consultaUrl, conCobro: cobraPorTransferencia(s), conMp: pagaConMp(s), pago: primerPagoTexto(s, c), conFirma: pideFirma(s) });
    if (firmas) {
      const quienCliente = cl.nombre.trim() || cl.empresa.trim() || 'Cliente';
      const quienEmisor = e.nombre.trim() || 'Responsable de la propuesta';
      const cliente = firmaOnline || `<div class="firma__linea"><p class="firma__quien">${esc(quienCliente)}</p><p class="firma__datos">Firma, aclaración y fecha</p></div>`;
      const emisor = s.opciones.firmas ? `<div class="firma__linea"><p class="firma__quien">${esc(quienEmisor)}</p><p class="firma__datos">Firma, aclaración y fecha</p></div>` : '';
      html += `
        <div class="firmas">
          ${cliente}
          ${emisor}
        </div>`;
    }
    bloques.push({ editar: 'paso:Cierre', titulo: pasos.length ? 'Próximos pasos' : (web ? 'Siguiente paso' : 'Aceptación'), html });
  }

  const contactos = [];
  if (e.email.trim()) contactos.push(web ? `<a href="mailto:${esc(e.email.trim())}" data-enlace-cliente>${esc(e.email.trim())}</a>` : esc(e.email.trim()));
  if (e.telefono.trim()) contactos.push(esc(e.telefono.trim()));
  if (e.web.trim()) {
    const url = /^https?:\/\//i.test(e.web.trim()) ? e.web.trim() : `https://${e.web.trim()}`;
    contactos.push(web ? `<a href="${esc(url)}" target="_blank" rel="noopener" data-enlace-cliente>${esc(e.web.trim())}</a>` : esc(e.web.trim()));
  }
  const pie = `
    <footer class="pie">
      ${e.nombre.trim() ? `<span class="pie__nombre"${ed('emisor.nombre')}>${esc(e.nombre)}</span>` : ''}
      ${contactos.map(x => `<span>${x}</span>`).join('')}
      ${web ? '<button type="button" class="pie__pdf" data-accion="pdf">Descargar en PDF</button>' : ''}
      ${s.opciones.credito ? creditoHTML('propuesta', web) : ''}
    </footer>`;

  const aviso = web && vig.vencida ? `<p class="doc-aviso">Esta propuesta venció el ${esc(fechaLarga(vig.vence))}. Los valores pueden haber cambiado.</p>` : '';

  const navLandingProp = web && s.opciones?.barraNav && bloques.length > 1
    ? `<nav class="doc-nav" aria-label="Secciones de la propuesta">
        <a class="doc-nav__marca" href="#sec-prop-inicio" data-scroll-interno>${esc(e.nombre.trim() || 'Propuesta')}</a>
        <ul class="doc-nav__links">
          ${bloques.map((b, i) => `<li><a class="doc-nav__link" href="#${esc(b.id || `sec-prop-${i + 1}`)}" data-scroll-interno>${esc(b.nav || b.titulo)}</a></li>`).join('')}
        </ul>
      </nav>`
    : '';

  const cuerpo = `
    <div class="cuerpo">
      ${aviso}
      ${bloques.length ? bloques.map((b, i) => `
        <section class="bloque" id="${esc(b.id || `sec-prop-${i + 1}`)}"${ed(b.editar)}>
          <span class="bloque__num" aria-hidden="true">${i + 1}</span>
          <div class="bloque__contenido">
            <h2 class="bloque__titulo">${esc(b.titulo)}</h2>
            ${b.html}
          </div>
        </section>`).join('') : '<p class="doc-nota">Completá las secciones del editor para armar el cuerpo de la propuesta.</p>'}
      ${pie}
    </div>`;

  return portada + navLandingProp + cuerpo + (web ? barraClienteHTML(c, vig, { moneda: m, esAceptada, consultaUrl, conFirma: pideFirma(s) }) : '');
};
