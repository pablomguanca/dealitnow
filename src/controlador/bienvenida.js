// Bienvenida (components/auth/Bienvenida.jsx): la ve quien abre Dealit sin cuenta y todavía
// no armó nada. En lugar de caer siempre en la misma propuesta de ejemplo, elige su rubro y
// arranca con la plantilla de ese rubro (o en blanco).

import { $, esc } from '../lib/formato.js';
import { PLANTILLAS } from '../modelo.js';
import { ctx, normalizar } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { volverAEditorPropuestaInvitado } from './propuestas.js';

export const mostrarBienvenida = () => {
  const el = $('#bienvenida');
  if (!el) return;
  // Los rubros y, al final, «En blanco» como una opción más.
  $('#bienvenida-rubros').innerHTML = Object.entries(PLANTILLAS)
    .filter(([id]) => id !== 'en-blanco')
    .map(([id, p]) => `<button type="button" class="bienvenida__rubro" data-accion="bienvenida-rubro" data-id="${esc(id)}">${esc(p.rubro)}</button>`)
    .join('') + '<button type="button" class="bienvenida__rubro bienvenida__rubro--blanco" data-accion="bienvenida-rubro" data-id="en-blanco">Empezar en blanco</button>';
  el.hidden = false;
  document.body.classList.add('bienvenida-activa');
};

export const ocultarBienvenida = () => {
  const el = $('#bienvenida');
  if (!el || el.hidden) return;
  el.hidden = true;
  document.body.classList.remove('bienvenida-activa');
};

const elegirRubro = id => {
  const tpl = PLANTILLAS[id];
  if (!tpl) return;
  const base = normalizar(tpl.crear());
  if (id !== 'en-blanco') base.plantilla = id;
  ocultarBienvenida();
  if (ctx.invitado) volverAEditorPropuestaInvitado(base);
};

export const instalarBienvenida = () => {
  registrarAcciones({
    'bienvenida-rubro': boton => elegirRubro(boton.dataset.id)
  });
};
