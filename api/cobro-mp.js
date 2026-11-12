// /api/cobro-mp — cobrar las propuestas con el Mercado Pago de cada freelancer (ver
// _lib/mp-connect.js). Una sola función para todo (el plan de Vercel limita la cantidad):
//   GET  ?code&state                     vuelta del OAuth: guarda la cuenta y vuelve a la app
//   POST { accion: 'vincular' }          (dueño) devuelve la URL para autorizar en Mercado Pago
//   POST { accion: 'estado' }            (dueño) si está configurado y si su cuenta está vinculada
//   POST { accion: 'desvincular' }       (dueño) borra la cuenta vinculada
//   POST { accion: 'pagar', id }         (cliente) link de pago del primer pago de una propuesta
//                                        aceptada; el monto lo calcula el servidor
import { ID_PROPUESTA } from '../src/aceptacion.js';
import { normalizarCobro, normalizarPropuesta, primerPago, usaMercadoPago } from '../src/modelo.js';
import { FieldValue, firestore, sesionDeLaSolicitud } from './_lib/firebase-admin.js';
import { ErrorHttp, fallar, leerPost, responder } from './_lib/http.js';
import { urlAppDe } from './_lib/avisos.js';
import {
  credenciales, crearPreferencia, cuentasMp, datosDeLaCuenta, firmarEstado, pedirToken,
  registroDeCuenta, tokenVigente, urlAutorizacion, verificarEstado
} from './_lib/mp-connect.js';

const redirigir = (res, url) => {
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 302;
  res.setHeader('Location', url);
  return res.end();
};

export const crearHandler = ({ db, sesionDe, entorno = process.env, fetchFn = fetch, ahora = () => Date.now() }) => async (req, res) => {
  const cred = credenciales(entorno);
  const app = urlAppDe(req);
  const redirectUri = `${app}/api/cobro-mp`;

  // ---------- Vuelta del OAuth ----------
  if (req.method === 'GET') {
    const { code, state, error } = req.query || {};
    if (!cred) return redirigir(res, `${app}/cuenta?mp=no-configurado`);
    if (error || !code) return redirigir(res, `${app}/cuenta?mp=cancelado`);
    const uid = verificarEstado(state, { secreto: cred.secreto, ahora: ahora() });
    if (!uid) return redirigir(res, `${app}/cuenta?mp=vencido`);
    try {
      const respuesta = await pedirToken(fetchFn, cred, { grant_type: 'authorization_code', code: String(code), redirect_uri: redirectUri });
      const cuenta = await datosDeLaCuenta(fetchFn, respuesta.access_token).catch(() => null);
      await cuentasMp(db).doc(uid).set({
        ...registroDeCuenta({ respuesta, cuenta, secreto: cred.secreto, ahora: ahora() }),
        vinculada: FieldValue.serverTimestamp()
      });
      return redirigir(res, `${app}/cuenta?mp=vinculado`);
    } catch (e) {
      console.error('No se pudo vincular la cuenta de Mercado Pago:', e.message);
      return redirigir(res, `${app}/cuenta?mp=error`);
    }
  }

  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  try {
    // ---------- Pagar (cliente, sin sesión) ----------
    if (cuerpo.accion === 'pagar') {
      if (typeof cuerpo.id !== 'string' || !ID_PROPUESTA.test(cuerpo.id)) return responder(res, 400, { error: 'id-invalido' });
      if (!cred) return responder(res, 503, { error: 'mp-no-configurado' });
      const snap = await db().collection('proposals').doc(cuerpo.id).get();
      const doc = snap.exists ? snap.data() : null;
      if (!doc || doc.publico !== true) return responder(res, 404, { error: 'no-disponible' });
      if (!doc.aceptacion) return responder(res, 409, { error: 'sin-aceptar' });
      // Lo aceptado (con los opcionales que eligió el cliente): de ahí sale el monto.
      const contenido = normalizarPropuesta(doc.aceptacion.contenido || doc.payload, { logoValido: () => true });
      if (!usaMercadoPago(normalizarCobro(contenido.cobro).metodo)) return responder(res, 409, { error: 'sin-mercadopago' });
      const moneda = doc.aceptacion.moneda || contenido.inversion.moneda;
      if (moneda !== 'ARS') return responder(res, 409, { error: 'moneda-no-soportada' });
      const pago = primerPago(contenido, doc.aceptacion.inicial);
      if (!pago || !(pago.monto > 0)) return responder(res, 409, { error: 'sin-monto' });
      const token = await tokenVigente({ db, uid: doc.userId, cred, fetchFn, ahora: ahora() });
      if (!token) return responder(res, 409, { error: 'mp-no-vinculado' });
      const titulo = String(contenido.propuesta.titulo || doc.title || 'Propuesta').trim().slice(0, 200);
      const vuelta = `${app}/p/${encodeURIComponent(cuerpo.id)}`;
      const preferencia = await crearPreferencia(fetchFn, token, {
        items: [{ id: cuerpo.id, title: `${titulo} · ${pago.concepto}`.slice(0, 250), quantity: 1, unit_price: pago.monto, currency_id: 'ARS' }],
        external_reference: cuerpo.id,
        back_urls: { success: `${vuelta}?pago=aprobado`, pending: `${vuelta}?pago=pendiente`, failure: `${vuelta}?pago=rechazado` },
        auto_return: 'approved',
        ...(doc.aceptacion.nombre ? { payer: { name: String(doc.aceptacion.nombre).slice(0, 120) } } : {})
      });
      const url = preferencia.init_point || preferencia.sandbox_init_point;
      if (!url) throw new Error('Mercado Pago no devolvió el link de pago');
      return responder(res, 200, { url, monto: pago.monto, concepto: pago.concepto });
    }

    // ---------- Acciones del dueño ----------
    const sesion = await sesionDe(req);
    if (!sesion) return responder(res, 401, { error: 'sin-sesion' });
    const ref = cuentasMp(db).doc(sesion.uid);

    if (cuerpo.accion === 'estado') {
      if (!cred) return responder(res, 200, { configurado: false, vinculado: false });
      const snap = await ref.get();
      const d = snap.exists ? snap.data() : null;
      return responder(res, 200, { configurado: true, vinculado: !!d, nombre: d?.nombre || '', email: d?.email || '', produccion: d ? d.produccion !== false : null });
    }
    if (cuerpo.accion === 'vincular') {
      if (!cred) return responder(res, 503, { error: 'mp-no-configurado' });
      const estado = firmarEstado(sesion.uid, { secreto: cred.secreto, ahora: ahora() });
      return responder(res, 200, { url: urlAutorizacion({ clienteId: cred.id, estado, redirectUri }) });
    }
    if (cuerpo.accion === 'desvincular') {
      await ref.delete();
      return responder(res, 204);
    }
    return responder(res, 400, { error: 'accion-invalida' });
  } catch (e) {
    if (e?.estado && !(e instanceof ErrorHttp)) {
      console.error('Mercado Pago rechazó el pedido:', e.message);
      return responder(res, 502, { error: 'mercadopago-rechazo' });
    }
    return fallar(res, e);
  }
};

export default crearHandler({ db: firestore, sesionDe: sesionDeLaSolicitud });
