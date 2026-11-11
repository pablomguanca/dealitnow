import { describe, expect, it } from 'vitest';
import { calcularResultados, inicioDe } from '../src/resultados.js';

const AHORA = new Date('2026-11-20T15:00:00-03:00');
const dias = n => new Date(AHORA.getTime() - n * 86400000).toISOString();

const propuesta = (cambios = {}) => ({
  id: Math.random().toString(36).slice(2),
  title: 'Web',
  clientName: 'Laura',
  status: 'sent',
  publico: true,
  amount: 1000,
  payload: { inversion: { moneda: 'ARS' }, propuesta: { fecha: dias(5).slice(0, 10), validez: 30 }, servicios: [] },
  enviadaEn: dias(5),
  ...cambios
});

const aceptada = (cambios = {}, aceptacion = {}) => propuesta({
  status: 'accepted',
  vistas: 3,
  aceptacion: { nombre: 'Laura', inicial: 1000, mensual: 0, moneda: 'ARS', opcionales: [], fecha: dias(2), ...aceptacion },
  ...cambios
});

describe('resultados', () => {
  it('el período «mes» empieza el día 1', () => {
    expect(inicioDe('mes', AHORA).getDate()).toBe(1);
  });

  it('ganado, conversión, ticket y embudo del mes', () => {
    const r = calcularResultados([
      aceptada({}, { inicial: 1000 }),
      aceptada({}, { inicial: 3000, opcionales: [{ nombre: 'Logo' }] }),
      propuesta({ vistas: 1 }),
      propuesta(),
      propuesta({ status: 'draft', publico: false, enviadaEn: null })
    ], { ahora: AHORA });
    expect(r.ganado).toEqual([{ moneda: 'ARS', total: 4000 }]);
    expect(r.embudo).toEqual({ enviadas: 4, abiertas: 3, aceptadas: 2 });
    expect(r.conversion).toBe(0.5);
    expect(r.ticketMedio).toBe(2000);
    expect(r.diasHastaAceptar).toBeCloseTo(3);
    expect(r.enJuego).toEqual([{ moneda: 'ARS', total: 2000 }]);
    expect(r.opcionales).toEqual([{ nombre: 'Logo', veces: 1 }]);
  });

  it('lo aceptado cuenta en el mes de la aceptación, no del envío', () => {
    const r = calcularResultados([aceptada({ enviadaEn: '2026-10-25T12:00:00Z' }, { fecha: '2026-11-03T12:00:00Z' })], { ahora: AHORA });
    expect(r.ganado[0].total).toBe(1000);
    expect(r.embudo.enviadas).toBe(0);
  });

  it('separa monedas y elige la principal por lo ganado', () => {
    const r = calcularResultados([
      aceptada({}, { inicial: 500, moneda: 'USD' }),
      aceptada({}, { inicial: 200000, moneda: 'ARS' })
    ], { ahora: AHORA });
    expect(r.monedaPrincipal).toBe('ARS');
    expect(r.ganado.map(g => g.moneda)).toEqual(['ARS', 'USD']);
  });

  it('para seguir: calientes, sin abrir y por vencer', () => {
    const caliente = propuesta({ vistas: 4, vistoUltimo: dias(1.5) });
    // La abrió hace unas horas: todavía la está pensando, no se sugiere escribirle.
    const pensando = propuesta({ vistas: 3, vistoUltimo: dias(0.3) });
    const sinAbrir = propuesta({ enviadaEn: dias(4) });
    const vence = propuesta({ vistas: 1, vistoUltimo: dias(10), payload: { inversion: { moneda: 'ARS' }, propuesta: { fecha: dias(13).slice(0, 10), validez: 15 } } });
    const vencida = propuesta({ payload: { inversion: { moneda: 'ARS' }, propuesta: { fecha: dias(40).slice(0, 10), validez: 15 } } });
    const r = calcularResultados([caliente, pensando, sinAbrir, vence, vencida], { ahora: AHORA });
    expect(r.calientes).toEqual([caliente]);
    expect(r.sinAbrir).toEqual([sinAbrir]);
    expect(r.porVencer).toEqual([vence]);
    expect(r.abiertasAhora).toBe(4);
  });

  it('ganado por mes: 6 columnas con el mes actual al final', () => {
    const r = calcularResultados([aceptada({}, { inicial: 700 })], { ahora: AHORA });
    expect(r.meses).toHaveLength(6);
    expect(r.meses.at(-1).total).toBe(700);
    expect(calcularResultados([], { periodo: 'anio', ahora: AHORA }).meses).toHaveLength(12);
  });

  it('sin propuestas enviadas no hay datos', () => {
    expect(calcularResultados([propuesta({ status: 'draft', publico: false, enviadaEn: null })], { ahora: AHORA }).hayDatos).toBe(false);
  });
});
