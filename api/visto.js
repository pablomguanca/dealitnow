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
import { clienteDe } from '../src/planes.js';
import { recordatorioPendiente } from '../src/respuestas.js';

// Entre una visita y la siguiente, al menos esto para volver a avisar.
export const PAUSA_REVISITA_MS = 30 * 1000;
const milisDe = v => (typeof v?.toMillis === 'function' ? v.toMillis() : v instanceof Date ? v.getTime() : null);

// GET /api/visto — tarea diaria (cron de Vercel, ver vercel.json): avisa al dueño de cada
// propuesta enviada que vence en los próximos días sin respuesta (recordatorioPendiente en
// src/respuestas.js; el aviso es solo para Pro, lo decide _lib/avisos.js). Va en esta
// función porque el plan de Vercel limita la cantidad. Vercel manda
// «Authorization: Bearer $CRON_SECRET»; sin esa variable no corre.
export const crearTareaDiaria = ({ db, avisar = async () => {}, ahora = () => new Date(), entorno = process.env, marcaDeTiempo = FieldValue.serverTimestamp }) => async (req, res) => {
  const secreto = entorno.CRON_SECRET;
  if (!secreto) return responder(res, 503, { error: 'sin-configurar' });
  if (req.headers?.authorization !== `Bearer ${secreto}`) return responder(res, 401, { error: 'no-autorizado' });
  try {
    const snap = await db().collection('proposals').where('publico', '==', true).where('status', '==', 'sent').get();
    let avisadas = 0;
    for (const d of snap.docs) {
      const doc = d.data();
      const pendiente = recordatorioPendiente(doc, ahora());
      if (!pendiente) continue;
      // Se marca antes de avisar: si el aviso falla, no se insiste todos los días.
      await d.ref.update({ recordatorio: { vence: pendiente.vence, fecha: marcaDeTiempo() } });
      await avisar({
        tipo: 'por-vencer',
        id: d.id,
        propuesta: doc,
        recordatorio: { ...pendiente, vistas: Number(doc.vistas) || 0 },
        urlApp: entorno.APP_URL || 'https://dealit.com.ar'
      });
      avisadas += 1;
    }
    return responder(res, 200, { revisadas: snap.size, avisadas });
  } catch (e) {
    return fallar(res, e);
  }
};

export const crearHandler = ({ db, uidDe, avisar = async () => {}, ahora = () => Date.now(), tareaDiaria = null }) => async (req, res) => {
  if (req.method === 'GET' && tareaDiaria) return tareaDiaria(req, res);
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  if (typeof cuerpo.id !== 'string' || !ID_PROPUESTA.test(cuerpo.id)) return responder(res, 400, { error: 'id-invalido' });

  try {
    const uid = await uidDe(req);
    const ref = db().collection('proposals').doc(cuerpo.id);
    const aviso = await db().runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.get('publico') !== true) throw new ErrorHttp(404, 'no-disponible');
      // Links de Gratis activados antes de congelar la versión enviada: se congela la de
      // ahora (ver contenidoDelLink en src/planes.js).
      const congelar = snap.get('marca') === true && !snap.get('publicado') && !snap.get('aceptacion') && snap.get('payload')
        ? {
            publicado: snap.get('payload'),
            publicadoEn: FieldValue.serverTimestamp(),
            ...(snap.get('clienteEnviado') ? {} : { clienteEnviado: clienteDe(snap.get('payload')) })
          }
        : null;
      if (uid && uid === snap.get('userId')) {
        if (congelar) tx.update(ref, congelar);
        return null;
      }
      // Todo lo de la visita anterior se lee antes de registrar esta.
      const esPrimera = !snap.get('vistoPrimero');
      const ultima = milisDe(snap.get('vistoUltimo'));
      const vistas = (Number(snap.get('vistas')) || 0) + 1;
      const aceptada = !!snap.get('aceptacion');
      const datos = { ...snap.data() };
      const cambios = { ...congelar, vistas: FieldValue.increment(1), vistoUltimo: FieldValue.serverTimestamp() };
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

const avisador = crearAvisador({ db: firestore, planesActivos: planesActivosPara });

export default crearHandler({
  db: firestore,
  uidDe: uidDeLaSolicitud,
  avisar: avisador,
  tareaDiaria: crearTareaDiaria({ db: firestore, avisar: avisador })
});
