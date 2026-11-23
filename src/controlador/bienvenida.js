// Bienvenida (components/auth/Bienvenida.jsx): la ve quien abre Dealit sin cuenta y todavía
// no armó nada. En lugar de caer siempre en la misma propuesta de ejemplo, elige su rubro y
// arranca con la plantilla de ese rubro (o en blanco).

import { $, esc } from '../lib/formato.js';
import { PLANTILLAS } from '../modelo.js';
import { ctx, normalizar } from './contexto.js';
import { registrarAcciones, ejecutarAccion } from './acciones.js';
import { volverAEditorPropuestaInvitado } from './propuestas.js';
import { empezarGuia } from './guia.js';

export const mostrarBienvenida = () => {
  const el = $('#bienvenida');
  if (!el) return;
  // Los rubros y, al final, «En blanco» como una opción más.
  $('#bienvenida-rubros').innerHTML = Object.entries(PLANTILLAS)
    .filter(([id, p]) => id !== 'en-blanco' && !p.catalogo)
    .map(([id, p]) => `<button type="button" class="bienvenida__rubro" data-accion="bienvenida-rubro" data-id="${esc(id)}">${esc(p.rubro)}</button>`)
    .join('') + '<button type="button" class="bienvenida__rubro bienvenida__rubro--blanco" data-accion="bienvenida-rubro" data-id="en-blanco">Empezar en blanco</button>';
  el.classList.remove('bienvenida--arranque');
  el.hidden = false;
  document.body.classList.add('bienvenida-activa');
};

export const ocultarBienvenida = () => {
  const el = $('#bienvenida');
  if (!el || el.hidden) return;
  el.hidden = true;
  el.classList.remove('bienvenida--arranque');
  document.body.classList.remove('bienvenida-activa');
};

let rubroElegido = null;

// Elegir el rubro no abre el editor todavía: pregunta cómo quiere arrancar.
const elegirRubro = id => {
  const tpl = PLANTILLAS[id];
  if (!tpl) return;
  rubroElegido = id;
  const enBlanco = id === 'en-blanco';
  $('#bienvenida-arranque-rubro').textContent = enBlanco ? 'empezar en blanco' : tpl.rubro;
  $('#bienvenida-ejemplo-titulo').textContent = enBlanco ? 'Completarla yo' : `Editar el ejemplo de ${tpl.rubro}`;
  $('#bienvenida-ejemplo-detalle').textContent = enBlanco
    ? 'Arrancás con la propuesta vacía y la completás paso a paso.'
    : 'Una propuesta ya armada de tu rubro: cambiás el cliente, los servicios y los precios.';
  $('#bienvenida').classList.add('bienvenida--arranque');
  $('#bienvenida').scrollTop = 0;
  $('[data-accion="bienvenida-ia"]')?.focus();
};

// Abre el editor con la plantilla del rubro y la guía de primeros pasos desde cero.
const cargarRubro = () => {
  const tpl = PLANTILLAS[rubroElegido];
  if (!tpl) return false;
  const base = normalizar(tpl.crear());
  if (rubroElegido !== 'en-blanco') base.plantilla = rubroElegido;
  ocultarBienvenida();
  if (ctx.invitado) {
    volverAEditorPropuestaInvitado(base);
    empezarGuia({ nueva: true });
  }
  return true;
};

export const instalarBienvenida = () => {
  registrarAcciones({
    'bienvenida-rubro': boton => elegirRubro(boton.dataset.id),
    'bienvenida-volver': () => {
      $('#bienvenida').classList.remove('bienvenida--arranque');
      $(`[data-accion="bienvenida-rubro"][data-id="${rubroElegido}"]`)?.focus();
    },
    'bienvenida-ejemplo': () => cargarRubro(),
    // Con la IA: el editor queda con el ejemplo detrás (si cierra el login, sigue desde ahí)
    // y se abre el registro; al crear la cuenta entra directo al dictado (continuar: 'ia').
    'bienvenida-ia': () => {
      if (cargarRubro()) ejecutarAccion('abrir-ia');
    }
  });
};
