// App de Android (Capacitor, ver capacitor.config.json). La app nativa abre dealit.com.ar
// dentro de una ventana propia; este módulo suma lo que la web sola no tiene: el botón
// «atrás» del sistema, el color de las barras del sistema, la pantalla de inicio, el login
// con Google nativo (Google no deja iniciar sesión dentro de una ventana web embebida) y
// compartir con la hoja del sistema. En el navegador no hace nada.

import { Capacitor, SystemBars, SystemBarsStyle, registerPlugin } from '@capacitor/core';

// Complemento propio (android/.../ImprimirPlugin.java): diálogo de impresión del sistema.
const Imprimir = registerPlugin('Imprimir');

export const esAppNativa = () => Capacitor.isNativePlatform();

// Login con Google: la cuenta se elige con la ventana nativa de Android y el token que
// devuelve se usa para entrar a Firebase como siempre. Si se cancela, se responde con el
// mismo código que la ventana web cerrada, así la interfaz no muestra un error.
export const tokenGoogleNativo = async () => {
  const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
  try {
    const r = await FirebaseAuthentication.signInWithGoogle();
    const token = r?.credential?.idToken;
    if (!token) throw Object.assign(new Error('Google no devolvió el token'), { code: 'auth/internal-error' });
    return token;
  } catch (e) {
    if (e?.code?.startsWith?.('auth/')) throw e;
    if (/cancel/i.test(e?.message || '')) throw Object.assign(new Error(e.message), { code: 'auth/popup-closed-by-user' });
    throw Object.assign(new Error(e?.message || 'Error de Google'), { code: 'auth/internal-error' });
  }
};

// Al cerrar sesión se olvida también la cuenta de Google elegida en Android, así la
// próxima vez se puede elegir otra.
export const cerrarSesionGoogleNativa = async () => {
  if (!esAppNativa()) return;
  try {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    await FirebaseAuthentication.signOut();
  } catch { }
};

// Compartir un link con la hoja de compartir de Android (la ventana web de Android no
// tiene navigator.share). Devuelve false si no se pudo, para usar el método de siempre.
export const compartirNativo = async ({ titulo, url }) => {
  if (!esAppNativa()) return false;
  try {
    const { Share } = await import('@capacitor/share');
    await Share.share({ title: titulo, url, dialogTitle: 'Compartir propuesta' });
  } catch (e) {
    // Cerrar la hoja sin elegir no es un error.
    if (!/cancel/i.test(e?.message || '')) return false;
  }
  return true;
};

// «Descargar PDF»: en la app no existe window.print(). Se avisa a la página como si fuera
// la impresión del navegador (beforeprint / afterprint), así suma y saca lo de siempre.
export const imprimirNativo = async nombre => {
  window.dispatchEvent(new Event('beforeprint'));
  try {
    await Imprimir.imprimir({ nombre });
  } finally {
    window.dispatchEvent(new Event('afterprint'));
  }
};

const cerrarDialogoAbierto = () => {
  const abiertos = [...document.querySelectorAll('dialog[open]')];
  const dialogo = abiertos[abiertos.length - 1];
  if (!dialogo) return false;
  // requestClose dispara «cancel» como la tecla Escape (los diálogos que no se pueden
  // cerrar en ese momento, como la IA generando, lo frenan ahí).
  if (typeof dialogo.requestClose === 'function') dialogo.requestClose();
  else dialogo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  return true;
};

// Botón «atrás» de Android, como en cualquier app: cierra lo que esté abierto, sale del
// editor, vuelve a Propuestas desde otra pestaña y, en Propuestas, deja la app en segundo plano.
const alTocarAtras = App => {
  const body = document.body;
  if (cerrarDialogoAbierto()) return;
  if (body.classList.contains('menu-abierto')) {
    document.querySelector('[data-accion="cerrar-menu"]')?.click();
    return;
  }
  if (!body.classList.contains('vista-inicio') && !body.classList.contains('auth-activo')) {
    const volver = document.querySelector('#editor-volver');
    if (volver) { volver.click(); return; }
  }
  if (body.classList.contains('vista-inicio') && !body.classList.contains('vista-panel') && !body.classList.contains('auth-activo')) {
    document.querySelector('.tabbar__item[data-seccion="panel"]')?.click();
    return;
  }
  App.minimizeApp();
};

export const instalarNativo = async () => {
  if (!esAppNativa()) return;
  document.body.classList.add('app-nativa');
  const [{ App }, { SplashScreen }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/splash-screen')
  ]);

  // Íconos de las barras del sistema claros u oscuros según el modo de la app.
  const pintarBarras = () => {
    const oscuro = document.documentElement.dataset.temaApp === 'oscuro';
    SystemBars.setStyle({ style: oscuro ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {});
  };
  pintarBarras();
  new MutationObserver(pintarBarras).observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema-app'] });

  App.addListener('backButton', () => alTocarAtras(App));

  // La pantalla de inicio se va cuando Firebase ya decidió qué mostrar (login o panel),
  // así no se ve la página a medio armar. Con un tope, por si algo tarda.
  const ocultar = () => SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
  const listo = () => !document.body.classList.contains('auth-cargando');
  if (listo()) ocultar();
  else {
    const obs = new MutationObserver(() => { if (listo()) { obs.disconnect(); ocultar(); } });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => { obs.disconnect(); ocultar(); }, 6000);
  }
};
