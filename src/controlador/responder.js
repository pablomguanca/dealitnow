// «Pedir un cambio» y «No avanzo por ahora» desde el link del cliente. El servidor
// (api/aceptar, con `accion`) valida y le avisa al dueño; acá solo se arma el pedido.

import { $, esc } from '../lib/formato.js';
import { CAMBIO_MIN, COMENTARIO_MAX, CAMBIO_MAX, MENSAJES_RESPUESTA, MOTIVOS_RECHAZO } from '../respuestas.js';
import { ctx, nombreEmisor } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarExito } from './avisos.js';
import { renderDocumento } from './vista.js';
import { llamarApi } from './api.js';

let modo = 'cambio';

const queEs = () => (ctx.estado?.opciones?.formato === 'presupuesto' ? 'el presupuesto' : 'la propuesta');
const motivoElegido = () => $('#responder-opciones input:checked')?.value || '';

const actualizarBoton = () => {
  const texto = $('#responder-comentario').value.trim();
  const listo = modo === 'cambio'
    ? texto.length >= CAMBIO_MIN
    : !!motivoElegido() && (motivoElegido() !== 'otro' || texto.length > 0);
  $('#responder-enviar').disabled = !listo;
};

const abrir = (nuevoModo, { vencida = false } = {}) => {
  if (!ctx.esCliente) {
    avisar(nuevoModo === 'cambio'
      ? 'Así lo ve tu cliente: desde acá te puede pedir un cambio y te llega el aviso.'
      : 'Así lo ve tu cliente: si no avanza, te cuenta por qué y te llega el aviso.');
    return;
  }
  if (!ctx.compartida?.id) return;
  modo = nuevoModo;
  const quien = nombreEmisor() || 'quien te la mandó';
  const cambio = modo === 'cambio';
  $('#responder-titulo').textContent = cambio ? (vencida ? 'Pedir una versión actualizada' : 'Pedir un cambio') : 'No avanzo por ahora';
  $('#responder-texto').textContent = cambio
    ? `Contale a ${quien} qué te gustaría ajustar. Le llega al instante y, cuando actualice ${queEs()}, la ves en este mismo link.`
    : `Contale a ${quien} por qué, así te puede ofrecer otra opción. Si cambiás de idea, la podés aceptar igual.`;
  $('#responder-motivos').hidden = cambio;
  if (!cambio) {
    $('#responder-opciones').innerHTML = Object.entries(MOTIVOS_RECHAZO).map(([id, nombre]) => `
      <label class="responder__opcion"><input type="radio" name="motivo" value="${esc(id)}"><span>${esc(nombre)}</span></label>`).join('');
  }
  $('#responder-etiqueta').textContent = cambio ? '¿Qué te gustaría cambiar?' : 'Comentario (opcional)';
  const comentario = $('#responder-comentario');
  comentario.value = cambio && vencida ? 'Hola, ¿me podrías mandar una versión actualizada?' : '';
  comentario.maxLength = cambio ? CAMBIO_MAX : COMENTARIO_MAX;
  comentario.placeholder = cambio ? 'Ej.: ¿Se puede sacar la tienda online y sumar más piezas para redes?' : '';
  $('#responder-enviar').textContent = cambio ? 'Enviar pedido' : 'Avisar que no avanzo';
  $('#responder-error').hidden = true;
  actualizarBoton();
  $('#dialogo-responder').showModal();
};

const enviar = async () => {
  const boton = $('#responder-enviar');
  const error = $('#responder-error');
  const texto = $('#responder-comentario').value.trim();
  const etiqueta = boton.textContent;
  boton.disabled = true;
  boton.textContent = 'Enviando…';
  error.hidden = true;
  try {
    const quien = nombreEmisor() || 'Quien te la mandó';
    const respuesta = ctx.compartida.respuesta ||= { rechazo: null, cambios: 0 };
    if (modo === 'cambio') {
      await llamarApi('/api/aceptar', { id: ctx.compartida.id, accion: 'cambio', texto });
      respuesta.cambios = (Number(respuesta.cambios) || 0) + 1;
      avisarExito(`Listo. ${quien} ya recibió tu pedido.`, 6000);
    } else {
      const motivo = motivoElegido();
      await llamarApi('/api/aceptar', { id: ctx.compartida.id, accion: 'no-avanzo', motivo, ...(texto ? { comentario: texto } : {}) });
      respuesta.rechazo = { motivo };
      avisarExito(`Gracias por avisar. ${quien} ya sabe que no avanzás por ahora.`, 6000);
    }
    $('#dialogo-responder').close();
    renderDocumento();
  } catch (e) {
    console.error('No se pudo enviar la respuesta:', e);
    error.textContent = MENSAJES_RESPUESTA[e.codigo] || 'No pudimos enviarlo. Revisá tu conexión y probá de nuevo.';
    error.hidden = false;
  } finally {
    boton.textContent = etiqueta;
    actualizarBoton();
  }
};

export const instalarResponder = () => {
  if (!$('#dialogo-responder')) return;
  $('#responder-comentario').addEventListener('input', actualizarBoton);
  $('#responder-opciones').addEventListener('change', actualizarBoton);
  $('#responder-enviar').addEventListener('click', enviar);
  registrarAcciones({
    'pedir-cambio': boton => abrir('cambio', { vencida: boton.hasAttribute('data-vencida') }),
    'no-avanzo': () => abrir('no-avanzo')
  });
};
