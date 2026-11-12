// POST /api/aceptar { id, nombre, acepto, opcionales } — el cliente acepta la propuesta.
// Todo se valida acá (vigencia, opcionales, total): el navegador solo propone.
// Después se avisa por email y por push al dueño, si es Pro (ver _lib/avisos.js).
// Con cobro por transferencia, los datos bancarios del dueño (cobros/{uid}, que el cliente
// no puede leer) se guardan con la aceptación y se le devuelven al cliente: recién ahí los ve.
import { ID_PROPUESTA, validarAceptacion } from '../src/aceptacion.js';
import { normalizarCobro, normalizarDatosCobro, usaTransferencia } from '../src/modelo.js';
import { FieldValue, firestore, uidDeLaSolicitud } from './_lib/firebase-admin.js';
import { ErrorHttp, fallar, leerPost, responder } from './_lib/http.js';
import { crearAvisador, urlAppDe } from './_lib/avisos.js';
import { planesActivosPara } from './_lib/planes-activos.js';

export const crearHandler = ({ db, uidDe, ahora = () => new Date(), avisar = async () => {} }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  if (typeof cuerpo.id !== 'string' || !ID_PROPUESTA.test(cuerpo.id)) return responder(res, 400, { error: 'id-invalido' });

  try {
    const uid = await uidDe(req);
    const ref = db().collection('proposals').doc(cuerpo.id);
    let propuesta = null;
    const aceptacion = await db().runTransaction(async tx => {
      const snap = await tx.get(ref);
      const doc = snap.exists ? snap.data() : null;
      if (doc && uid && uid === doc.userId) throw new ErrorHttp(403, 'propia');
      const { datos, error, estado } = validarAceptacion({ doc, cuerpo, ahora: ahora() });
      if (error) throw new ErrorHttp(estado, error);
      propuesta = doc;
      if (usaTransferencia(normalizarCobro(doc.payload?.cobro).metodo)) {
        const snapCobro = await tx.get(db().collection('cobros').doc(doc.userId));
        const cobro = snapCobro.exists ? normalizarDatosCobro(snapCobro.data()) : null;
        if (cobro) datos.cobro = cobro;
      }
      tx.update(ref, {
        status: 'accepted',
        aceptacion: { ...datos, fecha: FieldValue.serverTimestamp() },
        updatedAt: FieldValue.serverTimestamp()
      });
      return datos;
    });
    const { contenido, ...resumen } = aceptacion;
    await avisar({ tipo: 'aceptada', id: cuerpo.id, propuesta, aceptacion: resumen, urlApp: urlAppDe(req) });
    return responder(res, 200, { aceptacion: { ...resumen, fecha: ahora().toISOString() } });
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({
  db: firestore,
  uidDe: uidDeLaSolicitud,
  avisar: crearAvisador({ db: firestore, planesActivos: planesActivosPara })
});
