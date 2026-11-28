// Navegación entre vistas (panel, portfolios, cuenta, editor), rutas e historial,
// menú principal, pestañas Editar/Vista previa y visor de imágenes.

import { $, $$ } from '../lib/formato.js';
import { ctx, nube } from './contexto.js';
import { registrarAcciones, ejecutarAccion } from './acciones.js';
import { avisar, elegir } from './avisos.js';
import { guardarModoApp, modoGuardado } from '../lib/modo-app.js';
import { hayCambiosSinEnviar, guardarAhora } from './guardado.js';
import { irAlPanel, abrirPropuesta, volverAEditorPropuestaInvitado } from './propuestas.js';
import { irAPortafolios, abrirPortafolio } from './portafolios.js';
import { irACuenta } from './cuenta.js';
import { cerrarExplorador } from './explorador-plantillas.js';
import { irAResultados } from './resultados.js';
import { pintarGuia } from './guia.js';
import { salirVistaPrevia } from './vista-previa.js';

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
  if (location.pathname === '/clientes' || location.pathname === '/clientes/') return 'clientes';
  if (location.pathname === '/portafolios' || location.pathname === '/portafolios/') return 'portafolios';
  if (location.pathname === '/cuenta' || location.pathname === '/cuenta/') return 'cuenta';
  if (location.pathname === '/resultados' || location.pathname === '/resultados/') return 'resultados';
  return new URLSearchParams(location.search).get('seccion');
};

// Puertas de entrada a la app desde la landing: /empezar (editor sin cuenta) e /ingresar (login).
// Una vez adentro, la dirección vuelve a ser /.
export const esRutaEntrada = () => /^\/(empezar|ingresar)\/?$/.test(location.pathname);
export const pideIngresarEnUrl = () => /^\/ingresar\/?$/.test(location.pathname) || new URLSearchParams(location.search).has('ingresar');

// Pantallas que solo existen con la sesión iniciada (Mi cuenta, Resultados, Mis portfolios,
// Plantillas, o una propuesta o un portfolio de la cuenta). Sin sesión abren el login en lugar
// de la bienvenida, y al entrar se va a esa pantalla.
const SECCIONES_CON_CUENTA = ['cuenta', 'resultados', 'portafolios', 'plantillas', 'clientes'];
export const pideCuentaEnUrl = () =>
  SECCIONES_CON_CUENTA.includes(seccionEnUrl()) || !!idEnUrl() || !!idPortafolioEnUrl();

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
  cuenta: 'Mi cuenta | Dealit',
  resultados: 'Resultados | Dealit'
};
// Orden de las pantallas para el sentido de la transición: hacia la derecha (o más adentro,
// como el editor) se avanza; hacia la izquierda se vuelve. Igual que las pestañas de abajo.
const ORDEN_VISTA = { panel: 0, resultados: 1, portafolios: 2, cuenta: 3, editor: 10 };
let vistaActual = null;
let finTransicion = null;
const animarEntrada = (anterior, vista) => {
  if (!anterior || anterior === vista) return;
  const body = document.body;
  const sentido = (ORDEN_VISTA[vista] ?? 0) > (ORDEN_VISTA[anterior] ?? 0) ? 'adelante' : 'atras';
  body.classList.remove('vista-entra-adelante', 'vista-entra-atras');
  void body.offsetWidth; // reinicia la animación si se navega rápido
  body.classList.add(`vista-entra-${sentido}`);
  clearTimeout(finTransicion);
  finTransicion = setTimeout(() => body.classList.remove('vista-entra-adelante', 'vista-entra-atras'), 400);
};

export const mostrarVista = vista => {
  animarEntrada(vistaActual, vista);
  vistaActual = vista;
  const inicio = vista !== 'editor';
  document.body.classList.toggle('vista-inicio', inicio);
  document.body.classList.toggle('vista-panel', vista === 'panel');
  document.body.classList.toggle('vista-portafolios', vista === 'portafolios');
  document.body.classList.toggle('vista-cuenta', vista === 'cuenta');
  document.body.classList.toggle('vista-resultados', vista === 'resultados');
  const elResultados = $('#resultados');
  if (elResultados) elResultados.hidden = vista !== 'resultados';
  $('#panel').hidden = vista !== 'panel';
  const elPortafolios = $('#portafolios');
  if (elPortafolios) elPortafolios.hidden = vista !== 'portafolios';
  $('#cuenta').hidden = vista !== 'cuenta';
  $('#app').hidden = inicio;
  if (inicio) {
    cerrarExplorador();
    salirVistaPrevia({ redibujar: false });
  }
  $$('.barra__nav-link, .menu__opcion[data-seccion], .tabbar__item').forEach(a => {
    if (a.dataset.seccion === vista) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  abrirMenu(false);
  if (TITULOS_VISTA[vista]) document.title = TITULOS_VISTA[vista];
  // La guía de primeros pasos depende de qué se edita (propuesta o portfolio, y cuál).
  pintarGuia();
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

// Apariencia (components/SelectorModo.jsx): en el menú y en Mi cuenta, la opción elegida marcada.
const pintarSelectorModo = (modo = modoGuardado()) => {
  $$('[data-accion="modo-app"]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.modo === modo)));
};

// En el celular no hay menú lateral (como en las apps): las secciones están en la barra de
// abajo, la apariencia y la sesión en Mi cuenta, y en el editor el botón «⋯» abre esta hoja
// con las acciones de la propuesta o el portfolio (solo eso: la apariencia no es de acá).
const esCelular = () => typeof matchMedia === 'function' && matchMedia('(max-width: 768px)').matches;
const abrirAccionesEditor = async () => {
  const conCuenta = !!nube();
  const esPf = ctx.modoEditor === 'portafolio';
  const conIA = document.body.classList.contains('ia-disponible') || !conCuenta;
  const accion = await elegir({
    titulo: esPf ? 'Tu portfolio' : 'Tu propuesta',
    opciones: [
      { valor: 'guardar-version', texto: 'Guardar versión' },
      ...(conCuenta ? [{ valor: 'ver-versiones', texto: 'Versiones anteriores' }] : []),
      ...(esPf ? [] : [{ valor: 'pdf', texto: 'Descargar PDF' }]),
      ...(conIA ? [{ valor: 'abrir-ia', texto: 'Armá tu propuesta con IA', icono: 'ia' }] : []),
      ...(conCuenta && !esPf && document.body.classList.contains('ia-disponible') ? [{ valor: 'editar-con-ia', texto: 'Editar con IA', icono: 'ia' }] : []),
      { valor: 'nueva', texto: 'Nueva propuesta' },
      { valor: 'nuevo-portafolio', texto: 'Nuevo portfolio' },
      { valor: null, texto: 'Cancelar', estilo: 'texto' }
    ]
  });
  if (accion) ejecutarAccion(accion);
};

export const instalarNavegacion = () => {
  pintarSelectorModo();

  // Clic fuera del menú lo cierra, y elegir una de sus opciones también (abrirlo y
  // cerrarlo tienen su propia acción). Corre antes de que se despache la acción.
  document.addEventListener('click', ev => {
    if (!menuAbierto()) return;
    const accion = ev.target.closest('[data-accion]')?.dataset.accion;
    const dentro = ev.target.closest('#menu-panel');
    const quedaAbierto = ['menu', 'cerrar-menu', 'modo-app'].includes(accion);
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
    else if (seccionEnUrl() === 'resultados') irAResultados({ historial: false });
    else irAlPanel({ historial: false, pestana: seccionEnUrl() });
  });

  registrarAcciones({
    'menu': () => {
      if (esCelular() && !document.body.classList.contains('vista-inicio')) abrirAccionesEditor();
      else abrirMenu(!menuAbierto());
    },
    'cerrar-menu': () => abrirMenu(false),
    'ir-panel': conLink(() => {
      if (nube()) irAlPanel();
      else volverAEditorPropuestaInvitado();
    }),
    'ir-portafolios': conLink(() => irAPortafolios()),
    'ir-resultados': (boton, ev) => {
      if (!nube()) return;
      conLink(() => irAResultados())(boton, ev);
    },
    'ir-cuenta': (boton, ev) => {
      if (!nube()) return;
      conLink(() => irACuenta())(boton, ev);
    },
    'modo-app': boton => {
      const modo = boton.dataset.modo;
      guardarModoApp(modo);
      pintarSelectorModo(modo);
    },
    // «+ Nueva»: un solo lugar para crear, como la hoja de acciones de una app. Desde el
    // panel («Nueva propuesta», data-tipo="propuesta") ofrece las tres formas de arrancar una
    // propuesta; desde el «+» de la barra de abajo, también un portfolio.
    'crear-nuevo': async boton => {
      const conIA = document.body.classList.contains('ia-disponible');
      const soloPropuesta = boton?.dataset?.tipo === 'propuesta';
      const accion = await elegir({
        titulo: soloPropuesta ? 'Nueva propuesta' : '¿Qué querés crear?',
        opciones: [
          ...(conIA ? [{ valor: 'abrir-ia', texto: 'Contásela a la IA', estilo: 'primario', icono: 'ia' }] : []),
          { valor: 'nueva', texto: soloPropuesta ? 'En blanco' : 'Propuesta en blanco', estilo: conIA ? 'secundario' : 'primario' },
          ...(nube() ? [{ valor: 'desde-plantilla', texto: 'Desde una plantilla', estilo: 'secundario' }] : []),
          ...(soloPropuesta ? [] : [{ valor: 'nuevo-portafolio', texto: 'Nuevo portfolio', estilo: 'secundario' }]),
          { valor: null, texto: 'Cancelar', estilo: 'texto' }
        ]
      });
      if (accion === 'desde-plantilla') irAlPanel({ pestana: 'plantillas' });
      else if (accion) ejecutarAccion(accion);
    },
    'contacto-demo': () => avisar('En tu portfolio compartido, este botón abre WhatsApp o email directo para contratarte.')
  });
};
