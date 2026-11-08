// POST /api/suscripcion { periodo: 'mensual' | 'anual', emailPago? } — crea la suscripción
// a Pro en Mercado Pago y devuelve el link donde la persona paga. El plan NO se activa
// acá: lo activa /api/mercadopago cuando Mercado Pago confirma el pago.
import { PRECIOS_PRO, esPro } from '../src/planes.js';
import { firestore, sesionDeLaSolicitud } from './_lib/firebase-admin.js';
import { planesActivosPara } from './_lib/planes-activos.js';
import { fallar, leerPost, responder } from './_lib/http.js';
import { crearSuscripcion } from './_lib/mercadopago.js';

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export const crearHandler = ({ db, sesionDe, planesActivos, mp, urlApp, ahora = () => new Date() }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  const precio = PRECIOS_PRO[cuerpo.periodo];
  if (!precio) return responder(res, 400, { error: 'periodo-invalido' });

  try {
    const sesion = await sesionDe(req);
    if (!sesion) return responder(res, 401, { error: 'sin-sesion' });
    if (!planesActivos(sesion.email)) return responder(res, 403, { error: 'planes-inactivos' });
    const { uid } = sesion;
    const [snapPlan, snapUsuario] = await Promise.all([
      db().collection('planes').doc(uid).get(),
      db().collection('users').doc(uid).get()
    ]);
    const plan = snapPlan.exists ? snapPlan.data() : {};
    if (esPro(plan, ahora()) && plan.estado === 'activa') return responder(res, 409, { error: 'ya-es-pro' });

    // Mercado Pago pide el email de la cuenta con la que se va a pagar.
    const email = String(cuerpo.emailPago || (snapUsuario.exists && snapUsuario.data().email) || '').trim().toLowerCase();
    if (!EMAIL.test(email)) return responder(res, 400, { error: 'email-invalido' });

    const suscripcion = await mp.crearSuscripcion({
      reason: `Dealit Pro (${precio.nombre})`,
      external_reference: uid,
      payer_email: email,
      auto_recurring: {
        frequency: precio.meses,
        frequency_type: 'months',
        transaction_amount: precio.monto,
        currency_id: precio.moneda
      },
      back_url: `${urlApp(req)}/cuenta?suscripcion=volver`,
      status: 'pending'
    });
    if (!suscripcion?.init_point) throw new Error('Mercado Pago no devolvió el link de pago');
    return responder(res, 200, { url: suscripcion.init_point });
  } catch (e) {
    if (e?.estado >= 400 && e?.estado < 500) {
      console.error('Mercado Pago rechazó la suscripción:', e.datos);
      const detalle = String(e.datos?.message || e.datos?.error || '').slice(0, 200);
      return responder(res, 502, { error: 'mercadopago-rechazo', detalle });
    }
    return fallar(res, e);
  }
};

// La URL de vuelta tiene que ser https. En producción conviene fijarla con APP_URL.
const urlApp = req => process.env.APP_URL || `https://${req.headers?.host || 'dealitnow.vercel.app'}`;

export default crearHandler({ db: firestore, sesionDe: sesionDeLaSolicitud, planesActivos: planesActivosPara, mp: { crearSuscripcion }, urlApp });
