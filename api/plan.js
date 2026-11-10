// POST /api/plan {} — le dice a la app si los planes están activos para esta cuenta
// (ver api/_lib/planes-activos.js). Con los planes apagados no se muestra «Tu plan».
// También si la IA está configurada (ANTHROPIC_API_KEY): si no, la app oculta sus botones.
// Y la clave pública de las notificaciones push ('' si no están configuradas).
import { sesionDeLaSolicitud } from './_lib/firebase-admin.js';
import { fallar, leerPost, responder } from './_lib/http.js';
import { planesActivosPara } from './_lib/planes-activos.js';
import { clavePublicaPush } from './_lib/push.js';

export const crearHandler = ({ sesionDe, planesActivos, iaDisponible = () => !!process.env.ANTHROPIC_API_KEY, clavePush = () => clavePublicaPush() }) => async (req, res) => {
  if (!leerPost(req, res)) return;
  try {
    const sesion = await sesionDe(req);
    if (!sesion) return responder(res, 401, { error: 'sin-sesion' });
    return responder(res, 200, { activos: planesActivos(sesion.email), ia: iaDisponible(), push: clavePush() });
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({ sesionDe: sesionDeLaSolicitud, planesActivos: planesActivosPara });
