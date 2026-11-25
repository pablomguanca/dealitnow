// Plantillas de portfolio en «Mis portfolios»: cada tarjeta lleva una miniatura real de la
// página y «Vista previa» la abre entera, en el mismo diálogo que las plantillas de propuesta
// (galeria-plantillas.js). «Usar esta plantilla» crea el portfolio (crear-pf-rubro).

import { $, $$ } from '../lib/formato.js';
import { PLANTILLAS_PORTAFOLIO } from '../modelo.js';
import { aplicarTema } from '../lib/tema.js';
import { mostrarSinAnimar } from '../lib/render.js';
import { generarPortafolioHTML } from '../lib/render-portafolio.js';
import { normalizarPf } from './contexto.js';
import { escalarMiniatura, observadorTamano } from './galeria-plantillas.js';
import { registrarAcciones } from './acciones.js';

let miniaturasListas = false;

// Los IDs del documento ya existen en la app: en las copias se sacan para no repetirlos.
const sinIds = html => html.replace(/\sid="[^"]*"/g, '');

export const dibujarPortafolioPlantilla = (article, id) => {
  const tpl = PLANTILLAS_PORTAFOLIO[id];
  if (!article || !tpl) return;
  const datos = normalizarPf(tpl.crear());
  aplicarTema(article, datos.tema);
  article.classList.add('doc--portafolio');
  article.innerHTML = sinIds(generarPortafolioHTML(datos, {
    web: true,
    tipoPortada: article.dataset.portada || 'editorial'
  }));
  mostrarSinAnimar(article);
};

// Se dibujan la primera vez que se ve el panel, de a una para no trabar la pantalla.
export const dibujarMiniaturasPortafolio = () => {
  if (miniaturasListas) return;
  const lienzos = $$('#portafolios .plantilla-card__lienzo');
  if (!lienzos.length) return;
  miniaturasListas = true;
  lienzos.forEach(lienzo => {
    escalarMiniatura(lienzo);
    observadorTamano?.observe(lienzo);
  });
  $$('#portafolios [data-miniatura-pf]').forEach((article, i) => {
    setTimeout(() => dibujarPortafolioPlantilla(article, article.dataset.miniaturaPf), 60 * i);
  });
};

const verPlantillaPortafolio = id => {
  const tpl = PLANTILLAS_PORTAFOLIO[id];
  const dialogo = $('#dialogo-plantilla-vista');
  if (!tpl || !dialogo) return;
  $('#plantilla-vista-titulo').textContent = tpl.nombre;
  $('#plantilla-vista-rubro').textContent = tpl.rubro;
  // El botón del diálogo crea un portfolio (no una propuesta) con esta plantilla.
  const usar = $('#plantilla-vista-usar');
  usar.dataset.accion = 'crear-pf-rubro';
  usar.dataset.rubro = id;
  dialogo.showModal();
  const lienzo = $('#plantilla-vista-documento');
  lienzo.scrollTop = 0;
  dibujarPortafolioPlantilla(lienzo.querySelector('article'), id);
};

export const instalarGaleriaPortafolios = () => {
  registrarAcciones({
    'ver-plantilla-pf': boton => verPlantillaPortafolio(boton.dataset.id)
  });
};
