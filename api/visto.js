// POST /api/visto { id } — registra que alguien abrió el link de una propuesta.
// No guarda datos de quien la abre: solo cuántas veces y cuándo. Las visitas del
// propio dueño (con la sesión iniciada) no cuentan.
import { ID_PROPUESTA } from '../src/aceptacion.js';
import { FieldValue, firestore, uidDeLaSolicitud } from './_lib/firebase-admin.js';
import { ErrorHttp, fallar, leerPost, responder } from './_lib/http.js';

export const crearHandler = ({ db, uidDe }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  if (typeof cuerpo.id !== 'string' || !ID_PROPUESTA.test(cuerpo.id)) return responder(res, 400, { error: 'id-invalido' });

  try {
    const uid = await uidDe(req);
    const ref = db().collection('proposals').doc(cuerpo.id);
    await db().runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.get('publico') !== true) throw new ErrorHttp(404, 'no-disponible');
      if (uid && uid === snap.get('userId')) return;
      const cambios = { vistas: FieldValue.increment(1), vistoUltimo: FieldValue.serverTimestamp() };
      if (!snap.get('vistoPrimero')) cambios.vistoPrimero = FieldValue.serverTimestamp();
      tx.update(ref, cambios);
    });
    return responder(res, 204);
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({ db: firestore, uidDe: uidDeLaSolicitud });
