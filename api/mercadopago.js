// POST /api/mercadopago — avisos (webhooks) de Mercado Pago sobre suscripciones. Cada aviso
// se verifica con la firma y, aun así, no se le cree: se consulta el estado real de la
// suscripción a Mercado Pago antes de tocar el plan. Responder 200 rápido evita reintentos.
import { planDesdeSuscripcion } from '../src/planes.js';
import { FieldValue, firestore } from './_lib/firebase-admin.js';
import { fallar, responder } from './_lib/http.js';
import { firmaValida, obtenerPagoDeSuscripcion, obtenerSuscripcion } from './_lib/mercadopago.js';

const UID = /^[A-Za-z0-9]{10,128}$/;

export const crearHandler = ({ db, mp, verificarFirma }) => async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return responder(res, 405, { error: 'metodo-no-permitido' });
  }
  const tipo = req.query?.type || req.body?.type || '';
  const idDato = String(req.query?.['data.id'] || req.body?.data?.id || '');
  if (!idDato) return responder(res, 400, { error: 'sin-dato' });
  if (!verificarFirma({ firma: req.headers?.['x-signature'], idSolicitud: req.headers?.['x-request-id'], idDato })) {
    return responder(res, 401, { error: 'firma-invalida' });
  }

  try {
    let idSuscripcion = null;
    if (tipo === 'subscription_preapproval') idSuscripcion = idDato;
    else if (tipo === 'subscription_authorized_payment') idSuscripcion = (await mp.obtenerPagoDeSuscripcion(idDato))?.preapproval_id;
    // Otros avisos no cambian el plan.
    if (!idSuscripcion) return responder(res, 200, { ok: true });

    const suscripcion = await mp.obtenerSuscripcion(idSuscripcion);
    const uid = String(suscripcion?.external_reference || '');
    if (!UID.test(uid)) return responder(res, 200, { ok: true, ignorado: 'sin-usuario' });

    const ref = db().collection('planes').doc(uid);
    await db().runTransaction(async tx => {
      const snap = await tx.get(ref);
      const actual = snap.exists ? snap.data() : {};
      // Un aviso viejo de otra suscripción no pisa la vigente.
      if (actual.mpSuscripcionId && actual.mpSuscripcionId !== String(suscripcion.id) && actual.estado === 'activa' && suscripcion.status !== 'authorized') return;
      tx.set(ref, { ...planDesdeSuscripcion(suscripcion, actual), actualizado: FieldValue.serverTimestamp() }, { merge: true });
    });
    return responder(res, 200, { ok: true });
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({
  db: firestore,
  mp: { obtenerSuscripcion, obtenerPagoDeSuscripcion },
  verificarFirma: firmaValida
});
