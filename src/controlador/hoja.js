// Editor en celular: el documento queda siempre a la vista y el editor es una hoja que
// sube desde abajo, con tres alturas (solo la barra, media pantalla o casi completa) y una
// barra de secciones para saltar a cada paso. En escritorio no cambia nada.

import { $, $$, esc } from '../lib/formato.js';
import { registrarAcciones } from './acciones.js';

const ALTURAS = ['cerrada', 'media', 'completa'];
const ETIQUETAS = {
  cerrada: 'Abrir el editor',
  media: 'Agrandar el editor',
  completa: 'Achicar el editor'
};

let altura = 'media';

const esCelular = () => typeof matchMedia === 'function' && matchMedia('(max-width: 900px)').matches;

export const fijarHoja = nueva => {
  if (!ALTURAS.includes(nueva)) return;
  altura = nueva;
  document.body.dataset.hoja = nueva;
  $('#hoja-asa')?.setAttribute('aria-label', ETIQUETAS[nueva]);
  $('#hoja-asa')?.setAttribute('aria-expanded', String(nueva !== 'cerrada'));
};

const mover = pasos => fijarHoja(ALTURAS[Math.max(0, Math.min(ALTURAS.length - 1, ALTURAS.indexOf(altura) + pasos))]);

// Reemplaza a las viejas pestañas «Editar / Vista previa»: en celular, ver la vista previa
// es bajar la hoja; en escritorio el editor y el documento ya están lado a lado.
export const cambiarPestana = previa => {
  if (esCelular()) fijarHoja(previa ? 'cerrada' : 'media');
};

const pasosVisibles = () => $$('#formulario details.paso[data-corto]').filter(d => !d.closest('[hidden]'));

// Se rehace al cambiar entre propuesta y portfolio (cada uno tiene sus pasos).
export const actualizarSeccionesHoja = () => {
  const nav = $('#hoja-secciones');
  if (!nav) return;
  nav.innerHTML = pasosVisibles()
    .map((d, i) => `<button type="button" class="hoja__seccion" data-accion="hoja-seccion" data-indice="${i}">${esc(d.dataset.corto)}</button>`)
    .join('');
};

const irASeccion = (indice, boton) => {
  const paso = pasosVisibles()[indice];
  if (!paso) return;
  if (altura === 'cerrada') fijarHoja('media');
  paso.open = true;
  $$('.hoja__seccion').forEach(b => b.setAttribute('aria-current', String(b === boton)));
  boton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  const cuerpo = $('#editor-cuerpo');
  const destino = paso.getBoundingClientRect().top - cuerpo.getBoundingClientRect().top + cuerpo.scrollTop;
  cuerpo.scrollTo({ top: destino, behavior: 'smooth' });
};

export const instalarHoja = () => {
  fijarHoja(altura);

  // Arrastrar la cabecera sube o baja la hoja; un toque en la manija la abre o la cierra.
  const cabecera = $('#hoja-cabecera');
  const asa = $('#hoja-asa');
  let inicio = null;
  let arrastro = false;
  cabecera?.addEventListener('pointerdown', ev => {
    if (ev.target.closest('.hoja__seccion')) return;
    inicio = ev.clientY;
    arrastro = false;
  });
  cabecera?.addEventListener('pointermove', ev => {
    if (inicio !== null && Math.abs(ev.clientY - inicio) > 8) arrastro = true;
  });
  const soltar = ev => {
    if (inicio === null) return;
    const recorrido = ev.clientY - inicio;
    inicio = null;
    if (!arrastro) return;
    // Hacia arriba agranda, hacia abajo achica; un tirón largo salta dos alturas.
    mover((recorrido < 0 ? 1 : -1) * (Math.abs(recorrido) > 220 ? 2 : 1));
  };
  cabecera?.addEventListener('pointerup', soltar);
  cabecera?.addEventListener('pointercancel', () => { inicio = null; });
  asa?.addEventListener('click', () => {
    if (arrastro) {
      arrastro = false;
      return;
    }
    fijarHoja(altura === 'media' ? 'completa' : 'media');
  });

  registrarAcciones({
    'hoja-seccion': boton => irASeccion(Number(boton.dataset.indice), boton)
  });
};
