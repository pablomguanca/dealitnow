// Sesión: pantalla de ingreso y registro, verificación del email, modo invitado (editor
// de prueba sin cuenta), arranque con cuenta y cierre de sesión.

import { $ } from '../lib/formato.js';
import { vacio, vacioPortafolio, ejemplo } from '../modelo.js';
import { ctx, AteneaDB, AteneaDBError, CLAVE, nube, normalizar } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisarExito, confirmar } from './avisos.js';
import {
  cargarGuardado,
  cargarPortafoliosLocales,
  guardarLocal,
  guardarAhora,
  hayCambiosSinEnviar,
  limpiarAlmacenamientoLocal,
  migrarLocal,
  mostrarEstadoGuardado
} from './guardado.js';
import { llenarFormulario, actualizarAvisoPagos } from './formulario.js';
import { renderDocumento } from './vista.js';
import { descargarPDF } from './documento.js';
import { irAResultados } from './resultados.js';
import { abrirIA } from './ia.js';
import { irRuta, idEnUrl, idPortafolioEnUrl, seccionEnUrl } from './navegacion.js';
import { escucharPropuestas, reiniciarPanel, irAlPanel, abrirPropuesta, mostrarEditor } from './propuestas.js';
import { escucharPortafoliosNube, reiniciarPortafolios, irAPortafolios, abrirPortafolio } from './portafolios.js';
import { cargarPerfil, reiniciarCuenta, irACuenta, pintarAvatar } from './cuenta.js';
import { abrirCompartir } from './compartir.js';
import { escucharPlan, reiniciarPlan } from './plan.js';
import { desactivarPushEnEsteDispositivo, reiniciarPush } from './push.js';

let invitadoIniciado = false;
let guardadoParaRegistro = false;
let authModo = 'login';
let entrar = () => { };

const MOTIVOS_REGISTRO = {
  compartir: 'Creá tu cuenta gratis para compartir tu propuesta. Lo que armaste se guarda en tu cuenta.',
  pdf: 'Creá tu cuenta gratis para descargar tu propuesta en PDF. Lo que armaste se guarda en tu cuenta.',
  guardar: 'Creá tu cuenta gratis para guardar tus propuestas y abrirlas desde cualquier dispositivo.',
  ia: 'Creá tu cuenta gratis para armar propuestas con IA: contás el trabajo en un audio y queda lista en segundos.'
};

export const abrirRegistro = motivo => {
  if (MOTIVOS_REGISTRO[motivo]) {
    // Se guarda ya, aunque no haya editado: es la propuesta que quiere compartir.
    if (ctx.invitado) {
      guardadoParaRegistro = !ctx.invitadoEdito;
      guardarLocal();
    }
    try { sessionStorage.setItem(`${CLAVE}:continuar`, motivo); } catch { }
  }
  const elMotivo = $('#auth-motivo');
  elMotivo.textContent = MOTIVOS_REGISTRO[motivo] || '';
  elMotivo.hidden = !MOTIVOS_REGISTRO[motivo];
  $('#auth-cerrar').hidden = !ctx.invitado;
  $('#auth-pantalla').hidden = false;
  $('#auth-google').focus();
};

const cerrarRegistro = () => {
  if (!ctx.invitado) return;
  $('#auth-pantalla').hidden = true;
  try {
    sessionStorage.removeItem(`${CLAVE}:continuar`);
    // Si solo se guardó para el registro y al final no se registró, no queda nada guardado.
    if (guardadoParaRegistro && !ctx.invitadoEdito) { localStorage.removeItem(CLAVE); sessionStorage.removeItem(CLAVE); }
  } catch { }
  guardadoParaRegistro = false;
};

const mostrarMensaje = (el, texto) => {
  el.textContent = texto;
  el.hidden = false;
};

const MENSAJES_AUTH = {
  'auth/user-not-found': 'No hay cuenta con ese email.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá un momento.',
  'auth/popup-closed-by-user': '',
  'auth/cancelled-popup-request': ''
};

const mostrarErrorAuth = (el, msg) => {
  if (!el) return;
  const texto = MENSAJES_AUTH[msg?.code] ?? MENSAJES_AUTH[msg?.message] ?? (typeof msg === 'string' ? msg : 'Ocurrió un error. Intentá de nuevo.');
  if (!texto) { el.hidden = true; return; }
  el.textContent = texto;
  el.hidden = false;
};

const setAuthCargando = cargando => {
  const authSubmit = $('#auth-submit');
  const authSubmitText = authSubmit?.querySelector('.auth__submit-texto');
  const authSpinner = authSubmit?.querySelector('.auth__spinner');
  const authGoogle = $('#auth-google');
  if (authSubmit) authSubmit.disabled = cargando;
  if (authGoogle) authGoogle.disabled = cargando;
  if (authSubmitText) authSubmitText.textContent = cargando ? 'Cargando...' : (authModo === 'login' ? 'Iniciar sesión' : 'Crear cuenta');
  if (authSpinner) authSpinner.hidden = !cargando;
};

const instalarPantallaAuth = () => {
  const authPantalla = $('#auth-pantalla');
  const authErrorG = $('#auth-error-google');
  const authError = $('#auth-error');
  const authSubmitText = $('#auth-submit')?.querySelector('.auth__submit-texto');
  const authNombre = $('#auth-nombre');
  const authEmail = $('#auth-email');
  const authPass = $('#auth-pass');
  const authOlvido = $('#auth-olvido');
  const authMensaje = $('#auth-mensaje');
  const elVerificar = $('#auth-verificar');
  const verificarError = $('#auth-verificar-error');
  const verificarMensaje = $('#auth-verificar-mensaje');

  authPantalla.querySelectorAll('[data-auth-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      authModo = tab.dataset.authTab === 'registro' ? 'registro' : 'login';
      authPantalla.querySelectorAll('[data-auth-tab]').forEach(t => t.classList.toggle('auth__tab--activo', t === tab));
      const campoNombre = authPantalla.querySelector('.auth__campo--nombre');
      if (campoNombre) campoNombre.hidden = authModo === 'login';
      if (authSubmitText) authSubmitText.textContent = authModo === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
      if (authPass) authPass.autocomplete = authModo === 'login' ? 'current-password' : 'new-password';
      if (authError) authError.hidden = true;
      authOlvido.hidden = authModo !== 'login';
      authMensaje.hidden = true;
    });
  });

  authPantalla.querySelectorAll('[data-auth-toggle-pass]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!authPass) return;
      const show = authPass.type === 'password';
      authPass.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  });

  $('#auth-google').addEventListener('click', async () => {
    setAuthCargando(true);
    if (authErrorG) authErrorG.hidden = true;
    try {
      await AteneaDB.auth.signInGoogle();
    } catch (e) {
      console.error('[APP] signInGoogle ERROR:', e.code, e.message);
      mostrarErrorAuth(authErrorG, e);
    } finally {
      setAuthCargando(false);
    }
  });

  $('#auth-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = authEmail?.value.trim();
    const pass = authPass?.value;
    if (!email || !pass) return;
    setAuthCargando(true);
    if (authError) authError.hidden = true;
    try {
      if (authModo === 'registro') {
        await AteneaDB.auth.signUp(email, pass, authNombre?.value.trim());
      } else {
        await AteneaDB.auth.signIn(email, pass);
      }
    } catch (e) {
      mostrarErrorAuth(authError, e);
    } finally {
      setAuthCargando(false);
    }
  });

  // El mensaje es el mismo exista o no la cuenta, para no revelar qué emails están registrados.
  authOlvido.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    authError.hidden = true;
    authMensaje.hidden = true;
    if (!email) {
      mostrarErrorAuth(authError, 'Escribí tu email arriba y volvé a tocar «¿Olvidaste tu contraseña?».');
      authEmail.focus();
      return;
    }
    authOlvido.disabled = true;
    try {
      await AteneaDB.auth.recuperarPassword(email);
      mostrarMensaje(authMensaje, `Si hay una cuenta con ${email}, te mandamos un link para crear una contraseña nueva.`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') mostrarMensaje(authMensaje, `Si hay una cuenta con ${email}, te mandamos un link para crear una contraseña nueva.`);
      else mostrarErrorAuth(authError, e);
    } finally {
      authOlvido.disabled = false;
    }
  });

  $('#auth-verificar-listo').addEventListener('click', async ev => {
    const boton = ev.currentTarget;
    boton.disabled = true;
    verificarError.hidden = true;
    verificarMensaje.hidden = true;
    try {
      if (await AteneaDB.auth.comprobarVerificacion()) entrar(AteneaDB.auth.getUser());
      else mostrarErrorAuth(verificarError, 'Tu email todavía no figura como verificado. Tocá el link del email que te mandamos y probá de nuevo.');
    } catch (e) {
      mostrarErrorAuth(verificarError, e);
    } finally {
      boton.disabled = false;
    }
  });

  $('#auth-verificar-reenviar').addEventListener('click', async ev => {
    const boton = ev.currentTarget;
    boton.disabled = true;
    verificarError.hidden = true;
    try {
      await AteneaDB.auth.enviarVerificacion();
      mostrarMensaje(verificarMensaje, 'Te reenviamos el email. Puede tardar unos minutos en llegar.');
    } catch (e) {
      mostrarErrorAuth(verificarError, e.code === 'auth/too-many-requests'
        ? 'Ya te mandamos varios emails. Esperá unos minutos antes de pedir otro.'
        : e);
    } finally {
      boton.disabled = false;
    }
  });

  $('#auth-verificar-salir').addEventListener('click', async () => {
    await AteneaDB.auth.signOut();
    location.reload();
  });

  // Si verificó en otra pestaña (o en el celular), al volver entra solo.
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || elVerificar.hidden || !AteneaDB.auth.getUser()) return;
    try {
      if (await AteneaDB.auth.comprobarVerificacion()) entrar(AteneaDB.auth.getUser());
    } catch { }
  });
};

// Sin sesión: editor de prueba que guarda en este navegador. Al registrarse, lo que
// armó pasa a su cuenta (migrarLocal) y sigue con lo que quería hacer.
const iniciarInvitado = () => {
  ctx.invitado = true;
  document.body.classList.add('invitado');
  document.body.classList.remove('auth-cargando', 'auth-activo');
  $('#auth-pantalla').hidden = true;
  if (invitadoIniciado) return;
  invitadoIniciado = true;
  const pideIngresar = new URLSearchParams(location.search).has('ingresar');
  if (location.search) irRuta('/', { reemplazar: true });
  ctx.portafolios = cargarPortafoliosLocales();
  const guardada = cargarGuardado();
  ctx.invitadoEdito = !!guardada;
  ctx.estado = guardada || normalizar(ejemplo());
  ctx.seleccion = new Set();
  llenarFormulario();
  renderDocumento();
  actualizarAvisoPagos();
  ctx.editando = true;
  mostrarEstadoGuardado();
  if (pideIngresar) abrirRegistro('ingresar');
};

// Con la sesión ya iniciada, guardarAhora apuntaría a la cuenta: lo pendiente del
// visitante va al navegador, y de ahí migrarLocal lo pasa a su cuenta.
const guardarCambiosDeInvitado = () => {
  if (!hayCambiosSinEnviar()) return;
  clearTimeout(ctx.temporizadorGuardado);
  ctx.temporizadorGuardado = null;
  guardarLocal();
};

const limpiarEstadoMemoria = () => {
  clearTimeout(ctx.temporizadorGuardado);
  ctx.temporizadorGuardado = null;
  ctx.renderPendiente = false;
  ctx.editando = false;
  ctx.invitado = false;
  invitadoIniciado = false;
  ctx.invitadoEdito = false;
  guardadoParaRegistro = false;
  reiniciarPanel();
  reiniciarPortafolios();
  reiniciarCuenta();
  reiniciarPlan();
  reiniciarPush();
  ctx.propuestaId = null;
  ctx.portafolioId = null;
  ctx.estado = vacio();
  ctx.estadoPortafolio = vacioPortafolio();
  ctx.seleccion = new Set();
  if ($('#documento')) $('#documento').innerHTML = '';
  if ($('#menu-usuario')) $('#menu-usuario').textContent = '';
  if ($('#barra-avatar')) $('#barra-avatar').textContent = '';
};

const cerrarSesion = async () => {
  if (!AteneaDB) return;
  if (hayCambiosSinEnviar()) guardarAhora();
  // Cerrar sesión borra la caché local: antes hay que asegurar que todo llegó a la cuenta.
  const sincronizado = await Promise.race([
    ctx.ultimaEscritura.then(() => !ctx.escriturasPendientes),
    new Promise(res => setTimeout(() => res(false), 4000))
  ]);
  if (!sincronizado && nube() && !await confirmar({
    titulo: 'Hay cambios sin sincronizar',
    texto: 'Los últimos cambios todavía no llegaron a tu cuenta, probablemente por falta de conexión. Si cerrás sesión ahora, se pierden.',
    aceptar: 'Cerrar sesión igual',
    peligro: true
  })) return;
  ctx.cerrandoSesion = true;
  // Este dispositivo deja de recibir los avisos de la cuenta (con la sesión todavía abierta).
  await Promise.race([desactivarPushEnEsteDispositivo(), new Promise(res => setTimeout(res, 3000))]);
  limpiarEstadoMemoria();
  limpiarAlmacenamientoLocal();
  await AteneaDB.auth.signOut();
  location.replace('/');
};

// Sin Firebase: un solo editor que guarda en el navegador, como antes de las cuentas.
const iniciarSinCuenta = () => {
  document.body.classList.add('sin-cuenta');
  ctx.portafolios = cargarPortafoliosLocales();
  ctx.estado = cargarGuardado() || normalizar(ejemplo());
  llenarFormulario();
  renderDocumento();
  actualizarAvisoPagos();
  ctx.editando = true;
  mostrarEstadoGuardado();
};

// Con cuenta: se entra al panel, o directo a la propuesta si la URL la indica.
const iniciarConCuenta = async () => {
  const migrada = migrarLocal();
  escucharPropuestas();
  escucharPortafoliosNube();
  escucharPlan();
  cargarPerfil();
  // Si se registró desde el editor sin cuenta, sigue donde estaba: con su propuesta
  // abierta y, si quería compartirla o bajar el PDF, haciendo eso.
  let continuar = null;
  try {
    continuar = sessionStorage.getItem(`${CLAVE}:continuar`);
    sessionStorage.removeItem(`${CLAVE}:continuar`);
  } catch { }
  const id = idEnUrl();
  if (continuar === 'ia') {
    irAlPanel({ historial: false });
    abrirIA();
  } else if (migrada && continuar) {
    mostrarEditor(migrada.id, migrada.contenido, { historial: false });
    irRuta(`/propuesta/${encodeURIComponent(migrada.id)}`, { reemplazar: true });
    if (continuar === 'compartir') abrirCompartir();
    else if (continuar === 'pdf') descargarPDF();
  } else if (idPortafolioEnUrl()) await abrirPortafolio(idPortafolioEnUrl(), { historial: false });
  else if (id) await abrirPropuesta(id, { historial: false });
  else if (seccionEnUrl() === 'portafolios') irAPortafolios({ historial: false });
  else if (seccionEnUrl() === 'cuenta') irACuenta({ historial: false });
  else if (seccionEnUrl() === 'resultados') irAResultados({ historial: false });
  else irAlPanel({ historial: false, pestana: seccionEnUrl() });
};

// Arranque del dueño (no es un link de cliente): con Firebase escucha la sesión;
// sin Firebase queda el editor local.
export const arrancarSesion = () => {
  const authPantalla = $('#auth-pantalla');
  const menuUsuario = $('#menu-usuario');

  if (!AteneaDB) {
    if (AteneaDBError) {
      authPantalla.hidden = false;
      document.body.classList.add('auth-activo');
      mostrarErrorAuth($('#auth-error-google'), AteneaDBError);
    } else {
      authPantalla.hidden = true;
      document.body.classList.remove('auth-activo');
      iniciarSinCuenta();
    }
    return;
  }

  let editorIniciado = false;
  let ultimoUid = null;

  const mostrarAuth = () => {
    document.body.classList.remove('auth-cargando', 'invitado');
    if ($('#auth-cerrar')) $('#auth-cerrar').hidden = true;
    if ($('#auth-motivo')) $('#auth-motivo').hidden = true;
    authPantalla.hidden = false;
    document.body.classList.add('auth-activo');
  };

  // Cuentas con email y contraseña: hasta verificar el email no entran a la app
  // (las reglas de Firestore y Storage tampoco les permiten escribir).
  const mostrarVerificacion = user => {
    if (ctx.invitado) guardarCambiosDeInvitado();
    $('#auth-cerrar').hidden = true;
    $('#auth-verificar-email').textContent = user.email;
    $('#auth-ingreso').hidden = true;
    $('#auth-verificar').hidden = false;
    mostrarAuth();
  };

  entrar = async user => {
    ctx.cerrandoSesion = false;
    $('#auth-verificar').hidden = true;
    $('#auth-ingreso').hidden = false;
    authPantalla.hidden = true;
    document.body.classList.remove('auth-activo');
    if (ctx.invitado) {
      guardarCambiosDeInvitado();
      ctx.invitado = false;
      ctx.editando = false;
      document.body.classList.remove('invitado');
    }
    if (!editorIniciado || ultimoUid !== user.uid) {
      // Si había otra sesión abierta antes, limpiamos todo antes de iniciar la cuenta
      limpiarEstadoMemoria();
      if (ultimoUid && ultimoUid !== user.uid) limpiarAlmacenamientoLocal();
      editorIniciado = true;
      ultimoUid = user.uid;
      if (menuUsuario) menuUsuario.textContent = user.displayName || user.email;
      pintarAvatar(user);
      // El spinner sigue visible hasta saber qué mostrar, así no se ve un editor vacío.
      document.body.classList.add('auth-cargando');
      await iniciarConCuenta();
    } else {
      if (menuUsuario) menuUsuario.textContent = user.displayName || user.email;
      pintarAvatar(user);
    }
    document.body.classList.remove('auth-cargando');
  };

  AteneaDB.auth.onAuthChange(async user => {
    if (!user) {
      editorIniciado = false;
      ultimoUid = null;
      limpiarEstadoMemoria();
      limpiarAlmacenamientoLocal();
      // Sin sesión: la plataforma queda abierta en modo prueba (invitado) sin mostrar
      // jamás datos de sesiones anteriores. La cuenta se pide al compartir o guardar.
      iniciarInvitado();
      try {
        if (sessionStorage.getItem(`${CLAVE}:cuenta-eliminada`)) {
          sessionStorage.removeItem(`${CLAVE}:cuenta-eliminada`);
          avisarExito('Tu cuenta y todos tus datos se eliminaron.', 6000);
        }
      } catch { }
      return;
    }
    // Al volver desde el link del email, el usuario en memoria puede estar desactualizado.
    if (!user.emailVerified) {
      const verificado = await AteneaDB.auth.comprobarVerificacion().catch(() => false);
      if (!verificado) {
        mostrarVerificacion(user);
        return;
      }
    }
    entrar(user);
  });
};

export const instalarSesion = () => {
  $('#auth-cerrar').addEventListener('click', cerrarRegistro);
  $('.auth__fondo').addEventListener('click', cerrarRegistro);
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && !$('#auth-pantalla').hidden) cerrarRegistro();
  });
  if ($('#auth-pantalla') && AteneaDB) instalarPantallaAuth();

  registrarAcciones({
    'registrarse': () => abrirRegistro('guardar'),
    'ingresar': () => abrirRegistro('ingresar'),
    'cerrar-sesion': () => cerrarSesion()
  });
};
