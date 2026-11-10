// Notificaciones push en este dispositivo (Mi cuenta): registra el service worker
// (public/sw.js), pide permiso, suscribe el navegador y se lo pasa al servidor
// (api/push). Qué avisos llegan y a quién lo decide el servidor (api/_lib/avisos.js).
// En el celular dependen de que la app esté instalada (en iPhone es obligatorio).

import { $ } from '../lib/formato.js';
import { ctx } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarError, avisarExito } from './avisos.js';
import { llamarApi } from './api.js';

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

const pintarPush = async () => {
  const tarjeta = $('#tarjeta-push');
  if (!tarjeta) return;
  tarjeta.hidden = !clave;
  if (!clave) return;
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
  // En Gratis el botón ofrece Pro: los avisos son de Pro.
  activar.dataset.accion = ctx.restringido ? 'ofrecer-pro' : 'activar-push';
  activar.dataset.motivo = 'seguimiento';
  activar.textContent = ctx.restringido ? 'Activar con Pro' : 'Activar en este dispositivo';
  mostrar(ctx.restringido
    ? 'Con Dealit Pro te avisamos al instante, en el celular o la computadora, cuando tu cliente abre o acepta una propuesta.'
    : `Te avisamos al instante cuando tu cliente abre o acepta una propuesta.${esIOS() || /Android/i.test(navigator.userAgent) ? ' Para que lleguen siempre, instalá Dealit en tu pantalla de inicio.' : ''}`, { conActivar: true });
};

// La pide plan.js cuando /api/plan responde.
export const configurarPush = clavePublica => {
  clave = typeof clavePublica === 'string' ? clavePublica : '';
  pintarPush();
};

const activarPush = async boton => {
  if (!clave || !soportaPush()) return;
  boton.disabled = true;
  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      avisar(permiso === 'denied'
        ? 'Bloqueaste las notificaciones. Podés habilitarlas desde la configuración del sitio.'
        : 'No activamos las notificaciones. Podés hacerlo cuando quieras desde acá.', 7000);
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
  const suscripcion = await suscripcionActual().catch(() => null);
  if (!suscripcion) return;
  await llamarApi('/api/push', { accion: 'baja', endpoint: suscripcion.endpoint }).catch(e => console.warn('No se pudo dar de baja la suscripción push:', e.codigo || e.message));
  await suscripcion.unsubscribe().catch(() => {});
};

// Al eliminar la cuenta: ningún dispositivo sigue suscripto.
export const desactivarPushEnTodos = async () => {
  await llamarApi('/api/push', { accion: 'baja', todos: true }).catch(e => console.warn('No se pudieron borrar las suscripciones push:', e.codigo || e.message));
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
  registrarServiceWorker();
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
