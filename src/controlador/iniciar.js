// Arranque de la app del dueño: conecta cada módulo con la interfaz ya renderizada por
// React y decide qué mostrar (panel, editor o editor sin cuenta). Los links de cliente
// arrancan por iniciar-cliente.js (ver src/main.jsx).

import { AteneaDB, AteneaDBError } from '../firebase.js';
import { usarBase, PREFIJO, PREFIJO_PORTAFOLIO } from './contexto.js';
import { instalarAcciones } from './acciones.js';
import { instalarNavegacion } from './navegacion.js';
import { instalarHoja } from './hoja.js';
import { instalarVista } from './vista.js';
import { instalarGuardado } from './guardado.js';
import { instalarFormulario } from './formulario.js';
import { instalarDiseno } from './diseno.js';
import { instalarSubidas } from './subidas.js';
import { instalarVersiones } from './versiones.js';
import { instalarDocumento } from './documento.js';
import { instalarCompartir } from './compartir.js';
import { instalarAceptar } from './aceptar.js';
import { instalarPropuestas } from './propuestas.js';
import { instalarGaleriaPlantillas } from './galeria-plantillas.js';
import { instalarPortafolios } from './portafolios.js';
import { instalarCuenta } from './cuenta.js';
import { instalarPlan } from './plan.js';
import { instalarSesion, arrancarSesion } from './sesion.js';

export { registrarNavegadorReact } from './navegacion.js';

let controladorIniciado = false;

export const inicializarControladorDealit = () => {
  if (controladorIniciado) return;
  controladorIniciado = true;
  usarBase(AteneaDB, AteneaDBError);

  // El orden importa solo entre oyentes del mismo evento: la navegación cierra el
  // menú antes de que se despache la acción del clic.
  instalarGuardado();
  instalarDiseno();
  instalarFormulario();
  instalarSubidas();
  instalarVersiones();
  instalarDocumento();
  instalarCompartir();
  instalarAceptar();
  instalarNavegacion();
  instalarHoja();
  instalarVista();
  instalarAcciones();
  instalarPropuestas();
  instalarGaleriaPlantillas();
  instalarPortafolios();
  instalarCuenta();
  instalarPlan();
  instalarSesion();

  if (!AteneaDB) document.body.classList.remove('auth-cargando');
  arrancarSesion();

  // Si pegan un link largo de cliente en esta pestaña, se recarga para abrirlo como cliente.
  window.addEventListener('hashchange', () => {
    if (location.hash.startsWith(PREFIJO) || location.hash.startsWith(PREFIJO_PORTAFOLIO)) location.reload();
  });
};
