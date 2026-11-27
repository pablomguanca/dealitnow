// Registro de los pagos que los clientes les hacen a los freelancers con Mercado Pago (las
// reglas, en src/pagos.js). Lo usan el aviso de Mercado Pago (api/mercadopago, con ?cobro=)
// y la consulta del link al volver de pagar (api/cobro-mp, accion 'estado-pago').
//
// Nunca se le cree al aviso ni al navegador: con la propuesta se busca su dueño, con su token
// se pide el pago a la API de Mercado Pago (que solo devuelve pagos de esa cuenta) y se
// comprueba que sea de esa propuesta, de esa cuenta (collector_id), en esa moneda y por ese
// monto. Recién ahí se guarda, en una transacción: el mismo aviso dos veces no duplica nada,
// uno viejo no pisa uno nuevo y el aviso al dueño sale una sola vez.
import {
  avisoDePago, avisosTrasAviso, debeActualizar, idRegistro, pagoEsperado, registroDePago,
  resumenDePropuesta, validarPagoMp
} from '../../src/pagos.js';
import { FieldValue } from './firebase-admin.js';
import { buscarPagos, cuentasMp, obtenerOrden, obtenerPago, tokenVigente } from './mp-connect.js';

const pagosCol = db => db().collection('pagos');

// Guarda un pago ya leído de Mercado Pago. Devuelve { estado } o { ignorado: motivo }.
const registrar = async ({ db, propuestaId, doc, cuenta, pago, token, fetchFn, avisar, urlApp }) => {
  const esperado = pagoEsperado(doc);
  const v = validarPagoMp({ pago, propuestaId, cuentaMpId: cuenta.mpUserId, esperado });
  if (v.error) {
    console.warn(`Pago ${pago?.id} descartado para la propuesta ${propuestaId}: ${v.error}`);
    return { ignorado: v.error };
  }
  const ref = pagosCol(db).doc(idRegistro(pago.id));
  const propuestaRef = db().collection('proposals').doc(propuestaId);

  // De qué preferencia salió: una consulta más, solo la primera vez (si falla, queda vacío).
  const previo = await ref.get();
  let preferencia = previo.exists ? previo.data().preferencia : '';
  if (!preferencia && pago.order?.id) {
    preferencia = await obtenerOrden(fetchFn, token, pago.order.id).then(o => o?.preference_id || '').catch(() => '');
  }
  const registro = registroDePago(pago, { propuestaId, uid: doc.userId, esperado, preferencia });

  const resultado = await db().runTransaction(async tx => {
    const [snap, snapPropuesta] = await Promise.all([tx.get(ref), tx.get(propuestaRef)]);
    const actual = snap.exists ? snap.data() : null;
    if (!debeActualizar(actual, registro)) return { estado: actual.estado, sinCambios: true };
    const aviso = avisoDePago(actual, registro);
    tx.set(ref, {
      ...registro,
      avisos: avisosTrasAviso(actual, aviso),
      creado: actual?.creado || FieldValue.serverTimestamp(),
      actualizado: FieldValue.serverTimestamp()
    });
    if (snapPropuesta.exists) {
      tx.update(propuestaRef, { pago: resumenDePropuesta(snapPropuesta.data().pago, registro) });
    }
    return { estado: registro.estado, aviso };
  });
  if (resultado.aviso) {
    await avisar({ tipo: resultado.aviso, id: propuestaId, propuesta: doc, pago: registro, urlApp });
  }
  return { estado: resultado.estado };
};

// Lo común: la propuesta, su dueño, su cuenta vinculada y su token.
const contexto = async ({ db, propuestaId, cred, fetchFn, ahora }) => {
  const snap = await db().collection('proposals').doc(propuestaId).get();
  const doc = snap.exists ? snap.data() : null;
  if (!doc?.userId) return { ignorado: 'sin-propuesta' };
  const snapCuenta = await cuentasMp(db).doc(doc.userId).get();
  if (!snapCuenta.exists) return { ignorado: 'sin-cuenta' };
  const token = await tokenVigente({ db, uid: doc.userId, cred, fetchFn, ahora });
  if (!token) return { ignorado: 'sin-cuenta' };
  return { doc, cuenta: snapCuenta.data(), token };
};

// Aviso de Mercado Pago de un pago puntual. Los errores de Mercado Pago (salvo «no existe»)
// se tiran para responder con error y que Mercado Pago lo reintente.
export const verificarPago = async ({ db, propuestaId, pagoId, cred, fetchFn = fetch, ahora = Date.now(), avisar = async () => {}, urlApp }) => {
  const c = await contexto({ db, propuestaId, cred, fetchFn, ahora });
  if (c.ignorado) return c;
  let pago;
  try {
    pago = await obtenerPago(fetchFn, c.token, pagoId);
  } catch (e) {
    if (e?.estado === 404 || e?.estado === 403) return { ignorado: 'sin-pago' };
    throw e;
  }
  return registrar({ db, propuestaId, ...c, pago, fetchFn, avisar, urlApp });
};

// Al volver de pagar: busca en Mercado Pago los pagos de la propuesta (por external_reference)
// y registra los que haya. No depende de lo que diga la URL de vuelta.
export const sincronizarPagos = async ({ db, propuestaId, cred, fetchFn = fetch, ahora = Date.now(), avisar = async () => {}, urlApp }) => {
  const c = await contexto({ db, propuestaId, cred, fetchFn, ahora });
  if (c.ignorado) return c;
  const pagos = await buscarPagos(fetchFn, c.token, propuestaId);
  // Del más viejo al más nuevo, así el resumen queda con el último intento.
  for (const pago of [...pagos].reverse()) {
    await registrar({ db, propuestaId, ...c, pago, fetchFn, avisar, urlApp });
  }
  return { revisados: pagos.length };
};
