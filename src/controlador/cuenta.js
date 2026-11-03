// Mi cuenta: perfil y datos del negocio que se usan en las propuestas nuevas, logo y
// foto en Storage, cambio de contraseña, avatar de la barra y eliminación de la cuenta.

import { $, $$, texto } from '../lib/formato.js';
import { LOGO_MAX_ARCHIVO, logoParaSubir, procesarImagenProyecto } from '../lib/imagenes.js';
import { ctx, AteneaDB, CLAVE, nube, esLogoValido } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisarError, avisarExito } from './avisos.js';
import { irRuta, mostrarVista, cerrarEdicion } from './navegacion.js';
import { renderPanel } from './propuestas.js';

let cuentaEditada = false;
// Logo y foto del negocio: se suben a Storage y se guardan con «Guardar cambios».
let logoCuenta = '';
let fotoCuenta = '';

// Datos del negocio para una propuesta o un portfolio nuevo: salen solo de Mi cuenta,
// nunca de una plantilla ni de otra propuesta. Lo que no cargó queda vacío para completarlo.
// Sin cuenta (modo prueba) se dejan los de ejemplo.
export const emisorDeCuenta = emisor => {
  if (!nube()) return emisor;
  const propio = ctx.perfil?.emisor || {};
  return Object.fromEntries(Object.keys(emisor).map(k => [k, texto(propio[k])]));
};

export const nombreVisible = () => texto(ctx.perfil?.displayName || AteneaDB?.auth.getUser()?.displayName).trim();

const pintarLogoCuenta = () => {
  [['cuenta-logo', logoCuenta, 'Subir logo', 'Cambiar logo'], ['cuenta-foto', fotoCuenta, 'Subir foto', 'Cambiar foto']].forEach(([prefijo, url, subir, cambiar]) => {
    const vista = $(`#${prefijo}-vista`);
    if (vista) {
      vista.hidden = !url;
      if (url) vista.src = url;
      else vista.removeAttribute('src');
    }
    if ($(`#${prefijo}-quitar`)) $(`#${prefijo}-quitar`).hidden = !url;
    if ($(`#${prefijo}-texto`)) $(`#${prefijo}-texto`).textContent = url ? cambiar : subir;
  });
};

const llenarCuenta = () => {
  const user = AteneaDB.auth.getUser();
  const conPassword = AteneaDB.auth.usaPassword();
  const { perfil } = ctx;
  $('#cuenta-nombre').value = nombreVisible();
  $('#cuenta-email').textContent = user?.email || '';
  $('#cuenta-acceso').textContent = conPassword ? 'Con email y contraseña.' : 'Con tu cuenta de Google.';
  $('[data-accion="cambiar-password"]').hidden = !conPassword;
  // Solo lo que el usuario guardó acá: nunca se completa con datos de propuestas o plantillas.
  const emisor = perfil?.emisor || {};
  $$('[data-emisor]').forEach(el => { el.value = texto(emisor[el.dataset.emisor]); });
  // Los logos y fotos viejos guardados como data: no van al perfil de Firestore: solo los de Storage.
  logoCuenta = esLogoValido(texto(emisor.logo)) && !texto(emisor.logo).startsWith('data:') ? texto(emisor.logo) : '';
  fotoCuenta = esLogoValido(texto(emisor.foto)) && !texto(emisor.foto).startsWith('data:') ? texto(emisor.foto) : '';
  pintarLogoCuenta();
  $('#cuenta-estado').textContent = perfil?.emisor ? '' : 'Completá los datos de tu negocio: se usan en cada propuesta y portfolio nuevo.';
  cuentaEditada = false;
};

export const cargarPerfil = async () => {
  try {
    ctx.perfil = await AteneaDB.perfil.obtener();
  } catch (e) {
    console.warn('No se pudo cargar el perfil:', e);
    ctx.perfil = ctx.perfil || {};
  }
  renderPanel();
  if (!$('#cuenta').hidden && !cuentaEditada) llenarCuenta();
};

// Al cerrar sesión o cambiar de cuenta.
export const reiniciarCuenta = () => {
  ctx.perfil = null;
  logoCuenta = '';
  fotoCuenta = '';
  cuentaEditada = false;
};

export const irACuenta = ({ historial = true } = {}) => {
  cerrarEdicion();
  if (historial && location.pathname !== '/cuenta') irRuta('/cuenta');
  mostrarVista('cuenta');
  if (!cuentaEditada) llenarCuenta();
  $('#cuenta').scrollTop = 0;
};

// Avatar de la barra: la foto de Google, o la inicial si entró con email.
export const pintarAvatar = user => {
  const el = $('#barra-avatar');
  const inicial = texto(user.displayName || user.email).trim().charAt(0).toUpperCase();
  el.textContent = inicial;
  if (!/^https:\/\//.test(texto(user.photoURL))) return;
  const img = document.createElement('img');
  img.alt = '';
  img.referrerPolicy = 'no-referrer'; // Google rechaza las fotos pedidas con referer de otro sitio
  img.src = user.photoURL;
  img.addEventListener('error', () => { el.textContent = inicial; });
  el.replaceChildren(img);
};

const cambiarPassword = async () => {
  const email = AteneaDB.auth.getUser()?.email;
  try {
    await AteneaDB.auth.recuperarPassword(email);
    avisarExito(`Te mandamos un email a ${email} para crear una contraseña nueva.`, 6000);
  } catch (e) {
    console.error('No se pudo enviar el email de contraseña:', e);
    avisarError('No se pudo enviar el email. Probá de nuevo en unos minutos.');
  }
};

// Sube una imagen de Mi cuenta (logo o foto) y deja el resultado listo para guardar.
const vincularImagenCuenta = (selectorCampo, { prefijo, mensajeTipo, mensajePeso, subiendo, procesar, aplicar, mensajeListo, mensajeError }) => {
  const campo = $(selectorCampo);
  if (!campo) return;
  campo.addEventListener('change', async () => {
    const archivo = campo.files?.[0];
    campo.value = '';
    if (!archivo || !nube()) return;
    if (!archivo.type.startsWith('image/')) {
      avisarError(mensajeTipo);
      return;
    }
    if (archivo.size > LOGO_MAX_ARCHIVO) {
      avisarError(mensajePeso);
      return;
    }
    $(`#${prefijo}-texto`).textContent = subiendo;
    campo.disabled = true;
    try {
      aplicar(await AteneaDB.logos.subir(await procesar(archivo)));
      cuentaEditada = true;
      $('#cuenta-estado').textContent = mensajeListo;
    } catch (e) {
      console.error(mensajeError, e);
      avisarError(`${mensajeError} Revisá tu conexión y probá de nuevo.`);
    } finally {
      campo.disabled = false;
      pintarLogoCuenta();
    }
  });
};

const instalarEliminarCuenta = () => {
  const eliminarConfirmacion = $('#eliminar-confirmacion');
  const eliminarPass = $('#eliminar-pass');
  const eliminarBoton = $('#eliminar-confirmar');
  const eliminarError = $('#eliminar-error');

  const actualizarBotonEliminar = () => {
    eliminarBoton.disabled = eliminarConfirmacion.value.trim().toUpperCase() !== 'ELIMINAR'
      || (AteneaDB.auth.usaPassword() && !eliminarPass.value);
  };
  eliminarConfirmacion.addEventListener('input', actualizarBotonEliminar);
  eliminarPass.addEventListener('input', actualizarBotonEliminar);

  const abrirEliminarCuenta = () => {
    const conPassword = AteneaDB.auth.usaPassword();
    $('#eliminar-form').reset();
    $('#eliminar-campo-pass').hidden = !conPassword;
    $('#eliminar-ayuda-google').hidden = conPassword;
    eliminarError.hidden = true;
    eliminarBoton.textContent = 'Eliminar cuenta';
    actualizarBotonEliminar();
    $('#dialogo-eliminar').showModal();
    eliminarConfirmacion.focus();
  };

  eliminarBoton.addEventListener('click', async () => {
    eliminarBoton.disabled = true;
    eliminarBoton.textContent = 'Eliminando…';
    eliminarError.hidden = true;
    try {
      await AteneaDB.auth.eliminarCuenta(eliminarPass.value);
      try {
        Object.keys(localStorage).filter(k => k.startsWith(CLAVE)).forEach(k => localStorage.removeItem(k));
        sessionStorage.setItem(`${CLAVE}:cuenta-eliminada`, '1');
      } catch { }
      location.replace('/');
    } catch (e) {
      console.error('No se pudo eliminar la cuenta:', e);
      const MENSAJES = {
        'auth/wrong-password': 'La contraseña no es correcta.',
        'auth/invalid-credential': 'La contraseña no es correcta.',
        'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de confirmar. Probá de nuevo.',
        'auth/cancelled-popup-request': 'Cerraste la ventana de Google antes de confirmar. Probá de nuevo.',
        'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permitila y probá de nuevo.',
        'auth/user-mismatch': 'Elegiste otra cuenta de Google. Confirmá con la cuenta con la que iniciaste sesión.',
        'auth/too-many-requests': 'Demasiados intentos. Esperá un momento.'
      };
      eliminarError.textContent = MENSAJES[e.code] || 'No se pudo eliminar la cuenta. Revisá tu conexión y probá de nuevo.';
      eliminarError.hidden = false;
      eliminarBoton.textContent = 'Eliminar cuenta';
      actualizarBotonEliminar();
    }
  });

  return abrirEliminarCuenta;
};

export const instalarCuenta = () => {
  const elCuentaEstado = $('#cuenta-estado');
  const botonGuardarCuenta = $('#cuenta-guardar');

  $('#cuenta-form').addEventListener('input', () => {
    cuentaEditada = true;
    elCuentaEstado.textContent = '';
  });

  $('#cuenta-form').addEventListener('submit', async ev => {
    ev.preventDefault();
    const displayName = $('#cuenta-nombre').value.trim();
    const emisor = { ...Object.fromEntries($$('[data-emisor]').map(el => [el.dataset.emisor, el.value.trim()])), logo: logoCuenta, foto: fotoCuenta };
    botonGuardarCuenta.disabled = true;
    botonGuardarCuenta.textContent = 'Guardando…';
    try {
      await AteneaDB.perfil.guardar({ displayName, emisor });
      ctx.perfil = { ...ctx.perfil, displayName, emisor };
      cuentaEditada = false;
      elCuentaEstado.textContent = 'Cambios guardados.';
      const menuUsuario = $('#menu-usuario');
      if (menuUsuario) menuUsuario.textContent = displayName || AteneaDB.auth.getUser()?.email || '';
    } catch (e) {
      console.error('No se pudo guardar el perfil:', e);
      elCuentaEstado.textContent = 'No se pudieron guardar los cambios. Revisá tu conexión y probá de nuevo.';
    } finally {
      botonGuardarCuenta.disabled = false;
      botonGuardarCuenta.textContent = 'Guardar cambios';
    }
  });

  vincularImagenCuenta('#cuenta-logo', {
    prefijo: 'cuenta-logo',
    mensajeTipo: 'El logo tiene que ser una imagen PNG, JPG, SVG o WebP.',
    mensajePeso: 'El logo pesa más de 5 MB. Usá una versión más liviana.',
    subiendo: 'Subiendo logo…',
    procesar: logoParaSubir,
    aplicar: url => { logoCuenta = url; },
    mensajeListo: 'Guardá los cambios para usar este logo en tus propuestas nuevas.',
    mensajeError: 'No se pudo subir el logo.'
  });
  vincularImagenCuenta('#cuenta-foto', {
    prefijo: 'cuenta-foto',
    mensajeTipo: 'La foto tiene que ser PNG, JPG o WebP.',
    mensajePeso: 'La foto pesa más de 5 MB. Usá una versión más liviana.',
    subiendo: 'Subiendo foto…',
    procesar: archivo => procesarImagenProyecto(archivo, true, { anchoMax: 480, altoMax: 480 }),
    aplicar: url => { fotoCuenta = url; },
    mensajeListo: 'Guardá los cambios para usar esta foto en tus propuestas y portfolios.',
    mensajeError: 'No se pudo subir la foto.'
  });

  const abrirEliminarCuenta = instalarEliminarCuenta();

  registrarAcciones({
    'quitar-logo-cuenta': () => {
      logoCuenta = '';
      cuentaEditada = true;
      pintarLogoCuenta();
    },
    'quitar-foto-cuenta': () => {
      fotoCuenta = '';
      cuentaEditada = true;
      pintarLogoCuenta();
    },
    'cambiar-password': () => cambiarPassword(),
    'eliminar-cuenta': () => {
      if (nube()) abrirEliminarCuenta();
    }
  });
};
