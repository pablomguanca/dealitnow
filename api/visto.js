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
import { clienteDe, contenidoDelLink } from '../src/planes.js';
import { DIAS_AVISO_VENCE, hoyArgentina, recordatorioPendiente, ultimoDia } from '../src/respuestas.js';
import { desdeISO } from '../src/lib/formato.js';

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
    // Qué pasó con cada propuesta, para entender una corrida desde Vercel («Run» o los logs).
    const detalle = [];
    for (const d of snap.docs) {
      const doc = d.data();
      const titulo = String(doc.title || '').slice(0, 80);
      const motivo = motivoSinRecordatorio(doc, ahora());
      if (motivo) {
        detalle.push({ id: d.id, titulo, resultado: motivo });
        continue;
      }
      const pendiente = recordatorioPendiente(doc, ahora());
      const resultado = await avisar({
        tipo: 'por-vencer',
        id: d.id,
        propuesta: doc,
        recordatorio: { ...pendiente, vistas: Number(doc.vistas) || 0 },
        urlApp: entorno.APP_URL || 'https://dealit.com.ar'
      });
      detalle.push({ id: d.id, titulo, vence: pendiente.vence, quedan: pendiente.quedan, resultado: resultado || 'enviado' });
      // En Gratis no se manda: no se marca, así si se pasa a Pro todavía le llega. Si se
      // mandó (o falló al mandar), una vez por vencimiento: no se insiste todos los días.
      if (resultado === 'gratis') continue;
      await d.ref.update({ recordatorio: { vence: pendiente.vence, fecha: marcaDeTiempo() } });
      avisadas += 1;
    }
    console.log('Tarea diaria de recordatorios:', JSON.stringify({ revisadas: snap.size, avisadas, detalle }));
    return responder(res, 200, { revisadas: snap.size, avisadas, detalle: detalle.slice(0, 100) });
  } catch (e) {
    return fallar(res, e);
  }
};

// Por qué una propuesta enviada no lleva recordatorio hoy ('' si lo lleva).
const motivoSinRecordatorio = (doc, ahora) => {
  if (recordatorioPendiente(doc, ahora)) return '';
  if (doc.aceptacion) return 'aceptada';
  const vence = ultimoDia(contenidoDelLink(doc));
  if (!vence) return 'sin-vencimiento';
  const quedan = Math.round((desdeISO(vence) - desdeISO(hoyArgentina(ahora))) / 86400000);
  if (quedan < 0) return `vencida-el-${vence}`;
  if (quedan > DIAS_AVISO_VENCE) return `faltan-${quedan}-dias`;
  return `ya-avisada-para-el-${vence}`;
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
