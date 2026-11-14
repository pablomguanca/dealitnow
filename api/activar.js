// POST /api/activar { id, tipo? } — el dueño activa (o actualiza) el link de su propuesta
// o, con tipo 'portafolio', de su portfolio. El plan se aplica acá:
// - Gratis: hasta LIMITE_ENVIOS_GRATIS propuestas nuevas por mes. Una que ya se envió se
//   puede volver a activar sin contar de nuevo, pero solo para el mismo cliente
//   (mismoCliente en src/planes.js): mandarla a otro cliente es un envío nuevo (duplicarla).
// - Gratis: el link muestra la versión que se mandó (publicado), no la que se edita. Cada vez
//   que se comparte de nuevo, se actualiza con los últimos cambios. Así un link no se
//   reusa para otra propuesta. Con Pro el link muestra siempre la última versión.
// - Gratis: no se envían diseños ni plantillas PRO, y el link lleva la marca de Dealit
//   (campo marca, que lee la vista del cliente).
// Con los planes apagados (ver _lib/planes-activos.js) los envíos se cuentan pero no se frenan.
import { ID_PROPUESTA } from '../src/aceptacion.js';
import {
  LIMITE_ENVIOS_GRATIS, clienteDe, enviosDelMes, esPro, mesDe, mismoCliente, tieneCliente, usosPro
} from '../src/planes.js';
import { FieldValue, firestore, sesionDeLaSolicitud } from './_lib/firebase-admin.js';
import { planesActivosPara } from './_lib/planes-activos.js';
import { ErrorHttp, fallar, leerPost, responder } from './_lib/http.js';

// Lo que ve el cliente: congelado en Gratis, en vivo con Pro.
const versionDelLink = (pro, payload) => (pro
  ? { marca: false, publicado: FieldValue.delete(), publicadoEn: FieldValue.delete() }
  : { marca: true, publicado: payload, publicadoEn: FieldValue.serverTimestamp() });

const activarPortafolio = async ({ db, uid, id, pro }) => {
  const ref = db().collection('portfolios').doc(id);
  await db().runTransaction(async tx => {
    const snap = await tx.get(ref);
    const doc = snap.exists ? snap.data() : null;
    if (!doc) throw new ErrorHttp(404, 'no-existe');
    if (doc.userId !== uid) throw new ErrorHttp(403, 'ajena');
    if (!pro && usosPro(doc.payload, { esPortafolio: true }).length) throw new ErrorHttp(403, 'diseno-pro');
    tx.update(ref, { publico: true, ...versionDelLink(pro, doc.payload || {}), updatedAt: FieldValue.serverTimestamp() });
  });
  return { primeraVez: false, usados: 0, pro };
};

export const crearHandler = ({ db, sesionDe, planesActivos, ahora = () => new Date() }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  if (typeof cuerpo.id !== 'string' || !ID_PROPUESTA.test(cuerpo.id)) return responder(res, 400, { error: 'id-invalido' });
  const esPortafolio = cuerpo.tipo === 'portafolio';

  try {
    const sesion = await sesionDe(req);
    if (!sesion) return responder(res, 401, { error: 'sin-sesion' });
    const { uid } = sesion;
    const conLimite = planesActivos(sesion.email);
    const refPlan = db().collection('planes').doc(uid);
    const momento = ahora();

    if (esPortafolio) {
      const snapPlan = await refPlan.get();
      const pro = esPro(snapPlan.exists ? snapPlan.data() : {}, momento) || !conLimite;
      return responder(res, 200, { ...await activarPortafolio({ db, uid, id: cuerpo.id, pro }), limite: null });
    }

    const refPropuesta = db().collection('proposals').doc(cuerpo.id);
    const resultado = await db().runTransaction(async tx => {
      const [snapPropuesta, snapPlan] = await Promise.all([tx.get(refPropuesta), tx.get(refPlan)]);
      const doc = snapPropuesta.exists ? snapPropuesta.data() : null;
      if (!doc) throw new ErrorHttp(404, 'no-existe');
      if (doc.userId !== uid) throw new ErrorHttp(403, 'ajena');

      const plan = snapPlan.exists ? snapPlan.data() : {};
      const pro = esPro(plan, momento) || !conLimite;
      const usados = enviosDelMes(plan, momento);
      const primeraVez = !doc.enviadaEn;
      const payload = doc.payload || {};

      // Aceptada: el cliente ve lo que aceptó, no se toca.
      if (doc.aceptacion) {
        if (doc.publico !== true || doc.marca !== !pro) tx.update(refPropuesta, { publico: true, marca: !pro });
        return { primeraVez: false, usados, pro };
      }

      const cambios = { publico: true, ...versionDelLink(pro, payload), updatedAt: FieldValue.serverTimestamp() };
      if (!pro) {
        if (usosPro(payload).length) throw new ErrorHttp(403, 'diseno-pro');
        if (!tieneCliente(payload)) throw new ErrorHttp(400, 'sin-cliente');
        // El cliente de la primera vez. Las enviadas antes de este control lo toman de la
        // versión mandada o, si no hay, de la actual.
        const enviado = doc.clienteEnviado || (primeraVez ? null : clienteDe(doc.publicado || payload));
        if (enviado && !mismoCliente(enviado, payload)) throw new ErrorHttp(409, 'otro-cliente');
        if (!doc.clienteEnviado) cambios.clienteEnviado = enviado || clienteDe(payload);
        if (primeraVez && usados >= LIMITE_ENVIOS_GRATIS) throw new ErrorHttp(403, 'limite-envios');
      }

      if (!doc.status || doc.status === 'draft') cambios.status = 'sent';
      if (primeraVez) cambios.enviadaEn = FieldValue.serverTimestamp();
      tx.update(refPropuesta, cambios);
      if (primeraVez) tx.set(refPlan, { envios: { [mesDe(momento)]: usados + 1 } }, { merge: true });
      return { primeraVez, usados: primeraVez ? usados + 1 : usados, pro, actualizada: doc.publico === true };
    });
    return responder(res, 200, { ...resultado, limite: resultado.pro ? null : LIMITE_ENVIOS_GRATIS });
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({ db: firestore, sesionDe: sesionDeLaSolicitud, planesActivos: planesActivosPara });
