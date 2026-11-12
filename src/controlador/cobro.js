// Método de cobro en el editor (paso Inversión): con transferencia se muestran los campos
// del titular, CBU/CVU y alias, y se avisa si alguno no tiene el formato correcto. Los datos
// van en la propuesta (payload.cobro) y el cliente los ve al aceptarla (ver aceptar.js).

import { $ } from '../lib/formato.js';
import { cbuValido, aliasValido, normalizarCobro } from '../modelo.js';
import { ctx } from './contexto.js';

export const pintarCobroEditor = () => {
  const bloque = $('#cobro-editor');
  if (!bloque) return;
  const c = normalizarCobro(ctx.estado?.cobro);
  const transferencia = c.metodo === 'transferencia';
  $('#cobro-transferencia').hidden = !transferencia;
  $('#cobro-acordar').hidden = transferencia;
  // Solo se marca un dato mal escrito cuando ya hay algo cargado.
  const cbu = c.cbu.replace(/\D/g, '');
  $('#cobro-cbu-ayuda').hidden = !cbu || cbuValido(cbu);
  $('#cobro-alias-ayuda').hidden = !c.alias || aliasValido(c.alias);
};

// Para no cargarlos en cada propuesta: los datos de cobro de la propuesta más reciente
// que los tenga (null si no hay ninguna).
export const cobroReciente = () => {
  const conDatos = (ctx.propuestas || [])
    .map(p => p.payload?.cobro)
    .find(c => c && (String(c.cbu || '').trim() || String(c.alias || '').trim()));
  return conDatos ? normalizarCobro(conDatos) : null;
};

export const instalarCobro = () => {
  // Los campos usan data-campo como el resto del editor: acá solo se repinta la ayuda.
  $('#cobro-editor')?.addEventListener('input', () => setTimeout(pintarCobroEditor, 0));
  $('#cobro-editor')?.addEventListener('change', () => setTimeout(pintarCobroEditor, 0));
};
