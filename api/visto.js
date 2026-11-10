// POST /api/visto { id } — registra que alguien abrió el link de una propuesta.
// No guarda datos de quien la abre: solo cuántas veces y cuándo. Las visitas del
// propio dueño (con la sesión iniciada) no cuentan. La primera visita se le avisa por email
// al dueño, si es Pro (ver _lib/avisos.js).
import { ID_PROPUESTA } from '../src/aceptacion.js';
import { FieldValue, firestore, uidDeLaSolicitud } from './_lib/firebase-admin.js';
import { ErrorHttp, fallar, leerPost, responder } from './_lib/http.js';
import { crearAvisador, urlAppDe } from './_lib/avisos.js';
import { planesActivosPara } from './_lib/planes-activos.js';

export const crearHandler = ({ db, uidDe, avisar = async () => {} }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  if (typeof cuerpo.id !== 'string' || !ID_PROPUESTA.test(cuerpo.id)) return responder(res, 400, { error: 'id-invalido' });

  try {
    const uid = await uidDe(req);
    const ref = db().collection('proposals').doc(cuerpo.id);
    const primera = await db().runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.get('publico') !== true) throw new ErrorHttp(404, 'no-disponible');
      if (uid && uid === snap.get('userId')) return null;
      const cambios = { vistas: FieldValue.increment(1), vistoUltimo: FieldValue.serverTimestamp() };
      const esPrimera = !snap.get('vistoPrimero');
      if (esPrimera) cambios.vistoPrimero = FieldValue.serverTimestamp();
      tx.update(ref, cambios);
      return esPrimera && !snap.get('aceptacion') ? snap.data() : null;
    });
    if (primera) await avisar({ tipo: 'vista', id: cuerpo.id, propuesta: primera, urlApp: urlAppDe(req) });
    return responder(res, 204);
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({
  db: firestore,
  uidDe: uidDeLaSolicitud,
  avisar: crearAvisador({ db: firestore, planesActivos: planesActivosPara })
});
