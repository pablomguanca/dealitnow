// Aceptación de la propuesta por el cliente y llamadas a las funciones de /api
// (visitas y aceptación). El servidor valida todo; acá solo se propone.

import { $, esc, dinero } from '../lib/formato.js';
import { servicioConContenido } from '../lib/render.js';
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
const VISITA_INTERVALO = 30 * 60 * 1000;
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
const modoAceptar = modo => {
  $('#aceptar-formulario').hidden = modo !== 'formulario';
  $('#aceptar-confirmar').hidden = modo !== 'formulario';
  if (modo === 'formulario') ['#aceptar-whatsapp', '#aceptar-email', '#aceptar-copiar'].forEach(sel => { $(sel).hidden = true; });
  $('#aceptar-titulo').textContent = modo === 'listo' ? '¡Propuesta aceptada!' : 'Confirmar la propuesta';
  $('#aceptar-cerrar').textContent = modo === 'listo' ? 'Cerrar' : 'Volver a la propuesta';
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
    $('#aceptar-texto').textContent = `Listo, ${nombre.split(' ')[0]}. ${emisor || 'Quien te mandó la propuesta'} ya puede ver tu aceptación.${hay ? ' Si querés, avisale también por mensaje.' : ''}`;
  } catch (e) {
    console.error('No se pudo aceptar la propuesta:', e);
    errorAceptacion.textContent = MENSAJES_ACEPTACION[e.codigo] || 'No pudimos registrar tu aceptación. Revisá tu conexión y probá de nuevo.';
    errorAceptacion.hidden = false;
  } finally {
    boton.textContent = 'Aceptar propuesta';
    actualizarBotonAceptar();
  }
};

export const instalarAceptar = () => {
  $('#aceptar-nombre').addEventListener('input', actualizarBotonAceptar);
  $('#aceptar-conformidad').addEventListener('change', actualizarBotonAceptar);
  $('#aceptar-confirmar').addEventListener('click', confirmarAceptacion);

  registrarAcciones({
    'aceptar': () => abrirAceptar(),
    'copiar-aceptacion': async () => {
      if (await copiar(mensajeAceptacion().texto)) avisarExito('Mensaje copiado. Pegalo en tu chat o mail.');
      else avisarError('No se pudo copiar. Probá de nuevo.');
    }
  });
};
