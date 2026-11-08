// Reglas de los planes (Gratis y Pro), compartidas por la app y el servidor. El servidor
// decide: la app solo las usa para mostrar el estado. Ver «Planes» en CLAUDE.md.

export const LIMITE_ENVIOS_GRATIS = 5; // propuestas enviadas (links activados) por mes calendario

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

// Pro mientras la suscripción esté activa o, si se canceló o pausó, hasta el fin del período pago.
export const esPro = (plan, ahora = new Date()) => {
  if (plan?.tipo !== 'pro') return false;
  if (plan.estado === 'activa') return true;
  const vence = fechaValida(plan.vence);
  return !!vence && vence > ahora;
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
