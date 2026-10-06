// POST /api/aceptar { id, nombre, acepto, opcionales } — el cliente acepta la propuesta.
// Todo se valida acá (vigencia, opcionales, total): el navegador solo propone.
import { ID_PROPUESTA, validarAceptacion } from '../src/aceptacion.js';
import { FieldValue, firestore, uidDeLaSolicitud } from './_lib/firebase-admin.js';
import { ErrorHttp, fallar, leerPost, responder } from './_lib/http.js';

export const crearHandler = ({ db, uidDe, ahora = () => new Date() }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  if (typeof cuerpo.id !== 'string' || !ID_PROPUESTA.test(cuerpo.id)) return responder(res, 400, { error: 'id-invalido' });

  try {
    const uid = await uidDe(req);
    const ref = db().collection('proposals').doc(cuerpo.id);
    const aceptacion = await db().runTransaction(async tx => {
      const snap = await tx.get(ref);
      const doc = snap.exists ? snap.data() : null;
      if (doc && uid && uid === doc.userId) throw new ErrorHttp(403, 'propia');
      const { datos, error, estado } = validarAceptacion({ doc, cuerpo, ahora: ahora() });
      if (error) throw new ErrorHttp(estado, error);
      tx.update(ref, {
        status: 'accepted',
        aceptacion: { ...datos, fecha: FieldValue.serverTimestamp() },
        updatedAt: FieldValue.serverTimestamp()
      });
      return datos;
    });
    const { contenido, ...resumen } = aceptacion;
    return responder(res, 200, { aceptacion: { ...resumen, fecha: ahora().toISOString() } });
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({ db: firestore, uidDe: uidDeLaSolicitud });
