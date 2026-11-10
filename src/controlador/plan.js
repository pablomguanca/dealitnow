// Plan del usuario en la app: muestra el estado (Gratis / Pro y envíos del mes), ofrece
// pasarse a Pro en los momentos justos y lleva al pago en Mercado Pago. Quién es Pro lo
// decide el servidor (api/mercadopago); acá solo se lee planes/{uid}.

import { $, $$, dinero } from '../lib/formato.js';
import { LIMITE_ENVIOS_GRATIS, PRECIOS_PRO, enviosDelMes, esPro, proParaVerificar } from '../planes.js';
import { LIMITE_IA_GRATIS } from '../ia.js';
import { ctx, AteneaDB } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarError, elegir } from './avisos.js';
import { llamarApi } from './api.js';
import { irRuta } from './navegacion.js';
import { irADiseno } from './hoja.js';

let dejarDeEscuchar = null;
let verificado = false;
// El servidor dice si los planes están activos para esta cuenta (interruptor PLANES_ACTIVOS).
let planesActivos = false;

// Meses que regala el anual frente a pagar 12 mensuales (hoy, 2).
export const mesesGratisAnual = () => Math.round(12 - PRECIOS_PRO.anual.monto / PRECIOS_PRO.mensual.monto);

const precioTexto = periodo => {
  const p = PRECIOS_PRO[periodo];
  if (periodo === 'anual') return `${dinero(p.monto, p.moneda)} por año · ${mesesGratisAnual()} meses gratis`;
  return `${dinero(p.monto, p.moneda)} por mes`;
};

const opcionesPro = () => [
  { valor: 'mensual', texto: `Pro mensual · ${precioTexto('mensual')}`, estilo: 'primario' },
  { valor: 'anual', texto: `Pro anual · ${precioTexto('anual')}`, estilo: 'secundario' }
];

export const usuarioEsPro = () => esPro(ctx.plan);

// Límites de Gratis en la app: solo con los planes activos para esta cuenta y sin Pro.
export const restriccionesActivas = () => planesActivos && !esPro(ctx.plan);

// Avisa al resto de la app (panel, editor) que cambió el plan, sin importarlos acá.
const aplicarRestricciones = () => {
  const antes = ctx.restringido;
  ctx.restringido = restriccionesActivas();
  ctx.marcaObligatoria = ctx.restringido;
  if (antes !== ctx.restringido) document.dispatchEvent(new CustomEvent('dealit:plan'));
};

let avisoPruebaDado = false;
// Al probar un diseño o una plantilla PRO en Gratis: se puede, pero no enviar.
export const avisarPruebaPro = () => {
  if (!restriccionesActivas() || avisoPruebaDado) return;
  avisoPruebaDado = true;
  avisar('Este diseño es PRO: probalo todo lo que quieras. Para enviarlo necesitás Dealit Pro.', 7000);
};

const pintarPlan = () => {
  const tarjeta = $('.tarjeta--plan');
  if (tarjeta) tarjeta.hidden = !planesActivos;
  const plan = ctx.plan || {};
  const pro = esPro(plan);
  const usados = enviosDelMes(plan);
  const estado = $('#plan-estado');
  if (!estado) return;
  if (pro) {
    const vence = plan.vence ? new Date(plan.vence).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    estado.textContent = plan.estado === 'activa'
      ? `Plan Pro ${plan.periodo === 'anual' ? 'anual' : 'mensual'} activo.${vence ? ` Próximo cobro: ${vence}.` : ''}`
      : `Plan Pro hasta el ${vence}. Cancelaste la renovación.`;
  } else {
    const quedan = Math.max(0, LIMITE_ENVIOS_GRATIS - usados);
    estado.textContent = `Plan Gratis: ${usados} de ${LIMITE_ENVIOS_GRATIS} propuestas enviadas este mes. ${quedan === 0 ? 'No te quedan envíos: se renuevan el mes que viene.' : quedan === 1 ? 'Te queda 1 envío.' : `Te quedan ${quedan} envíos.`}`;
  }
  $('#plan-ofertas').hidden = pro && plan.estado === 'activa';
  $('#plan-administrar').hidden = !pro;
  $('#plan-sincronizar').hidden = pro && plan.estado === 'activa';
  $$('[data-precio-pro]').forEach(el => { el.textContent = precioTexto(el.dataset.precioPro); });
  const barra = $('#plan-uso');
  if (barra) {
    barra.hidden = pro;
    barra.style.setProperty('--uso', String(Math.min(1, usados / LIMITE_ENVIOS_GRATIS)));
    barra.classList.toggle('plan-uso--ultimo', !pro && usados >= LIMITE_ENVIOS_GRATIS - 1);
  }
  aplicarRestricciones();
};

// Pregunta al servidor si los planes están activos para esta cuenta. Si falla (por ejemplo,
// la función tarda en arrancar justo al iniciar sesión), reintenta una vez; y se vuelve a
// preguntar cada vez que se entra a Mi cuenta, así un error suelto no deja oculto el plan.
export const consultarPlanesActivos = async (reintento = true) => {
  try {
    const r = await llamarApi('/api/plan', {});
    planesActivos = !!r?.activos;
    document.body.classList.toggle('ia-disponible', r?.ia === true);
  } catch (e) {
    console.warn('No se pudo consultar si los planes están activos:', e.codigo || e.message);
    if (reintento) {
      await new Promise(listo => setTimeout(listo, 1500));
      return consultarPlanesActivos(false);
    }
  }
  pintarPlan();
};

export const escucharPlan = () => {
  if (!AteneaDB?.plan) return;
  consultarPlanesActivos();
  if (dejarDeEscuchar) dejarDeEscuchar();
  dejarDeEscuchar = AteneaDB.plan.escuchar(plan => {
    const eraPro = esPro(ctx.plan);
    ctx.plan = plan;
    pintarPlan();
    if (!eraPro && esPro(plan) && ctx.plan.estado === 'activa') avisar('¡Listo! Ya tenés Dealit Pro.', 7000);
    // Pasó la fecha de cobro y no llegó el aviso: se le pregunta a Mercado Pago (una vez).
    if (proParaVerificar(plan) && !verificado) {
      verificado = true;
      sincronizar();
    }
  });
};

export const reiniciarPlan = () => {
  if (dejarDeEscuchar) { dejarDeEscuchar(); dejarDeEscuchar = null; }
  planesActivos = false;
  verificado = false;
  avisoPruebaDado = false;
  ctx.plan = null;
  aplicarRestricciones();
};

// Paso previo al pago: Mercado Pago exige el email de la cuenta con la que se paga, que
// puede no ser el de Dealit. Se confirma acá (con el de Dealit ya cargado).
let periodoElegido = 'mensual';
const CLAVE_EMAIL_PAGO = 'dealit-email-pago';
const suscribir = periodo => {
  periodoElegido = PRECIOS_PRO[periodo] ? periodo : 'mensual';
  const dialogo = $('#dialogo-pago');
  if (!dialogo) return;
  $('#pago-precio').textContent = `Pro ${periodoElegido} · ${precioTexto(periodoElegido)}`;
  let guardado = '';
  try { guardado = localStorage.getItem(CLAVE_EMAIL_PAGO) || ''; } catch { }
  $('#pago-email').value = guardado || AteneaDB?.auth.getUser()?.email || '';
  $('#pago-ir').disabled = false;
  dialogo.showModal();
  $('#pago-email').select();
};

// Crea la suscripción en el servidor y lleva a pagar a Mercado Pago.
const irAPagar = async () => {
  const emailPago = $('#pago-email').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailPago)) {
    avisarError('Revisá el email de tu cuenta de Mercado Pago.');
    $('#pago-email').focus();
    return;
  }
  const boton = $('#pago-ir');
  boton.disabled = true;
  try {
    try { localStorage.setItem(CLAVE_EMAIL_PAGO, emailPago); } catch { }
    const { url } = await llamarApi('/api/suscripcion', { periodo: periodoElegido, emailPago });
    location.href = url;
  } catch (e) {
    const mensajes = {
      'ya-es-pro': 'Ya tenés Dealit Pro activo.',
      'email-invalido': 'Revisá el email de tu cuenta de Mercado Pago.',
      'mercadopago-rechazo': 'Mercado Pago no pudo iniciar el pago.'
    };
    let mensaje = mensajes[e.codigo] || 'No pudimos iniciar el pago. Revisá tu conexión y probá de nuevo.';
    if (e.codigo === 'mercadopago-rechazo') {
      // Con las credenciales de prueba solo pagan compradores de prueba («real or test users»).
      if (/real or test|test users/i.test(e.detalle)) mensaje += ' Mercado Pago está en modo de prueba: solo se puede pagar con una cuenta de comprador de prueba.';
      else if (/email/i.test(e.detalle)) mensaje += ' Revisá que el email sea el de la cuenta de Mercado Pago con la que vas a pagar.';
      // El motivo real siempre a la vista: sirve para entender qué pasó.
      if (e.detalle) mensaje += ` Motivo: ${e.detalle}`;
    }
    avisarError(mensaje, 14000);
    boton.disabled = false;
  }
};

const lista = nombres => (nombres.length > 1 ? `«${nombres.slice(0, -1).join('», «')}» y «${nombres.at(-1)}»` : `«${nombres[0]}»`);

const MOTIVOS = {
  limite: () => ({
    titulo: `Ya enviaste tus ${LIMITE_ENVIOS_GRATIS} propuestas de este mes`,
    texto: 'Tu propuesta queda guardada. Con Pro la mandás ahora y todas las que vengan, sin tope, sin la marca de Dealit y viendo cuándo tu cliente la abre. Si no, el mes que viene se renueva tu cupo.'
  }),
  diseno: (nombres = []) => ({
    titulo: 'Este diseño es de Dealit Pro',
    texto: `Tu propuesta usa ${nombres.length ? lista(nombres) : 'un diseño PRO'}. Podés seguir probándolo, pero para enviarla necesitás Pro. También podés elegir un diseño sin la etiqueta PRO y mandarla gratis.`
  }),
  'link-activo': (nombres = []) => ({
    titulo: 'Tu cliente ya tiene el link',
    texto: `${nombres.length ? lista(nombres) : 'Este diseño'} es PRO y tu cliente lo vería al abrir la propuesta. Con Pro lo aplicás; si no, probalo en una copia de la propuesta.`
  }),
  ia: () => ({
    titulo: 'Usaste tus propuestas con IA de este mes',
    texto: `En Gratis armás ${LIMITE_IA_GRATIS} propuestas por mes contándolas en un audio. Con Pro son ilimitadas, y además las enviás sin tope y sin la marca de Dealit.`
  }),
  seguimiento: () => ({
    titulo: 'Sabé cuándo tu cliente abre tu propuesta',
    texto: 'Con Pro ves cuántas veces la abrió y cuándo, y te avisamos en el momento. Así llamás cuando está mirando, no cuando ya se olvidó.'
  }),
  general: () => ({
    titulo: 'Pasate a Dealit Pro',
    texto: 'Propuestas sin tope, todos los diseños PRO, seguimiento de cada visita y sin la marca de Dealit.'
  })
};

export const ofrecerPro = async (motivo = 'general', nombres = []) => {
  const { titulo, texto } = (MOTIVOS[motivo] || MOTIVOS.general)(nombres);
  // Con un diseño PRO, la salida gratis es cambiar de diseño (no abandonar el envío).
  const salida = motivo === 'diseno' || motivo === 'link-activo'
    ? { valor: 'gratis', texto: 'Elegir un diseño gratis', estilo: 'texto' }
    : { valor: null, texto: 'Ahora no', estilo: 'texto' };
  const eleccion = await elegir({ titulo, texto, opciones: [...opcionesPro(), salida] });
  if (eleccion === 'gratis') irADiseno();
  else if (eleccion) suscribir(eleccion);
};

// Antes del último envío gratis del mes: avisa y deja elegir. true = enviar.
export const confirmarUltimoEnvio = async () => {
  const eleccion = await elegir({
    titulo: 'Es tu último envío gratis de este mes',
    texto: `Vas a usar el envío ${LIMITE_ENVIOS_GRATIS} de ${LIMITE_ENVIOS_GRATIS}. Después, las propuestas nuevas se mandan con Pro o cuando se renueve tu cupo, el mes que viene.`,
    opciones: [
      { valor: 'enviar', texto: 'Enviar igual', estilo: 'primario' },
      { valor: 'pro', texto: 'Ver Dealit Pro', estilo: 'secundario' },
      { valor: null, texto: 'Cancelar', estilo: 'texto' }
    ]
  });
  if (eleccion === 'pro') ofrecerPro('general');
  return eleccion === 'enviar';
};

// Envíos gratis que le quedan este mes (null si no tiene límite).
export const enviosRestantes = () => (restriccionesActivas() ? Math.max(0, LIMITE_ENVIOS_GRATIS - enviosDelMes(ctx.plan)) : null);

// Respaldo del aviso de Mercado Pago: el servidor consulta la suscripción y actualiza el
// plan. El cambio llega solo, por planes/{uid}; acá solo se avisa si no hubo suerte.
const sincronizar = async ({ manual = false, boton } = {}) => {
  if (boton) boton.disabled = true;
  try {
    const r = await llamarApi('/api/sincronizar', {});
    if (manual && !r?.encontrada) avisar('Todavía no encontramos un pago en Mercado Pago. Si recién pagaste, probá de nuevo en un minuto.', 8000);
    else if (manual && r?.plan?.estado !== 'activa') avisar('Mercado Pago todavía no confirmó el pago. Probá de nuevo en un minuto.', 8000);
    return r;
  } catch (e) {
    if (manual) avisarError(e.detalle ? `No pudimos consultar Mercado Pago. Motivo: ${e.detalle}` : 'No pudimos consultar Mercado Pago. Probá de nuevo en un minuto.');
    return null;
  } finally {
    if (boton) boton.disabled = false;
  }
};

export const instalarPlan = () => {
  pintarPlan();
  $('#pago-form')?.addEventListener('submit', ev => {
    ev.preventDefault();
    irAPagar();
  });
  // Vuelta desde Mercado Pago: se consulta enseguida y otra vez unos segundos después,
  // por si Mercado Pago todavía no actualizó el estado (el aviso por webhook puede tardar).
  const parametros = new URLSearchParams(location.search);
  if (parametros.get('suscripcion') === 'volver') {
    avisar('Estamos confirmando tu pago con Mercado Pago. En unos segundos se activa Pro.', 8000);
    irRuta('/cuenta', { reemplazar: true });
    setTimeout(async () => {
      const r = await sincronizar();
      if (r?.plan?.estado !== 'activa') setTimeout(() => sincronizar(), 6000);
    }, 2500);
  }
  registrarAcciones({
    'suscribir-pro': boton => suscribir(boton.dataset.periodo),
    'pago-cancelar': () => $('#dialogo-pago').close(),
    'ofrecer-pro': boton => ofrecerPro(boton?.dataset?.motivo || 'general'),
    'sincronizar-plan': boton => sincronizar({ manual: true, boton })
  });
};
