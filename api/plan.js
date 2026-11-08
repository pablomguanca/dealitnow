// POST /api/plan {} — le dice a la app si los planes están activos para esta cuenta
// (ver api/_lib/planes-activos.js). Con los planes apagados no se muestra «Tu plan».
import { sesionDeLaSolicitud } from './_lib/firebase-admin.js';
import { fallar, leerPost, responder } from './_lib/http.js';
import { planesActivosPara } from './_lib/planes-activos.js';

export const crearHandler = ({ sesionDe, planesActivos }) => async (req, res) => {
  if (!leerPost(req, res)) return;
  try {
    const sesion = await sesionDe(req);
    if (!sesion) return responder(res, 401, { error: 'sin-sesion' });
    return responder(res, 200, { activos: planesActivos(sesion.email) });
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({ sesionDe: sesionDeLaSolicitud, planesActivos: planesActivosPara });
