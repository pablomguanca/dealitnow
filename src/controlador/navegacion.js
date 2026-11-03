// Navegación entre vistas (panel, portfolios, cuenta, editor), rutas e historial,
// menú principal, pestañas Editar/Vista previa y visor de imágenes.

import { $, $$ } from '../lib/formato.js';
import { ctx, nube } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar } from './avisos.js';
import { esModoOscuro, guardarModoApp, seguirModoDelSistema } from '../lib/modo-app.js';
import { hayCambiosSinEnviar, guardarAhora } from './guardado.js';
import { irAlPanel, abrirPropuesta, volverAEditorPropuestaInvitado } from './propuestas.js';
import { irAPortafolios, abrirPortafolio } from './portafolios.js';
import { irACuenta } from './cuenta.js';

let navegarReactRouter = null;

export const registrarNavegadorReact = fn => {
  navegarReactRouter = fn;
};

export const irRuta = (ruta, { reemplazar = false } = {}) => {
  if (typeof navegarReactRouter === 'function') {
    try {
      navegarReactRouter(ruta, { replace: reemplazar });
      return;
    } catch { }
  }
  try {
    if (reemplazar) history.replaceState(null, '', ruta);
    else history.pushState(null, '', ruta);
  } catch { }
};

const RUTA_EDITAR_PROPUESTA = /^\/propuesta\/([^/]+)\/?$/;
const RUTA_EDITAR_PORTAFOLIO = /^\/editar-portafolio\/([^/]+)\/?$/;

export const idEnUrl = () => {
  const m = location.pathname.match(RUTA_EDITAR_PROPUESTA);
  if (m) return decodeURIComponent(m[1]);
  return new URLSearchParams(location.search).get('propuesta');
};
export const idPortafolioEnUrl = () => {
  const m = location.pathname.match(RUTA_EDITAR_PORTAFOLIO);
  if (m) return decodeURIComponent(m[1]);
  return new URLSearchParams(location.search).get('portafolio');
};
export const seccionEnUrl = () => {
  if (location.pathname === '/plantillas' || location.pathname === '/plantillas/') return 'plantillas';
  if (location.pathname === '/portafolios' || location.pathname === '/portafolios/') return 'portafolios';
  if (location.pathname === '/cuenta' || location.pathname === '/cuenta/') return 'cuenta';
  return new URLSearchParams(location.search).get('seccion');
};

// Un clic común abre en esta pestaña; con Ctrl, Cmd o la rueda, el navegador abre una nueva.
export const clicComun = ev => ev.button === 0 && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey && !ev.altKey;

export const abrirMenu = abrir => {
  const panelMenu = $('#menu-panel');
  const botonMenu = $('[data-accion="menu"]');
  if (!panelMenu || !botonMenu) return;
  panelMenu.hidden = !abrir;
  const veloMenu = $('#menu-velo');
  if (veloMenu) veloMenu.hidden = !abrir;
  botonMenu.setAttribute('aria-expanded', String(abrir));
  document.body.classList.toggle('menu-abierto', abrir);
};

const menuAbierto = () => {
  const panelMenu = $('#menu-panel');
  return !!panelMenu && !panelMenu.hidden;
};

// En celular, «vista previa» es bajar la hoja del editor (ver hoja.js).
export { cambiarPestana } from './hoja.js';

// Vistas: 'panel' (Mis propuestas), 'portafolios' (Mis portfolios), 'cuenta' (Mi cuenta) y 'editor'.
const TITULOS_VISTA = {
  panel: 'Mis propuestas | Dealit',
  portafolios: 'Mis portfolios | Dealit',
  cuenta: 'Mi cuenta | Dealit'
};
export const mostrarVista = vista => {
  const inicio = vista !== 'editor';
  document.body.classList.toggle('vista-inicio', inicio);
  document.body.classList.toggle('vista-panel', vista === 'panel');
  document.body.classList.toggle('vista-portafolios', vista === 'portafolios');
  document.body.classList.toggle('vista-cuenta', vista === 'cuenta');
  $('#panel').hidden = vista !== 'panel';
  const elPortafolios = $('#portafolios');
  if (elPortafolios) elPortafolios.hidden = vista !== 'portafolios';
  $('#cuenta').hidden = vista !== 'cuenta';
  $('#app').hidden = inicio;
  $$('.barra__nav-link, .menu__opcion[data-seccion]').forEach(a => {
    if (a.dataset.seccion === vista) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  abrirMenu(false);
  if (TITULOS_VISTA[vista]) document.title = TITULOS_VISTA[vista];
};

// Antes de cambiar de propuesta o de vista, lo pendiente se manda a la cuenta.
export const cerrarEdicion = () => {
  if (hayCambiosSinEnviar()) guardarAhora();
  ctx.editando = false;
  ctx.propuestaId = null;
  ctx.portafolioId = null;
};

// Los links de navegación son <a>: con Ctrl o la rueda abren otra pestaña como cualquier link.
const conLink = fn => (boton, ev) => {
  if (boton.tagName === 'A') {
    if (!clicComun(ev)) return;
    ev.preventDefault();
  }
  fn();
};

const pintarInterruptorModo = () => {
  $('#menu-modo-oscuro')?.setAttribute('aria-checked', String(esModoOscuro()));
};

export const instalarNavegacion = () => {
  pintarInterruptorModo();
  seguirModoDelSistema(pintarInterruptorModo);

  // Clic fuera del menú lo cierra, y elegir una de sus opciones también (abrirlo y
  // cerrarlo tienen su propia acción). Corre antes de que se despache la acción.
  document.addEventListener('click', ev => {
    if (!menuAbierto()) return;
    const accion = ev.target.closest('[data-accion]')?.dataset.accion;
    const dentro = ev.target.closest('#menu-panel');
    const quedaAbierto = ['menu', 'cerrar-menu', 'alternar-modo'].includes(accion);
    if ((!dentro && !ev.target.closest('[data-accion="menu"]')) || (dentro && accion && !quedaAbierto)) abrirMenu(false);
  });

  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && menuAbierto()) {
      abrirMenu(false);
      $('[data-accion="menu"]').focus();
    }
  });

  window.addEventListener('popstate', () => {
    if (ctx.esCliente) return;
    const idPf = idPortafolioEnUrl();
    if (idPf) {
      if (idPf !== ctx.portafolioId) abrirPortafolio(idPf, { historial: false });
      return;
    }
    if (seccionEnUrl() === 'portafolios') {
      irAPortafolios({ historial: false });
      return;
    }
    if (!nube()) {
      volverAEditorPropuestaInvitado();
      return;
    }
    const id = idEnUrl();
    if (id) {
      if (id !== ctx.propuestaId) abrirPropuesta(id, { historial: false });
    } else if (seccionEnUrl() === 'cuenta') irACuenta({ historial: false });
    else irAlPanel({ historial: false, pestana: seccionEnUrl() });
  });

  registrarAcciones({
    'menu': () => abrirMenu(!menuAbierto()),
    'cerrar-menu': () => abrirMenu(false),
    'ir-panel': conLink(() => {
      if (nube()) irAlPanel();
      else volverAEditorPropuestaInvitado();
    }),
    'ir-portafolios': conLink(() => irAPortafolios()),
    'ir-cuenta': (boton, ev) => {
      if (!nube()) return;
      conLink(() => irACuenta())(boton, ev);
    },
    'alternar-modo': () => {
      guardarModoApp(esModoOscuro() ? 'claro' : 'oscuro');
      pintarInterruptorModo();
    },
    'contacto-demo': () => avisar('En tu portfolio compartido, este botón abre WhatsApp o email directo para contratarte.')
  });
};
