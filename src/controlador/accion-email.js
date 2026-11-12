// Links de los emails de Firebase Auth. Hoy la URL de acción de las plantillas es la de
// Firebase (https://dealit-7f735.firebaseapp.com/__/auth/action) y no se puede cambiar
// desde la consola: el email se verifica allá y el botón «Continuar» vuelve a
// https://dealit.com.ar/?verificado=<email> (firebase.js). Si algún día la URL de acción
// apunta a https://dealit.com.ar/accion, esta página también la resuelve.
//
// · Verificar el email se resuelve acá, con la marca de Dealit y sabiendo qué cuenta se
//   verificó: si en este navegador hay otra sesión abierta (por ejemplo, tu cuenta de
//   siempre), se ofrece cerrarla y entrar con la cuenta recién verificada.
// · Lo demás (restablecer la contraseña, recuperar el email) sigue en la página de Firebase,
//   servida en este mismo dominio (vercel.json reescribe /__/auth/).

import { $ } from '../lib/formato.js';
import { AteneaDB } from './contexto.js';
import { avisarError, avisarExito, elegir } from './avisos.js';
import { abrirRegistro, cerrarSesion } from './sesion.js';
import { ocultarBienvenida } from './bienvenida.js';

const CLAVE_INGRESAR = 'dealit-ingresar-con';
let verificado = null; // { email } o { error }

const mismoEmail = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

// Antes de arrancar la sesión. Devuelve false si la página se va a otro lado (Firebase).
export const resolverAccionEmail = async () => {
  // Vuelta desde la página de Firebase (botón «Continuar»): el email ya quedó verificado allá.
  const vuelta = new URLSearchParams(location.search).get('verificado');
  if (vuelta && location.pathname !== '/accion') {
    const resto = new URLSearchParams(location.search);
    resto.delete('verificado');
    const query = resto.toString();
    history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
    if (/^[^\s@]+@[^\s@]+$/.test(vuelta)) verificado = { email: vuelta };
    return true;
  }
  if (location.pathname !== '/accion') return true;
  const parametros = new URLSearchParams(location.search);
  const modo = parametros.get('mode');
  const codigo = parametros.get('oobCode');
  if (modo !== 'verifyEmail' || !codigo || !AteneaDB?.auth.aplicarVerificacion) {
    location.replace(`/__/auth/action${location.search}`);
    return false;
  }
  history.replaceState(null, '', '/');
  try {
    verificado = { email: await AteneaDB.auth.aplicarVerificacion(codigo) };
  } catch (e) {
    console.warn('No se pudo verificar el email:', e.code || e.message);
    verificado = { error: e.code || 'error' };
  }
  return true;
};

// Abre «Iniciar sesión» con el email ya escrito.
const abrirIngreso = email => {
  ocultarBienvenida();
  abrirRegistro('ingresar');
  // El formulario de email está plegado detrás de «Usar email y contraseña».
  const plegado = $('#auth-email')?.closest('details');
  if (plegado) plegado.open = true;
  $('#auth-pantalla [data-auth-tab]:not([data-auth-tab="registro"])')?.click();
  const campo = $('#auth-email');
  if (campo) campo.value = email;
  $('#auth-pass')?.focus();
};

// Después de arrancar la sesión: avisa el resultado según quién quedó adentro.
export const avisarAccionEmail = () => {
  let pendiente = null;
  try {
    pendiente = sessionStorage.getItem(CLAVE_INGRESAR);
    sessionStorage.removeItem(CLAVE_INGRESAR);
  } catch { }
  if (!verificado && !pendiente) return;
  if (!AteneaDB) return;

  let resuelto = false;
  const dejar = AteneaDB.auth.onAuthChange(async user => {
    if (resuelto) return;
    resuelto = true;
    // Se espera a que la sesión termine de dibujarse (pantalla de ingreso o panel).
    await new Promise(r => setTimeout(r, 400));
    if (typeof dejar === 'function') dejar();

    // Volvió de cerrar la otra sesión para entrar con la cuenta verificada.
    if (pendiente) {
      if (!user) {
        abrirIngreso(pendiente);
        avisarExito(`Ingresá con ${pendiente} y tu contraseña.`, 7000);
      }
      return;
    }

    if (verificado.error) {
      const usado = verificado.error === 'auth/invalid-action-code' || verificado.error === 'auth/expired-action-code';
      avisarError(usado
        ? 'Este link ya se usó o venció. Si ya verificaste tu email, iniciá sesión; si no, pedí uno nuevo desde la pantalla de verificación.'
        : 'No pudimos verificar tu email. Probá de nuevo con el link o pedí uno nuevo.', 10000);
      return;
    }

    const { email } = verificado;
    if (!user) {
      abrirIngreso(email);
      avisarExito(`¡Listo! Verificaste ${email}. Ahora ingresá con tu contraseña.`, 7000);
      return;
    }
    if (mismoEmail(user.email, email)) {
      avisarExito('¡Listo! Tu email quedó verificado. Bienvenido a Dealit.', 6000);
      return;
    }
    // Hay otra cuenta abierta en este navegador.
    const eleccion = await elegir({
      titulo: 'Listo, verificaste tu email',
      texto: `${email} ya está verificado. En este navegador tenés abierta la sesión de ${user.email}. ¿Querés cerrarla y entrar con la cuenta nueva?`,
      opciones: [
        { valor: 'cambiar', texto: `Entrar con ${email}`, estilo: 'primario' },
        { valor: null, texto: `Seguir con ${user.email}`, estilo: 'texto' }
      ]
    });
    if (eleccion === 'cambiar') {
      try { sessionStorage.setItem(CLAVE_INGRESAR, email); } catch { }
      cerrarSesion();
    }
  });
};
