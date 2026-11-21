// Fin de la tarifa de fundador (src/fundadores.js), dentro de la tarea diaria (api/visto):
// a los Fundadores que cumplen sus 12 meses de tarifa se les sube el monto de la suscripción
// de Mercado Pago al precio normal de Pro. Con la suscripción cancelada no hay nada que subir:
// solo se marca, así si vuelve a suscribirse paga el precio normal.
import { PRECIOS_PRO } from '../../src/planes.js';
import { DIAS_ANTES_FIN_TARIFA, finTarifaPendiente } from '../../src/fundadores.js';

export const crearFinTarifas = ({ db, mp, ahora = () => new Date() }) => async () => {
  const momento = ahora();
  // tarifaHasta es ISO: se compara como texto. El margen de días se aplica igual que en finTarifaPendiente.
  const tope = new Date(momento.getTime() + DIAS_ANTES_FIN_TARIFA * 86400000).toISOString();
  const snap = await db().collection('planes').where('fundador.tarifaHasta', '<=', tope).get();
  const detalle = [];
  for (const d of snap.docs) {
    const plan = d.data();
    if (!finTarifaPendiente(plan, momento)) continue;
    const precio = PRECIOS_PRO[plan.periodo] || PRECIOS_PRO.mensual;
    // Pausada también: si se reanuda, ya cobra el precio normal.
    const conSuscripcion = !!plan.mpSuscripcionId && plan.estado !== 'cancelada';
    try {
      if (conSuscripcion) await mp.actualizarMontoSuscripcion(plan.mpSuscripcionId, { monto: precio.monto, moneda: precio.moneda });
      await d.ref.set({ fundador: { tarifaFinal: true } }, { merge: true });
      detalle.push({ uid: d.id, resultado: conSuscripcion ? `precio-normal-${precio.monto}` : 'sin-suscripcion-activa' });
    } catch (e) {
      // Sin marcar: mañana se vuelve a intentar.
      console.error('No se pudo pasar al precio normal a un Fundador:', d.id, e.message);
      detalle.push({ uid: d.id, resultado: 'error' });
    }
  }
  return detalle;
};
