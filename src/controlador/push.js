// Notificaciones push en este dispositivo (Mi cuenta): registra el service worker
// (public/sw.js), pide permiso, suscribe el navegador y se lo pasa al servidor
// (api/push). Qué avisos llegan y a quién lo decide el servidor (api/_lib/avisos.js).
// En el celular dependen de que la app esté instalada (en iPhone es obligatorio).
// En la app de Android no hay Web Push: se usa Firebase Cloud Messaging (nativo.js), que
// no depende de las claves VAPID.

import { $ } from '../lib/formato.js';
import { ctx } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarError, avisarExito } from './avisos.js';
import { llamarApi } from './api.js';
import { esAppNativa, pushNativo } from '../nativo.js';

// Clave pública VAPID que manda /api/plan ('' = push no configurado en el servidor).
let clave = '';
let sincronizada = false;

export const soportaPush = () =>
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof window !== 'undefined'
  && 'PushManager' in window && 'Notification' in window;

const esIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const instalada = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// La clave llega en base64url; el navegador la quiere en bytes.
export const claveEnBytes = base64 => {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const binario = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binario, c => c.charCodeAt(0));
};

let registro = null;
const registrarServiceWorker = () => {
  if (!registro && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    registro = navigator.serviceWorker.register('/sw.js').catch(e => {
      console.warn('No se pudo registrar el service worker:', e);
      registro = null;
      return null;
    });
  }
  return registro || Promise.resolve(null);
};

const suscripcionActual = async () => {
  if (!soportaPush()) return null;
  const reg = await registrarServiceWorker();
  return reg ? reg.pushManager.getSubscription() : null;
};

// Botón «Activar»: en Gratis ofrece Pro (los avisos son de Pro).
const prepararActivar = activar => {
  activar.dataset.accion = ctx.restringido ? 'ofrecer-pro' : 'activar-push';
  activar.dataset.motivo = 'seguimiento';
  activar.textContent = ctx.restringido ? 'Activar con Pro' : 'Activar en este dispositivo';
};

// App de Android: el permiso es el del sistema y el token se le pasa al servidor.
const pintarPushNativo = async mostrar => {
  const permiso = await pushNativo.permiso().catch(() => 'prompt');
  if (permiso === 'denied') {
    return mostrar('Bloqueaste las notificaciones de Dealit. Activalas en Ajustes → Aplicaciones → Dealit → Notificaciones y volvé a esta pantalla.');
  }
  const guardado = pushNativo.guardado();
  if (permiso === 'granted' && guardado) {
    mostrar(ctx.restringido
      ? 'Activadas en este celular. Los avisos llegan con Dealit Pro.'
      : 'Activadas en este celular: te avisamos al instante cuando tu cliente abre o acepta una propuesta.', { activa: true });
    // Una vez por sesión se le recuerda al servidor (por si Google renovó el token).
    if (!sincronizada) {
      sincronizada = true;
      registrarTokenNativo(guardado).catch(e => console.warn('No se pudo actualizar el aviso push:', e.codigo || e.message));
    }
    return;
  }
  prepararActivar($('#push-activar'));
  mostrar(ctx.restringido
    ? 'Con Dealit Pro te avisamos al instante en el celular cuando tu cliente abre o acepta una propuesta.'
    : 'Te avisamos al instante en el celular cuando tu cliente abre o acepta una propuesta.', { conActivar: true });
};

// Pide el token actual y lo registra; si cambió, el viejo se da de baja.
const registrarTokenNativo = async anterior => {
  const token = await pushNativo.token();
  if (anterior && anterior !== token) await llamarApi('/api/push', { accion: 'baja', token: anterior }).catch(() => {});
  await llamarApi('/api/push', { accion: 'alta', token });
  pushNativo.guardar(token);
};

const pintarPush = async () => {
  const tarjeta = $('#tarjeta-push');
  if (!tarjeta) return;
  const nativa = esAppNativa();
  tarjeta.hidden = !clave && !nativa;
  if (tarjeta.hidden) return;
  const estado = $('#push-estado');
  const activar = $('#push-activar');
  const desactivar = $('#push-desactivar');
  const probar = $('#push-probar');
  const mostrar = (texto, { conActivar = false, activa = false } = {}) => {
    estado.textContent = texto;
    activar.hidden = !conActivar;
    desactivar.hidden = !activa;
    probar.hidden = !activa;
  };
  if (nativa) return pintarPushNativo(mostrar);

  if (!soportaPush()) {
    return mostrar(esIOS() && !instalada()
      ? 'En iPhone, primero agregá Dealit a la pantalla de inicio (Compartir → Agregar a inicio) y abrila desde ese ícono. Ahí vas a poder activarlas.'
      : 'Este navegador no permite notificaciones. Probá con Chrome, Edge, Firefox o Safari actualizados.');
  }
  if (Notification.permission === 'denied') {
    return mostrar('Bloqueaste las notificaciones de Dealit en este navegador. Habilitalas desde la configuración del sitio (el candado junto a la dirección) y volvé a esta pantalla.');
  }
  const suscripcion = await suscripcionActual().catch(() => null);
  if (suscripcion && Notification.permission === 'granted') {
    mostrar(ctx.restringido
      ? 'Activadas en este dispositivo. Los avisos llegan con Dealit Pro.'
      : 'Activadas en este dispositivo: te avisamos al instante cuando tu cliente abre o acepta una propuesta.', { activa: true });
    // Una vez por sesión se le recuerda al servidor (por si la suscripción cambió).
    if (!sincronizada) {
      sincronizada = true;
      llamarApi('/api/push', { accion: 'alta', suscripcion: suscripcion.toJSON() }).catch(e => console.warn('No se pudo actualizar la suscripción push:', e.codigo || e.message));
    }
    return;
  }
  prepararActivar(activar);
  mostrar(ctx.restringido
    ? 'Con Dealit Pro te avisamos al instante, en el celular o la computadora, cuando tu cliente abre o acepta una propuesta.'
    : `Te avisamos al instante cuando tu cliente abre o acepta una propuesta.${esIOS() || /Android/i.test(navigator.userAgent) ? ' Para que lleguen siempre, instalá Dealit en tu pantalla de inicio.' : ''}`, { conActivar: true });
};

// La pide plan.js cuando /api/plan responde.
export const configurarPush = clavePublica => {
  clave = typeof clavePublica === 'string' ? clavePublica : '';
  pintarPush();
};

const activarPushNativo = async boton => {
  boton.disabled = true;
  try {
    const permiso = await pushNativo.pedirPermiso();
    if (permiso !== 'granted') {
      avisar('Sin el permiso no podemos avisarte. Podés darlo en Ajustes → Aplicaciones → Dealit → Notificaciones.', 9000);
      return;
    }
    await registrarTokenNativo(pushNativo.guardado());
    sincronizada = true;
    avisarExito('Listo: te avisamos en este celular.');
  } catch (e) {
    console.error('No se pudieron activar las notificaciones:', e);
    avisarError('No se pudieron activar las notificaciones. Revisá tu conexión y probá de nuevo.');
  } finally {
    boton.disabled = false;
    pintarPush();
  }
};

const activarPush = async boton => {
  if (esAppNativa()) return activarPushNativo(boton);
  if (!clave || !soportaPush()) return;
  boton.disabled = true;
  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      avisar(permiso === 'denied'
        ? 'Bloqueaste las notificaciones. Podés habilitarlas desde la configuración del sitio.'
        // «default»: se cerró el cartel, el navegador lo mostró en silencio (la campanita
        // tachada de Chrome y Edge) o dejó de preguntar después de varios rechazos.
        : 'El navegador no dio el permiso. Tocá el candado o la campanita junto a la dirección, poné Notificaciones en «Permitir», recargá la página y volvé a tocar Activar.', 12000);
      return;
    }
    await registrarServiceWorker();
    const reg = await navigator.serviceWorker.ready;
    // Una suscripción vieja (por ejemplo, con otra clave) se reemplaza.
    const previa = await reg.pushManager.getSubscription();
    if (previa) await previa.unsubscribe().catch(() => {});
    const suscripcion = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveEnBytes(clave) });
    await llamarApi('/api/push', { accion: 'alta', suscripcion: suscripcion.toJSON() });
    sincronizada = true;
    avisarExito('Listo: te avisamos en este dispositivo.');
  } catch (e) {
    console.error('No se pudieron activar las notificaciones:', e);
    avisarError('No se pudieron activar las notificaciones. Revisá tu conexión y probá de nuevo.');
  } finally {
    boton.disabled = false;
    pintarPush();
  }
};

// Al apagarlas o al cerrar sesión: este dispositivo deja de recibir avisos de la cuenta.
export const desactivarPushEnEsteDispositivo = async () => {
  if (esAppNativa()) {
    const token = pushNativo.guardado();
    if (token) await llamarApi('/api/push', { accion: 'baja', token }).catch(e => console.warn('No se pudo dar de baja el aviso push:', e.codigo || e.message));
    await pushNativo.borrarToken();
    pushNativo.olvidar();
    return;
  }
  const suscripcion = await suscripcionActual().catch(() => null);
  if (!suscripcion) return;
  await llamarApi('/api/push', { accion: 'baja', endpoint: suscripcion.endpoint }).catch(e => console.warn('No se pudo dar de baja la suscripción push:', e.codigo || e.message));
  await suscripcion.unsubscribe().catch(() => {});
};

// Al eliminar la cuenta: ningún dispositivo sigue suscripto.
export const desactivarPushEnTodos = async () => {
  await llamarApi('/api/push', { accion: 'baja', todos: true }).catch(e => console.warn('No se pudieron borrar las suscripciones push:', e.codigo || e.message));
  if (esAppNativa()) {
    await pushNativo.borrarToken();
    pushNativo.olvidar();
    return;
  }
  const suscripcion = await suscripcionActual().catch(() => null);
  if (suscripcion) await suscripcion.unsubscribe().catch(() => {});
};

const probarPush = async boton => {
  boton.disabled = true;
  try {
    const { enviados } = await llamarApi('/api/push', { accion: 'prueba' });
    if (enviados > 0) avisar('Te mandamos un aviso de prueba. Si no lo ves, revisá que las notificaciones del sistema no estén silenciadas.', 7000);
    else avisarError('No encontramos este dispositivo. Desactivá y volvé a activar las notificaciones.');
  } catch (e) {
    console.error('No se pudo mandar el aviso de prueba:', e);
    avisarError('No se pudo mandar el aviso de prueba. Probá de nuevo en un minuto.');
  } finally {
    boton.disabled = false;
  }
};

export const reiniciarPush = () => {
  clave = '';
  sincronizada = false;
  pintarPush();
};

export const instalarPush = () => {
  // El service worker hace instalable la app aunque no se activen las notificaciones.
  if (!esAppNativa()) registrarServiceWorker();
  // En la app de Android: si Google renueva el token y estaban activadas, se actualiza.
  else pushNativo.alRenovarToken(token => {
    const anterior = pushNativo.guardado();
    if (!anterior || anterior === token) return;
    llamarApi('/api/push', { accion: 'baja', token: anterior }).catch(() => {});
    llamarApi('/api/push', { accion: 'alta', token }).then(() => pushNativo.guardar(token)).catch(() => {});
  }).catch(() => {});
  document.addEventListener('dealit:plan', () => pintarPush());
  registrarAcciones({
    'activar-push': boton => activarPush(boton),
    'desactivar-push': async boton => {
      boton.disabled = true;
      await desactivarPushEnEsteDispositivo();
      boton.disabled = false;
      avisar('Listo: este dispositivo ya no recibe avisos.');
      pintarPush();
    },
    'probar-push': boton => probarPush(boton)
  });
};
