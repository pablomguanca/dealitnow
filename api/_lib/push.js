// Notificaciones push al dueño (Web Push estándar con claves VAPID): el mismo aviso que el
// email, pero al instante, en cada dispositivo donde las activó desde Mi cuenta.
// Las suscripciones viven en push/{uid}/dispositivos/{id}: las escribe solo el servidor
// (api/push), las reglas no dejan que el navegador las toque.
// Sin VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY no se manda nada y la app no ofrece activarlas.
import { createHash } from 'node:crypto';

export const MAX_DISPOSITIVOS = 10;

// Clave pública para que el navegador se suscriba ('' si push no está configurado).
export const clavePublicaPush = (entorno = process.env) =>
  entorno.VAPID_PUBLIC_KEY && entorno.VAPID_PRIVATE_KEY ? entorno.VAPID_PUBLIC_KEY : '';

export const idDispositivo = endpoint => createHash('sha256').update(String(endpoint)).digest('hex').slice(0, 40);

// Solo servicios de push de los navegadores: el servidor le manda pedidos a esa URL, así que
// no se acepta cualquier dirección (Chrome/Android/Edge, Firefox, Safari y Windows).
const SERVICIOS_PUSH = /^(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)$/;
const CLAVE_B64 = /^[A-Za-z0-9_-]+={0,2}$/;

// Normaliza la suscripción que manda el navegador (PushSubscription.toJSON()), o null.
export const suscripcionValida = s => {
  if (!s || typeof s !== 'object') return null;
  const { endpoint, keys } = s;
  if (typeof endpoint !== 'string' || endpoint.length > 1024) return null;
  let url;
  try { url = new URL(endpoint); } catch { return null; }
  if (url.protocol !== 'https:' || !SERVICIOS_PUSH.test(url.hostname)) return null;
  const { p256dh, auth } = keys || {};
  const claveOk = (k, largo) => typeof k === 'string' && k.length <= largo && CLAVE_B64.test(k);
  if (!claveOk(p256dh, 200) || !claveOk(auth, 64)) return null;
  return { endpoint, keys: { p256dh, auth } };
};

export const dispositivosDe = (db, uid) => db().collection('push').doc(uid).collection('dispositivos');

// Manda el mensaje ({ titulo, cuerpo, url, tag }) a todos los dispositivos del dueño.
// Las suscripciones vencidas (404 o 410) se borran. Devuelve cuántos llegaron.
export const crearEnviadorPush = ({
  entorno = process.env,
  cargarWebPush = () => import('web-push').then(m => m.default || m)
} = {}) => async ({ db, uid, mensaje }) => {
  const publica = clavePublicaPush(entorno);
  if (!publica || !uid) return 0;
  const snap = await dispositivosDe(db, uid).get();
  if (snap.empty) return 0;
  const webpush = await cargarWebPush();
  const opciones = {
    vapidDetails: {
      subject: entorno.VAPID_SUBJECT || entorno.APP_URL || 'https://dealit.com.ar',
      publicKey: publica,
      privateKey: entorno.VAPID_PRIVATE_KEY
    },
    TTL: 60 * 60 * 24,
    urgency: 'high',
    timeout: 5000
  };
  const carga = JSON.stringify(mensaje);
  let enviados = 0;
  await Promise.all(snap.docs.map(async d => {
    try {
      await webpush.sendNotification(d.get('suscripcion'), carga, opciones);
      enviados++;
    } catch (e) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await d.ref.delete().catch(() => {});
      else console.error('No se pudo mandar un aviso push:', e?.statusCode || '', e?.body || e?.message);
    }
  }));
  return enviados;
};

export const enviarPush = crearEnviadorPush();
