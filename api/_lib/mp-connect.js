// Mercado Pago de cada freelancer (OAuth): vincula su cuenta con Dealit y crea los pagos de
// sus propuestas con su propio token, así la plata va directo a su cuenta (no a la de Dealit).
// Necesita las credenciales de la aplicación de Dealit en Mercado Pago (variables de entorno
// MP_CLIENT_ID y MP_CLIENT_SECRET) y que en esa aplicación esté cargada la URL de
// redireccionamiento https://<dominio>/api/cobro-mp. Sin ellas, la opción no se ofrece.
//
// Los tokens de cada freelancer se guardan cifrados (AES-256-GCM) en mpCuentas/{uid}, que el
// navegador no puede leer ni escribir (cae en la regla general que lo niega todo).
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const API = 'https://api.mercadopago.com';
const AUTORIZACION = 'https://auth.mercadopago.com.ar/authorization';
const VIGENCIA_ESTADO_MS = 15 * 60 * 1000;
// El token dura 180 días; se renueva cuando le queda menos que esto.
const MARGEN_RENOVACION_MS = 7 * 24 * 60 * 60 * 1000;

export const credenciales = (entorno = process.env) =>
  entorno.MP_CLIENT_ID && entorno.MP_CLIENT_SECRET ? { id: entorno.MP_CLIENT_ID, secreto: entorno.MP_CLIENT_SECRET } : null;

const b64url = buf => Buffer.from(buf).toString('base64url');

// «state» del OAuth: identifica la cuenta de Dealit que pidió vincular y vence en 15 minutos.
// Va firmado, así nadie puede vincular su Mercado Pago a la cuenta de otro.
export const firmarEstado = (uid, { secreto, ahora = Date.now() }) => {
  const cuerpo = b64url(JSON.stringify({ u: uid, n: b64url(randomBytes(9)), e: ahora + VIGENCIA_ESTADO_MS }));
  const firma = createHmac('sha256', secreto).update(cuerpo).digest('base64url');
  return `${cuerpo}.${firma}`;
};

export const verificarEstado = (estado, { secreto, ahora = Date.now() }) => {
  const [cuerpo, firma] = String(estado || '').split('.');
  if (!cuerpo || !firma) return null;
  const esperada = createHmac('sha256', secreto).update(cuerpo).digest('base64url');
  const a = Buffer.from(esperada);
  const b = Buffer.from(firma);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { u, e } = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
    return typeof u === 'string' && u && Number(e) > ahora ? u : null;
  } catch {
    return null;
  }
};

export const urlAutorizacion = ({ clienteId, estado, redirectUri }) =>
  `${AUTORIZACION}?client_id=${encodeURIComponent(clienteId)}&response_type=code&platform_id=mp&state=${encodeURIComponent(estado)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

// Cifrado de los tokens guardados. La clave sale del secreto de la aplicación: si se cambia,
// cada freelancer tiene que volver a vincular su cuenta.
const clave = secreto => createHash('sha256').update(`dealit-mp-tokens:${secreto}`).digest();
export const cifrar = (texto, secreto) => {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', clave(secreto), iv);
  const datos = Buffer.concat([c.update(String(texto), 'utf8'), c.final()]);
  return `${b64url(iv)}.${b64url(c.getAuthTag())}.${b64url(datos)}`;
};
export const descifrar = (guardado, secreto) => {
  const [iv, tag, datos] = String(guardado || '').split('.');
  const d = createDecipheriv('aes-256-gcm', clave(secreto), Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([d.update(Buffer.from(datos, 'base64url')), d.final()]).toString('utf8');
};

const pedir = async (fetchFn, ruta, { method = 'GET', body, token } = {}) => {
  const r = await fetchFn(`${API}${ruta}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000)
  });
  const datos = await r.json().catch(() => null);
  if (!r.ok) throw Object.assign(new Error(`Mercado Pago ${r.status}: ${datos?.message || datos?.error || 'sin detalle'}`), { estado: r.status, datos });
  return datos;
};

// Cambia el código de la vuelta del OAuth (o el refresh token) por el token del freelancer.
export const pedirToken = (fetchFn, { id, secreto }, datos) =>
  pedir(fetchFn, '/oauth/token', { method: 'POST', body: { client_id: id, client_secret: secreto, ...datos } });

export const datosDeLaCuenta = (fetchFn, token) => pedir(fetchFn, '/users/me', { token });

export const crearPreferencia = (fetchFn, token, preferencia) =>
  pedir(fetchFn, '/checkout/preferences', { method: 'POST', body: preferencia, token });

export const cuentasMp = db => db().collection('mpCuentas');

// Lo que se guarda de la cuenta del freelancer (tokens cifrados).
export const registroDeCuenta = ({ respuesta, cuenta, secreto, ahora = Date.now() }) => ({
  mpUserId: String(respuesta.user_id ?? cuenta?.id ?? ''),
  nombre: String(cuenta?.nickname || '').slice(0, 120),
  email: String(cuenta?.email || '').slice(0, 200),
  token: cifrar(respuesta.access_token, secreto),
  refresh: respuesta.refresh_token ? cifrar(respuesta.refresh_token, secreto) : '',
  vence: ahora + (Number(respuesta.expires_in) || 15552000) * 1000,
  produccion: respuesta.live_mode !== false
});

// Token vigente de la cuenta guardada (lo renueva si está por vencer). null si no hay cuenta.
export const tokenVigente = async ({ db, uid, cred, fetchFn = fetch, ahora = Date.now() }) => {
  const ref = cuentasMp(db).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const guardada = snap.data();
  if (Number(guardada.vence) - ahora > MARGEN_RENOVACION_MS || !guardada.refresh) return descifrar(guardada.token, cred.secreto);
  const respuesta = await pedirToken(fetchFn, cred, { grant_type: 'refresh_token', refresh_token: descifrar(guardada.refresh, cred.secreto) });
  await ref.set({ ...guardada, ...registroDeCuenta({ respuesta, cuenta: { nickname: guardada.nombre, email: guardada.email, id: guardada.mpUserId }, secreto: cred.secreto, ahora }) });
  return respuesta.access_token;
};
