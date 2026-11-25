// Página del portfolio: una landing con portada de portfolio (nombre grande, foto opcional y
// el color de acento), «Sobre mí», proyectos numerados como casos, galería, servicios,
// testimonios, preguntas y un cierre de contacto. La ven el cliente (link) y el editor.
//
// En el editor ({ editable: true }) cada texto lleva data-editar con la clave de su campo,
// como en las propuestas: las del portfolio van con «pf:» (ver src/editar-documento.js).
//
// La foto de portada es opcional: sin ella, la portada se arma con el nombre, un monograma
// y el color de acento, y tiene que verse igual de bien (las plantillas vienen sin fotos).

import { esc, parrafos } from './formato.js';
import { atributoEditar } from '../editar-documento.js';
import { ENCUADRES_IMAGEN } from '../modelo.js';
import {
  ICONO_EXTERNO,
  vacioHTML,
  proyectoConContenido,
  proyectoMediaHTML,
  proyectoTagsYLink,
  armarEnlaceWhatsApp,
  armarEnlaceEmail,
  redesEmisorHTML,
  videoSeccionHTML,
  galeriaSeccionHTML,
  testimoniosSeccionHTML,
  faqsSeccionHTML,
  creditoHTML
} from './render.js';

// Las portadas del estudio de diseño se agrupan en tres portadas de portfolio.
const HEROES = {
  editorial: 'bloque',
  minimal: 'bloque',
  insignia: 'bloque',
  dividida: 'dividida',
  tarjeta: 'dividida',
  impacto: 'impacto',
  franja: 'impacto'
};
export const heroDePortada = tipo => HEROES[tipo] || 'bloque';

const dosDigitos = n => String(n).padStart(2, '0');

// Texto de un título: las palabras compuestas («multi-depósito») no se parten en el guion.
export const tituloSinCortes = t => esc(t).replace(/[^\s<>]+-[^\s<>]+/g, m => `<span class="pf-junto">${m}</span>`);

// Iniciales para el monograma de la portada sin foto: «Estudio Norte» → «EN».
export const iniciales = (...textos) => {
  for (const t of textos) {
    const palabras = String(t || '').trim().split(/\s+/).filter(p => /[\p{L}\p{N}]/u.test(p));
    if (palabras.length) {
      return palabras.slice(0, 2).map(p => p.match(/[\p{L}\p{N}]/u)[0].toUpperCase()).join('');
    }
  }
  return 'P';
};

// Marco de una foto con sus ajustes (FOTO_PORTADA): forma, si llena el marco o va entera,
// máscara, qué parte se ve y zoom. Lo usan la portada y «Sobre mí».
const marcoFoto = ({ clase, src, alt, forma, ajuste, mascara, encuadre, zoom, editar = '', estiloExtra = '', atributosImg = '' }) => {
  const pos = (ENCUADRES_IMAGEN[encuadre] || ENCUADRES_IMAGEN.centro).css;
  const escala = ajuste === 'entera' ? 1 : Math.min(2.5, Math.max(1, (Number(zoom) || 100) / 100));
  const estilo = [`--pf-foto-pos:${pos}`, `--pf-foto-zoom:${escala}`, estiloExtra].filter(Boolean).join(';');
  return `<figure class="${clase}" data-forma="${esc(forma || 'auto')}" data-ajuste="${esc(ajuste || 'recortar')}" data-mascara="${esc(mascara || 'recta')}"${editar} style="${esc(estilo)}">
        <div class="pf-hero__marco pf-marco"><img src="${esc(src)}" alt="${esc(alt)}"${atributosImg}></div>
      </figure>`;
};

const ICONO_FLECHA = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9M8.5 4l4 4-4 4"/></svg>';
const ICONO_UBICACION = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 9.8 8 14 8 14z"/><circle cx="8" cy="6.5" r="1.5"/></svg>';

// Cabecera de cada sección: número grande, título y bajada.
const cabeceraHTML = ({ num, titulo, claveTitulo, bajada = '', claveBajada = '', ed }) => `
  <header class="pf-sec__cab">
    <span class="pf-sec__num" aria-hidden="true">${dosDigitos(num)}</span>
    <h2 class="pf-sec__titulo"${ed(claveTitulo)}>${tituloSinCortes(titulo)}</h2>
    ${bajada ? `<p class="pf-sec__bajada"${ed(claveBajada)}>${esc(bajada)}</p>` : ''}
  </header>`;

export const generarPortafolioHTML = (s, { web = true, tipoPortada = 'editorial', editable = false } = {}) => {
  const ed = atributoEditar(editable);
  const e = s.emisor;
  const pf = s.portafolio;
  const op = s.opciones || {};
  const usaLightbox = op.lightbox !== false;
  const lb = web && usaLightbox;
  const nombre = e.nombre.trim();
  const tituloPf = pf.titulo.trim() || pf.nombreInterno.trim() || 'tu portfolio';
  const hero = heroDePortada(tipoPortada);

  // Las claves de los ítems usan su lugar en la lista completa (con los vacíos), que es el
  // del editor.
  const clave = (lista, arr) => (item, campo) => ed(`pf:${lista}:${arr.indexOf(item)}${campo ? `:${campo}` : ''}`);

  const proyectos = s.proyectos.filter(proyectoConContenido);
  const especialidades = s.especialidades.filter(x => x.texto.trim());
  const galeria = (s.galeria || []).filter(g => g && g.imagen);
  const servicios = (s.serviciosWeb || []).filter(sw => sw && (sw.titulo.trim() || sw.descripcion.trim() || sw.imagen));
  const testimonios = (s.testimonios || []).filter(t => t && (t.texto.trim() || t.autor.trim()));
  const faqs = (s.faqs || []).filter(f => f && (f.pregunta.trim() || f.respuesta.trim()));

  // Contacto: WhatsApp o email, con un mensaje que ya dice de dónde viene.
  const saludo = `Hola${nombre ? ` ${nombre.split(' ')[0]}` : ''}!`;
  const msgContacto = `${saludo} Vi tu página «${tituloPf}» y me gustaría conversar sobre un proyecto.`;
  const waUrl = armarEnlaceWhatsApp(msgContacto, e);
  const mailUrl = armarEnlaceEmail(`Consulta desde tu página: ${tituloPf}`, msgContacto, e);
  const principalUrl = waUrl || mailUrl;
  const ctaLabel = pf.ctaTexto.trim() || 'Contactar';
  const botonCta = (clase, extra = '') => (principalUrl
    ? `<a class="boton ${clase}" href="${esc(principalUrl)}" target="_blank" rel="noopener" data-enlace-cliente>${esc(ctaLabel)}${extra}</a>`
    : `<button type="button" class="boton ${clase}" data-accion="contacto-demo">${esc(ctaLabel)}${extra}</button>`);

  // ---------- Portada ----------
  const foto = pf.imagenPortada || '';
  const opFoto = Math.min(0.85, Math.max(0.1, (Number(pf.opacidadPortada) || 35) / 100));
  const marca = e.logo
    ? `<img class="pf-hero__logo"${ed('paso:Tus datos')} src="${esc(e.logo)}" alt="${esc(nombre || 'Logo')}">`
    : `<span class="pf-hero__marca"${ed('emisor.nombre')}>${nombre ? esc(nombre) : vacioHTML('Tu marca')}</span>`;
  const titulo = pf.titulo.trim();
  const largo = titulo.length > 44 ? ' pf-hero__titulo--largo' : titulo.length > 0 && titulo.length <= 18 ? ' pf-hero__titulo--corto' : '';
  const datosHero = [];
  if (proyectos.length) datosHero.push([dosDigitos(proyectos.length), proyectos.length === 1 ? 'Proyecto' : 'Proyectos', 'pf:lista:proyectos']);
  if (especialidades.length) datosHero.push([dosDigitos(especialidades.length), especialidades.length === 1 ? 'Especialidad' : 'Especialidades', 'pf:lista:especialidades']);
  if (e.ubicacion?.trim()) datosHero.push([esc(e.ubicacion.trim()), 'Base', 'emisor.ubicacion', true]);

  // La foto va en un marco: forma (proporción), máscara, si llena el marco o va entera,
  // qué parte se ve y zoom. Lo elige el dueño en el paso «Portada» (ver FOTO_PORTADA).
  const visual = foto
    ? marcoFoto({
      clase: 'pf-hero__foto',
      src: foto,
      alt: titulo || nombre || 'Portada',
      forma: pf.formaPortada,
      ajuste: pf.ajustePortada,
      mascara: pf.mascaraPortada,
      encuadre: pf.encuadrePortada,
      zoom: pf.zoomPortada,
      editar: ed('paso:Portada'),
      estiloExtra: hero === 'impacto' ? `--pf-foto-op:${opFoto}` : ''
    })
    : `<div class="pf-hero__arte"${ed('paso:Portada')} aria-hidden="true">
        <span class="pf-hero__monograma">${esc(iniciales(nombre, titulo))}</span>
        <span class="pf-hero__palabra">Portfolio<span> · ${new Date().getFullYear()}</span></span>
      </div>`;

  const portada = `
    <header class="pf-hero pf-hero--${hero} ${foto ? 'pf-hero--con-foto' : 'pf-hero--sin-foto'}"${foto ? ` data-tamano="${esc(pf.tamanoPortada || 'mediana')}"` : ''} id="sec-inicio" aria-label="Portada">
      ${visual}
      <div class="pf-hero__barra">
        ${marca}
        ${pf.disponibilidad.trim() ? `<span class="pf-hero__estado"${ed('pf:portafolio.disponibilidad')}><i aria-hidden="true"></i>${esc(pf.disponibilidad.trim())}</span>` : ''}
      </div>
      <div class="pf-hero__texto">
        ${pf.insignia.trim() ? `<p class="pf-hero__etiqueta"${ed('pf:portafolio.insignia')}>${esc(pf.insignia.trim())}</p>` : ''}
        <h1 class="pf-hero__titulo${largo}"${ed('pf:portafolio.titulo')}>${titulo ? tituloSinCortes(titulo) : vacioHTML('Título de tu página')}</h1>
        ${pf.subtitulo.trim() ? `<p class="pf-hero__sub"${ed('pf:portafolio.subtitulo')}>${esc(pf.subtitulo.trim())}</p>` : ''}
        ${nombre || e.rol.trim() ? `
          <p class="pf-hero__firma">
            ${nombre && e.logo ? `<span class="pf-hero__nombre"${ed('emisor.nombre')}>${esc(nombre)}</span>` : ''}
            ${e.rol.trim() ? `<span class="pf-hero__rol"${ed('emisor.rol')}>${esc(e.rol.trim())}</span>` : ''}
          </p>` : ''}
        ${web ? `
          <div class="pf-hero__acciones">
            ${botonCta('boton--primario boton--grande')}
            ${proyectos.length ? `<a class="pf-hero__ver" href="#sec-proyectos" data-scroll-interno><span>Ver proyectos</span>${ICONO_FLECHA}</a>` : ''}
          </div>` : ''}
      </div>
      ${datosHero.length ? `<dl class="pf-hero__datos">${datosHero.map(([v, t, k, enPalabras]) => `<div${enPalabras ? ' class="pf-hero__dato--texto"' : ''}${ed(k)}><dt>${t}</dt><dd>${v}</dd></div>`).join('')}</dl>` : ''}
    </header>`;

  // ---------- Secciones ----------
  const secciones = [];
  const sumar = (id, nav, html) => secciones.push({ id, nav, html });
  const num = () => secciones.length + 1;

  const redes = redesEmisorHTML(e, web);
  if (e.presentacion.trim() || e.foto || especialidades.length || redes) {
    const chips = especialidades.length
      ? `<ul class="pf-sobre__chips">${especialidades.map(x => `<li${clave('especialidades', s.especialidades)(x, 'texto')}>${esc(x.texto.trim())}</li>`).join('')}</ul>`
      : '';
    sumar('sec-sobre-mi', 'Sobre mí', `
      <section class="pf-sec pf-sobre${e.foto ? '' : ' pf-sobre--sin-foto'}" id="sec-sobre-mi"${e.foto ? ` data-tamano="${esc(pf.tamanoFotoSobre || 'mediana')}"` : ''}>
        ${e.foto ? marcoFoto({
          clase: 'pf-sobre__foto',
          src: e.foto,
          alt: nombre || 'Foto de perfil',
          forma: pf.formaFotoSobre,
          ajuste: pf.ajusteFotoSobre,
          mascara: pf.mascaraFotoSobre,
          encuadre: pf.encuadreFotoSobre,
          zoom: pf.zoomFotoSobre,
          editar: ed('paso:Tus datos'),
          atributosImg: lb ? ` data-lightbox-src="${esc(e.foto)}" data-lightbox-caption="${esc(nombre)}"` : ''
        }) : ''}
        <div class="pf-sobre__texto">
          <p class="pf-sobre__etiqueta"><span aria-hidden="true">${dosDigitos(num())}</span> Sobre mí</p>
          <h2 class="pf-sobre__titulo"${ed('emisor.nombre')}>${nombre ? `Hola, soy ${tituloSinCortes(nombre)}` : 'Quién soy'}</h2>
          ${e.ubicacion?.trim() ? `<p class="pf-sobre__ubicacion"${ed('emisor.ubicacion')}>${ICONO_UBICACION}${esc(e.ubicacion.trim())}</p>` : ''}
          ${e.presentacion.trim() ? `<div class="pf-sobre__presentacion"${ed('emisor.presentacion')}>${parrafos(e.presentacion)}</div>` : ''}
          ${chips}
          ${redes}
        </div>
      </section>`);
  }

  const video = videoSeccionHTML(s.video, web);
  if (video) {
    sumar('sec-video', 'Video', `
      <section class="pf-sec pf-sec--video" id="sec-video">
        ${cabeceraHTML({ num: num(), titulo: s.video.titulo.trim() || 'Mirá cómo trabajo', claveTitulo: 'pf:video.titulo', ed })}
        <div${ed('pf:video.url')}>${video}</div>
      </section>`);
  }

  if (proyectos.length) {
    const kp = clave('proyectos', s.proyectos);
    const indice = proyectos.length > 1
      ? `<ol class="pf-indice">${proyectos.map((p, i) => `
          <li>
            <a class="pf-indice__item" href="#pf-caso-${i + 1}"${web ? ' data-scroll-interno' : ''}>
              <span class="pf-indice__num">${dosDigitos(i + 1)}</span>
              <span class="pf-indice__textos">
                ${p.categoria.trim() ? `<span class="pf-badge">${tituloSinCortes(p.categoria.trim())}</span>` : ''}
                <span class="pf-indice__titulo">${tituloSinCortes(p.titulo.trim() || 'Proyecto')}</span>
              </span>
              <svg class="pf-indice__flecha" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9M8.5 4l4 4-4 4"/></svg>
            </a>
          </li>`).join('')}</ol>`
      : '';
    const casos = proyectos.map((p, i) => {
      const { media, tiraExtras, imagenPrincipal } = proyectoMediaHTML(p, i, web, usaLightbox);
      const { tags, url } = proyectoTagsYLink(p);
      // Sin fotos, un afiche con el número gigante y el cliente (no repite la ficha); el
      // número entonces no va de nuevo en la ficha.
      const afiche = !imagenPrincipal;
      const pieAfiche = p.subtitulo.trim() || p.categoria.trim() || 'Proyecto';
      return `
        <article class="pf-caso${afiche ? ' pf-caso--afiche' : ''}" id="pf-caso-${i + 1}"${kp(p)}>
          <div class="pf-caso__media">${afiche
            ? `<div class="pf-caso__afiche" aria-hidden="true"><span class="pf-caso__afiche-num">${dosDigitos(i + 1)}</span><span class="pf-caso__afiche-pie">${esc(pieAfiche)}</span></div>`
            : `${media}${tiraExtras}`}</div>
          <div class="pf-caso__info">
            ${afiche ? '' : `<span class="pf-caso__num" aria-hidden="true">${dosDigitos(i + 1)}</span>`}
            ${p.categoria.trim() ? `<p class="pf-caso__cabecera"><span class="pf-badge"${kp(p, 'categoria')}>${tituloSinCortes(p.categoria.trim())}</span></p>` : ''}
            <h3 class="pf-caso__titulo"${kp(p, 'titulo')}>${p.titulo.trim() ? tituloSinCortes(p.titulo) : vacioHTML('Proyecto sin título')}</h3>
            ${p.subtitulo.trim() ? `<p class="pf-caso__sub"${kp(p, 'subtitulo')}>${esc(p.subtitulo.trim())}</p>` : ''}
            ${p.destacado.trim() ? `<p class="pf-caso__dato"${kp(p, 'destacado')}>${esc(p.destacado.trim())}</p>` : ''}
            ${p.descripcion.trim() ? `<p class="pf-caso__desc"${kp(p, 'descripcion')}>${esc(p.descripcion.trim()).replace(/\n/g, '<br>')}</p>` : ''}
            ${tags.length ? `<ul class="pf-caso__tags"${kp(p, 'tags')}>${tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
            ${url ? `<a class="pf-caso__link" href="${esc(url)}" target="_blank" rel="noopener" data-enlace-cliente><span>${esc(p.textoEnlace.trim() || 'Ver proyecto')}</span>${ICONO_EXTERNO}</a>` : ''}
          </div>
        </article>`;
    }).join('');
    sumar('sec-proyectos', 'Proyectos', `
      <section class="pf-sec pf-sec--proyectos" id="sec-proyectos">
        ${cabeceraHTML({ num: num(), titulo: 'Proyectos', claveTitulo: 'pf:lista:proyectos', ed })}
        ${indice}
        <div class="pf-casos">${casos}</div>
      </section>`);
  }

  if (galeria.length) {
    sumar('sec-galeria', 'Galería', `
      <section class="pf-sec pf-sec--galeria" id="sec-galeria">
        ${cabeceraHTML({ num: num(), titulo: op.galeriaTitulo?.trim() || 'Galería', claveTitulo: 'pf:opciones.galeriaTitulo', bajada: op.galeriaSubtitulo?.trim() || '', claveBajada: 'pf:opciones.galeriaSubtitulo', ed })}
        ${galeriaSeccionHTML(galeria, { ...op, galeriaSubtitulo: '' }, web, { editar: clave('galeria', s.galeria) })}
      </section>`);
  }

  if (servicios.length) {
    const ks = clave('serviciosWeb', s.serviciosWeb);
    const tarjetas = servicios.map((sw, i) => {
      const msg = `${saludo} Me interesa consultar por «${sw.titulo.trim() || 'tu servicio'}» que vi en tu página.`;
      const link = armarEnlaceWhatsApp(msg, e) || armarEnlaceEmail(`Consulta por ${sw.titulo.trim() || 'servicio'}`, msg, e);
      return `
        <article class="servicio-web-card pf-servicio"${ks(sw)}>
          ${sw.imagen ? `<div class="servicio-web-card__media"${lb ? ` data-lightbox-src="${esc(sw.imagen)}" data-lightbox-caption="${esc(sw.titulo || '')}"` : ''}><img src="${esc(sw.imagen)}" alt="${esc(sw.titulo || 'Servicio')}"></div>` : ''}
          <div class="pf-servicio__top">
            <span class="pf-servicio__num" aria-hidden="true">${dosDigitos(i + 1)}</span>
            ${sw.precio.trim() ? `<span class="pf-servicio__precio"${ks(sw, 'precio')}>${esc(sw.precio.trim())}</span>` : ''}
          </div>
          <h3 class="servicio-web-card__titulo pf-servicio__titulo"${ks(sw, 'titulo')}>${sw.titulo.trim() ? tituloSinCortes(sw.titulo) : vacioHTML('Servicio')}</h3>
          ${sw.descripcion.trim() ? `<p class="servicio-web-card__desc"${ks(sw, 'descripcion')}>${esc(sw.descripcion.trim()).replace(/\n/g, '<br>')}</p>` : ''}
          ${web ? (link
            ? `<a class="boton boton--secundario boton--chico servicio-web-card__cta" href="${esc(link)}" target="_blank" rel="noopener" data-enlace-cliente>${esc(sw.cta.trim() || 'Consultar')}</a>`
            : `<button type="button" class="boton boton--secundario boton--chico servicio-web-card__cta" data-accion="contacto-demo">${esc(sw.cta.trim() || 'Consultar')}</button>`) : ''}
        </article>`;
    }).join('');
    sumar('sec-servicios', 'Servicios', `
      <section class="pf-sec pf-sec--servicios" id="sec-servicios">
        ${cabeceraHTML({ num: num(), titulo: op.serviciosTitulo?.trim() || 'Servicios', claveTitulo: 'pf:opciones.serviciosTitulo', ed })}
        <div class="servicios-web-grilla">${tarjetas}</div>
      </section>`);
  }

  if (testimonios.length) {
    sumar('sec-testimonios', 'Testimonios', `
      <section class="pf-sec pf-sec--testimonios" id="sec-testimonios">
        ${cabeceraHTML({ num: num(), titulo: 'Lo que dicen mis clientes', claveTitulo: 'pf:lista:testimonios', ed })}
        ${testimoniosSeccionHTML(testimonios, web, usaLightbox, { editar: clave('testimonios', s.testimonios) })}
      </section>`);
  }

  if (faqs.length) {
    sumar('sec-faq', 'Preguntas', `
      <section class="pf-sec pf-sec--faq" id="sec-faq">
        ${cabeceraHTML({ num: num(), titulo: 'Preguntas frecuentes', claveTitulo: 'pf:lista:faqs', ed })}
        ${faqsSeccionHTML(faqs, web, { editar: clave('faqs', s.faqs) })}
      </section>`);
  }

  // ---------- Contacto ----------
  const datos = [];
  if (e.email.trim()) datos.push(['Email', web ? `<a href="mailto:${esc(e.email.trim())}" data-enlace-cliente>${esc(e.email.trim())}</a>` : esc(e.email.trim()), 'emisor.email']);
  if (e.telefono.trim()) datos.push(['Teléfono', esc(e.telefono.trim()), 'emisor.telefono']);
  if (e.web.trim()) {
    const url = /^https?:\/\//i.test(e.web.trim()) ? e.web.trim() : `https://${e.web.trim()}`;
    datos.push(['Web', web ? `<a href="${esc(url)}" target="_blank" rel="noopener" data-enlace-cliente>${esc(e.web.trim().replace(/^https?:\/\//i, ''))}</a>` : esc(e.web.trim()), 'emisor.web']);
  }
  const botones = [];
  if (web) {
    if (waUrl) botones.push(`<a class="boton boton--primario boton--grande" href="${esc(waUrl)}" target="_blank" rel="noopener" data-enlace-cliente>${esc(ctaLabel)} por WhatsApp</a>`);
    if (mailUrl) botones.push(`<a class="boton ${waUrl ? 'boton--secundario' : 'boton--primario'} boton--grande" href="${esc(mailUrl)}" data-enlace-cliente>${waUrl ? 'Escribir por email' : esc(ctaLabel)}</a>`);
    if (!botones.length) botones.push(`<button type="button" class="boton boton--primario boton--grande" data-accion="contacto-demo">${esc(ctaLabel)}</button>`);
  }
  const contacto = web || datos.length ? `
    <section class="pf-contacto" id="sec-contacto">
      <p class="pf-contacto__etiqueta">Contacto</p>
      <h2 class="pf-contacto__titulo"${ed('pf:portafolio.cierreTitulo')}>${tituloSinCortes(pf.cierreTitulo.trim() || '¿Trabajamos juntos?')}</h2>
      <p class="pf-contacto__texto"${ed('pf:portafolio.cierreTexto')}>${esc(pf.cierreTexto.trim() || 'Contame qué tenés en mente y armamos una propuesta a medida.')}</p>
      ${botones.length ? `<div class="pf-contacto__acciones">${botones.join('')}</div>` : ''}
      ${datos.length ? `<dl class="pf-contacto__datos">${datos.map(([t, v, k]) => `<div${ed(k)}><dt>${t}</dt><dd>${v}</dd></div>`).join('')}</dl>` : ''}
    </section>` : '';
  if (contacto) secciones.push({ id: 'sec-contacto', nav: 'Contacto', html: '' });

  const nav = web && op.barraNav !== false && secciones.length > 1
    ? `<nav class="doc-nav pf-nav" aria-label="Secciones de la página">
        <a class="doc-nav__marca" href="#sec-inicio" data-scroll-interno>${esc(nombre || pf.insignia.trim() || 'Inicio')}</a>
        <ul class="doc-nav__links">
          ${secciones.map(b => `<li><a class="doc-nav__link" href="#${esc(b.id)}" data-scroll-interno>${esc(b.nav)}</a></li>`).join('')}
        </ul>
      </nav>`
    : '';

  const pie = `
    <footer class="pie pf-pie">
      ${nombre ? `<span class="pie__nombre"${ed('emisor.nombre')}>${esc(nombre)}</span>` : ''}
      ${e.rol.trim() ? `<span${ed('emisor.rol')}>${esc(e.rol.trim())}</span>` : ''}
      ${op.credito ? creditoHTML('portafolio') : ''}
    </footer>`;

  const barraInferior = web ? `
    <div class="barra-cliente">
      <div>
        <span class="barra-cliente__etiqueta">${esc(pf.disponibilidad.trim() || 'Página profesional')}</span>
        <span class="barra-cliente__monto">${esc(nombre || pf.insignia.trim() || 'Portfolio')}</span>
        ${e.rol.trim() ? `<span class="barra-cliente__extra">${esc(e.rol.trim())}</span>` : ''}
      </div>
      ${botonCta('boton--primario')}
    </div>` : '';

  const vacio = secciones.filter(b => b.html).length
    ? ''
    : '<p class="doc-nota pf-vacio">Sumá tus proyectos, fotos y servicios desde el editor para armar tu página.</p>';

  return `
    ${portada}
    ${nav}
    <div class="pf-cuerpo">
      ${vacio}
      ${secciones.map(b => b.html).join('')}
    </div>
    ${contacto}
    ${pie}
    ${barraInferior}`;
};
