// Plan del usuario en la app: muestra el estado (Gratis / Pro y envíos del mes), ofrece
// pasarse a Pro en los momentos justos y lleva al pago en Mercado Pago. Quién es Pro lo
// decide el servidor (api/mercadopago); acá solo se lee planes/{uid}.
//
// En la app de Android no se vende Pro: Google Play exige su propio cobro para las
// suscripciones digitales y no deja mandar a pagar afuera (Argentina no está en sus
// programas de cobro alternativo). Ahí los carteles solo informan qué es de Pro, sin precios
// ni botones de pago, y el CSS oculta las ofertas (.app-nativa en _paneles.scss). Quien pagó
// Pro en la web lo tiene igual en la app. Más adelante: Google Play Billing.

import { $, $$, dinero } from '../lib/formato.js';
import { LIMITE_ENVIOS_GRATIS, PRECIOS_PRO, enviosDelMes, esPro, finDePro, proParaVerificar } from '../planes.js';
import { LIMITE_IA_GRATIS } from '../ia.js';
import { ctx, AteneaDB } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarError, avisarExito, elegir } from './avisos.js';
import { llamarApi } from './api.js';
import { irRuta } from './navegacion.js';
import { irADiseno } from './hoja.js';
import { configurarPush } from './push.js';
import { esAppNativa } from '../nativo.js';

// ¿Se puede comprar Pro desde acá? En la web sí; en la app de Android, no (ver arriba).
const ventaPermitida = () => !esAppNativa();

let dejarDeEscuchar = null;
let verificado = false;
// La primera lectura del plan al cargar la página no es un cambio: solo se avisa «Ya tenés
// Pro» si pasa a Pro mientras la app está abierta, o al volver de pagar en Mercado Pago.
let planLeido = false;
let volviendoDelPago = false;
// El servidor dice si los planes están activos para esta cuenta (interruptor PLANES_ACTIVOS)
// y si la cuenta es Pro. Lo segundo cubre el caso en que el plan de Firestore todavía no
// llegó o no se pudo leer: nunca se trata a un Pro como Gratis.
let planesActivos = false;
let proServidor = false;
let consultado = false;
let planLlegado = false;

// Meses que regala el anual frente a pagar 12 mensuales (hoy, 2).
export const mesesGratisAnual = () => Math.round(12 - PRECIOS_PRO.anual.monto / PRECIOS_PRO.mensual.monto);

const precioTexto = periodo => {
  const p = PRECIOS_PRO[periodo];
  if (periodo === 'anual') return `${dinero(p.monto, p.moneda)} por año · ${mesesGratisAnual()} meses gratis`;
  return `${dinero(p.monto, p.moneda)} por mes`;
};

const opcionesPro = () => (!ventaPermitida() ? [] : [
  { valor: 'mensual', texto: `Pro mensual · ${precioTexto('mensual')}`, estilo: 'primario' },
  { valor: 'anual', texto: `Pro anual · ${precioTexto('anual')}`, estilo: 'secundario' }
]);

export const usuarioEsPro = () => esPro(ctx.plan) || proServidor;

// Límites de Gratis en la app: solo con los planes activos para esta cuenta y sin Pro.
export const restriccionesActivas = () => planesActivos && !usuarioEsPro();

// Antes de frenar algo por Gratis: se espera a saber el plan (respuesta del servidor y plan
// de Firestore), con un tope. Así, recién entrando, un Pro no ve el cartel de Pro.
const esperarPlan = async (tope = 4000) => {
  const inicio = Date.now();
  while ((!consultado || !planLlegado) && Date.now() - inicio < tope) await new Promise(r => setTimeout(r, 150));
};

// Avisa al resto de la app (panel, editor) que cambió el plan, sin importarlos acá.
const aplicarRestricciones = () => {
  const antes = ctx.restringido;
  ctx.restringido = restriccionesActivas();
  ctx.marcaObligatoria = ctx.restringido;
  if (antes !== ctx.restringido) document.dispatchEvent(new CustomEvent('dealit:plan'));
};

// Al probar un diseño o una plantilla PRO en Gratis: se puede, pero no enviar.
// Elegir un diseño o una plantilla PRO en Gratis: antes de aplicarlo, un cartel que explica
// que es de Pro y ofrece pasarse (con los dos precios) o seguir con un diseño gratis. El
// diseño no se aplica. true = se puede usar (Pro, o planes apagados para esta cuenta).
export const disenoProPermitido = async nombre => {
  if (!restriccionesActivas()) return true;
  await esperarPlan();
  if (!restriccionesActivas()) return true;
  const eleccion = await elegir({
    titulo: `«${nombre}» es un diseño PRO`,
    texto: !ventaPermitida()
      ? 'Este diseño es parte de Dealit Pro. Para tus propuestas, elegí un diseño sin la etiqueta PRO.'
      : 'Para usarlo en tus propuestas necesitás Dealit Pro: todos los diseños y plantillas PRO, envíos sin tope, sin la marca de Dealit y un aviso cada vez que tu cliente la abre. Si preferís seguir gratis, elegí un diseño sin la etiqueta PRO.',
    opciones: [...opcionesPro(), { valor: null, texto: 'Elegir un diseño gratis', estilo: 'texto' }]
  });
  if (eleccion) suscribir(eleccion);
  return false;
};

const fechaLarga = fecha => fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' });
const cuentaRegresiva = dias => (dias <= 0 ? 'Termina hoy' : dias === 1 ? 'Termina mañana' : `Quedan ${dias} días`);
const noPagaDosVeces = fin => `No pagás dos veces: si seguís ahora, el primer cobro es recién el ${fechaLarga(fin.vence)}, cuando termina lo que ya pagaste.`;

// Pro sin renovación: cuánto le queda (o si ya terminó). Solo con los planes activos.
const finPro = () => (planesActivos ? finDePro(ctx.plan) : null);

// Aviso en el panel: en los últimos 7 días de Pro y hasta 14 días después de que terminó.
// Se puede cerrar: mientras termina, vuelve al día siguiente; ya terminado, no vuelve.
const CLAVE_AVISO_PRO = 'dealit-aviso-pro';
const DIAS_AVISO = 7;
const claveCierre = fin => (fin.terminado ? `${fin.vence.getTime()}|fin` : `${fin.vence.getTime()}|${new Date().toDateString()}`);
const avisoCerrado = fin => {
  try { return localStorage.getItem(CLAVE_AVISO_PRO) === claveCierre(fin); } catch { return false; }
};

const pintarAvisoPro = fin => {
  const aviso = $('#aviso-pro');
  if (!aviso) return;
  const porTerminar = fin && !fin.terminado && fin.dias <= DIAS_AVISO;
  const terminado = fin && fin.terminado && fin.dias >= -14;
  aviso.hidden = !(porTerminar || terminado) || avisoCerrado(fin);
  if (aviso.hidden) return;
  aviso.classList.toggle('aviso-pro--urgente', !!porTerminar && fin.dias <= 1);
  if (porTerminar) {
    $('#aviso-pro-titulo').textContent = fin.dias <= 0 ? 'Tu Dealit Pro termina hoy' : fin.dias === 1 ? 'Tu Dealit Pro termina mañana' : `Tu Dealit Pro termina en ${fin.dias} días`;
    $('#aviso-pro-bajada').textContent = `Después: ${LIMITE_ENVIOS_GRATIS} envíos por mes, la marca de Dealit en tus propuestas y sin avisos cuando tu cliente las abre.`;
    $('#aviso-pro-accion').textContent = 'Seguir con Pro';
  } else {
    $('#aviso-pro-titulo').textContent = 'Tu Dealit Pro terminó';
    $('#aviso-pro-bajada').textContent = 'Los diseños PRO, los envíos sin tope y los avisos en vivo te esperan. Volvés en un minuto.';
    $('#aviso-pro-accion').textContent = 'Volver a Pro';
  }
};

// «Seguir con Pro» desde el aviso: los dos precios y, si todavía tiene días, que no paga dos veces.
const reactivarPro = async () => {
  if (!ventaPermitida()) return;
  const fin = finPro();
  const porTerminar = fin && !fin.terminado;
  const eleccion = await elegir({
    titulo: porTerminar ? 'Seguí con Dealit Pro' : 'Volvé a Dealit Pro',
    texto: porTerminar
      ? `Mantenés los envíos sin tope, todos los diseños PRO, tus propuestas sin la marca de Dealit y los avisos cuando tu cliente las abre. ${noPagaDosVeces(fin)}`
      : 'Recuperás los envíos sin tope, todos los diseños PRO, tus propuestas sin la marca de Dealit y los avisos cuando tu cliente las abre.',
    opciones: [...opcionesPro(), { valor: null, texto: 'Ahora no', estilo: 'texto' }]
  });
  if (eleccion) suscribir(eleccion);
};

const pintarPlan = () => {
  const tarjeta = $('.tarjeta--plan');
  if (tarjeta) tarjeta.hidden = !planesActivos;
  const plan = ctx.plan || {};
  // Pro según el plan de Firestore o según el servidor (lo mismo, leído de otro lado).
  const pro = usuarioEsPro();
  const usados = enviosDelMes(plan);
  const estado = $('#plan-estado');
  if (!estado) return;
  const fin = finPro();
  const porTerminar = pro && fin && !fin.terminado;
  if (pro) {
    const vence = plan.vence ? new Date(plan.vence).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    estado.textContent = !porTerminar
      ? `Plan Pro${plan.periodo === 'anual' ? ' anual' : plan.periodo === 'mensual' ? ' mensual' : ''} activo.${vence ? ` Próximo cobro: ${vence}.` : ''}`
      : `Tu plan Pro finaliza el ${fin ? fechaLarga(fin.vence) : vence}.`;
  } else {
    const quedan = Math.max(0, LIMITE_ENVIOS_GRATIS - usados);
    const termino = fin?.terminado && fin.dias >= -30 ? `Tu Pro terminó el ${fechaLarga(fin.vence)}. ` : '';
    estado.textContent = `${termino}Plan Gratis: ${usados} de ${LIMITE_ENVIOS_GRATIS} propuestas enviadas este mes. ${quedan === 0 ? 'No te quedan envíos: se renuevan el mes que viene.' : quedan === 1 ? 'Te queda 1 envío.' : `Te quedan ${quedan} envíos.`}`;
  }
  // Con Pro, la tarjeta se viste de Pro: logo, «Dealit Pro» y lo que incluye.
  $('.tarjeta--plan')?.classList.toggle('tarjeta--pro', pro);
  const bloquePro = $('#plan-pro');
  if (bloquePro) {
    bloquePro.hidden = !pro;
    $('#plan-pro-estado').textContent = porTerminar ? estado.textContent : estado.textContent.replace(/^Plan Pro /, 'Plan ');
  }
  // Canceló la renovación: cuenta regresiva, qué pierde y cómo seguir sin pagar dos veces.
  $('.tarjeta--plan')?.classList.toggle('tarjeta--por-terminar', !!porTerminar);
  const renovar = $('#plan-renovar');
  if (renovar) {
    renovar.hidden = !porTerminar;
    if (porTerminar) {
      const cuenta = $('#plan-renovar-cuenta');
      cuenta.textContent = cuentaRegresiva(fin.dias);
      cuenta.classList.toggle('plan-renovar__cuenta--urgente', fin.dias <= DIAS_AVISO);
      $('#plan-renovar-fecha').textContent = fechaLarga(fin.vence);
      $('#plan-renovar-nota').textContent = noPagaDosVeces(fin);
    }
  }
  // Un punto en «Cuenta» mientras el Pro está por terminar: se ve sin interrumpir.
  document.body.classList.toggle('pro-por-terminar', !!porTerminar);
  pintarAvisoPro(fin);
  $('#plan-ofertas').hidden = pro;
  $('#plan-administrar').hidden = !pro || !!porTerminar;
  $('#plan-sincronizar').hidden = pro;
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
    proServidor = r?.pro === true;
    consultado = true;
    document.body.classList.toggle('ia-disponible', r?.ia === true);
    configurarPush(r?.push);
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
    const eraPro = planLeido ? esPro(ctx.plan) : !volviendoDelPago;
    planLeido = true;
    planLlegado = true;
    ctx.plan = plan;
    if (esPro(plan)) proServidor = true;
    pintarPlan();
    if (!eraPro && esPro(plan) && ctx.plan.estado === 'activa') {
      volviendoDelPago = false;
      avisar('¡Listo! Ya tenés Dealit Pro.', 7000);
    }
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
  proServidor = false;
  consultado = false;
  planLlegado = false;
  verificado = false;
  planLeido = false;
  ctx.plan = null;
  aplicarRestricciones();
};

// Paso previo al pago: Mercado Pago exige el email de la cuenta con la que se paga, que
// puede no ser el de Dealit. Se confirma acá (con el de Dealit ya cargado).
let periodoElegido = 'mensual';
const CLAVE_EMAIL_PAGO = 'dealit-email-pago';
const suscribir = periodo => {
  if (!ventaPermitida()) return;
  periodoElegido = PRECIOS_PRO[periodo] ? periodo : 'mensual';
  const dialogo = $('#dialogo-pago');
  if (!dialogo) return;
  $('#pago-precio').textContent = `Pro ${periodoElegido} · ${precioTexto(periodoElegido)}`;
  const fin = finPro();
  const nota = $('#pago-nota');
  if (nota) {
    nota.hidden = !(fin && !fin.terminado && esPro(ctx.plan));
    if (!nota.hidden) nota.textContent = noPagaDosVeces(fin);
  }
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
    if (e.codigo === 'ya-es-pro') {
      // El servidor ya te tiene como Pro: la app se pone al día y no hay nada que pagar.
      $('#dialogo-pago')?.close();
      proServidor = true;
      pintarPlan();
      avisarExito('Ya tenés Dealit Pro activo: tenés todos los diseños y funciones disponibles.');
      boton.disabled = false;
      return;
    }
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
    texto: `Tu propuesta usa ${nombres.length ? lista(nombres) : 'un diseño PRO'}. Para enviarla necesitás Pro, o elegí un diseño sin la etiqueta PRO y mandala gratis.`
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

// Los mismos carteles en la app de Android: qué es de Pro y la salida gratis, sin vender.
const MOTIVOS_APP = {
  limite: () => ({
    titulo: `Ya enviaste tus ${LIMITE_ENVIOS_GRATIS} propuestas de este mes`,
    texto: 'Tu propuesta queda guardada. Tu cupo de envíos del plan Gratis se renueva el mes que viene.'
  }),
  diseno: (nombres = []) => ({
    titulo: 'Este diseño es de Dealit Pro',
    texto: `Tu propuesta usa ${nombres.length ? lista(nombres) : 'un diseño PRO'}. Para enviarla, elegí un diseño sin la etiqueta PRO.`
  }),
  'link-activo': (nombres = []) => ({
    titulo: 'Tu cliente ya tiene el link',
    texto: `${nombres.length ? lista(nombres) : 'Este diseño'} es de Dealit Pro y tu cliente lo vería al abrir la propuesta. Probalo en una copia de la propuesta.`
  }),
  ia: () => ({
    titulo: 'Usaste tus propuestas con IA de este mes',
    texto: `En el plan Gratis armás ${LIMITE_IA_GRATIS} propuestas con IA por mes. Tu cupo se renueva el mes que viene.`
  }),
  seguimiento: () => ({
    titulo: 'El seguimiento es de Dealit Pro',
    texto: 'Cuántas veces y cuándo tu cliente abre la propuesta, y los avisos en el momento, son parte de Dealit Pro.'
  }),
  general: () => ({
    titulo: 'Esto es parte de Dealit Pro',
    texto: 'Esta función es parte de Dealit Pro.'
  })
};

export const ofrecerPro = async (motivo = 'general', nombres = []) => {
  if (planesActivos && usuarioEsPro()) return;
  const motivos = ventaPermitida() ? MOTIVOS : MOTIVOS_APP;
  const { titulo, texto } = (motivos[motivo] || motivos.general)(nombres);
  // Con un diseño PRO, la salida gratis es cambiar de diseño (no abandonar el envío).
  const salida = motivo === 'diseno' || motivo === 'link-activo'
    ? { valor: 'gratis', texto: 'Elegir un diseño gratis', estilo: 'texto' }
    : { valor: null, texto: ventaPermitida() ? 'Ahora no' : 'Entendido', estilo: ventaPermitida() ? 'texto' : 'primario' };
  const eleccion = await elegir({ titulo, texto, opciones: [...opcionesPro(), salida] });
  if (eleccion === 'gratis') irADiseno();
  else if (eleccion) suscribir(eleccion);
};

// Antes del último envío gratis del mes: avisa y deja elegir. true = enviar.
export const confirmarUltimoEnvio = async () => {
  const eleccion = await elegir({
    titulo: 'Es tu último envío gratis de este mes',
    texto: ventaPermitida()
      ? `Vas a usar el envío ${LIMITE_ENVIOS_GRATIS} de ${LIMITE_ENVIOS_GRATIS}. Después, las propuestas nuevas se mandan con Pro o cuando se renueve tu cupo, el mes que viene.`
      : `Vas a usar el envío ${LIMITE_ENVIOS_GRATIS} de ${LIMITE_ENVIOS_GRATIS}. Tu cupo se renueva el mes que viene.`,
    opciones: [
      { valor: 'enviar', texto: 'Enviar igual', estilo: 'primario' },
      ...(ventaPermitida() ? [{ valor: 'pro', texto: 'Ver Dealit Pro', estilo: 'secundario' }] : []),
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
    volviendoDelPago = true;
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
    'sincronizar-plan': boton => sincronizar({ manual: true, boton }),
    'reactivar-pro': () => reactivarPro(),
    'cerrar-aviso-pro': () => {
      const fin = finPro();
      if (fin) try { localStorage.setItem(CLAVE_AVISO_PRO, claveCierre(fin)); } catch { }
      $('#aviso-pro').hidden = true;
    }
  });
};
