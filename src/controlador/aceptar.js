// Aceptación de la propuesta por el cliente y llamadas a las funciones de /api
// (visitas y aceptación). El servidor valida todo; acá solo se propone.

import { $, esc, dinero } from '../lib/formato.js';
import { servicioConContenido, tarjetaCobroHTML, primerPagoTexto, pagoMpHTML, pagaConMp } from '../lib/render.js';
import { cobraPorTransferencia, calcularTotales } from '../modelo.js';
import { MENSAJES_ACEPTACION, NOMBRE_MIN, limpiarNombre } from '../aceptacion.js';
import {
  ctx,
  AteneaDB,
  CLAVE,
  aceptada,
  calcular,
  enlaceWhatsApp,
  enlaceEmail,
  nombreEmisor,
  tituloPropuesta
} from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarExito, avisarError } from './avisos.js';
import { renderDocumento } from './vista.js';
import { copiar } from '../lib/portapapeles.js';
import { llamarApi } from './api.js';

const mensajeAceptacion = (firma = ctx.estado.cliente.nombre.trim()) => {
  const { estado, seleccion } = ctx;
  const c = calcular();
  const m = estado.inversion.moneda;
  const sumados = estado.servicios.filter(s => s.opcional && seleccion.has(s.id) && servicioConContenido(s)).map(s => s.nombre.trim());
  const emisor = nombreEmisor();
  const lineasMsg = [`Hola${emisor ? ` ${emisor.split(' ')[0]}` : ''}! Acepto la propuesta${estado.propuesta.numero.trim() ? ` ${estado.propuesta.numero.trim()}` : ''} «${tituloPropuesta()}».`];
  if (c.inicial.total > 0) lineasMsg.push(`${c.mensual.base > 0 ? 'Inversión inicial' : 'Inversión total'}: ${dinero(c.inicial.total, m)}`);
  if (c.mensual.total > 0) lineasMsg.push(`Servicio mensual: ${dinero(c.mensual.total, m)} por mes`);
  if (sumados.length) lineasMsg.push(`Sumé: ${sumados.join(', ')}.`);
  if (firma) lineasMsg.push(firma);
  return { texto: lineasMsg.join('\n'), c, sumados };
};

// Una visita cada media hora por navegador: recargar la página no suma visitas.
// El mismo navegador no registra otra visita antes de esto (recargar la página no cuenta).
const VISITA_INTERVALO = 30 * 1000;
export const registrarVisita = id => {
  const clave = `${CLAVE}:visto:${id}`;
  try {
    if (Date.now() - Number(localStorage.getItem(clave) || 0) < VISITA_INTERVALO) return;
    localStorage.setItem(clave, String(Date.now()));
  } catch { }
  llamarApi('/api/visto', { id }, { keepalive: true }).catch(e => console.warn('No se pudo registrar la visita:', e));
};

const llenarResumenAceptacion = () => {
  const { c, sumados } = mensajeAceptacion();
  const m = ctx.estado.inversion.moneda;
  const filas = [];
  if (c.inicial.total > 0) filas.push([c.mensual.base > 0 ? 'Inversión inicial' : 'Inversión total', dinero(c.inicial.total, m)]);
  if (c.mensual.total > 0) filas.push(['Servicio mensual', `${dinero(c.mensual.total, m)} por mes`]);
  if (sumados.length) filas.push(['Sumaste', sumados.join(', ')]);
  $('#aceptar-resumen').innerHTML = filas.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('');
  $('#aceptar-resumen').hidden = !filas.length;
};

// Configura los botones que abren WhatsApp o el email con el mensaje. Devuelve si hay alguno.
const prepararMensajeria = (mensaje, { whatsapp, email }) => {
  const wa = enlaceWhatsApp(mensaje);
  const mail = enlaceEmail(`Acepto la propuesta ${ctx.estado.propuesta.numero.trim() || tituloPropuesta()}`.trim(), mensaje);
  const elWa = $('#aceptar-whatsapp');
  const elMail = $('#aceptar-email');
  elWa.hidden = !wa;
  elMail.hidden = !mail;
  if (wa) elWa.href = wa;
  if (mail) elMail.href = mail;
  elWa.textContent = whatsapp;
  elMail.textContent = email;
  return !!(wa || mail);
};

// 'mensaje': link largo, se confirma por WhatsApp o email. 'formulario': link corto,
// se acepta con nombre y casilla. 'listo': aceptación registrada.
// Propuesta o presupuesto (formato del documento), para los textos.
const esPresupuesto = () => ctx.estado?.opciones?.formato === 'presupuesto';
const queEs = () => (esPresupuesto() ? 'presupuesto' : 'propuesta');

// Texto del botón principal: con transferencia, el cliente sabe que al aceptar ve cómo pagar.
const textoBotonAceptar = () => `Aceptar ${queEs()}${cobraPorTransferencia(ctx.estado) || pagaConMp(ctx.estado) ? ' y ver datos de pago' : ''}`;

const modoAceptar = modo => {
  $('#aceptar-formulario').hidden = modo !== 'formulario';
  $('#aceptar-confirmar').hidden = modo !== 'formulario';
  if (modo === 'formulario') ['#aceptar-whatsapp', '#aceptar-email', '#aceptar-copiar'].forEach(sel => { $(sel).hidden = true; });
  if (modo !== 'listo') $('#aceptar-cobro').hidden = true;
  $('#dialogo-aceptar').classList.toggle('dialogo--aceptada', modo === 'listo');
  $('#aceptar-titulo').textContent = modo === 'listo'
    ? `¡Excelente! ${esPresupuesto() ? 'Presupuesto aceptado' : 'Propuesta aceptada'}`
    : `Confirmar ${esPresupuesto() ? 'el presupuesto' : 'la propuesta'}`;
  $('#aceptar-conformidad-texto').textContent = `Acepto los términos, condiciones y el alcance detallado en ${esPresupuesto() ? 'este presupuesto' : 'esta propuesta'}.`;
  $('#aceptar-confirmar').textContent = textoBotonAceptar();
  $('#aceptar-cerrar').textContent = modo === 'listo' ? 'Cerrar' : `Volver ${esPresupuesto() ? 'al presupuesto' : 'a la propuesta'}`;
};

const actualizarBotonAceptar = () => {
  $('#aceptar-confirmar').disabled = limpiarNombre($('#aceptar-nombre').value).length < NOMBRE_MIN || !$('#aceptar-conformidad').checked;
};

const abrirAceptar = () => {
  if (!ctx.esCliente) {
    avisar('Así lo ve tu cliente. En el link, este botón le permite aceptar la propuesta.');
    return;
  }
  if (aceptada()) return;
  llenarResumenAceptacion();
  const emisor = nombreEmisor();
  if (ctx.compartida) {
    modoAceptar('formulario');
    $('#aceptar-error').hidden = true;
    const campoNombre = $('#aceptar-nombre');
    if (!campoNombre.value) campoNombre.value = ctx.estado.cliente.nombre.trim();
    $('#aceptar-conformidad').checked = false;
    actualizarBotonAceptar();
    $('#aceptar-texto').textContent = `${emisor || 'Quien te mandó la propuesta'} va a ver tu aceptación al instante. Queda registrado tu nombre, la fecha y lo que elegiste.`;
  } else {
    modoAceptar('mensaje');
    const hay = prepararMensajeria(mensajeAceptacion().texto, { whatsapp: 'Confirmar por WhatsApp', email: 'Confirmar por email' });
    $('#aceptar-copiar').hidden = hay;
    $('#aceptar-texto').textContent = hay
      ? `Se abre un mensaje${emisor ? ` para ${emisor}` : ''} con este resumen, listo para enviar.`
      : `Copiá el mensaje y mandáselo${emisor ? ` a ${emisor}` : ''} por donde suelan hablar.`;
  }
  $('#dialogo-aceptar').showModal();
};

const confirmarAceptacion = async () => {
  const boton = $('#aceptar-confirmar');
  const errorAceptacion = $('#aceptar-error');
  const nombre = limpiarNombre($('#aceptar-nombre').value);
  boton.disabled = true;
  boton.textContent = 'Aceptando…';
  errorAceptacion.hidden = true;
  try {
    const { aceptacion } = await llamarApi('/api/aceptar', { id: ctx.compartida.id, nombre, acepto: true, opcionales: [...ctx.seleccion] });
    ctx.compartida.aceptacion = aceptacion;
    renderDocumento();
    modoAceptar('listo');
    const emisor = nombreEmisor();
    const hay = prepararMensajeria(mensajeAceptacion(nombre).texto, { whatsapp: 'Avisar por WhatsApp', email: 'Avisar por email' });
    // Con transferencia: los datos para pagar, que recién ahora entrega el servidor. Con
    // Mercado Pago: el botón para pagar.
    const cobro = aceptacion.cobro || null;
    const conMp = pagaConMp(ctx.estado);
    const pago = primerPagoTexto(ctx.estado, calcularTotales(ctx.estado, ctx.seleccion));
    const elCobro = $('#aceptar-cobro');
    elCobro.innerHTML = (conMp ? pagoMpHTML(pago, { conTransferencia: !!cobro }) : '') + tarjetaCobroHTML(cobro, { pago: conMp ? null : pago });
    elCobro.hidden = !cobro && !conMp;
    $('#aceptar-texto').textContent = cobro || conMp
      ? `Gracias, ${nombre.split(' ')[0]}. ${emisor || 'Quien te mandó la propuesta'} ya recibió tu aceptación.${hay ? ` Cuando ${cobro ? 'transfieras' : 'pagues'}, avisale por mensaje.` : ''}`
      : `Listo, ${nombre.split(' ')[0]}. ${emisor || 'Quien te mandó la propuesta'} ya puede ver tu aceptación.${hay ? ' Si querés, avisale también por mensaje.' : ''}`;
  } catch (e) {
    console.error('No se pudo aceptar la propuesta:', e);
    errorAceptacion.textContent = MENSAJES_ACEPTACION[e.codigo] || 'No pudimos registrar tu aceptación. Revisá tu conexión y probá de nuevo.';
    errorAceptacion.hidden = false;
  } finally {
    boton.textContent = textoBotonAceptar();
    actualizarBotonAceptar();
  }
};

const MENSAJES_PAGO = {
  'mp-no-vinculado': 'Quien te mandó la propuesta todavía no tiene Mercado Pago vinculado. Escribile para coordinar el pago.',
  'moneda-no-soportada': 'Mercado Pago cobra en pesos y esta propuesta está en otra moneda. Escribile a quien te la mandó para coordinar el pago.',
  'sin-aceptar': 'Primero aceptá la propuesta.',
  'mercadopago-rechazo': 'Mercado Pago no pudo crear el pago. Probá de nuevo en un minuto.'
};

// Vuelta de Mercado Pago al link (/p/…?pago=…): cómo salió el pago.
export const avisarVueltaDePago = () => {
  const parametros = new URLSearchParams(location.search);
  const pago = parametros.get('pago');
  if (!pago) return;
  if (pago === 'aprobado') avisarExito('¡Pago realizado! Mercado Pago te manda el comprobante por email.', 9000);
  else if (pago === 'pendiente') avisar('Tu pago quedó pendiente en Mercado Pago. Te avisan por email cuando se acredite.', 9000);
  else avisarError('El pago no se completó. Podés intentarlo de nuevo desde el botón.', 9000);
  ['pago', 'collection_id', 'collection_status', 'payment_id', 'status', 'external_reference', 'payment_type', 'merchant_order_id', 'preference_id', 'site_id', 'processing_mode', 'merchant_account_id'].forEach(k => parametros.delete(k));
  history.replaceState(null, '', location.pathname + (parametros.toString() ? `?${parametros}` : ''));
};

export const instalarAceptar = () => {
  $('#aceptar-nombre').addEventListener('input', actualizarBotonAceptar);
  $('#aceptar-conformidad').addEventListener('change', actualizarBotonAceptar);
  $('#aceptar-confirmar').addEventListener('click', confirmarAceptacion);

  registrarAcciones({
    'aceptar': () => abrirAceptar(),
    // Pagar con Mercado Pago: el servidor crea el pago con la cuenta del freelancer.
    'pagar-mp': async boton => {
      if (!ctx.esCliente || !ctx.compartida?.id) {
        avisar('Así lo ve tu cliente: al tocarlo, paga con Mercado Pago y la plata va a tu cuenta.');
        return;
      }
      boton.disabled = true;
      try {
        const { url } = await llamarApi('/api/cobro-mp', { accion: 'pagar', id: ctx.compartida.id });
        location.href = url;
      } catch (e) {
        avisarError(MENSAJES_PAGO[e.codigo] || 'No pudimos abrir Mercado Pago. Revisá tu conexión y probá de nuevo.', 9000);
        boton.disabled = false;
      }
    },
    // Copiar el CBU, el alias o el titular de la tarjeta de transferencia.
    'copiar-dato-cobro': async boton => {
      if (await copiar(boton.dataset.valor || '')) {
        avisarExito(`${boton.dataset.que === 'titular' ? 'Titular' : boton.dataset.que === 'alias' ? 'Alias' : 'CBU'} copiado.`);
        boton.textContent = 'Copiado';
        setTimeout(() => { boton.textContent = 'Copiar'; }, 1800);
      } else avisarError('No se pudo copiar. Probá de nuevo.');
    },
    'copiar-aceptacion': async () => {
      if (await copiar(mensajeAceptacion().texto)) avisarExito('Mensaje copiado. Pegalo en tu chat o mail.');
      else avisarError('No se pudo copiar. Probá de nuevo.');
    }
  });
};
