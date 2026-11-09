// POST /api/sincronizar {} — respaldo del webhook: el servidor le pregunta directamente a
// Mercado Pago por las suscripciones de esta cuenta y actualiza planes/{uid}. Lo llama la
// app al volver del pago y con «Ya pagué, actualizar mi plan». El navegador no decide nada:
// el estado sale de Mercado Pago, consultado con el token del servidor.
import { planDesdeSuscripcion } from '../src/planes.js';
import { FieldValue, firestore, sesionDeLaSolicitud } from './_lib/firebase-admin.js';
import { fallar, leerPost, responder } from './_lib/http.js';
import { buscarSuscripciones } from './_lib/mercadopago.js';
import { planesActivosPara } from './_lib/planes-activos.js';

// La que importa: una activa si hay; si no, la más nueva (que ya viene primera).
const elegirSuscripcion = lista => lista.find(s => s.status === 'authorized') || lista[0] || null;

export const crearHandler = ({ db, sesionDe, planesActivos, mp }) => async (req, res) => {
  if (!leerPost(req, res)) return;
  try {
    const sesion = await sesionDe(req);
    if (!sesion) return responder(res, 401, { error: 'sin-sesion' });
    if (!planesActivos(sesion.email)) return responder(res, 403, { error: 'planes-inactivos' });

    const suscripcion = elegirSuscripcion(await mp.buscarSuscripciones(sesion.uid));
    if (!suscripcion) return responder(res, 200, { encontrada: false });
    // Doble control: la suscripción tiene que ser de esta cuenta.
    if (String(suscripcion.external_reference) !== sesion.uid) return responder(res, 200, { encontrada: false });

    const ref = db().collection('planes').doc(sesion.uid);
    const plan = await db().runTransaction(async tx => {
      const snap = await tx.get(ref);
      const nuevo = planDesdeSuscripcion(suscripcion, snap.exists ? snap.data() : {});
      tx.set(ref, { ...nuevo, actualizado: FieldValue.serverTimestamp() }, { merge: true });
      return nuevo;
    });
    return responder(res, 200, { encontrada: true, plan });
  } catch (e) {
    if (e?.estado >= 400 && e?.estado < 500) {
      console.error('Mercado Pago rechazó la búsqueda de suscripciones:', e.datos);
      return responder(res, 502, { error: 'mercadopago-rechazo', detalle: String(e.datos?.message || '').slice(0, 200) });
    }
    return fallar(res, e);
  }
};

export default crearHandler({
  db: firestore,
  sesionDe: sesionDeLaSolicitud,
  planesActivos: planesActivosPara,
  mp: { buscarSuscripciones }
});
