// Pestaña «Plantillas» del panel: catálogo con una miniatura real de cada plantilla,
// vista previa completa y «Usar plantilla», que crea una propuesta nueva a partir de ella.

import { $, $$, esc } from '../lib/formato.js';
import { PLANTILLAS } from '../modelo.js';
import { aplicarTema } from '../lib/tema.js';
import { generarPropuestaHTML, mostrarSinAnimar } from '../lib/render.js';
import { normalizar } from './contexto.js';
import { disenoProPermitido } from './plan.js';
import { registrarAcciones } from './acciones.js';
import { avisarExito } from './avisos.js';
import { nuevaPropuesta } from './propuestas.js';
import { emisorDeCuenta } from './cuenta.js';

let galeriaLista = false;

// Categorías del catálogo (cada plantilla en una). «Gratis» y «PRO» filtran por plan.
const CATEGORIAS = [
  { id: 'todas', nombre: 'Todas' },
  { id: 'diseno-tech', nombre: 'Diseño & Tech', ids: ['diseno-web', 'software-saas', 'ux-ui-producto', 'web-pymes', 'ecommerce-performance'] },
  { id: 'marketing', nombre: 'Marketing & Contenido', ids: ['marketing-redes', 'redaccion-contenidos', 'audiovisual-eventos'] },
  { id: 'profesionales', nombre: 'Profesionales', ids: ['consultoria-b2b', 'estudio-juridico', 'contable-impositivo', 'traduccion-idiomas'] },
  { id: 'oficios', nombre: 'Oficios & Obra', ids: ['oficios-reformas', 'arquitectura-interiorismo', 'paisajismo-jardines', 'presupuesto'] },
  { id: 'eventos', nombre: 'Eventos & Bienestar', ids: ['fotografia-bodas', 'eventos-dj', 'gastronomia-eventos', 'salud-nutricion', 'fitness-entrenamiento', 'coaching-capacitacion'] },
  { id: 'real-estate', nombre: 'Real Estate', ids: ['inmobiliaria-lanzamiento'] },
  { id: 'gratis', nombre: 'Gratis' },
  { id: 'pro', nombre: 'PRO' }
];

// Palabras con las que alguien busca su rubro, además del nombre y la descripción.
const CLAVES = {
  'en-blanco': 'vacia cero libre cualquier',
  'diseno-web': 'disenador disenadora branding logo identidad tienda marca grafico',
  'software-saas': 'programador desarrollador sistema app aplicacion plataforma',
  'marketing-redes': 'community manager redes instagram tiktok ads publicidad agencia',
  'arquitectura-interiorismo': 'arquitecto arquitecta interiorista reforma obra casa',
  'consultoria-b2b': 'consultor consultora procesos empresa estrategia',
  'audiovisual-eventos': 'video filmmaker camarografo fotografo produccion',
  'gastronomia-eventos': 'catering chef cocina comida evento',
  'coaching-capacitacion': 'coach taller capacitacion curso mentoria',
  'presupuesto': 'presupuesto oficio cualquier rubro tabla trabajos',
  'oficios-reformas': 'albanil plomero gasista electricista pintor obra refaccion construccion bano cocina',
  'fotografia-bodas': 'fotografo fotografa casamiento boda novios fiesta',
  'estudio-juridico': 'abogado abogada estudio legal juridico contrato sociedad sas',
  'contable-impositivo': 'contador contadora monotributo impuestos arca afip sueldos balance',
  'ux-ui-producto': 'disenador ux ui figma producto app experiencia',
  'ecommerce-performance': 'tienda nube shopify ads meta google ventas online',
  'eventos-dj': 'dj sonido iluminacion fiesta musica casamiento',
  'salud-nutricion': 'nutricionista nutricion medico kinesiologo bienestar salud',
  'fitness-entrenamiento': 'personal trainer entrenador gimnasio running deporte',
  'redaccion-contenidos': 'redactor redactora copywriter seo blog textos contenido',
  'inmobiliaria-lanzamiento': 'inmobiliaria desarrollista departamentos edificio propiedades',
  'paisajismo-jardines': 'jardinero paisajista jardin parque riego',
  'web-pymes': 'programador wordpress pagina web sitio pyme',
  'traduccion-idiomas': 'traductor traductora interprete ingles portugues idiomas'
};

// Sin tildes ni mayúsculas, para que «abogacía» y «abogacia» den lo mismo.
const normalizarBusqueda = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const categoriaDe = id => CATEGORIAS.find(c => c.ids?.includes(id))?.id || '';

const coincide = (id, tpl, categoria, busqueda) => {
  if (categoria === 'gratis' && tpl.plan !== 'gratis') return false;
  if (categoria === 'pro' && tpl.plan !== 'pro') return false;
  if (!['todas', 'gratis', 'pro'].includes(categoria) && categoriaDe(id) !== categoria) return false;
  if (!busqueda) return true;
  const texto = normalizarBusqueda(`${tpl.nombre} ${tpl.rubro} ${tpl.desc} ${CLAVES[id] || ''}`);
  return normalizarBusqueda(busqueda).split(/\s+/).filter(Boolean).every(p => texto.includes(p));
};

let categoriaActiva = 'todas';

const filtrarGaleria = () => {
  const galeria = $('#galeria-plantillas');
  if (!galeria) return;
  const busqueda = $('#plantillas-buscar')?.value.trim() || '';
  let visibles = 0;
  galeria.querySelectorAll('.plantilla-card').forEach(li => {
    const id = li.dataset.id;
    const ok = coincide(id, PLANTILLAS[id], categoriaActiva, busqueda);
    li.hidden = !ok;
    if (ok) visibles++;
  });
  $$('#plantillas-categorias [data-categoria]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.categoria === categoriaActiva)));
  const vacio = $('#plantillas-vacio');
  if (vacio) {
    vacio.hidden = visibles > 0;
    vacio.textContent = busqueda
      ? `No encontramos plantillas para «${busqueda}». Probá con otra palabra o arrancá con «En blanco».`
      : 'No hay plantillas en esta categoría.';
  }
};

const chipsHTML = () => CATEGORIAS.map(c => {
  const total = Object.entries(PLANTILLAS).filter(([id, tpl]) => coincide(id, tpl, c.id, '')).length;
  return `<button type="button" class="galeria-chip${c.id === 'pro' ? ' galeria-chip--pro' : ''}" data-categoria="${esc(c.id)}" aria-pressed="${c.id === categoriaActiva}">${esc(c.nombre)} <span class="galeria-chip__cuenta">${total}</span></button>`;
}).join('');

// La miniatura es el documento real a ANCHO_MINIATURA px, reducido al ancho de su tarjeta.
const ANCHO_MINIATURA = 1100;
const escalarMiniatura = lienzo => {
  const article = lienzo.querySelector('.doc--miniatura');
  if (article) article.style.transform = `scale(${lienzo.clientWidth / ANCHO_MINIATURA})`;
};
const observadorTamano = typeof ResizeObserver === 'function'
  ? new ResizeObserver(entradas => entradas.forEach(e => escalarMiniatura(e.target)))
  : null;

// Los IDs del documento ya existen en el editor: en las copias se sacan para no repetirlos.
const sinIds = html => html.replace(/\sid="[^"]*"/g, '');

const dibujarPlantilla = (article, id) => {
  const datos = normalizar(PLANTILLAS[id].crear());
  aplicarTema(article, datos.tema);
  article.innerHTML = sinIds(generarPropuestaHTML(datos, {
    web: true,
    seleccion: new Set(),
    compartida: null,
    tipoDecoracion: article.dataset.decoracion || 'marco',
    tipoPortada: article.dataset.portada || 'editorial'
  }));
  mostrarSinAnimar(article);
};

const tarjetaHTML = ([id, tpl]) => `
  <li class="plantilla-card" data-id="${esc(id)}">
    <div class="plantilla-card__lienzo" inert aria-hidden="true">
      <article class="doc doc--web doc--estatico doc--miniatura" data-miniatura="${esc(id)}"></article>
    </div>
    <button type="button" class="plantilla-card__ver" data-accion="ver-plantilla" data-id="${esc(id)}" aria-label="Ver la plantilla «${esc(tpl.nombre)}»"></button>
    <div class="plantilla-card__info">
      <span class="plantilla-card__rubro">${esc(tpl.rubro)}${tpl.plan === 'pro' ? ' <em class="insignia-pro">PRO</em>' : ''}${tpl.catalogo ? ' <em class="insignia-nueva">Nueva</em>' : ''}</span>
      <h3 class="plantilla-card__nombre">${esc(tpl.nombre)}</h3>
      <p class="plantilla-card__desc">${esc(tpl.desc)}</p>
      <div class="plantilla-card__acciones">
        <button type="button" class="boton boton--primario boton--chico" data-accion="usar-plantilla" data-id="${esc(id)}">Usar plantilla</button>
        <button type="button" class="boton boton--texto boton--chico" data-accion="ver-plantilla" data-id="${esc(id)}">Vista previa</button>
      </div>
    </div>
  </li>`;

// Se arma la primera vez que se abre la pestaña. Las miniaturas se dibujan de a una
// para no trabar la pantalla.
export const renderGaleriaPlantillas = () => {
  if (galeriaLista) return;
  const galeria = $('#galeria-plantillas');
  if (!galeria) return;
  galeriaLista = true;
  const ordenadas = Object.entries(PLANTILLAS).sort(([, a], [, b]) => (a.plan === 'gratis' ? 0 : 1) - (b.plan === 'gratis' ? 0 : 1));
  galeria.innerHTML = ordenadas.map(tarjetaHTML).join('');
  const chips = $('#plantillas-categorias');
  if (chips) chips.innerHTML = chipsHTML();
  filtrarGaleria();
  galeria.querySelectorAll('.plantilla-card__lienzo').forEach(lienzo => {
    escalarMiniatura(lienzo);
    observadorTamano?.observe(lienzo);
  });
  [...galeria.querySelectorAll('[data-miniatura]')].forEach((article, i) => {
    setTimeout(() => dibujarPlantilla(article, article.dataset.miniatura), 60 * i);
  });
};

const verPlantilla = id => {
  const tpl = PLANTILLAS[id];
  if (!tpl) return;
  $('#plantilla-vista-titulo').textContent = tpl.nombre;
  $('#plantilla-vista-rubro').textContent = tpl.rubro;
  $('#plantilla-vista-usar').dataset.id = id;
  const dialogo = $('#dialogo-plantilla-vista');
  dialogo.showModal();
  const lienzo = $('#plantilla-vista-documento');
  lienzo.scrollTop = 0;
  dibujarPlantilla(lienzo.querySelector('article'), id);
};

// La plantilla aporta textos, servicios y diseño; los datos del negocio salen de Mi cuenta.
const usarPlantilla = async id => {
  const tpl = PLANTILLAS[id];
  if (!tpl) return;
  if (tpl.plan === 'pro' && !(await disenoProPermitido(tpl.nombre))) return;
  const datos = normalizar(tpl.crear());
  datos.plantilla = id;
  datos.emisor = emisorDeCuenta(datos.emisor);
  $('#dialogo-plantilla-vista')?.close();
  nuevaPropuesta(datos);
  avisarExito(`Plantilla «${tpl.nombre}» lista. Cambiá los datos por los de tu proyecto.`);
};

export const instalarGaleriaPlantillas = () => {
  $('#plantillas-categorias')?.addEventListener('click', ev => {
    const chip = ev.target.closest('[data-categoria]');
    if (!chip) return;
    categoriaActiva = chip.dataset.categoria;
    filtrarGaleria();
  });
  $('#plantillas-buscar')?.addEventListener('input', () => filtrarGaleria());
  registrarAcciones({
    'ver-plantilla': boton => verPlantilla(boton.dataset.id),
    'usar-plantilla': boton => usarPlantilla(boton.dataset.id)
  });
};
