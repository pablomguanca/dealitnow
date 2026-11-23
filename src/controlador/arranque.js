// Arranque de una cuenta sin propuestas (panel vacío, ProposalsPanel.jsx): como la bienvenida
// sin cuenta (bienvenida.js), primero el rubro y después «¿Cómo querés arrancar?»: con la IA
// (abre el dictado) o editando el ejemplo del rubro (crea la propuesta con esa plantilla).
// La guía de primeros pasos (guia.js) acompaña esa primera propuesta, la arme como la arme.

import { $, esc } from '../lib/formato.js';
import { PLANTILLAS } from '../modelo.js';
import { registrarAcciones, ejecutarAccion } from './acciones.js';
import { normalizar } from './contexto.js';
import { avisarExito } from './avisos.js';
import { restriccionesActivas } from './plan.js';
import { emisorDeCuenta } from './cuenta.js';
import { nuevaPropuesta } from './propuestas.js';

let rubroElegido = null;

// Los mismos rubros que la bienvenida, con «Empezar en blanco» al final.
export const pintarRubrosArranque = () => {
  const el = $('#arranque-rubros');
  if (!el || el.childElementCount) return;
  el.innerHTML = Object.entries(PLANTILLAS)
    .filter(([id, p]) => id !== 'en-blanco' && !p.catalogo)
    .map(([id, p]) => `<button type="button" class="arranque__rubro" data-accion="arranque-rubro" data-id="${esc(id)}">${esc(p.rubro)}</button>`)
    .join('') + '<button type="button" class="arranque__rubro arranque__rubro--blanco" data-accion="arranque-rubro" data-id="en-blanco">Empezar en blanco</button>';
};

const mostrarPaso = como => {
  $('#arranque-rubros-paso').hidden = como;
  $('#arranque-como').hidden = !como;
};

// Diseño gratis para el ejemplo de un rubro PRO cuando la cuenta no puede usarlo.
const DISENO_GRATIS = 'diseno-web';

// Crea la primera propuesta con el ejemplo del rubro. Si la plantilla es PRO y la cuenta es
// Gratis (con los planes activos), trae igual los textos, servicios y precios del rubro, pero
// con un diseño gratis: la primera propuesta no puede arrancar con el cartel de Pro.
const editarEjemplo = () => {
  if (rubroElegido === 'en-blanco') {
    ejecutarAccion('nueva');
    return;
  }
  const tpl = PLANTILLAS[rubroElegido];
  if (!tpl) return;
  const datos = normalizar(tpl.crear());
  if (tpl.plan === 'pro' && restriccionesActivas()) {
    datos.tema = normalizar(PLANTILLAS[DISENO_GRATIS].crear()).tema;
  } else {
    datos.plantilla = rubroElegido;
  }
  datos.emisor = emisorDeCuenta(datos.emisor);
  nuevaPropuesta(datos);
  avisarExito('Tu propuesta de ejemplo está lista. Cambiá los datos por los de tu trabajo.');
};

const elegirRubro = id => {
  const tpl = PLANTILLAS[id];
  if (!tpl) return;
  rubroElegido = id;
  // Sin la IA configurada en el servidor no hay nada que elegir: va directo al ejemplo.
  if (!document.body.classList.contains('ia-disponible')) {
    editarEjemplo();
    return;
  }
  const enBlanco = id === 'en-blanco';
  $('#arranque-rubro').textContent = enBlanco ? 'empezar en blanco' : tpl.rubro;
  $('#arranque-ejemplo-titulo').textContent = enBlanco ? 'Completarla yo' : `Editar el ejemplo de ${tpl.rubro}`;
  $('#arranque-ejemplo-detalle').textContent = enBlanco
    ? 'Arrancás con la propuesta vacía y la completás paso a paso.'
    : 'Una propuesta ya armada de tu rubro: cambiás el cliente, los servicios y los precios.';
  mostrarPaso(true);
  $('[data-accion="arranque-ia"]')?.focus();
};

export const instalarArranque = () => {
  pintarRubrosArranque();
  registrarAcciones({
    'arranque-rubro': boton => elegirRubro(boton.dataset.id),
    'arranque-volver': () => {
      mostrarPaso(false);
      $(`[data-accion="arranque-rubro"][data-id="${rubroElegido}"]`)?.focus();
    },
    'arranque-ia': () => {
      mostrarPaso(false);
      ejecutarAccion('abrir-ia');
    },
    'arranque-ejemplo': () => {
      mostrarPaso(false);
      editarEjemplo();
    }
  });
};
