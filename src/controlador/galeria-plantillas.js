// Pestaña «Plantillas» del panel: catálogo con una miniatura real de cada plantilla,
// vista previa completa y «Usar plantilla», que crea una propuesta nueva a partir de ella.

import { $, esc } from '../lib/formato.js';
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
  <li class="plantilla-card">
    <div class="plantilla-card__lienzo" inert aria-hidden="true">
      <article class="doc doc--web doc--estatico doc--miniatura" data-miniatura="${esc(id)}"></article>
    </div>
    <button type="button" class="plantilla-card__ver" data-accion="ver-plantilla" data-id="${esc(id)}" aria-label="Ver la plantilla «${esc(tpl.nombre)}»"></button>
    <div class="plantilla-card__info">
      <span class="plantilla-card__rubro">${esc(tpl.rubro)}${tpl.plan === 'pro' ? ' <em class="insignia-pro">PRO</em>' : ''}</span>
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
  galeria.innerHTML = Object.entries(PLANTILLAS).map(tarjetaHTML).join('');
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
  registrarAcciones({
    'ver-plantilla': boton => verPlantilla(boton.dataset.id),
    'usar-plantilla': boton => usarPlantilla(boton.dataset.id)
  });
};
