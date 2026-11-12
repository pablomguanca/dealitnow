// Arranque de la vista del cliente (/p/<id>, /portafolio/<id>, #p=…, #f=…). Carga solo
// lo necesario para ver, sumar opcionales y aceptar: nada del editor ni del panel.

import { AteneaDB, AteneaDBError } from '../firebase-publico.js';
import { usarBase } from './contexto.js';
import { instalarAcciones } from './acciones.js';
import { instalarVista } from './vista.js';
import { instalarVideos } from './video.js';
import { instalarAceptar } from './aceptar.js';
import { iniciarVistaCliente } from './cliente.js';
import { tipoLinkCliente } from '../lib/links-cliente.js';

let iniciado = false;

export const inicializarVistaCliente = () => {
  if (iniciado) return;
  iniciado = true;
  usarBase(AteneaDB, AteneaDBError);
  instalarVista();
  instalarVideos();
  instalarAceptar();
  instalarAcciones();
  document.body.classList.remove('auth-cargando');
  iniciarVistaCliente(tipoLinkCliente());

  // Otro link largo en la misma pestaña: se abre de cero.
  window.addEventListener('hashchange', () => location.reload());
};
