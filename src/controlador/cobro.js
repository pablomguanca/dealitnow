// Método de cobro en el editor (paso Inversión). El método va en la propuesta
// (payload.cobro.metodo); los datos bancarios (titular, CBU/CVU, alias) van aparte, en la
// cuenta (cobros/{uid}, que solo lee el dueño), y sirven para todas las propuestas. El
// cliente los recibe del servidor recién al aceptar (api/aceptar).
// Sin cuenta, se guardan en este navegador y pasan a la cuenta al registrarse.

import { $ } from '../lib/formato.js';
import { cbuValido, aliasValido, normalizarCobro, normalizarDatosCobro } from '../modelo.js';
import { ctx, nube, AteneaDB } from './contexto.js';
import { actualizar } from './documento.js';

const CLAVE_LOCAL = 'dealit-cobro';
let datos = { titular: '', cbu: '', alias: '' };
let cargados = false;
let temporizador = null;

const leerLocal = () => { try { return JSON.parse(localStorage.getItem(CLAVE_LOCAL) || 'null'); } catch { return null; } };
const guardarLocal = d => { try { localStorage.setItem(CLAVE_LOCAL, JSON.stringify(d)); } catch { } };

export const hayDatosDeCobro = () => !!normalizarDatosCobro(datos);

const campos = () => ({ titular: $('#cobro-titular'), cbu: $('#cobro-cbu'), alias: $('#cobro-alias') });

const pintarCampos = () => {
  const c = campos();
  if (!c.titular) return;
  // No se pisa lo que está escribiendo.
  for (const k of ['titular', 'cbu', 'alias']) if (document.activeElement !== c[k]) c[k].value = datos[k] || '';
};

export const pintarCobroEditor = () => {
  if (!$('#cobro-editor')) return;
  const c = normalizarCobro(ctx.estado?.cobro);
  const transferencia = c.metodo === 'transferencia';
  $('#cobro-transferencia').hidden = !transferencia;
  $('#cobro-acordar').hidden = transferencia;
  if (!transferencia) $('#cobro-estado').textContent = '';
  // Solo se marca un dato mal escrito cuando ya hay algo cargado.
  const cbu = String(datos.cbu || '').replace(/\D/g, '');
  $('#cobro-cbu-ayuda').hidden = !cbu || cbuValido(cbu);
  $('#cobro-alias-ayuda').hidden = !datos.alias || aliasValido(String(datos.alias).trim());
  pintarCampos();
  sincronizarPropuesta();
};

// La propuesta anota si hay datos de cobro (para el texto del botón del cliente).
const sincronizarPropuesta = () => {
  if (!ctx.estado?.cobro || !cargados) return;
  const conDatos = hayDatosDeCobro();
  if (ctx.estado.cobro.conDatos === conDatos) return;
  ctx.estado.cobro = { ...normalizarCobro(ctx.estado.cobro), conDatos };
  if (ctx.editando) actualizar();
};

const guardar = async () => {
  const estado = $('#cobro-estado');
  if (!nube()) {
    guardarLocal(datos);
    return;
  }
  try {
    await AteneaDB.cobro.guardar(datos);
    if (estado) estado.textContent = 'Datos de cobro guardados en tu cuenta.';
  } catch (e) {
    console.error('No se pudieron guardar los datos de cobro:', e);
    if (estado) estado.textContent = 'No pudimos guardar los datos de cobro. Revisá tu conexión.';
  }
};

const alEscribir = () => {
  const c = campos();
  datos = { titular: c.titular.value, cbu: c.cbu.value, alias: c.alias.value };
  $('#cobro-estado').textContent = '';
  pintarCobroEditor();
  clearTimeout(temporizador);
  temporizador = setTimeout(guardar, 700);
};

// Al entrar con la cuenta: se leen los datos de cobro. Si todavía no hay, se toman los que
// hubiera en este navegador (sin cuenta) o, de la versión anterior, dentro de alguna
// propuesta; en ese caso se pasan a la cuenta y se borran de esas propuestas.
export const cargarCobroCuenta = async () => {
  if (!nube() || !AteneaDB?.cobro) return;
  try {
    let guardados = normalizarDatosCobro(await AteneaDB.cobro.obtener() || {});
    if (!guardados) {
      const viejas = (ctx.propuestas || []).filter(p => normalizarDatosCobro(p.payload?.cobro || {}));
      const previo = normalizarDatosCobro(leerLocal() || {}) || normalizarDatosCobro(viejas[0]?.payload?.cobro || {});
      if (previo) {
        await AteneaDB.cobro.guardar(previo);
        guardados = previo;
      }
    }
    datos = guardados || { titular: '', cbu: '', alias: '' };
    cargados = true;
    try { localStorage.removeItem(CLAVE_LOCAL); } catch { }
    limpiarPropuestasViejas();
    pintarCobroEditor();
  } catch (e) {
    console.warn('No se pudieron leer los datos de cobro:', e);
  }
};

// Propuestas guardadas con la versión anterior, que llevaban los datos bancarios adentro
// (y por eso se podían leer con el link): se reescriben sin ellos.
const limpiadas = new Set();
const limpiarPropuestasViejas = () => {
  (ctx.propuestas || []).forEach(p => {
    const c = p.payload?.cobro;
    if (!c || !('cbu' in c || 'alias' in c || 'titular' in c) || limpiadas.has(p.id)) return;
    limpiadas.add(p.id);
    const payload = { ...p.payload, cobro: { metodo: normalizarCobro(c).metodo, conDatos: !!normalizarDatosCobro(c) } };
    AteneaDB.proposals.actualizar(p.id, { payload }).catch(e => console.warn('No se pudo limpiar la propuesta', p.id, e));
  });
};

export const reiniciarCobro = () => {
  datos = { titular: '', cbu: '', alias: '' };
  cargados = false;
  limpiadas.clear();
};

export const instalarCobro = () => {
  // Sin cuenta: lo que haya en este navegador.
  const local = leerLocal();
  if (local) datos = { titular: local.titular || '', cbu: local.cbu || '', alias: local.alias || '' };
  cargados = !nube();
  ['#cobro-titular', '#cobro-cbu', '#cobro-alias'].forEach(sel => $(sel)?.addEventListener('input', alEscribir));
  // El método usa data-campo como el resto del editor: acá solo se repinta.
  $('#cobro-metodo')?.addEventListener('change', () => setTimeout(pintarCobroEditor, 0));
  // Con la cuenta, cuando llegan las propuestas: se cargan los datos de cobro (y se pasan a
  // la cuenta los que hubiera dentro de alguna propuesta vieja).
  document.addEventListener('dealit:propuestas', () => {
    if (!nube()) return;
    if (!cargados) cargarCobroCuenta();
    else limpiarPropuestasViejas();
  });
};
