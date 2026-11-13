// POST /api/ia-propuesta { texto } — «Contale tu propuesta»: el dueño dicta o escribe el
// trabajo y Gemini arma la propuesta (servicios, precios, opcionales, etapas, pagos y
// condiciones, preguntas frecuentes). El servidor valida todo lo que vuelve (src/ia.js) y
// lleva la cuenta del mes en planes/{uid}.ia: en Gratis, LIMITE_IA_GRATIS; en Pro, un tope
// alto anti abuso. Para respetar el nivel de precios del dueño, se le pasan los que ya usó, y
// los datos de su negocio (users/{uid}.emisor: nombre, rol y ubicación) para ubicar el rubro.
import { esPro, mesDe } from '../src/planes.js';
import {
  LIMITE_IA_GRATIS, LIMITE_IA_PRO, TEXTO_MAX, TEXTO_MIN,
  esquemaIA, instruccionesIA, mensajeIA, preciosDeReferencia, propuestaDesdeIA, temasPermitidos, usosIADelMes
} from '../src/ia.js';
import { firestore, sesionDeLaSolicitud } from './_lib/firebase-admin.js';
import { planesActivosPara } from './_lib/planes-activos.js';
import { generarJSON } from './_lib/gemini.js';
import { ErrorHttp, fallar, leerPost, responder } from './_lib/http.js';

const historialDe = async (db, uid) => {
  try {
    const snap = await db().collection('proposals').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(20).get();
    return snap.docs.map(d => d.data());
  } catch (e) {
    console.warn('No se pudo leer el historial de precios:', e.message);
    return [];
  }
};

const emisorDe = async (db, uid) => {
  try {
    const snap = await db().collection('users').doc(uid).get();
    const e = (snap.exists && snap.data()?.emisor) || {};
    return { nombre: e.nombre, rol: e.rol, ubicacion: e.ubicacion };
  } catch (e) {
    console.warn('No se pudieron leer los datos del emisor:', e.message);
    return {};
  }
};

export const crearHandler = ({ db, sesionDe, planesActivos, generar, ahora = () => new Date() }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  const dictado = typeof cuerpo.texto === 'string' ? cuerpo.texto.trim() : '';
  if (dictado.length < TEXTO_MIN) return responder(res, 400, { error: 'texto-corto' });
  if (dictado.length > TEXTO_MAX) return responder(res, 400, { error: 'texto-largo' });

  try {
    const sesion = await sesionDe(req);
    if (!sesion) return responder(res, 401, { error: 'sin-sesion' });
    const { uid } = sesion;
    const momento = ahora();
    const mes = mesDe(momento);
    const conLimite = planesActivos(sesion.email);
    const refPlan = db().collection('planes').doc(uid);
    const snapPlan = await refPlan.get();
    const plan = snapPlan.exists ? snapPlan.data() : {};
    const pro = esPro(plan, momento);
    const limite = pro || !conLimite ? LIMITE_IA_PRO : LIMITE_IA_GRATIS;
    const usados = usosIADelMes(plan, mes);
    if (usados >= limite) throw new ErrorHttp(403, pro || !conLimite ? 'limite-ia-pro' : 'limite-ia');

    // En Gratis la IA elige solo diseños gratis: así la propuesta se puede enviar.
    const temas = temasPermitidos(pro || !conLimite);
    const [emisor, historial] = await Promise.all([emisorDe(db, uid), historialDe(db, uid)]);
    const respuesta = await generar({
      sistema: instruccionesIA(temas, emisor),
      mensaje: mensajeIA(dictado, preciosDeReferencia(historial)),
      esquema: esquemaIA(temas)
    });
    const { contenido, avisos } = propuestaDesdeIA(respuesta, { temas });
    if (!contenido.servicios.length) throw new ErrorHttp(422, 'ia-sin-servicios');

    await refPlan.set({ ia: { [mes]: usados + 1 } }, { merge: true });
    return responder(res, 200, {
      contenido,
      avisos,
      usados: usados + 1,
      limite: pro || !conLimite ? null : LIMITE_IA_GRATIS
    });
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({ db: firestore, sesionDe: sesionDeLaSolicitud, planesActivos: planesActivosPara, generar: generarJSON });
