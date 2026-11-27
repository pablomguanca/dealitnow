// Pagos que el cliente le hace al profesional con Mercado Pago (cuenta vinculada por OAuth,
// ver api/_lib/mp-connect.js). Reglas puras, compartidas por el servidor (api/_lib/cobros-mp.js,
// que es el único que escribe) y la app (estado en el link y en el panel).
//
// Cada pago de Mercado Pago es un documento pagos/mp_<id>: el id lo hace único, así un mismo
// aviso recibido varias veces no lo duplica. El estado sale siempre de la API de Mercado
// Pago, nunca del aviso ni de la URL de vuelta. La propuesta guarda un resumen (`pago`) del
// pago que importa: el acreditado, o si no hay ninguno, el último intento.
//
// Hoy se cobra solo el primer pago de la forma de pago (`numero: 1`). El campo queda para
// sumar, más adelante, los pagos siguientes de una misma propuesta.
import { normalizarCobro, normalizarPropuesta, primerPago, usaMercadoPago } from './modelo.js';

// rango: cuán avanzado está el pago. Sirve para ordenar avisos que llegan con la misma fecha.
export const ESTADOS_PAGO = {
  pendiente: { nombre: 'Pendiente', rango: 0 },
  'en-proceso': { nombre: 'En proceso', rango: 1 },
  acreditado: { nombre: 'Acreditado', rango: 2 },
  rechazado: { nombre: 'Rechazado', rango: 2 },
  cancelado: { nombre: 'Cancelado', rango: 2 },
  'en-mediacion': { nombre: 'En reclamo', rango: 3 },
  reembolsado: { nombre: 'Reembolsado', rango: 4 },
  contracargo: { nombre: 'Contracargo', rango: 4 }
};

// Estado de Mercado Pago (status) → estado de Dealit.
const DESDE_MP = {
  pending: 'pendiente',
  in_process: 'en-proceso',
  authorized: 'en-proceso',
  approved: 'acreditado',
  rejected: 'rechazado',
  cancelled: 'cancelado',
  in_mediation: 'en-mediacion',
  refunded: 'reembolsado',
  charged_back: 'contracargo'
};
export const estadoDesdeMp = status => DESDE_MP[status] || 'pendiente';

// Con estos, el cliente puede volver a intentar el pago desde el link.
const REINTENTABLES = new Set(['rechazado', 'cancelado', 'pendiente']);
export const puedePagar = pago => !pago || REINTENTABLES.has(pago.estado);
export const revertido = estado => estado === 'reembolsado' || estado === 'contracargo';

export const ID_PAGO_MP = /^\d{1,20}$/;
export const idRegistro = idMp => `mp_${idMp}`;

const redondear = n => Math.round(Number(n) * 100) / 100;

// Lo que tiene que pagar el cliente según lo aceptado (con los opcionales que eligió).
// Lo usan la creación del pago y la verificación de cada aviso, así coinciden siempre.
export const pagoEsperado = doc => {
  if (!doc?.aceptacion) return { error: 'sin-aceptar', estado: 409 };
  const contenido = normalizarPropuesta(doc.aceptacion.contenido || doc.payload, { logoValido: () => true });
  if (!usaMercadoPago(normalizarCobro(contenido.cobro).metodo)) return { error: 'sin-mercadopago', estado: 409 };
  const moneda = doc.aceptacion.moneda || contenido.inversion.moneda;
  if (moneda !== 'ARS') return { error: 'moneda-no-soportada', estado: 409 };
  const pago = primerPago(contenido, doc.aceptacion.inicial);
  if (!pago || !(pago.monto > 0)) return { error: 'sin-monto', estado: 409 };
  return { monto: pago.monto, moneda, concepto: pago.concepto, numero: 1, contenido };
};

// ¿El pago que devolvió Mercado Pago es el de esta propuesta, de esta cuenta y por lo que
// corresponde? Cualquier diferencia lo descarta.
export const validarPagoMp = ({ pago, propuestaId, cuentaMpId, esperado }) => {
  if (!pago || !ID_PAGO_MP.test(String(pago.id ?? ''))) return { error: 'pago-invalido' };
  if (esperado?.error) return { error: esperado.error };
  if (String(pago.external_reference ?? '') !== propuestaId) return { error: 'otra-propuesta' };
  if (!cuentaMpId || String(pago.collector_id ?? '') !== String(cuentaMpId)) return { error: 'otra-cuenta' };
  if (pago.currency_id !== esperado.moneda) return { error: 'otra-moneda' };
  if (Math.abs(redondear(pago.transaction_amount) - redondear(esperado.monto)) > 0.009) return { error: 'otro-monto' };
  return { ok: true };
};

const fecha = v => (v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

// El registro que se guarda: nada de la tarjeta ni de quien pagó, solo lo del cobro.
export const registroDePago = (pago, { propuestaId, uid, esperado, preferencia = '' }) => ({
  proveedor: 'mercadopago',
  mpPagoId: String(pago.id),
  propuestaId,
  userId: uid,
  mpCuentaId: String(pago.collector_id),
  monto: redondear(pago.transaction_amount),
  moneda: String(pago.currency_id),
  concepto: String(esperado.concepto || '').slice(0, 120),
  numero: esperado.numero || 1,
  estado: estadoDesdeMp(pago.status),
  estadoMp: String(pago.status || '').slice(0, 40),
  detalleMp: String(pago.status_detail || '').slice(0, 80),
  reembolsado: redondear(pago.transaction_amount_refunded || 0),
  creadoMp: fecha(pago.date_created),
  aprobado: fecha(pago.date_approved),
  actualizadoMp: fecha(pago.date_last_updated) || fecha(pago.date_created),
  preferencia: String(preferencia || '').slice(0, 120),
  produccion: pago.live_mode !== false
});

// Avisos fuera de orden: manda la fecha de última actualización de Mercado Pago; con la
// misma fecha (o sin ella), solo se avanza de estado, nunca se retrocede.
export const debeActualizar = (actual, nuevo) => {
  if (!actual) return true;
  const a = Date.parse(actual.actualizadoMp);
  const n = Date.parse(nuevo.actualizadoMp);
  if (Number.isFinite(a) && Number.isFinite(n) && a !== n) return n > a;
  return (ESTADOS_PAGO[nuevo.estado]?.rango ?? 0) >= (ESTADOS_PAGO[actual.estado]?.rango ?? 0);
};

// Qué aviso le corresponde al dueño con este cambio (o null). Una sola vez cada uno: las
// marcas quedan en el registro (`avisos`), escritas en la misma transacción.
export const avisoDePago = (actual, nuevo) => {
  const avisos = actual?.avisos || {};
  if (nuevo.estado === 'acreditado' && !avisos.acreditado) return 'pago-acreditado';
  if (revertido(nuevo.estado) && avisos.acreditado && !avisos.revertido) return 'pago-revertido';
  return null;
};
export const avisosTrasAviso = (actual, aviso) => ({
  acreditado: !!actual?.avisos?.acreditado || aviso === 'pago-acreditado',
  revertido: !!actual?.avisos?.revertido || aviso === 'pago-revertido'
});

const resumen = r => ({
  id: idRegistro(r.mpPagoId),
  estado: r.estado,
  monto: r.monto,
  moneda: r.moneda,
  concepto: r.concepto,
  aprobado: r.aprobado,
  actualizado: r.actualizadoMp
});

// Resumen en la propuesta: el pago acreditado manda; otro intento (rechazado, pendiente) no
// lo tapa. Si el que estaba resumido cambia (por ejemplo, se reembolsa), se actualiza.
export const resumenDePropuesta = (actual, registro) => {
  const nuevo = resumen(registro);
  if (!actual || actual.id === nuevo.id) return nuevo;
  if (actual.estado === 'acreditado' && nuevo.estado !== 'acreditado') return actual;
  return nuevo;
};

// Etiqueta corta para el dueño (panel y editor): «Cobrado · Seña», «Pago rechazado · Seña».
export const etiquetaPago = pago => {
  if (!pago || !ESTADOS_PAGO[pago.estado]) return '';
  const concepto = String(pago.concepto || '').trim() || 'Pago';
  return pago.estado === 'acreditado' ? `Cobrado · ${concepto}` : `Pago ${ESTADOS_PAGO[pago.estado].nombre.toLowerCase()} · ${concepto}`;
};

// Lo que ve el cliente en el link: el estado de su pago, sin ids ni datos de la cuenta.
export const pagoPublico = p => (p && ESTADOS_PAGO[p.estado]
  ? { estado: p.estado, monto: Number(p.monto) || 0, moneda: p.moneda || 'ARS', concepto: String(p.concepto || ''), aprobado: p.aprobado || null }
  : null);
