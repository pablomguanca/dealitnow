// Método de cobro en el editor (paso Inversión). El método va en la propuesta
// (payload.cobro.metodo); los datos bancarios (titular, CBU/CVU, alias) van aparte, en la
// cuenta (cobros/{uid}, que solo lee el dueño), y sirven para todas las propuestas. El
// cliente los recibe del servidor recién al aceptar (api/aceptar).
// Sin cuenta, se guardan en este navegador y pasan a la cuenta al registrarse.
// Mercado Pago: el freelancer vincula su cuenta (OAuth, api/cobro-mp) desde el editor o
// desde Mi cuenta, y el cliente paga desde la propuesta aceptada.

import { $, $$, esc } from '../lib/formato.js';
import { cbuValido, aliasValido, normalizarCobro, normalizarDatosCobro, usaTransferencia, usaMercadoPago } from '../modelo.js';
import { ctx, nube, AteneaDB } from './contexto.js';
import { actualizar } from './documento.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarExito, avisarError, confirmar } from './avisos.js';
import { llamarApi } from './api.js';
import { montarMarcasMp } from '../lib/mp-marca.js';

const CLAVE_LOCAL = 'dealit-cobro';
let datos = { titular: '', cbu: '', alias: '' };
let cargados = false;
let temporizador = null;

const leerLocal = () => { try { return JSON.parse(localStorage.getItem(CLAVE_LOCAL) || 'null'); } catch { return null; } };
const guardarLocal = d => { try { localStorage.setItem(CLAVE_LOCAL, JSON.stringify(d)); } catch { } };

export const hayDatosDeCobro = () => !!normalizarDatosCobro(datos);

// Estado de Mercado Pago de la cuenta (lo pregunta al servidor): configurado en Dealit y
// cuenta vinculada.
let mp = { configurado: false, vinculado: false, nombre: '', email: '' };
export const mpVinculado = () => mp.vinculado;

const pintarMp = () => {
  $$('[data-mp-bloque]').forEach(b => {
    const estado = b.querySelector('[data-mp-estado]');
    b.querySelector('[data-mp-vincular]').hidden = mp.vinculado;
    b.querySelector('[data-mp-desvincular]').hidden = !mp.vinculado;
    b.classList.toggle('cobro-mp--vinculado', mp.vinculado);
    estado.innerHTML = mp.vinculado
      ? `Vinculado${mp.nombre || mp.email ? ` con <strong>${esc(mp.nombre || mp.email)}</strong>` : ''}. Tus clientes pagan desde la propuesta aceptada y la plata va directo a tu cuenta.`
      : 'Tu cliente paga con tarjeta o dinero en cuenta y la plata va directo a tu Mercado Pago. Mercado Pago cobra su comisión; Dealit, ninguna.';
    const vista = b.querySelector('[data-mp-vista]');
    if (vista) vista.hidden = !mp.vinculado;
    const enDolares = ctx.estado?.inversion?.moneda && ctx.estado.inversion.moneda !== 'ARS';
    const aviso = b.querySelector('[data-mp-moneda]');
    if (aviso) aviso.hidden = !(b.closest('#cobro-editor') && enDolares);
  });
  // Sin Mercado Pago configurado en el servidor, no se ofrecen esas opciones.
  $$('#cobro-metodo option[data-requiere-mp]').forEach(o => { o.hidden = !mp.configurado; o.disabled = !mp.configurado; });
  const tarjeta = $('#tarjeta-mp');
  if (tarjeta) tarjeta.hidden = !mp.configurado;
  if (mp.vinculado) montarMarcasMp(document);
};

export const consultarMp = async () => {
  if (!nube()) return;
  try {
    mp = { ...mp, ...(await llamarApi('/api/cobro-mp', { accion: 'estado' })) };
  } catch (e) {
    console.warn('No se pudo consultar Mercado Pago:', e.codigo || e.message);
  }
  pintarMp();
  pintarCobroEditor();
};

const vincularMp = async boton => {
  if (!nube()) return;
  boton.disabled = true;
  try {
    const { url } = await llamarApi('/api/cobro-mp', { accion: 'vincular' });
    // Por si se vuelve a esta pantalla en otra pestaña o desde la app: se vuelve a preguntar.
    try { sessionStorage.setItem('dealit-mp-vinculando', '1'); } catch { }
    location.href = url;
  } catch (e) {
    console.error('No se pudo iniciar la vinculación con Mercado Pago:', e);
    avisarError('No pudimos abrir Mercado Pago. Probá de nuevo en un minuto.');
    boton.disabled = false;
  }
};

const desvincularMp = async boton => {
  if (!await confirmar({
    titulo: '¿Desvincular Mercado Pago?',
    texto: 'Tus clientes ya no van a poder pagarte con Mercado Pago desde las propuestas. Podés volver a vincularlo cuando quieras.',
    aceptar: 'Desvincular',
    peligro: true
  })) return;
  boton.disabled = true;
  try {
    await llamarApi('/api/cobro-mp', { accion: 'desvincular' });
    mp = { ...mp, vinculado: false, nombre: '', email: '' };
    avisar('Listo: tu Mercado Pago quedó desvinculado.');
  } catch {
    avisarError('No pudimos desvincular la cuenta. Probá de nuevo.');
  } finally {
    boton.disabled = false;
    pintarMp();
    pintarCobroEditor();
  }
};

// Vuelta de Mercado Pago (/cuenta?mp=…): avisa cómo salió y limpia la dirección.
const MENSAJES_VUELTA = {
  vinculado: ['ok', '¡Listo! Tu Mercado Pago quedó vinculado. Tus clientes ya pueden pagarte desde la propuesta.'],
  cancelado: ['aviso', 'No se vinculó Mercado Pago: cancelaste el permiso. Podés volver a intentarlo cuando quieras.'],
  vencido: ['error', 'El pedido para vincular Mercado Pago venció. Tocá «Vincular Mercado Pago» de nuevo.'],
  error: ['error', 'No pudimos vincular tu Mercado Pago. Probá de nuevo en unos minutos.'],
  'no-configurado': ['error', 'Mercado Pago todavía no está disponible en Dealit.']
};
const leerVuelta = () => {
  const parametros = new URLSearchParams(location.search);
  const resultado = parametros.get('mp');
  if (!resultado || !MENSAJES_VUELTA[resultado]) return;
  const [tipo, texto] = MENSAJES_VUELTA[resultado];
  (tipo === 'ok' ? avisarExito : tipo === 'error' ? avisarError : avisar)(texto, 8000);
  parametros.delete('mp');
  history.replaceState(null, '', location.pathname + (parametros.toString() ? `?${parametros}` : ''));
};

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
  const transferencia = usaTransferencia(c.metodo);
  $('#cobro-transferencia').hidden = !transferencia;
  $('#cobro-mercadopago').hidden = !usaMercadoPago(c.metodo);
  $('#cobro-acordar').hidden = c.metodo !== 'acordar';
  if (!transferencia) $('#cobro-estado').textContent = '';
  pintarMp();
  // Solo se marca un dato mal escrito cuando ya hay algo cargado.
  const cbu = String(datos.cbu || '').replace(/\D/g, '');
  $('#cobro-cbu-ayuda').hidden = !cbu || cbuValido(cbu);
  $('#cobro-alias-ayuda').hidden = !datos.alias || aliasValido(String(datos.alias).trim());
  pintarCampos();
  sincronizarPropuesta();
};

// La propuesta anota si hay datos bancarios y si Mercado Pago está vinculado (para lo que
// ve el cliente: el texto del botón y el botón de pago).
let mpConsultado = false;
const sincronizarPropuesta = () => {
  if (!ctx.estado?.cobro || !cargados) return;
  const actual = normalizarCobro(ctx.estado.cobro);
  const conDatos = hayDatosDeCobro();
  const conMp = mpConsultado ? mp.vinculado : actual.conMp;
  if (actual.conDatos === conDatos && actual.conMp === conMp) return;
  ctx.estado.cobro = { ...actual, conDatos, conMp };
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
  mp = { configurado: false, vinculado: false, nombre: '', email: '' };
  mpConsultado = false;
  pintarMp();
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
    if (!mpConsultado) {
      mpConsultado = true;
      consultarMp().then(leerVuelta);
    }
  });
  // Al volver a la app (por ejemplo, después de autorizar en Mercado Pago desde el
  // navegador), se vuelve a preguntar si quedó vinculado.
  document.addEventListener('visibilitychange', () => {
    let vinculando = false;
    try { vinculando = sessionStorage.getItem('dealit-mp-vinculando') === '1'; } catch { }
    if (document.visibilityState === 'visible' && vinculando && nube()) {
      try { sessionStorage.removeItem('dealit-mp-vinculando'); } catch { }
      consultarMp();
    }
  });
  registrarAcciones({
    'vincular-mp': boton => vincularMp(boton),
    'desvincular-mp': boton => desvincularMp(boton)
  });
};
