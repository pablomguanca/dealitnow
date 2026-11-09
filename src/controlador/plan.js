// Plan del usuario en la app: muestra el estado (Gratis / Pro y envíos del mes), ofrece
// pasarse a Pro en los momentos justos y lleva al pago en Mercado Pago. Quién es Pro lo
// decide el servidor (api/mercadopago); acá solo se lee planes/{uid}.

import { $, $$, dinero } from '../lib/formato.js';
import { LIMITE_ENVIOS_GRATIS, PRECIOS_PRO, enviosDelMes, esPro } from '../planes.js';
import { ctx, AteneaDB } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarError, elegir } from './avisos.js';
import { llamarApi } from './api.js';
import { irRuta } from './navegacion.js';

let dejarDeEscuchar = null;
// El servidor dice si los planes están activos para esta cuenta (interruptor PLANES_ACTIVOS).
let planesActivos = false;

const precioTexto = periodo => {
  const p = PRECIOS_PRO[periodo];
  return `${dinero(p.monto, p.moneda)} ${periodo === 'anual' ? 'por año' : 'por mes'}`;
};

export const usuarioEsPro = () => esPro(ctx.plan);

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
    estado.textContent = `Plan Gratis: ${usados} de ${LIMITE_ENVIOS_GRATIS} propuestas enviadas este mes.`;
  }
  $('#plan-ofertas').hidden = pro && plan.estado === 'activa';
  $('#plan-administrar').hidden = !pro;
  $('#plan-sincronizar').hidden = pro && plan.estado === 'activa';
  $$('[data-precio-pro]').forEach(el => { el.textContent = precioTexto(el.dataset.precioPro); });
  const barra = $('#plan-uso');
  if (barra) {
    barra.hidden = pro;
    barra.style.setProperty('--uso', String(Math.min(1, usados / LIMITE_ENVIOS_GRATIS)));
  }
};

// Pregunta al servidor si los planes están activos para esta cuenta. Si falla (por ejemplo,
// la función tarda en arrancar justo al iniciar sesión), reintenta una vez; y se vuelve a
// preguntar cada vez que se entra a Mi cuenta, así un error suelto no deja oculto el plan.
export const consultarPlanesActivos = async (reintento = true) => {
  try {
    const r = await llamarApi('/api/plan', {});
    planesActivos = !!r?.activos;
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
  });
};

export const reiniciarPlan = () => {
  if (dejarDeEscuchar) { dejarDeEscuchar(); dejarDeEscuchar = null; }
  planesActivos = false;
  ctx.plan = null;
};

// Crea la suscripción en el servidor y lleva a pagar a Mercado Pago.
const suscribir = async (periodo, boton) => {
  if (boton) boton.disabled = true;
  try {
    // Mercado Pago pide el email de la cuenta con la que se va a pagar (si no, el de Dealit).
    const emailPago = $('#plan-email-pago')?.value.trim();
    const { url } = await llamarApi('/api/suscripcion', emailPago ? { periodo, emailPago } : { periodo });
    location.href = url;
  } catch (e) {
    const mensajes = {
      'ya-es-pro': 'Ya tenés Dealit Pro activo.',
      'email-invalido': 'Revisá el email de tu cuenta de Mercado Pago.',
      'mercadopago-rechazo': 'Mercado Pago no pudo iniciar el pago.'
    };
    let mensaje = mensajes[e.codigo] || 'No pudimos iniciar el pago. Revisá tu conexión y probá de nuevo.';
    if (e.codigo === 'mercadopago-rechazo') {
      // Vendedor y comprador tienen que ser los dos reales o los dos de prueba.
      mensaje += /real or test|test users|testuser/i.test(e.detalle)
        ? ' El email tiene que ser el de una cuenta de Mercado Pago del mismo tipo (en las pruebas, el del comprador de prueba).'
        : (e.detalle ? ` Motivo: ${e.detalle}` : ' Probá de nuevo en unos minutos.');
    }
    avisarError(mensaje, 12000);
    if (boton) boton.disabled = false;
  }
};

const MOTIVOS = {
  limite: {
    titulo: `Llegaste a tus ${LIMITE_ENVIOS_GRATIS} propuestas de este mes`,
    texto: 'Con Pro enviás todas las que quieras, ves cuándo tu cliente abre cada propuesta, te avisamos por email cuando acepta y sacás la marca de Dealit.'
  },
  general: {
    titulo: 'Pasate a Dealit Pro',
    texto: 'Propuestas ilimitadas, seguimiento de cada visita, avisos por email cuando tu cliente acepta y sin la marca de Dealit.'
  }
};

export const ofrecerPro = async (motivo = 'general') => {
  const { titulo, texto } = MOTIVOS[motivo] || MOTIVOS.general;
  const eleccion = await elegir({
    titulo,
    texto,
    opciones: [
      { valor: 'anual', texto: `Pro anual · ${precioTexto('anual')}`, estilo: 'primario' },
      { valor: 'mensual', texto: `Pro mensual · ${precioTexto('mensual')}`, estilo: 'secundario' },
      { valor: null, texto: 'Ahora no', estilo: 'texto' }
    ]
  });
  if (eleccion) suscribir(eleccion);
};

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
    'suscribir-pro': boton => suscribir(boton.dataset.periodo, boton),
    'ofrecer-pro': () => ofrecerPro('general'),
    'sincronizar-plan': boton => sincronizar({ manual: true, boton })
  });
};
