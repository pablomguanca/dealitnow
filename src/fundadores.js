// Programa de Fundadores (lanzamiento, 2026-11): reglas compartidas por la app y el servidor.
// - Cupo: las primeras CUPOS_FUNDADORES cuentas que comparten una propuesta (api/activar)
//   quedan como Fundador, con su número, en planes/{uid}.fundador. Lo escribe solo el servidor.
// - Al suscribirse a Pro: el primer mes sin cargo (la suscripción de Mercado Pago empieza a
//   cobrar al mes) y la tarifa de fundador (DESCUENTO_FUNDADOR) durante MESES_TARIFA_FUNDADOR
//   meses desde el primer cobro. Después, la tarea diaria (api/visto) le sube el monto a la
//   suscripción al precio normal.
// Campos de planes/{uid}.fundador: numero, desde, suscripto (primera suscripción confirmada:
// ya usó el mes gratis), tarifaHasta (ISO: el primer cobro + 12 meses) y tarifaFinal (ya se
// pasó la suscripción al precio normal).
import { PRECIOS_PRO } from './planes.js';

export const CUPOS_FUNDADORES = 25;
export const DESCUENTO_FUNDADOR = 0.3;
export const MESES_TARIFA_FUNDADOR = 12;
// Días antes de terminar la tarifa en que la tarea diaria sube el monto: así el primer cobro
// con el precio normal ya sale bien aunque Mercado Pago debite un poco antes de la fecha.
export const DIAS_ANTES_FIN_TARIFA = 3;

const fecha = v => {
  if (!v) return null;
  const f = typeof v.toDate === 'function' ? v.toDate() : new Date(v);
  return Number.isNaN(f.getTime()) ? null : f;
};

export const sumarMeses = (desde, meses) => {
  const f = new Date(desde);
  f.setUTCMonth(f.getUTCMonth() + meses);
  return f;
};

// Redondeado a la decena: 13.900 → 9.730; 139.000 → 97.300.
export const precioFundador = monto => Math.round((monto * (1 - DESCUENTO_FUNDADOR)) / 10) * 10;

export const esFundador = plan => Number.isInteger(plan?.fundador?.numero) && plan.fundador.numero >= 1;

// Número del próximo cupo, o null si ya no quedan.
export const proximoCupo = asignados => {
  const n = Math.max(0, Number(asignados) || 0);
  return n < CUPOS_FUNDADORES ? n + 1 : null;
};

// El mes sin cargo es uno solo: con la primera suscripción confirmada.
export const mesGratisDisponible = plan => esFundador(plan) && !plan.fundador.suscripto;

// La tarifa vale antes de suscribirse y hasta tarifaHasta.
export const tarifaFundadorVigente = (plan, ahora = new Date()) => {
  if (!esFundador(plan) || plan.fundador.tarifaFinal) return false;
  const hasta = fecha(plan.fundador.tarifaHasta);
  return !hasta || hasta > ahora;
};

// Los precios de Pro para esta cuenta: con la tarifa de fundador si le corresponde.
export const preciosProPara = (plan, ahora = new Date()) => {
  if (!tarifaFundadorVigente(plan, ahora)) return PRECIOS_PRO;
  return Object.fromEntries(Object.entries(PRECIOS_PRO)
    .map(([periodo, p]) => [periodo, { ...p, monto: precioFundador(p.monto), fundador: true, normal: p.monto }]));
};

// Mercado Pago confirmó (authorized) la primera suscripción de un Fundador: ya usó el mes
// gratis y la tarifa corre 12 meses desde el primer cobro (start_date). null si no aplica.
export const fundadorAlSuscribirse = (plan, suscripcion, ahora = new Date()) => {
  if (!esFundador(plan) || plan.fundador.suscripto || suscripcion?.status !== 'authorized') return null;
  const primerCobro = fecha(suscripcion.auto_recurring?.start_date) || fecha(suscripcion.date_created) || ahora;
  return {
    suscripto: ahora.toISOString(),
    tarifaHasta: sumarMeses(primerCobro, MESES_TARIFA_FUNDADOR).toISOString()
  };
};

// ¿Hay que pasar hoy la suscripción del Fundador al precio normal?
export const finTarifaPendiente = (plan, ahora = new Date()) => {
  if (!esFundador(plan) || plan.fundador.tarifaFinal) return false;
  const hasta = fecha(plan.fundador.tarifaHasta);
  return !!hasta && hasta.getTime() - DIAS_ANTES_FIN_TARIFA * 86400000 <= ahora.getTime();
};
