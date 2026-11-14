// POST /api/ia-propuesta { texto } — «Contale tu propuesta»: el dueño dicta o escribe el
// trabajo y Gemini arma la propuesta (servicios, precios, opcionales, etapas, pagos y
// condiciones, preguntas frecuentes). El servidor valida todo lo que vuelve (src/ia.js) y
// lleva la cuenta del mes en planes/{uid}.ia: en Gratis, LIMITE_IA_GRATIS; en Pro, un tope
// alto anti abuso. Para respetar el nivel de precios del dueño, se le pasan los que ya usó, y
// los datos de su negocio (users/{uid}.emisor: nombre, rol y ubicación) para ubicar el rubro.
// Con { accion: 'editar', pedido, propuesta } es «Editar con IA» (src/ia-editar.js): devuelve
// solo las secciones que cambian y cuenta aparte, en planes/{uid}.iaEdicion. Va en la misma
// función por el límite de funciones de Vercel.
import { esPro, mesDe } from '../src/planes.js';
import {
  LIMITE_IA_GRATIS, LIMITE_IA_PRO, TEXTO_MAX, TEXTO_MIN,
  esquemaIA, instruccionesIA, mensajeIA, preciosDeReferencia, propuestaDesdeIA, temasPermitidos, usosIADelMes
} from '../src/ia.js';
import {
  LIMITE_EDICION_GRATIS, LIMITE_EDICION_PRO, PEDIDO_MAX, PEDIDO_MIN, PROPUESTA_MAX,
  cambiosDesdeIA, contenidoParaEditar, esquemaEdicion, instruccionesEdicion, mensajeEdicion, usosEdicionDelMes
} from '../src/ia-editar.js';
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

// Plan del dueño y si se le aplica el límite de Gratis (sin límite: Pro, o planes apagados).
const planDe = async (db, sesion, planesActivos, momento) => {
  const refPlan = db().collection('planes').doc(sesion.uid);
  const snapPlan = await refPlan.get();
  const plan = snapPlan.exists ? snapPlan.data() : {};
  return { refPlan, plan, sinLimite: esPro(plan, momento) || !planesActivos(sesion.email) };
};

const armar = async ({ cuerpo, sesion, db, planesActivos, generar, momento }, res) => {
  const dictado = typeof cuerpo.texto === 'string' ? cuerpo.texto.trim() : '';
  if (dictado.length < TEXTO_MIN) return responder(res, 400, { error: 'texto-corto' });
  if (dictado.length > TEXTO_MAX) return responder(res, 400, { error: 'texto-largo' });
  const { uid } = sesion;
  const mes = mesDe(momento);
  const { refPlan, plan, sinLimite } = await planDe(db, sesion, planesActivos, momento);
  const limite = sinLimite ? LIMITE_IA_PRO : LIMITE_IA_GRATIS;
  const usados = usosIADelMes(plan, mes);
  if (usados >= limite) throw new ErrorHttp(403, sinLimite ? 'limite-ia-pro' : 'limite-ia');

  // En Gratis la IA elige solo diseños gratis: así la propuesta se puede enviar.
  const temas = temasPermitidos(sinLimite);
  const [emisor, historial] = await Promise.all([emisorDe(db, uid), historialDe(db, uid)]);
  const respuesta = await generar({
    sistema: instruccionesIA(temas, emisor),
    mensaje: mensajeIA(dictado, preciosDeReferencia(historial)),
    esquema: esquemaIA(temas)
  });
  const { contenido, avisos } = propuestaDesdeIA(respuesta, { temas, dictado });
  if (!contenido.servicios.length) throw new ErrorHttp(422, 'ia-sin-servicios');

  await refPlan.set({ ia: { [mes]: usados + 1 } }, { merge: true });
  return responder(res, 200, {
    contenido,
    avisos,
    usados: usados + 1,
    limite: sinLimite ? null : LIMITE_IA_GRATIS
  });
};

const editar = async ({ cuerpo, sesion, db, planesActivos, generar, momento }, res) => {
  const pedido = typeof cuerpo.pedido === 'string' ? cuerpo.pedido.trim() : '';
  if (pedido.length < PEDIDO_MIN) return responder(res, 400, { error: 'pedido-corto' });
  if (pedido.length > PEDIDO_MAX) return responder(res, 400, { error: 'pedido-largo' });
  if (!cuerpo.propuesta || typeof cuerpo.propuesta !== 'object') return responder(res, 400, { error: 'sin-propuesta' });
  // Lo que manda el navegador se vuelve a compactar acá: solo pasa lo que la IA puede editar.
  const actual = contenidoParaEditar(cuerpo.propuesta);
  if (JSON.stringify(actual).length > PROPUESTA_MAX) return responder(res, 400, { error: 'propuesta-larga' });

  const mes = mesDe(momento);
  const { refPlan, plan, sinLimite } = await planDe(db, sesion, planesActivos, momento);
  const limite = sinLimite ? LIMITE_EDICION_PRO : LIMITE_EDICION_GRATIS;
  const usados = usosEdicionDelMes(plan, mes);
  if (usados >= limite) throw new ErrorHttp(403, sinLimite ? 'limite-edicion-pro' : 'limite-edicion');

  const emisor = await emisorDe(db, sesion.uid);
  const respuesta = await generar({
    sistema: instruccionesEdicion(emisor),
    mensaje: mensajeEdicion(pedido, actual),
    esquema: esquemaEdicion()
  });
  const resultado = cambiosDesdeIA(respuesta, actual, { pedido });

  // La IA ya trabajó (y costó): cuenta aunque no haya encontrado qué cambiar.
  await refPlan.set({ iaEdicion: { [mes]: usados + 1 } }, { merge: true });
  return responder(res, 200, { ...resultado, usados: usados + 1, limite: sinLimite ? null : LIMITE_EDICION_GRATIS });
};

export const crearHandler = ({ db, sesionDe, planesActivos, generar, ahora = () => new Date() }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  const accion = cuerpo.accion === 'editar' ? editar : armar;
  try {
    const sesion = await sesionDe(req);
    if (!sesion) return responder(res, 401, { error: 'sin-sesion' });
    return await accion({ cuerpo, sesion, db, planesActivos, generar, momento: ahora() }, res);
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({ db: firestore, sesionDe: sesionDeLaSolicitud, planesActivos: planesActivosPara, generar: generarJSON });
