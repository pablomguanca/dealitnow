// POST /api/activar { id } — el dueño activa el link de su propuesta. El límite del plan
// se controla acá: en Gratis, hasta LIMITE_ENVIOS_GRATIS propuestas nuevas por mes.
// Una propuesta que ya se envió alguna vez se puede volver a activar sin contar de nuevo.
// En Gratis tampoco se envían diseños ni plantillas PRO, y el link lleva la marca de Dealit
// (campo marca, que lee la vista del cliente).
// Con los planes apagados (ver _lib/planes-activos.js) los envíos se cuentan pero no se frenan.
import { ID_PROPUESTA } from '../src/aceptacion.js';
import { LIMITE_ENVIOS_GRATIS, enviosDelMes, esPro, mesDe, usosPro } from '../src/planes.js';
import { FieldValue, firestore, sesionDeLaSolicitud } from './_lib/firebase-admin.js';
import { planesActivosPara } from './_lib/planes-activos.js';
import { ErrorHttp, fallar, leerPost, responder } from './_lib/http.js';

export const crearHandler = ({ db, sesionDe, planesActivos, ahora = () => new Date() }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  if (typeof cuerpo.id !== 'string' || !ID_PROPUESTA.test(cuerpo.id)) return responder(res, 400, { error: 'id-invalido' });

  try {
    const sesion = await sesionDe(req);
    if (!sesion) return responder(res, 401, { error: 'sin-sesion' });
    const { uid } = sesion;
    const conLimite = planesActivos(sesion.email);
    const refPropuesta = db().collection('proposals').doc(cuerpo.id);
    const refPlan = db().collection('planes').doc(uid);
    const resultado = await db().runTransaction(async tx => {
      const [snapPropuesta, snapPlan] = await Promise.all([tx.get(refPropuesta), tx.get(refPlan)]);
      const doc = snapPropuesta.exists ? snapPropuesta.data() : null;
      if (!doc) throw new ErrorHttp(404, 'no-existe');
      if (doc.userId !== uid) throw new ErrorHttp(403, 'ajena');

      const plan = snapPlan.exists ? snapPlan.data() : {};
      const momento = ahora();
      const pro = esPro(plan, momento) || !conLimite;
      const usados = enviosDelMes(plan, momento);
      const primeraVez = !doc.enviadaEn;
      if (doc.publico === true) {
        if (doc.marca !== !pro) tx.update(refPropuesta, { marca: !pro });
        return { primeraVez: false, usados, pro };
      }
      if (!pro && usosPro(doc.payload).length) throw new ErrorHttp(403, 'diseno-pro');
      if (primeraVez && !pro && usados >= LIMITE_ENVIOS_GRATIS) throw new ErrorHttp(403, 'limite-envios');

      const cambios = { publico: true, marca: !pro, updatedAt: FieldValue.serverTimestamp() };
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

export default crearHandler({ db: firestore, sesionDe: sesionDeLaSolicitud, planesActivos: planesActivosPara });
