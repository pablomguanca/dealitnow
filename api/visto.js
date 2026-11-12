// POST /api/visto { id } — registra que alguien abrió el link de una propuesta.
// No guarda datos de quien la abre: solo cuántas veces y cuándo. Las visitas del
// propio dueño (con la sesión iniciada) no cuentan. Avisos al dueño, si es Pro (ver
// _lib/avisos.js): la primera visita por email y por push; cada vez que vuelve a abrirla,
// solo por push, con una pausa para que recargar la página no sea una lluvia de avisos.
import { ID_PROPUESTA } from '../src/aceptacion.js';
import { FieldValue, firestore, uidDeLaSolicitud } from './_lib/firebase-admin.js';
import { ErrorHttp, fallar, leerPost, responder } from './_lib/http.js';
import { crearAvisador, urlAppDe } from './_lib/avisos.js';
import { planesActivosPara } from './_lib/planes-activos.js';

// Entre una visita y la siguiente, al menos esto para volver a avisar.
export const PAUSA_REVISITA_MS = 30 * 1000;
const milisDe = v => (typeof v?.toMillis === 'function' ? v.toMillis() : v instanceof Date ? v.getTime() : null);

export const crearHandler = ({ db, uidDe, avisar = async () => {}, ahora = () => Date.now() }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  if (typeof cuerpo.id !== 'string' || !ID_PROPUESTA.test(cuerpo.id)) return responder(res, 400, { error: 'id-invalido' });

  try {
    const uid = await uidDe(req);
    const ref = db().collection('proposals').doc(cuerpo.id);
    const aviso = await db().runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.get('publico') !== true) throw new ErrorHttp(404, 'no-disponible');
      if (uid && uid === snap.get('userId')) return null;
      // Todo lo de la visita anterior se lee antes de registrar esta.
      const esPrimera = !snap.get('vistoPrimero');
      const ultima = milisDe(snap.get('vistoUltimo'));
      const vistas = (Number(snap.get('vistas')) || 0) + 1;
      const aceptada = !!snap.get('aceptacion');
      const datos = { ...snap.data() };
      const cambios = { vistas: FieldValue.increment(1), vistoUltimo: FieldValue.serverTimestamp() };
      if (esPrimera) cambios.vistoPrimero = FieldValue.serverTimestamp();
      tx.update(ref, cambios);
      if (aceptada) return null;
      if (esPrimera) return { tipo: 'vista', propuesta: datos };
      // Volvió a abrirla: se avisa si pasó la pausa desde la visita anterior.
      if (ultima === null || ahora() - ultima < PAUSA_REVISITA_MS) return null;
      return { tipo: 'revisita', propuesta: datos, vistas };
    });
    if (aviso) await avisar({ ...aviso, id: cuerpo.id, urlApp: urlAppDe(req) });
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
