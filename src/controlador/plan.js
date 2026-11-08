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
  $$('[data-precio-pro]').forEach(el => { el.textContent = precioTexto(el.dataset.precioPro); });
  const barra = $('#plan-uso');
  if (barra) {
    barra.hidden = pro;
    barra.style.setProperty('--uso', String(Math.min(1, usados / LIMITE_ENVIOS_GRATIS)));
  }
};

export const escucharPlan = () => {
  if (!AteneaDB?.plan) return;
  llamarApi('/api/plan', {})
    .then(r => { planesActivos = !!r?.activos; })
    .catch(() => { planesActivos = false; })
    .finally(pintarPlan);
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
      'mercadopago-rechazo': 'Mercado Pago no pudo iniciar el pago. Probá de nuevo en unos minutos.'
    };
    avisarError(mensajes[e.codigo] || 'No pudimos iniciar el pago. Revisá tu conexión y probá de nuevo.');
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

export const instalarPlan = () => {
  pintarPlan();
  // Vuelta desde Mercado Pago: el plan se activa cuando llega la confirmación (unos segundos).
  const parametros = new URLSearchParams(location.search);
  if (parametros.get('suscripcion') === 'volver') {
    avisar('Estamos confirmando tu pago con Mercado Pago. En unos segundos se activa Pro.', 8000);
    irRuta('/cuenta', { reemplazar: true });
  }
  registrarAcciones({
    'suscribir-pro': boton => suscribir(boton.dataset.periodo, boton),
    'ofrecer-pro': () => ofrecerPro('general')
  });
};
