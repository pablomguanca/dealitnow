// POST /api/aceptar — lo que responde el cliente desde el link. Una sola función (el plan de
// Vercel limita la cantidad):
//   { id, nombre, acepto, opcionales, firma? }        acepta la propuesta
//   { id, accion: 'no-avanzo', motivo, comentario? }  «No avanzo por ahora» (src/respuestas.js)
//   { id, accion: 'cambio', texto, nombre? }          «Pedir un cambio»
// Todo se valida acá (vigencia, opcionales, total): el navegador solo propone.
// Después se avisa por email y por push al dueño, también en Gratis (ver _lib/avisos.js).
// Con cobro por transferencia, los datos bancarios del dueño (cobros/{uid}, que el cliente
// no puede leer) se guardan con la aceptación y se le devuelven al cliente: recién ahí los ve.
import { ID_PROPUESTA, validarAceptacion } from '../src/aceptacion.js';
import { validarPedidoCambio, validarRechazo } from '../src/respuestas.js';
import { contenidoDelLink } from '../src/planes.js';
import { normalizarCobro, normalizarDatosCobro, usaTransferencia } from '../src/modelo.js';
import { FieldValue, Timestamp, firestore, uidDeLaSolicitud } from './_lib/firebase-admin.js';
import { ErrorHttp, fallar, leerPost, responder } from './_lib/http.js';
import { crearAvisador, urlAppDe } from './_lib/avisos.js';
import { planesActivosPara } from './_lib/planes-activos.js';

// Lee la propuesta en la transacción y frena al dueño (no puede responderse a sí mismo).
const leer = async (tx, ref, uid) => {
  const snap = await tx.get(ref);
  const doc = snap.exists ? snap.data() : null;
  if (doc && uid && uid === doc.userId) throw new ErrorHttp(403, 'propia');
  return doc;
};

export const crearHandler = ({ db, uidDe, ahora = () => new Date(), avisar = async () => {}, marcaDeTiempo = f => Timestamp.fromDate(f) }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  if (typeof cuerpo.id !== 'string' || !ID_PROPUESTA.test(cuerpo.id)) return responder(res, 400, { error: 'id-invalido' });

  try {
    const uid = await uidDe(req);
    const ref = db().collection('proposals').doc(cuerpo.id);
    let propuesta = null;

    if (cuerpo.accion === 'no-avanzo') {
      const { rechazo, nuevo } = await db().runTransaction(async tx => {
        const doc = await leer(tx, ref, uid);
        const r = validarRechazo({ doc, cuerpo });
        if (r.error) throw new ErrorHttp(r.estado, r.error);
        propuesta = doc;
        tx.update(ref, {
          status: 'rejected',
          rechazo: { ...r.datos, fecha: FieldValue.serverTimestamp() },
          updatedAt: FieldValue.serverTimestamp()
        });
        return { rechazo: r.datos, nuevo: r.nuevo };
      });
      if (nuevo) await avisar({ tipo: 'rechazada', id: cuerpo.id, propuesta, respuesta: rechazo, urlApp: urlAppDe(req) });
      return responder(res, 200, { rechazo: { ...rechazo, fecha: ahora().toISOString() } });
    }

    if (cuerpo.accion === 'cambio') {
      const cambio = await db().runTransaction(async tx => {
        const doc = await leer(tx, ref, uid);
        const r = validarPedidoCambio({ doc, cuerpo, ahora: ahora() });
        if (r.error) throw new ErrorHttp(r.estado, r.error);
        propuesta = doc;
        // Dentro de una lista no se puede usar la hora del servidor: va la de ahora.
        tx.update(ref, { cambios: FieldValue.arrayUnion({ ...r.datos, fecha: marcaDeTiempo(ahora()) }) });
        return r.datos;
      });
      await avisar({ tipo: 'cambio', id: cuerpo.id, propuesta, respuesta: cambio, urlApp: urlAppDe(req) });
      return responder(res, 200, { cambio: { ...cambio, fecha: ahora().toISOString() } });
    }

    const aceptacion = await db().runTransaction(async tx => {
      const doc = await leer(tx, ref, uid);
      const { datos, error, estado } = validarAceptacion({ doc, cuerpo, ahora: ahora() });
      if (error) throw new ErrorHttp(estado, error);
      propuesta = doc;
      if (usaTransferencia(normalizarCobro(contenidoDelLink(doc)?.cobro).metodo)) {
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
