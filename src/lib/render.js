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
import {
  PROPORCIONES_IMAGEN,
  LAYOUTS_GALERIA,
  totalServicio,
  calcularTotales
} from '../modelo.js';
import { decoracionPortadaSVG } from './decoraciones.js';
import { resolverColoresTema } from './tema.js';

export const ICONO_SUMAR = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>';
export const ICONO_SUMADO = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
export const ICONO_CHECK = '<svg class="icono-check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6.5"/></svg>';
export const ICONO_EXTERNO = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5h6.5V10M12 4L4.5 11.5"/></svg>';

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

export const galeriaSeccionHTML = (fotos = [], opciones = {}, web = true) => {
  const validas = (fotos || []).filter(g => g && g.imagen);
  if (!validas.length) return '';
  const layout = LAYOUTS_GALERIA[opciones.galeriaLayout] ? opciones.galeriaLayout : 'bento';
  const propDef = PROPORCIONES_IMAGEN[opciones.galeriaProporcion] ? opciones.galeriaProporcion : 'panoramica';
  const usaLightbox = web && opciones.lightbox !== false;
  const sub = opciones.galeriaSubtitulo?.trim() ? `<p class="galeria-subtitulo">${esc(opciones.galeriaSubtitulo.trim())}</p>` : '';
  const items = validas.map((g, idx) => {
    const prop = PROPORCIONES_IMAGEN[g.proporcion] ? g.proporcion : propDef;
    const cap = [g.titulo?.trim(), g.descripcion?.trim()].filter(Boolean).join(' — ');
    return `
      <figure class="galeria-item">
        <div class="galeria-item__media media-ratio--${esc(prop)}"${usaLightbox ? ` data-lightbox-src="${esc(g.imagen)}" data-lightbox-caption="${esc(cap)}" data-lightbox-group="galeria"` : ''}>
          <img src="${esc(g.imagen)}" alt="${esc(g.titulo?.trim() || `Imagen ${idx + 1}`)}">
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

export const testimoniosSeccionHTML = (lista = [], web = true, lightbox = true) => {
  const validos = (lista || []).filter(t => t && (t.texto?.trim() || t.autor?.trim()));
  if (!validos.length) return '';
  return `<div class="testimonios-grilla">${validos.map(t => {
    const inicial = (t.autor?.trim() || 'C').charAt(0).toUpperCase();
    const avatar = t.avatar
      ? `<img class="testimonio-card__avatar" src="${esc(t.avatar)}" alt="${esc(t.autor || 'Cliente')}"${web && lightbox ? ` data-lightbox-src="${esc(t.avatar)}" data-lightbox-caption="${esc(t.autor || '')}"` : ''}>`
      : `<span class="testimonio-card__inicial" aria-hidden="true">${esc(inicial)}</span>`;
    return `
      <blockquote class="testimonio-card">
        ${t.texto?.trim() ? `<p class="testimonio-card__texto">“${esc(t.texto.trim()).replace(/\n/g, '<br>')}”</p>` : ''}
        <footer class="testimonio-card__autor">
          ${avatar}
          <div>
            <span class="testimonio-card__nombre">${esc(t.autor?.trim() || 'Cliente')}</span>
            ${t.rol?.trim() ? `<span class="testimonio-card__rol">${esc(t.rol.trim())}</span>` : ''}
          </div>
        </footer>
      </blockquote>`;
  }).join('')}</div>`;
};

export const faqsSeccionHTML = (lista = [], web = true) => {
  const validas = (lista || []).filter(f => f && (f.pregunta?.trim() || f.respuesta?.trim()));
  if (!validas.length) return '';
  return `<div class="faqs-lista">${validas.map((f, i) => `
    <details class="faq-item"${!web || i === 0 ? ' open' : ''}>
      <summary class="faq-item__pregunta">${esc(f.pregunta?.trim() || 'Pregunta frecuente')}</summary>
      <div class="faq-item__respuesta">${parrafos(f.respuesta || '')}</div>
    </details>`).join('')}</div>`;
};

export const proyectoCardHTML = (p, idx, web, lightbox = true) => {
  const tags = texto(p.tags).split(/[,\n]/).map(t => t.trim()).filter(Boolean);
  const urlRaw = texto(p.enlace).trim();
  const url = urlRaw ? (/^https?:\/\//i.test(urlRaw) ? urlRaw : `https://${urlRaw}`) : '';
  const prop = PROPORCIONES_IMAGEN[p.proporcion] ? p.proporcion : 'panoramica';
  const extras = Array.isArray(p.galeria) ? p.galeria.filter(Boolean) : [];
  const imagenPrincipal = p.imagen || extras[0] || '';
  const todasLasFotos = [p.imagen, ...extras].filter(Boolean);
  const grupoLb = `proy-${p.id || idx}`;
  const usaLb = web && lightbox;
  const capBase = [p.titulo?.trim(), p.subtitulo?.trim(), p.destacado?.trim()].filter(Boolean).join(' · ');

  const media = imagenPrincipal
    ? `<div class="proyecto-card__media media-ratio--${esc(prop)}"${usaLb ? ` data-lightbox-src="${esc(imagenPrincipal)}" data-lightbox-caption="${esc(capBase)}" data-lightbox-group="${esc(grupoLb)}"` : ''}>
        <img src="${esc(imagenPrincipal)}" alt="${esc(p.titulo || 'Proyecto')}">
        ${todasLasFotos.length > 1 ? `<span class="proyecto-card__contador-fotos">${todasLasFotos.length} fotos</span>` : ''}
      </div>`
    : `<div class="proyecto-card__arte" aria-hidden="true">
        <div class="proyecto-card__arte-top">
          <span class="proyecto-card__arte-indice">${String(idx + 1).padStart(2, '0')}</span>
          ${p.destacado.trim() ? `<span class="proyecto-card__destacado">${esc(p.destacado.trim())}</span>` : ''}
        </div>
        <span class="proyecto-card__arte-titular">${esc(p.titulo.trim() || 'Proyecto destacado')}</span>
      </div>`;

  const tiraExtras = extras.length
    ? `<div class="proyecto-card__tira">${extras.map((imgUrl, iEx) => `
        <button type="button" class="proyecto-card__mini"${usaLb ? ` data-lightbox-src="${esc(imgUrl)}" data-lightbox-caption="${esc(capBase ? `${capBase} (${iEx + 2}/${todasLasFotos.length})` : '')}" data-lightbox-group="${esc(grupoLb)}"` : ''} aria-label="Ver foto ${iEx + 2} de ${esc(p.titulo || 'proyecto')}">
          <img src="${esc(imgUrl)}" alt="">
        </button>`).join('')}</div>`
    : '';

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

export const bloquePortafolioEnPropuestaHTML = (pfResumen, web, lightbox = true) => {
  const proyectos = (pfResumen?.proyectos || []).filter(proyectoConContenido);
  const galeriaPf = (pfResumen?.galeria || []).filter(g => g && g.imagen);
  if (!proyectos.length && !galeriaPf.length) return '';
  const origen = typeof location !== 'undefined' ? location.origin : '';
  const linkPublico = pfResumen.publico && pfResumen.id && /^[A-Za-z0-9]{20}$/.test(pfResumen.id)
    ? `${origen}/portafolio/${pfResumen.id}`
    : '';
  return `
    ${(pfResumen.subtitulo || linkPublico) ? `
      <div class="portafolio-embebido__cabecera">
        ${pfResumen.subtitulo ? `<p class="portafolio-embebido__sub">${esc(pfResumen.subtitulo)}</p>` : '<span></span>'}
        ${web && linkPublico ? `<a class="portafolio-embebido__ver-mas" href="${esc(linkPublico)}" target="_blank" rel="noopener" data-enlace-cliente><span>Ver página completa</span>${ICONO_EXTERNO}</a>` : ''}
      </div>` : ''}
    ${proyectos.length ? `<div class="portafolio-grilla">${proyectos.map((p, idx) => proyectoCardHTML(p, idx, web, lightbox)).join('')}</div>` : ''}
    ${galeriaPf.length ? `<div style="margin-top:${proyectos.length ? '1.6em' : '0'}">${galeriaSeccionHTML(galeriaPf, { galeriaLayout: 'bento', lightbox }, web)}</div>` : ''}`;
};

export const servicioHTML = (s, moneda, web, { seleccion = new Set(), esAceptada = false, lightbox = true } = {}) => {
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
    ? `<p class="servicio__precio">${dinero(totalItem, moneda)}<span class="servicio__modo">${esc(modo)}</span></p>`
    : '';
  return `
    <div class="servicio${s.opcional ? ' servicio--opcional' : ''}${sumado ? ' servicio--sumado' : ''}">
      ${mediaSrv}
      <div class="servicio__cabecera">
        <div class="servicio__titular">
          ${insignia}
          <h3 class="servicio__nombre">${s.nombre.trim() ? esc(s.nombre) : vacioHTML('Servicio sin nombre')}</h3>
        </div>
        ${bloquePrecio}
      </div>
      ${s.descripcion.trim() ? `<p class="servicio__desc">${esc(s.descripcion.trim()).replace(/\n/g, '<br>')}</p>` : ''}
      ${entregables.length ? `<ul class="doc-lista servicio__entregables">${entregables.map(e => `<li>${ICONO_CHECK}<span>${esc(e)}</span></li>`).join('')}</ul>` : ''}
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

export const barraClienteHTML = (c, vig, { moneda = 'USD', esAceptada = false, consultaUrl = '' } = {}) => {
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
    : '<button type="button" class="boton boton--primario" data-accion="aceptar">Aceptar propuesta</button>';
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

export const cierrePropuestaHTML = (vig, { compartida = null, nombreEmisor = '', consultaUrl = '' } = {}) => {
  const esAceptada = !!compartida?.aceptacion;
  if (esAceptada) {
    const a = compartida.aceptacion;
    const fecha = fechaDeAceptacion(a);
    return `
      <div class="cierre cierre--aceptada">
        <p class="cierre__titulo">Propuesta aceptada</p>
        <p class="cierre__texto">Aceptada por ${esc(a.nombre)}${fecha ? ` el ${esc(fechaLarga(fecha))}` : ''}. Esta es la versión que se aceptó.</p>
        ${consultaUrl ? `<div class="cierre__acciones"><a class="boton boton--secundario boton--grande" href="${esc(consultaUrl)}" target="_blank" rel="noopener" data-enlace-cliente>Hacer una consulta</a></div>` : ''}
      </div>`;
  }
  if (vig.vencida) {
    return `
      <div class="cierre">
        <p class="cierre__titulo">Esta propuesta venció</p>
        <p class="cierre__texto">Los valores y plazos pueden haber cambiado. Pedile ${nombreEmisor ? `a ${esc(nombreEmisor)} ` : ''}una versión actualizada.</p>
        ${consultaUrl ? `<div class="cierre__acciones"><a class="boton boton--primario boton--grande" href="${esc(consultaUrl)}" target="_blank" rel="noopener" data-enlace-cliente>Pedir una actualización</a></div>` : ''}
      </div>`;
  }
  const textoCierre = compartida
    ? `Al aceptar, ${nombreEmisor ? esc(nombreEmisor) : 'quien te la mandó'} recibe tu confirmación con lo que elegiste.`
    : `Al aceptar se abre un mensaje con el resumen de lo que elegiste${nombreEmisor ? `, listo para mandárselo a ${esc(nombreEmisor)}` : ''}.`;
  return `
    <div class="cierre">
      <p class="cierre__titulo">¿Avanzamos?</p>
      <p class="cierre__texto">${textoCierre}</p>
      <div class="cierre__acciones">
        <button type="button" class="boton boton--primario boton--grande" data-accion="aceptar">Aceptar propuesta</button>
        ${consultaUrl ? `<a class="boton boton--secundario boton--grande" href="${esc(consultaUrl)}" target="_blank" rel="noopener" data-enlace-cliente>Hacer una consulta</a></div>` : ''}
      </div>
    </div>`;
};

let observador;
const OBS_SEL = '.bloque, .resumen, .cierre, .pie, .doc-aviso';
const HIJO_SEL = '.servicio, .etapa, .proyecto-card, .galeria-item, .testimonio-card, .faq-item, .servicio-web-card';

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

export const generarPortafolioHTML = (s, { web = true, tipoDecoracion = 'marco', tipoPortada = 'editorial' } = {}) => {
  const e = s.emisor;
  const pf = s.portafolio;
  const usaLightbox = s.opciones?.lightbox !== false;
  const tituloPf = pf.titulo.trim() || pf.nombreInterno.trim() || 'tu portfolio';

  const marca = e.logo
    ? `<img class="portada__logo" src="${esc(e.logo)}" alt="${esc(e.nombre || 'Logo')}">`
    : `<span class="portada__marca">${e.nombre.trim() ? esc(e.nombre) : vacioHTML('Tu marca')}</span>`;

  const proyectosValidos = s.proyectos.filter(proyectoConContenido);
  const especialidadesValidas = s.especialidades.filter(x => x.texto.trim());
  const galeriaValida = (s.galeria || []).filter(g => g && g.imagen);
  const serviciosWebValidos = (s.serviciosWeb || []).filter(sw => sw && (sw.titulo.trim() || sw.descripcion.trim() || sw.imagen));
  const testimoniosValidos = (s.testimonios || []).filter(t => t && (t.texto.trim() || t.autor.trim()));
  const faqsValidas = (s.faqs || []).filter(f => f && (f.pregunta.trim() || f.respuesta.trim()));

  const meta = [];
  if (e.nombre.trim()) meta.push(['Presentado por', `${esc(e.nombre)}${e.rol.trim() ? `<span>${esc(e.rol)}</span>` : ''}`]);
  if (proyectosValidos.length) meta.push(['Casos seleccionados', `${proyectosValidos.length} ${proyectosValidos.length === 1 ? 'proyecto destacado' : 'proyectos destacados'}`]);
  if (pf.disponibilidad.trim()) meta.push(['Estado', `<span class="portada__urgente">${esc(pf.disponibilidad.trim())}</span>`]);
  if (e.ubicacion?.trim() || e.web.trim() || e.email.trim()) meta.push(['Ubicación / Web', esc(e.ubicacion?.trim() || e.web.trim() || e.email.trim())]);

  const marcaAgua = tipoPortada === 'impacto'
    ? `<span class="portada__marca-agua" aria-hidden="true">${esc(String(proyectosValidos.length || '01').padStart(2, '0'))}</span>`
    : '';

  const colTema = resolverColoresTema(s.tema);
  const opPortada = Math.min(0.85, Math.max(0.08, (Number(pf.opacidadPortada) || 35) / 100));
  const fondoFotoHTML = pf.imagenPortada
    ? `<div class="portada__fondo-img" style="--portada-img-opacidad:${opPortada}" aria-hidden="true"><img src="${esc(pf.imagenPortada)}" alt=""></div>`
    : '';

  const portada = `
    <section class="portada portada--${esc(tipoPortada)}" id="sec-inicio" aria-label="Portada del portfolio">
      ${fondoFotoHTML}
      <div class="portada__decoracion" style="color:${esc(colTema.colorSvg)}" aria-hidden="true">${decoracionPortadaSVG(tipoDecoracion, colTema.opacidadSvg, colTema.colorSvg)}</div>
      ${marcaAgua}
      <div class="portada__superior">
        ${marca}
        ${pf.disponibilidad.trim() ? `<p class="portada__numero">${esc(pf.disponibilidad.trim())}</p>` : ''}
      </div>
      <div class="portada__centro">
        <p class="portada__para"><span class="portada__para-chip">${esc(pf.insignia.trim() || 'Portfolio & Página Web')}</span></p>
        <h1 class="portada__titulo">${pf.titulo.trim() ? esc(pf.titulo) : vacioHTML('Título de tu página o portfolio')}</h1>
        ${pf.subtitulo.trim() ? `<p class="portada__subtitulo">${esc(pf.subtitulo.trim())}</p>` : ''}
        <hr class="portada__regla">
      </div>
      ${meta.length ? `<dl class="portada__meta">${meta.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>` : ''}
    </section>`;

  const bloques = [];

  if (e.presentacion.trim() || e.foto || especialidadesValidas.length || e.instagram?.trim() || e.linkedin?.trim() || e.behance?.trim()) {
    bloques.push({
      id: 'sec-sobre-mi',
      nav: 'Sobre mí',
      titulo: e.nombre.trim() ? `Sobre ${e.nombre.trim()}` : 'Perfil y especialidades',
      html: sobreMiBloqueHTML(e, especialidadesValidas, web, usaLightbox)
    });
  }

  if (proyectosValidos.length) {
    bloques.push({
      id: 'sec-proyectos',
      nav: 'Proyectos',
      titulo: 'Proyectos y casos seleccionados',
      html: `<div class="portafolio-grilla">${proyectosValidos.map((p, idx) => proyectoCardHTML(p, idx, web, usaLightbox)).join('')}</div>`
    });
  }

  if (galeriaValida.length) {
    bloques.push({
      id: 'sec-galeria',
      nav: 'Galería',
      titulo: s.opciones?.galeriaTitulo?.trim() || 'Galería visual',
      html: galeriaSeccionHTML(galeriaValida, s.opciones, web)
    });
  }

  const ctaLabel = pf.ctaTexto.trim() || 'Contactar';
  const msgContacto = `Hola${e.nombre.trim() ? ` ${e.nombre.trim().split(' ')[0]}` : ''}! Vi tu página «${tituloPf}» y me gustaría conversar sobre un proyecto.`;
  const waUrl = armarEnlaceWhatsApp(msgContacto, e);
  const mailUrl = armarEnlaceEmail(`Consulta desde tu página: ${tituloPf}`, msgContacto, e);
  const principalUrl = waUrl || mailUrl;

  if (serviciosWebValidos.length) {
    const htmlSrv = `<div class="servicios-web-grilla">${serviciosWebValidos.map(sw => {
      const msgSrv = `Hola${e.nombre.trim() ? ` ${e.nombre.trim().split(' ')[0]}` : ''}! Me interesa consultar por «${sw.titulo.trim() || 'tu servicio'}» que vi en tu página.`;
      const linkSrv = armarEnlaceWhatsApp(msgSrv, e) || armarEnlaceEmail(`Consulta por ${sw.titulo.trim() || 'servicio'}`, msgSrv, e);
      return `
        <article class="servicio-web-card">
          ${sw.imagen ? `<div class="servicio-web-card__media"${web && usaLightbox ? ` data-lightbox-src="${esc(sw.imagen)}" data-lightbox-caption="${esc(sw.titulo || '')}"` : ''}><img src="${esc(sw.imagen)}" alt="${esc(sw.titulo || 'Servicio')}"></div>` : ''}
          <div class="servicio-web-card__cabecera">
            <h3 class="servicio-web-card__titulo">${sw.titulo.trim() ? esc(sw.titulo) : vacioHTML('Servicio')}</h3>
            ${sw.precio.trim() ? `<span class="servicio-web-card__precio">${esc(sw.precio.trim())}</span>` : ''}
          </div>
          ${sw.descripcion.trim() ? `<p class="servicio-web-card__desc">${esc(sw.descripcion.trim()).replace(/\n/g, '<br>')}</p>` : ''}
          ${web ? (linkSrv
            ? `<a class="boton boton--secundario boton--chico servicio-web-card__cta" href="${esc(linkSrv)}" target="_blank" rel="noopener" data-enlace-cliente>${esc(sw.cta.trim() || 'Consultar')}</a>`
            : `<button type="button" class="boton boton--secundario boton--chico servicio-web-card__cta" data-accion="contacto-demo">${esc(sw.cta.trim() || 'Consultar')}</button>`) : ''}
        </article>`;
    }).join('')}</div>`;
    bloques.push({
      id: 'sec-servicios',
      nav: 'Servicios',
      titulo: s.opciones?.serviciosTitulo?.trim() || 'Servicios y soluciones',
      html: htmlSrv
    });
  }

  if (testimoniosValidos.length) {
    bloques.push({
      id: 'sec-testimonios',
      nav: 'Testimonios',
      titulo: 'Qué dicen quienes trabajaron conmigo',
      html: testimoniosSeccionHTML(testimoniosValidos, web, usaLightbox)
    });
  }

  if (faqsValidas.length) {
    bloques.push({
      id: 'sec-faq',
      nav: 'Preguntas',
      titulo: 'Preguntas frecuentes',
      html: faqsSeccionHTML(faqsValidas, web)
    });
  }

  if (web) {
    const botonesCierre = [];
    if (waUrl) {
      botonesCierre.push(`<a class="boton boton--primario boton--grande" href="${esc(waUrl)}" target="_blank" rel="noopener" data-enlace-cliente>${esc(ctaLabel)} por WhatsApp</a>`);
    }
    if (mailUrl) {
      botonesCierre.push(`<a class="boton ${waUrl ? 'boton--secundario' : 'boton--primario'} boton--grande" href="${esc(mailUrl)}" data-enlace-cliente>${waUrl ? 'Escribir por email' : esc(ctaLabel)}</a>`);
    }
    if (!botonesCierre.length) {
      botonesCierre.push(`<button type="button" class="boton boton--primario boton--grande" data-accion="contacto-demo">${esc(ctaLabel)}</button>`);
    }
    bloques.push({
      id: 'sec-contacto',
      nav: 'Contacto',
      titulo: 'Contacto',
      html: `
        <div class="cierre">
          <p class="cierre__titulo">${esc(pf.cierreTitulo.trim() || '¿Trabajamos juntos?')}</p>
          <p class="cierre__texto">${esc(pf.cierreTexto.trim() || 'Contame qué tenés en mente y armamos una propuesta a medida.')}</p>
          <div class="cierre__acciones">${botonesCierre.join('')}</div>
        </div>`
    });
  }

  const navLanding = web && s.opciones?.barraNav !== false && bloques.length > 1
    ? `<nav class="doc-nav" aria-label="Secciones de la página">
        <a class="doc-nav__marca" href="#sec-inicio" data-scroll-interno>${esc(e.nombre.trim() || pf.insignia.trim() || 'Inicio')}</a>
        <ul class="doc-nav__links">
          ${bloques.filter(b => b.nav).map(b => `<li><a class="doc-nav__link" href="#${esc(b.id)}" data-scroll-interno>${esc(b.nav)}</a></li>`).join('')}
        </ul>
      </nav>`
    : '';

  const contactos = [];
  if (e.email.trim()) contactos.push(web ? `<a href="mailto:${esc(e.email.trim())}" data-enlace-cliente>${esc(e.email.trim())}</a>` : esc(e.email.trim()));
  if (e.telefono.trim()) contactos.push(esc(e.telefono.trim()));
  if (e.web.trim()) {
    const url = /^https?:\/\//i.test(e.web.trim()) ? e.web.trim() : `https://${e.web.trim()}`;
    contactos.push(web ? `<a href="${esc(url)}" target="_blank" rel="noopener" data-enlace-cliente>${esc(e.web.trim())}</a>` : esc(e.web.trim()));
  }
  const pie = `
    <footer class="pie">
      ${e.nombre.trim() ? `<span class="pie__nombre">${esc(e.nombre)}</span>` : ''}
      ${contactos.map(x => `<span>${x}</span>`).join('')}
      ${web ? '<button type="button" class="pie__pdf" data-accion="pdf">Descargar en PDF</button>' : ''}
      ${s.opciones.credito ? '<span class="pie__credito">Página creada con Dealit</span>' : ''}
    </footer>`;

  const barraInferior = web ? `
    <div class="barra-cliente">
      <div>
        <span class="barra-cliente__etiqueta">${esc(pf.disponibilidad.trim() || 'Página profesional')}</span>
        <span class="barra-cliente__monto">${esc(e.nombre.trim() || pf.titulo.trim() || 'Disponible')}</span>
        ${e.rol.trim() ? `<span class="barra-cliente__extra">${esc(e.rol.trim())}</span>` : ''}
      </div>
      ${principalUrl
        ? `<a class="boton boton--primario" href="${esc(principalUrl)}" target="_blank" rel="noopener" data-enlace-cliente>${esc(ctaLabel)}</a>`
        : `<button type="button" class="boton boton--primario" data-accion="contacto-demo">${esc(ctaLabel)}</button>`}
    </div>` : '';

  const cuerpo = `
    <div class="cuerpo">
      ${bloques.length ? bloques.map((b, i) => `
        <section class="bloque" id="${esc(b.id || `sec-${i + 1}`)}">
          <span class="bloque__num" aria-hidden="true">${i + 1}</span>
          <div class="bloque__contenido">
            <h2 class="bloque__titulo">${esc(b.titulo)}</h2>
            ${b.html}
          </div>
        </section>`).join('') : '<p class="doc-nota">Sumá tus proyectos o fotos desde el panel izquierdo para armar tu página.</p>'}
      ${pie}
    </div>`;

  return portada + navLanding + cuerpo + barraInferior;
};

export const generarPropuestaHTML = (
  s,
  {
    web = true,
    seleccion = new Set(),
    compartida = null,
    tipoDecoracion = 'marco',
    tipoPortada = 'editorial'
  } = {}
) => {
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
    ? `<img class="portada__logo" src="${esc(e.logo)}" alt="${esc(e.nombre || 'Logo')}">`
    : `<span class="portada__marca">${e.nombre.trim() ? esc(e.nombre) : vacioHTML('Tu marca')}</span>`;

  const meta = [];
  if (cl.nombre.trim() || cl.empresa.trim()) {
    const sec = [cl.cargo.trim(), cl.empresa.trim() && cl.nombre.trim() ? cl.empresa.trim() : ''].filter(Boolean).join(', ');
    meta.push(['Preparada para', `${esc(cl.nombre.trim() || cl.empresa.trim())}${sec ? `<span>${esc(sec)}</span>` : ''}`]);
  }
  if (e.nombre.trim()) meta.push(['Preparada por', `${esc(e.nombre)}${e.rol.trim() ? `<span>${esc(e.rol)}</span>` : ''}`]);
  if (vig.fecha) meta.push(['Fecha', esc(fechaLarga(vig.fecha))]);
  if (vig.vence) {
    if (web && vig.vencida) meta.push(['Venció el', esc(fechaLarga(vig.vence))]);
    else {
      const urgente = web && vig.restantes !== null && vig.restantes <= 30 ? `<span class="portada__urgente">${textoRestantes(vig.restantes)}</span>` : '';
      meta.push(['Válida hasta', `${esc(fechaLarga(vig.vence))}${urgente}`]);
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
        ${p.numero.trim() ? `<p class="portada__numero">Propuesta ${esc(p.numero)}</p>` : ''}
      </div>
      <div class="portada__centro">
        <p class="portada__para"><span class="portada__para-chip">${destinatario ? `Propuesta para ${esc(destinatario)}` : 'Propuesta comercial'}</span></p>
        <h1 class="portada__titulo">${p.titulo.trim() ? esc(p.titulo) : vacioHTML('Título de la propuesta')}</h1>
        <hr class="portada__regla">
      </div>
      ${meta.length ? `<dl class="portada__meta">${meta.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>` : ''}
    </section>`;

  const bloques = [];

  if (e.presentacion.trim() || e.foto || e.instagram?.trim() || e.linkedin?.trim() || e.behance?.trim()) {
    bloques.push({
      id: 'sec-prop-sobre',
      nav: 'Sobre mí',
      titulo: e.nombre.trim() ? `Sobre ${e.nombre.trim()}` : 'Quién presenta esta propuesta',
      html: sobreMiBloqueHTML(e, [], web, usaLightbox)
    });
  }

  const pfAdjunto = s.opciones?.portafolioId ? s.opciones?.portafolio : null;
  if (pfAdjunto && ((Array.isArray(pfAdjunto.proyectos) && pfAdjunto.proyectos.some(proyectoConContenido)) || (Array.isArray(pfAdjunto.galeria) && pfAdjunto.galeria.some(g => g?.imagen)))) {
    const htmlPf = bloquePortafolioEnPropuestaHTML(pfAdjunto, web, usaLightbox);
    if (htmlPf) {
      bloques.push({
        titulo: pfAdjunto.titulo?.trim() || 'Trabajos y casos destacados',
        html: htmlPf
      });
    }
  }

  if (s.contexto.trim()) {
    bloques.push({
      titulo: 'El punto de partida',
      html: `<div class="contexto-bloque">${parrafos(s.contexto)}</div>`
    });
  }

  const objetivos = s.objetivos.filter(o => o.texto.trim());
  if (objetivos.length) {
    bloques.push({
      titulo: 'Qué queremos lograr',
      html: `<ul class="doc-lista objetivos-lista">${objetivos.map((o, i) => `
        <li class="objetivo-item">
          <span class="objetivo-item__indice" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <span class="objetivo-item__texto">${esc(o.texto.trim())}</span>
        </li>`).join('')}</ul>`
    });
  }

  const incluidos = s.servicios.filter(x => !x.opcional && servicioConContenido(x));
  const opcionales = s.servicios.filter(x => x.opcional && servicioConContenido(x));
  const srvOpts = { seleccion, esAceptada, lightbox: usaLightbox };
  if (incluidos.length || opcionales.length) {
    let html = `<div class="servicios-grilla">${incluidos.map(x => servicioHTML(x, m, web, srvOpts)).join('')}</div>`;
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
            ${opcionales.map(x => servicioHTML(x, m, web, srvOpts)).join('')}
          </div>
        </div>`;
    }
    bloques.push({ titulo: 'Qué incluye la propuesta', html });
  }

  const etapas = s.etapas.filter(x => x.nombre.trim() || x.descripcion.trim() || x.duracion.trim());
  if (etapas.length) {
    bloques.push({
      titulo: 'Cómo vamos a trabajar',
      html: `<ol class="etapas">${etapas.map((x, i) => `
        <li class="etapa">
          <span class="etapa__num" aria-hidden="true">${i + 1}</span>
          <div class="etapa__cuerpo">
            <p class="etapa__nombre">${x.nombre.trim() ? esc(x.nombre) : vacioHTML('Etapa sin nombre')}</p>
            ${x.descripcion.trim() ? `<p class="etapa__desc">${esc(x.descripcion.trim())}</p>` : ''}
          </div>
          ${x.duracion.trim() ? `<p class="etapa__duracion"><span class="etapa__chip">${esc(x.duracion.trim())}</span></p>` : '<p class="etapa__duracion etapa__duracion--vacia"></p>'}
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
          <thead><tr><th scope="col">Momento</th><th scope="col" class="pagos__num">Porcentaje</th><th scope="col" class="pagos__num">Monto</th></tr></thead>
          <tbody>${pagos.map(x => `<tr><td>${x.concepto.trim() ? esc(x.concepto) : vacioHTML('Pago sin descripción')}</td><td class="pagos__num"><span class="pagos__pct">${cantidadTexto(numero(x.porcentaje))}%</span></td><td class="pagos__num pagos__monto">${dinero(c.inicial.total * numero(x.porcentaje) / 100, m)}</td></tr>`).join('')}</tbody>
        </table>`;
      if (c.mensual.base > 0) html += '<p class="doc-nota">El servicio mensual se factura por mes adelantado, desde que empieza ese servicio.</p>';
    }
    bloques.push({ titulo: 'Inversión', html });
  }

  const galeriaPropValida = (s.galeria || []).filter(g => g && g.imagen);
  if (galeriaPropValida.length) {
    bloques.push({
      id: 'sec-prop-galeria',
      nav: 'Galería',
      titulo: s.opciones?.galeriaTitulo?.trim() || 'Galería visual y referencias',
      html: galeriaSeccionHTML(galeriaPropValida, s.opciones, web)
    });
  }

  const testimoniosPropValidos = (s.testimonios || []).filter(t => t && (t.texto.trim() || t.autor.trim()));
  if (testimoniosPropValidos.length) {
    bloques.push({
      id: 'sec-prop-testimonios',
      nav: 'Testimonios',
      titulo: 'Referencias y experiencias de clientes',
      html: testimoniosSeccionHTML(testimoniosPropValidos, web, usaLightbox)
    });
  }

  const faqsPropValidas = (s.faqs || []).filter(f => f && (f.pregunta.trim() || f.respuesta.trim()));
  if (faqsPropValidas.length) {
    bloques.push({
      id: 'sec-prop-faq',
      nav: 'Preguntas',
      titulo: 'Preguntas frecuentes',
      html: faqsSeccionHTML(faqsPropValidas, web)
    });
  }

  const condiciones = lineas(s.condiciones);
  if (condiciones.length) {
    bloques.push({ id: 'sec-prop-condiciones', titulo: 'Condiciones', html: `<ul class="doc-lista">${condiciones.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` });
  }

  const pasos = lineas(s.proximosPasos);
  const firmas = !web && s.opciones.firmas;
  if (pasos.length || firmas || web) {
    let html = pasos.length ? `<ol class="pasos">${pasos.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '';
    if (web) html += cierrePropuestaHTML(vig, { compartida, nombreEmisor: nombreEm, consultaUrl });
    if (firmas) {
      const quienCliente = cl.nombre.trim() || cl.empresa.trim() || 'Cliente';
      const quienEmisor = e.nombre.trim() || 'Responsable de la propuesta';
      html += `
        <div class="firmas">
          <div class="firma__linea"><p class="firma__quien">${esc(quienCliente)}</p><p class="firma__datos">Firma, aclaración y fecha</p></div>
          <div class="firma__linea"><p class="firma__quien">${esc(quienEmisor)}</p><p class="firma__datos">Firma, aclaración y fecha</p></div>
        </div>`;
    }
    bloques.push({ titulo: pasos.length ? 'Próximos pasos' : (web ? 'Siguiente paso' : 'Aceptación'), html });
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
      ${e.nombre.trim() ? `<span class="pie__nombre">${esc(e.nombre)}</span>` : ''}
      ${contactos.map(x => `<span>${x}</span>`).join('')}
      ${web ? '<button type="button" class="pie__pdf" data-accion="pdf">Descargar en PDF</button>' : ''}
      ${s.opciones.credito ? '<span class="pie__credito">Propuesta armada con la plantilla de AteneaGen</span>' : ''}
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
        <section class="bloque" id="${esc(b.id || `sec-prop-${i + 1}`)}">
          <span class="bloque__num" aria-hidden="true">${i + 1}</span>
          <div class="bloque__contenido">
            <h2 class="bloque__titulo">${esc(b.titulo)}</h2>
            ${b.html}
          </div>
        </section>`).join('') : '<p class="doc-nota">Completá las secciones del editor para armar el cuerpo de la propuesta.</p>'}
      ${pie}
    </div>`;

  return portada + navLandingProp + cuerpo + (web ? barraClienteHTML(c, vig, { moneda: m, esAceptada, consultaUrl }) : '');
};
