// App de Android (Capacitor, ver capacitor.config.json). La app nativa abre dealit.com.ar
// dentro de una ventana propia; este módulo suma lo que la web sola no tiene: el botón
// «atrás» del sistema, el color de las barras del sistema, la pantalla de inicio, el login
// con Google nativo (Google no deja iniciar sesión dentro de una ventana web embebida) y
// compartir con la hoja del sistema. En el navegador no hace nada.

import { Capacitor, SystemBars, SystemBarsStyle, registerPlugin } from '@capacitor/core';

// Complemento propio (android/.../ImprimirPlugin.java): diálogo de impresión del sistema.
const Imprimir = registerPlugin('Imprimir');

export const esAppNativa = () => Capacitor.isNativePlatform();

// Complemento propio (android/.../DictadoPlugin.java): dictado con el reconocimiento de voz de
// Android, porque la ventana web de la app no trae el de Chrome. Las apps instaladas antes
// de sumarlo no lo tienen: ahí se sigue usando el micrófono del teclado.
const Dictado = registerPlugin('Dictado');
export const dictadoNativoDisponible = () => esAppNativa() && Capacitor.isPluginAvailable('Dictado');

// Empieza a escuchar y devuelve { detener }. alParcial recibe lo que va diciendo, alFinal
// cada frase cerrada, alError un código ('sin-permiso', 'sin-conexion', …) y alFin avisa que
// dejó de escuchar (después de detener, o porque la app pasó a segundo plano). Si no se puede
// empezar (por ejemplo, se negó el permiso), la promesa se rechaza con ese código en e.code.
export const dictadoNativo = async ({ alParcial, alFinal, alError, alFin }) => {
  const oyentes = await Promise.all([
    Dictado.addListener('parcial', e => alParcial?.(e?.texto || '')),
    Dictado.addListener('final', e => alFinal?.(e?.texto || '')),
    Dictado.addListener('error', e => alError?.(e?.codigo || 'error')),
    Dictado.addListener('fin', () => {
      quitar();
      alFin?.();
    })
  ]);
  function quitar() { oyentes.forEach(o => o.remove()); }
  try {
    await Dictado.empezar({ idioma: 'es-AR' });
  } catch (e) {
    quitar();
    throw e;
  }
  return { detener: () => Dictado.detener().catch(() => {}) };
};

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
// Android arma el PDF con el ancho de la pantalla del celular: mientras imprime, la página se
// arma con el ancho de una hoja A4 (como en la compu) y después vuelve al del celular.
const ANCHO_HOJA = 820;
const esperar = ms => new Promise(listo => setTimeout(listo, ms));
const anchoDeHoja = async activo => {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  if (activo) {
    meta.dataset.original = meta.getAttribute('content') || '';
    await Imprimir.anchoDeHoja({ activo: true }).catch(() => {});
    meta.setAttribute('content', `width=${ANCHO_HOJA}, viewport-fit=cover`);
    // Hasta que la página se vuelve a armar con el ancho nuevo (con un tope).
    for (let i = 0; i < 20 && innerWidth < ANCHO_HOJA - 10; i++) await esperar(50);
    await esperar(150);
  } else {
    meta.setAttribute('content', meta.dataset.original || 'width=device-width, initial-scale=1, viewport-fit=cover');
    await Imprimir.anchoDeHoja({ activo: false }).catch(() => {});
    // Hasta que vuelve al ancho del celular (con un tope), así no se ve el salto al destapar.
    for (let i = 0; i < 20 && innerWidth > ANCHO_HOJA - 10; i++) await esperar(50);
    await esperar(200);
  }
};

// Mientras la página cambia de ancho (antes de abrir la impresión y al volver), una pantalla
// con el color de la app tapa el salto. No sale en el PDF (_impresion.scss la oculta).
const taparPantalla = tapar => {
  document.getElementById('cubre-impresion')?.remove();
  if (!tapar) return;
  const capa = document.createElement('div');
  capa.id = 'cubre-impresion';
  capa.className = 'cubre-impresion';
  capa.setAttribute('role', 'status');
  capa.innerHTML = '<span class="cubre-impresion__spinner" aria-hidden="true"></span><p>Preparando tu PDF…</p>';
  document.body.append(capa);
};

// Hojas sin márgenes mientras imprime la app (ver html.imprimiendo-app en _impresion.scss).
const modoImpresionApp = activo => {
  document.documentElement.classList.toggle('imprimiendo-app', activo);
  document.getElementById('impresion-app')?.remove();
  if (activo) {
    const estilo = document.createElement('style');
    estilo.id = 'impresion-app';
    estilo.textContent = '@page { margin: 0 !important; }';
    document.head.append(estilo);
  }
};

export const imprimirNativo = async nombre => {
  taparPantalla(true);
  await esperar(80); // que la capa llegue a pintarse antes del cambio de ancho
  try {
    await anchoDeHoja(true);
    modoImpresionApp(true);
    window.dispatchEvent(new Event('beforeprint'));
    try {
      await Imprimir.imprimir({ nombre });
    } finally {
      window.dispatchEvent(new Event('afterprint'));
      modoImpresionApp(false);
      await anchoDeHoja(false);
    }
  } finally {
    taparPantalla(false);
  }
};

// Notificaciones push de la app (Firebase Cloud Messaging). El token del celular se guarda
// también acá para poder darlo de baja después (al apagarlas o al cerrar sesión).
const CLAVE_TOKEN_PUSH = 'dealit-push-token';
// Ojo: el complemento nunca se devuelve desde una promesa. Al resolverla, JavaScript le pregunta
// si tiene .then() y Capacitor lo toma como un pedido a Android («then() is not implemented»).
// Por eso se devuelve el módulo entero y se usa .FirebaseMessaging recién al llamar.
const mensajeria = () => import('@capacitor-firebase/messaging');
export const pushNativo = {
  // 'granted' | 'denied' | 'prompt' (todavía no se preguntó)
  permiso: async () => (await (await mensajeria()).FirebaseMessaging.checkPermissions()).receive,
  pedirPermiso: async () => (await (await mensajeria()).FirebaseMessaging.requestPermissions()).receive,
  token: async () => (await (await mensajeria()).FirebaseMessaging.getToken()).token,
  borrarToken: async () => { try { await (await mensajeria()).FirebaseMessaging.deleteToken(); } catch { } },
  guardado: () => { try { return localStorage.getItem(CLAVE_TOKEN_PUSH) || ''; } catch { return ''; } },
  guardar: token => { try { localStorage.setItem(CLAVE_TOKEN_PUSH, token); } catch { } },
  olvidar: () => { try { localStorage.removeItem(CLAVE_TOKEN_PUSH); } catch { } },
  // Google renueva el token cada tanto: push.js lo vuelve a registrar en el servidor.
  alRenovarToken: async fn => (await mensajeria()).FirebaseMessaging.addListener('tokenReceived', ev => ev?.token && fn(ev.token))
};

// Al tocar un aviso se abre la pantalla de la propuesta. Se navega dentro de la app (sin
// recargar): la ruta nueva y un «popstate», que es lo que ya atiende navegacion.js.
const abrirDesdeAviso = url => {
  try {
    const destino = new URL(url, location.origin);
    if (destino.origin !== location.origin) return;
    history.pushState(null, '', destino.pathname + destino.search);
    window.dispatchEvent(new PopStateEvent('popstate'));
  } catch { }
};

const instalarAvisosNativos = async () => {
  const { FirebaseMessaging } = await mensajeria();
  // Canal de Android para los avisos (con sonido y que aparezcan arriba de la pantalla).
  await FirebaseMessaging.createChannel({
    id: 'avisos',
    name: 'Avisos de propuestas',
    description: 'Cuando tu cliente abre o acepta una propuesta',
    importance: 4,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#00C896'
  }).catch(() => {});
  // Con la app abierta, Android no muestra el aviso en la barra: lo recibe la app, que lo
  // muestra como cartel (push.js).
  FirebaseMessaging.addListener('notificationReceived', ev => {
    const n = ev?.notification || {};
    window.dispatchEvent(new CustomEvent('dealit:aviso-push', { detail: { titulo: n.title || '', cuerpo: n.body || '', url: n.data?.url || '' } }));
  });
  FirebaseMessaging.addListener('notificationActionPerformed', ev => {
    const url = ev?.notification?.data?.url;
    if (typeof url === 'string' && url) abrirDesdeAviso(url);
  });
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
  // El login abierto encima (sin cuenta) se cierra, como un diálogo.
  const cerrarLogin = document.querySelector('#auth-pantalla:not([hidden]) #auth-cerrar:not([hidden])');
  if (cerrarLogin) { cerrarLogin.click(); return; }
  // En la bienvenida o en el editor sin cuenta no hay adónde volver: la app pasa a segundo plano.
  if (body.classList.contains('bienvenida-activa') || body.classList.contains('invitado')) {
    App.minimizeApp();
    return;
  }
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
  instalarAvisosNativos().catch(e => console.warn('No se pudieron preparar los avisos:', e?.message));

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
