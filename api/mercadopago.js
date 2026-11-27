// POST /api/mercadopago — avisos (webhooks) de Mercado Pago. Dos circuitos distintos, en una
// sola función por el límite de Vercel:
//   · Sin ?cobro: suscripciones de Dealit Pro (lo que el freelancer le paga a Dealit).
//   · Con ?cobro=<id de propuesta>: pagos que un cliente le hace al freelancer con su Mercado
//     Pago vinculado (notification_url de la preferencia, ver api/cobro-mp). Se registran en
//     pagos/{id} (ver _lib/cobros-mp.js y src/pagos.js).
// Cada aviso se verifica con la firma y, aun así, no se le cree: se consulta el estado real
// a Mercado Pago antes de tocar nada. Responder 200 rápido evita reintentos; un error de
// Mercado Pago responde 500 para que lo reintente.
import { planDesdeSuscripcion } from '../src/planes.js';
import { fundadorAlSuscribirse } from '../src/fundadores.js';
import { ID_PROPUESTA } from '../src/aceptacion.js';
import { ID_PAGO_MP } from '../src/pagos.js';
import { FieldValue, firestore } from './_lib/firebase-admin.js';
import { fallar, responder } from './_lib/http.js';
import { firmaValida, obtenerPagoDeSuscripcion, obtenerSuscripcion } from './_lib/mercadopago.js';
import { credenciales } from './_lib/mp-connect.js';
import { verificarPago as verificarPagoReal } from './_lib/cobros-mp.js';
import { crearAvisador, urlAppDe } from './_lib/avisos.js';
import { planesActivosPara } from './_lib/planes-activos.js';

const UID = /^[A-Za-z0-9]{10,128}$/;

// Los avisos de los cobros llegan a la aplicación de Dealit que hace el OAuth (MP_CLIENT_ID):
// su clave secreta de webhooks va en MP_COBROS_WEBHOOK_SECRET. Si es la misma aplicación
// que la de las suscripciones, alcanza con MP_WEBHOOK_SECRET.
export const firmaCobroValida = (datos, entorno = process.env) =>
  firmaValida({ ...datos, secreto: entorno.MP_COBROS_WEBHOOK_SECRET || entorno.MP_WEBHOOK_SECRET });

export const crearHandler = ({
  db, mp, verificarFirma, ahora = () => new Date(),
  verificarFirmaCobro = firmaCobroValida, verificarPago = verificarPagoReal, avisar = async () => {},
  entorno = process.env, fetchFn = fetch
}) => async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return responder(res, 405, { error: 'metodo-no-permitido' });
  }
  const tipo = req.query?.type || req.body?.type || '';
  // Mercado Pago firma el data.id que va en la URL del aviso.
  const idDato = String(req.query?.['data.id'] || req.body?.data?.id || '');
  if (!idDato) return responder(res, 400, { error: 'sin-dato' });
  const firma = { firma: req.headers?.['x-signature'], idSolicitud: req.headers?.['x-request-id'], idDato };

  // ---------- Cobros de los freelancers ----------
  if (req.query?.cobro !== undefined) {
    if (!verificarFirmaCobro(firma)) return responder(res, 401, { error: 'firma-invalida' });
    const propuestaId = String(req.query.cobro);
    if (!ID_PROPUESTA.test(propuestaId)) return responder(res, 200, { ok: true, ignorado: 'propuesta-invalida' });
    // Solo los pagos: los demás avisos (órdenes, etc.) no cambian nada.
    if (tipo !== 'payment' || !ID_PAGO_MP.test(idDato)) return responder(res, 200, { ok: true, ignorado: 'otro-aviso' });
    const cred = credenciales(entorno);
    if (!cred) return responder(res, 200, { ok: true, ignorado: 'mp-no-configurado' });
    try {
      const r = await verificarPago({ db, propuestaId, pagoId: idDato, cred, fetchFn, ahora: ahora().getTime(), avisar, urlApp: urlAppDe(req) });
      return responder(res, 200, { ok: true, ...r });
    } catch (e) {
      console.error('No se pudo verificar el pago con Mercado Pago:', e.message);
      return responder(res, 500, { error: 'reintentar' });
    }
  }

  // ---------- Suscripciones de Dealit Pro ----------
  if (!verificarFirma(firma)) return responder(res, 401, { error: 'firma-invalida' });

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
      // Primera suscripción de un Fundador: usó su mes gratis y la tarifa corre desde acá.
      const fundador = fundadorAlSuscribirse(actual, suscripcion, ahora());
      tx.set(ref, {
        ...planDesdeSuscripcion(suscripcion, actual),
        ...(fundador ? { fundador } : {}),
        actualizado: FieldValue.serverTimestamp()
      }, { merge: true });
    });
    return responder(res, 200, { ok: true });
  } catch (e) {
    // Lo que no existe en Mercado Pago (como el aviso de prueba del panel, con id 123456)
    // no se arregla reintentando: 200 para que no lo vuelva a mandar.
    if (e?.estado === 404) return responder(res, 200, { ok: true, ignorado: 'no-existe' });
    return fallar(res, e);
  }
};

export default crearHandler({
  db: firestore,
  mp: { obtenerSuscripcion, obtenerPagoDeSuscripcion },
  verificarFirma: firmaValida,
  avisar: crearAvisador({ db: firestore, planesActivos: planesActivosPara })
});
