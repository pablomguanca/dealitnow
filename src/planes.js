// Reglas de los planes (Gratis y Pro), compartidas por la app y el servidor. El servidor
// decide: la app solo las usa para mostrar el estado. Ver «Planes» en CLAUDE.md.

import { TEMAS, PLANTILLAS, PLANTILLAS_PORTAFOLIO } from './modelo.js';

export const LIMITE_ENVIOS_GRATIS = 2; // propuestas enviadas (links activados) por mes calendario

// Días de margen después de la fecha de cobro: Mercado Pago reintenta el débito unos días
// antes de pausar o cancelar. Pasado ese margen sin un cobro nuevo, vuelve a Gratis.
const GRACIA_MS = 3 * 86400000;

export const PRECIOS_PRO = {
  mensual: { monto: 13900, moneda: 'ARS', meses: 1, nombre: 'mensual' },
  anual: { monto: 139000, moneda: 'ARS', meses: 12, nombre: 'anual' }
};

// Los meses se cuentan en hora de Argentina: «2026-11».
const formatoMes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit' });
export const mesDe = (fecha = new Date()) => formatoMes.format(fecha).slice(0, 7);

const fechaValida = v => {
  const f = v && typeof v.toDate === 'function' ? v.toDate() : new Date(v);
  return Number.isNaN(f?.getTime?.()) ? null : f;
};

// Pro mientras la suscripción esté al día: activa y con la próxima fecha de cobro (más el
// margen) por delante. Si se canceló o se pausó, hasta el fin del período ya pago. Si un
// cobro no entra, la fecha no avanza y, pasado el margen, vuelve a Gratis sola.
export const esPro = (plan, ahora = new Date()) => {
  if (plan?.tipo !== 'pro') return false;
  const vence = fechaValida(plan.vence);
  if (plan.estado === 'activa') return !vence || vence.getTime() + GRACIA_MS > ahora.getTime();
  return !!vence && vence > ahora;
};

// Pro que no se renueva (canceló o se pausó): cuándo termina y cuántos días quedan, en días
// calendario de Argentina (0 = hoy, 1 = mañana; negativo = terminó hace esos días).
// null si el Pro se renueva solo o nunca tuvo Pro.
const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' });
const diaDe = fecha => Date.parse(formatoDia.format(fecha));

export const finDePro = (plan, ahora = new Date()) => {
  if (plan?.tipo !== 'pro' || plan.estado === 'activa') return null;
  const vence = fechaValida(plan.vence);
  if (!vence) return null;
  return { vence, dias: Math.round((diaDe(vence) - diaDe(ahora)) / 86400000), terminado: vence <= ahora };
};

// Pro según el registro, pero con la fecha de cobro ya pasada: conviene preguntarle a
// Mercado Pago si el último cobro entró (por si se perdió el aviso).
export const proParaVerificar = (plan, ahora = new Date()) => {
  const vence = fechaValida(plan?.vence);
  return plan?.tipo === 'pro' && plan.estado === 'activa' && !!vence && vence <= ahora;
};

// Partes PRO que usa una propuesta o un portfolio: el tema y la plantilla de origen. En
// Gratis se pueden probar en el editor, pero no enviar.
export const usosPro = (documento, { esPortafolio = false } = {}) => {
  const usos = [];
  const tema = TEMAS[documento?.tema?.preset];
  if (tema?.plan === 'pro') usos.push({ tipo: 'tema', nombre: tema.nombre });
  const plantilla = (esPortafolio ? PLANTILLAS_PORTAFOLIO : PLANTILLAS)[documento?.plantilla];
  if (plantilla?.plan === 'pro') usos.push({ tipo: 'plantilla', nombre: plantilla.nombre });
  return usos;
};

export const enviosDelMes = (plan, ahora = new Date()) => Math.max(0, Number(plan?.envios?.[mesDe(ahora)]) || 0);

// ¿Puede activar el link de una propuesta que todavía no envió nunca?
export const puedeEnviar = (plan, ahora = new Date()) => esPro(plan, ahora) || enviosDelMes(plan, ahora) < LIMITE_ENVIOS_GRATIS;

// Estado de una suscripción de Mercado Pago (preapproval) → plan de Dealit.
const ESTADOS_MP = { authorized: 'activa', pending: 'pendiente', paused: 'pausada', cancelled: 'cancelada' };

export const planDesdeSuscripcion = (suscripcion, planActual = {}) => {
  const estado = ESTADOS_MP[suscripcion?.status] || 'pendiente';
  const meses = Number(suscripcion?.auto_recurring?.frequency) || 1;
  const proximoPago = fechaValida(suscripcion?.next_payment_date);
  // Si se cancela, se conserva la fecha hasta la que ya pagó.
  const vence = proximoPago ? proximoPago.toISOString() : (planActual.vence || null);
  return {
    tipo: estado === 'activa' || (vence && planActual.tipo === 'pro') ? 'pro' : (planActual.tipo || 'gratis'),
    estado,
    periodo: meses >= 12 ? 'anual' : 'mensual',
    vence,
    mpSuscripcionId: String(suscripcion?.id || planActual.mpSuscripcionId || '')
  };
};
