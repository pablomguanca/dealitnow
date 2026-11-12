// POST /api/plan {} — le dice a la app si los planes están activos para esta cuenta
// (ver api/_lib/planes-activos.js). Con los planes apagados no se muestra «Tu plan».
// También si la IA está configurada (ANTHROPIC_API_KEY): si no, la app oculta sus botones.
// Y la clave pública de las notificaciones push ('' si no están configuradas).
// Y si la cuenta es Pro según el servidor (planes/{uid}): la app lo usa además del plan que
// lee de Firestore, así una lectura que tarda o falla nunca trata a un Pro como Gratis.
import { firestore, sesionDeLaSolicitud } from './_lib/firebase-admin.js';
import { esPro } from '../src/planes.js';
import { fallar, leerPost, responder } from './_lib/http.js';
import { planesActivosPara } from './_lib/planes-activos.js';
import { clavePublicaPush } from './_lib/push.js';

const proDe = async (db, uid) => {
  const snap = await db().collection('planes').doc(uid).get();
  return snap.exists ? esPro(snap.data()) : false;
};

export const crearHandler = ({ sesionDe, planesActivos, iaDisponible = () => !!process.env.ANTHROPIC_API_KEY, clavePush = () => clavePublicaPush(), db = firestore, esProDe = proDe }) => async (req, res) => {
  if (!leerPost(req, res)) return;
  try {
    const sesion = await sesionDe(req);
    if (!sesion) return responder(res, 401, { error: 'sin-sesion' });
    const pro = await esProDe(db, sesion.uid).catch(e => {
      console.warn('No se pudo leer el plan:', e.message);
      return false;
    });
    return responder(res, 200, { activos: planesActivos(sesion.email), ia: iaDisponible(), push: clavePush(), pro });
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({ sesionDe: sesionDeLaSolicitud, planesActivos: planesActivosPara });
