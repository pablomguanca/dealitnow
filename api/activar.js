// POST /api/activar { id, tipo? } — el dueño activa (o actualiza) el link de su propuesta
// o, con tipo 'portafolio', de su portfolio. El plan se aplica acá:
// - Gratis: hasta LIMITE_ENVIOS_GRATIS propuestas nuevas por mes. Una que ya se envió se
//   puede volver a activar sin contar de nuevo, pero solo para el mismo cliente
//   (mismoCliente en src/planes.js): mandarla a otro cliente es un envío nuevo (duplicarla).
// - Gratis: el link muestra la versión que se mandó (publicado), no la que se edita. Cada vez
//   que se comparte de nuevo, se actualiza con los últimos cambios. Así un link no se
//   reusa para otra propuesta. Con Pro el link muestra siempre la última versión.
// - Gratis: no se envían diseños ni plantillas PRO, y el link lleva la marca de Dealit
//   (campo marca, que lee la vista del cliente).
// - Gratis: LIMITE_PORTAFOLIOS_GRATIS portfolio con el link activo a la vez. Con otro activo
//   responde «limite-portafolios» (con su nombre en detalle); con reemplazar: true, desactiva
//   ese link y activa este. Los que ya estaban activos antes de este límite siguen andando.
// Con los planes apagados (ver _lib/planes-activos.js) los envíos se cuentan pero no se frenan.
// Programa de Fundadores (src/fundadores.js): compartir una propuesta le da a la cuenta uno de
// los cupos que queden (contador en fundadores/cupos) y responde su número en «fundador».
import { ID_PROPUESTA } from '../src/aceptacion.js';
import { esFundador, proximoCupo } from '../src/fundadores.js';
import {
  LIMITE_ENVIOS_GRATIS, LIMITE_PORTAFOLIOS_GRATIS, clienteDe, enviosDelMes, esPro, mesDe, mismoCliente, tieneCliente, usosPro
} from '../src/planes.js';
import { FieldValue, firestore, sesionDeLaSolicitud } from './_lib/firebase-admin.js';
import { planesActivosPara } from './_lib/planes-activos.js';
import { ErrorHttp, fallar, leerPost, responder } from './_lib/http.js';

// Lo que ve el cliente: congelado en Gratis, en vivo con Pro.
const versionDelLink = (pro, payload) => (pro
  ? { marca: false, publicado: FieldValue.delete(), publicadoEn: FieldValue.delete() }
  : { marca: true, publicado: payload, publicadoEn: FieldValue.serverTimestamp() });

const nombrePortafolio = d => String(d?.payload?.portafolio?.nombreInterno || d?.payload?.portafolio?.titulo || d?.title || '').trim().slice(0, 120) || 'otro portfolio';

const activarPortafolio = async ({ db, uid, id, pro, reemplazar }) => {
  const coleccion = db().collection('portfolios');
  const ref = coleccion.doc(id);
  // En Gratis: los otros portfolios del dueño que ya tienen el link activo.
  const otrosActivos = pro ? [] : (await coleccion.where('userId', '==', uid).where('publico', '==', true).get())
    .docs.filter(d => d.id !== id);
  await db().runTransaction(async tx => {
    const snap = await tx.get(ref);
    const doc = snap.exists ? snap.data() : null;
    if (!doc) throw new ErrorHttp(404, 'no-existe');
    if (doc.userId !== uid) throw new ErrorHttp(403, 'ajena');
    if (!pro && usosPro(doc.payload, { esPortafolio: true }).length) throw new ErrorHttp(403, 'diseno-pro');
    if (!pro && doc.publico !== true && otrosActivos.length >= LIMITE_PORTAFOLIOS_GRATIS) {
      if (!reemplazar) throw new ErrorHttp(403, 'limite-portafolios', nombrePortafolio(otrosActivos[0].data()));
      for (const otro of otrosActivos) tx.update(otro.ref, { publico: false, updatedAt: FieldValue.serverTimestamp() });
    }
    tx.update(ref, { publico: true, ...versionDelLink(pro, doc.payload || {}), updatedAt: FieldValue.serverTimestamp() });
  });
  return { primeraVez: false, usados: 0, pro };
};

export const crearHandler = ({ db, sesionDe, planesActivos, ahora = () => new Date() }) => async (req, res) => {
  const cuerpo = leerPost(req, res);
  if (!cuerpo) return;
  if (typeof cuerpo.id !== 'string' || !ID_PROPUESTA.test(cuerpo.id)) return responder(res, 400, { error: 'id-invalido' });
  const esPortafolio = cuerpo.tipo === 'portafolio';

  try {
    const sesion = await sesionDe(req);
    if (!sesion) return responder(res, 401, { error: 'sin-sesion' });
    const { uid } = sesion;
    const conLimite = planesActivos(sesion.email);
    const refPlan = db().collection('planes').doc(uid);
    const momento = ahora();

    if (esPortafolio) {
      const snapPlan = await refPlan.get();
      const pro = esPro(snapPlan.exists ? snapPlan.data() : {}, momento) || !conLimite;
      const resultado = await activarPortafolio({ db, uid, id: cuerpo.id, pro, reemplazar: cuerpo.reemplazar === true });
      return responder(res, 200, { ...resultado, limite: pro ? null : LIMITE_PORTAFOLIOS_GRATIS });
    }

    const refPropuesta = db().collection('proposals').doc(cuerpo.id);
    const refCupos = db().collection('fundadores').doc('cupos');
    const resultado = await db().runTransaction(async tx => {
      const [snapPropuesta, snapPlan] = await Promise.all([tx.get(refPropuesta), tx.get(refPlan)]);
      const doc = snapPropuesta.exists ? snapPropuesta.data() : null;
      if (!doc) throw new ErrorHttp(404, 'no-existe');
      if (doc.userId !== uid) throw new ErrorHttp(403, 'ajena');

      const plan = snapPlan.exists ? snapPlan.data() : {};
      const pro = esPro(plan, momento) || !conLimite;
      const usados = enviosDelMes(plan, momento);
      const primeraVez = !doc.enviadaEn;
      const payload = doc.payload || {};

      // Aceptada: el cliente ve lo que aceptó, no se toca.
      if (doc.aceptacion) {
        if (doc.publico !== true || doc.marca !== !pro) tx.update(refPropuesta, { publico: true, marca: !pro });
        return { primeraVez: false, usados, pro };
      }

      const cambios = { publico: true, ...versionDelLink(pro, payload), updatedAt: FieldValue.serverTimestamp() };
      if (!pro) {
        if (usosPro(payload).length) throw new ErrorHttp(403, 'diseno-pro');
        if (!tieneCliente(payload)) throw new ErrorHttp(400, 'sin-cliente');
        // El cliente de la primera vez. Las enviadas antes de este control lo toman de la
        // versión mandada o, si no hay, de la actual.
        const enviado = doc.clienteEnviado || (primeraVez ? null : clienteDe(doc.publicado || payload));
        if (enviado && !mismoCliente(enviado, payload)) throw new ErrorHttp(409, 'otro-cliente');
        if (!doc.clienteEnviado) cambios.clienteEnviado = enviado || clienteDe(payload);
        if (primeraVez && usados >= LIMITE_ENVIOS_GRATIS) throw new ErrorHttp(403, 'limite-envios');
      }

      // Fundador: si todavía no lo es y quedan cupos, compartir le da el siguiente. También al
      // volver a compartir una ya enviada: quien compartía antes del programa no queda afuera.
      const cambiosPlan = {};
      let fundador = null;
      if (!esFundador(plan)) {
        const snapCupos = await tx.get(refCupos);
        fundador = proximoCupo(snapCupos.exists ? snapCupos.data().asignados : 0);
        if (fundador) {
          tx.set(refCupos, { asignados: fundador }, { merge: true });
          cambiosPlan.fundador = { numero: fundador, desde: FieldValue.serverTimestamp() };
        }
      }

      // Volver a compartirla después de un «No avanzo por ahora» es una nueva oportunidad:
      // vuelve a estar enviada (el motivo queda en `rechazo`, para Resultados).
      if (!doc.status || doc.status === 'draft' || doc.status === 'rejected') cambios.status = 'sent';
      if (primeraVez) cambios.enviadaEn = FieldValue.serverTimestamp();
      tx.update(refPropuesta, cambios);
      if (primeraVez) cambiosPlan.envios = { [mesDe(momento)]: usados + 1 };
      if (Object.keys(cambiosPlan).length) tx.set(refPlan, cambiosPlan, { merge: true });
      return { primeraVez, usados: primeraVez ? usados + 1 : usados, pro, actualizada: doc.publico === true, ...(fundador ? { fundador } : {}) };
    });
    return responder(res, 200, { ...resultado, limite: resultado.pro ? null : LIMITE_ENVIOS_GRATIS });
  } catch (e) {
    return fallar(res, e);
  }
};

export default crearHandler({ db: firestore, sesionDe: sesionDeLaSolicitud, planesActivos: planesActivosPara });
