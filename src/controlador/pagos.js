// Cobro con Mercado Pago en el editor de una propuesta: cómo va el pago (el resumen `pago`
// de la propuesta, que llega con la lista en tiempo real) y el historial de intentos
// (pagos/{id}, que escribe solo el servidor después de verificarlos con Mercado Pago).
// Visibilidad del cobro, no contabilidad: qué se pagó, cuánto, cuándo y en qué estado está.
import { $, esc, dinero, fechaLarga } from '../lib/formato.js';
import { ESTADOS_PAGO, etiquetaPago } from '../pagos.js';
import { ctx, AteneaDB } from './contexto.js';

const fechaDe = iso => (iso && !Number.isNaN(Date.parse(iso)) ? new Date(iso) : null);

const QUE_PASA = {
  pendiente: 'Mercado Pago todavía no lo acreditó (por ejemplo, si eligió pagar en efectivo).',
  'en-proceso': 'Mercado Pago lo está revisando; suele resolverse en minutos.',
  rechazado: 'Mercado Pago lo rechazó. Tu cliente puede volver a intentarlo desde el link.',
  cancelado: 'Se canceló. Tu cliente puede volver a intentarlo desde el link.',
  'en-mediacion': 'Tu cliente abrió un reclamo en Mercado Pago.',
  reembolsado: 'El pago se devolvió.',
  contracargo: 'Tu cliente desconoció el pago ante su tarjeta. Revisalo en Mercado Pago.'
};

const resumenHTML = pago => {
  const monto = esc(dinero(pago.monto, pago.moneda));
  const concepto = esc(pago.concepto || 'Pago');
  if (pago.estado === 'acreditado') {
    const f = fechaDe(pago.aprobado);
    return `<p><strong>Cobrado con Mercado Pago</strong> · ${concepto}: ${monto}${f ? `, acreditado el ${esc(fechaLarga(f))}` : ''}. Ya está en tu cuenta de Mercado Pago.</p>`;
  }
  return `<p><strong>${esc(etiquetaPago(pago))}:</strong> ${monto}. ${esc(QUE_PASA[pago.estado] || '')}</p>`;
};

const historialHTML = pagos => {
  if (!pagos.length) return '';
  const filas = [...pagos]
    .sort((a, b) => (Date.parse(b.creadoMp) || 0) - (Date.parse(a.creadoMp) || 0))
    .map(x => {
      const f = fechaDe(x.aprobado) || fechaDe(x.creadoMp);
      return `<li class="editor__pago editor__pago--${esc(x.estado)}"><span>${esc(ESTADOS_PAGO[x.estado]?.nombre || x.estado)} · ${esc(x.concepto || 'Pago')}</span><strong>${esc(dinero(x.monto, x.moneda))}</strong>${f ? `<time>${esc(fechaLarga(f))}${x.mpPagoId ? ` · operación ${esc(x.mpPagoId)}` : ''}</time>` : ''}</li>`;
    });
  return `<ol aria-label="Historial de pagos">${filas.join('')}</ol>`;
};

let clave = '';
let historial = [];

const pintar = (el, pago) => {
  el.innerHTML = resumenHTML(pago) + historialHTML(historial);
  el.className = `editor__aceptada editor__pagos editor__pago--${pago.estado}`;
  el.hidden = false;
};

export const actualizarPagosEditor = async () => {
  const el = $('#editor-pagos');
  if (!el) return;
  const p = ctx.propuestaId ? ctx.propuestas.find(x => x.id === ctx.propuestaId) : null;
  const pago = p?.pago;
  if (!pago || !ESTADOS_PAGO[pago.estado]) {
    el.hidden = true;
    clave = '';
    historial = [];
    return;
  }
  // El historial se vuelve a leer solo si cambió el pago (no en cada cambio de la propuesta).
  const nueva = `${p.id}:${pago.id}:${pago.estado}:${pago.actualizado}`;
  if (nueva === clave) return pintar(el, pago);
  if (!clave.startsWith(`${p.id}:`)) historial = [];
  clave = nueva;
  pintar(el, pago);
  try {
    const lista = AteneaDB?.pagos ? await AteneaDB.pagos.listar(p.id) : [];
    if (clave !== nueva) return;
    historial = lista;
    pintar(el, pago);
  } catch (e) {
    console.warn('No se pudo leer el historial de pagos:', e);
  }
};
