// POST /api/activar { id } — el dueño activa el link de su propuesta. El límite del plan
// se controla acá: en Gratis, hasta LIMITE_ENVIOS_GRATIS propuestas nuevas por mes.
// Una propuesta que ya se envió alguna vez se puede volver a activar sin contar de nuevo.
import { ID_PROPUESTA } from '../src/aceptacion.js';
import { LIMITE_ENVIOS_GRATIS, enviosDelMes, esPro, mesDe } from '../src/planes.js';
import { FieldValue, firestore, uidDeLaSolicitud } from './_lib/firebase-admin.js';
import { ErrorHttp, fallar, leerPost, responder } from './_lib/http.js';

export const crearHandler = ({ db, uidDe, ahora = () => new Date() }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  if (typeof cuerpo.id !== 'string' || !ID_PROPUESTA.test(cuerpo.id)) return responder(res, 400, { error: 'id-invalido' });

  try {
    const uid = await uidDe(req);
    if (!uid) return responder(res, 401, { error: 'sin-sesion' });
    const refPropuesta = db().collection('proposals').doc(cuerpo.id);
    const refPlan = db().collection('planes').doc(uid);
    const resultado = await db().runTransaction(async tx => {
      const [snapPropuesta, snapPlan] = await Promise.all([tx.get(refPropuesta), tx.get(refPlan)]);
      const doc = snapPropuesta.exists ? snapPropuesta.data() : null;
      if (!doc) throw new ErrorHttp(404, 'no-existe');
      if (doc.userId !== uid) throw new ErrorHttp(403, 'ajena');

      const plan = snapPlan.exists ? snapPlan.data() : {};
      const momento = ahora();
      const pro = esPro(plan, momento);
      const usados = enviosDelMes(plan, momento);
      const primeraVez = !doc.enviadaEn;
      if (doc.publico === true) return { primeraVez: false, usados, pro };
      if (primeraVez && !pro && usados >= LIMITE_ENVIOS_GRATIS) throw new ErrorHttp(403, 'limite-envios');

      const cambios = { publico: true, updatedAt: FieldValue.serverTimestamp() };
      if (!doc.status || doc.status === 'draft') cambios.status = 'sent';
      if (primeraVez) cambios.enviadaEn = FieldValue.serverTimestamp();
      tx.update(refPropuesta, cambios);
      if (primeraVez) tx.set(refPlan, { envios: { [mesDe(momento)]: usados + 1 } }, { merge: true });
      return { primeraVez, usados: primeraVez ? usados + 1 : usados, pro };
    });
    return responder(res, 200, { ...resultado, limite: resultado.pro ? null : LIMITE_ENVIOS_GRATIS });
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({ db: firestore, uidDe: uidDeLaSolicitud });
