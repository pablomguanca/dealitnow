import { describe, expect, it } from 'vitest';
import {
  CAMBIOS_MAX, cambioPendiente, contarMotivos, hoyArgentina, mensajeRecordatorio, porVencer,
  recordatorioPendiente, respuestaPublica, ultimoDia, validarPedidoCambio, validarRechazo, venceTexto
} from '../src/respuestas.js';

const doc = (cambios = {}) => ({
  userId: 'duenio',
  publico: true,
  status: 'sent',
  payload: { propuesta: { titulo: 'Web', fecha: '2026-11-10', validez: 10 }, cliente: { nombre: 'Laura Gómez' } },
  ...cambios
});

describe('validarRechazo', () => {
  it('guarda el motivo y el comentario, y avisa solo la primera vez', () => {
    const r = validarRechazo({ doc: doc(), cuerpo: { motivo: 'precio', comentario: '  Me pasé del presupuesto  ' } });
    expect(r.datos).toEqual({ motivo: 'precio', comentario: 'Me pasé del presupuesto' });
    expect(r.nuevo).toBe(true);
    expect(validarRechazo({ doc: doc({ status: 'rejected' }), cuerpo: { motivo: 'tiempos' } }).nuevo).toBe(false);
  });

  it('exige un motivo válido y, con «otro», un comentario', () => {
    expect(validarRechazo({ doc: doc(), cuerpo: {} }).error).toBe('motivo-invalido');
    expect(validarRechazo({ doc: doc(), cuerpo: { motivo: 'inventado' } }).error).toBe('motivo-invalido');
    expect(validarRechazo({ doc: doc(), cuerpo: { motivo: 'otro' } }).error).toBe('falta-comentario');
  });

  it('no deja responder una propuesta aceptada o sin link', () => {
    expect(validarRechazo({ doc: doc({ aceptacion: {} }), cuerpo: { motivo: 'precio' } }).estado).toBe(409);
    expect(validarRechazo({ doc: doc({ publico: false }), cuerpo: { motivo: 'precio' } }).estado).toBe(404);
  });
});

describe('validarPedidoCambio', () => {
  const ahora = new Date('2026-11-16T15:00:00Z');

  it('acepta el pedido y limpia el texto', () => {
    const r = validarPedidoCambio({ doc: doc(), cuerpo: { texto: '  Sacar la tienda\n\n\n\nY sumar redes ' }, ahora });
    expect(r.datos).toEqual({ texto: 'Sacar la tienda\n\nY sumar redes' });
  });

  it('pide un texto mínimo y frena los pedidos seguidos o demasiados', () => {
    expect(validarPedidoCambio({ doc: doc(), cuerpo: { texto: 'no' }, ahora }).error).toBe('falta-texto');
    const reciente = doc({ cambios: [{ texto: 'x', fecha: new Date(ahora.getTime() - 10000) }] });
    expect(validarPedidoCambio({ doc: reciente, cuerpo: { texto: 'Otro cambio' }, ahora }).error).toBe('muy-seguido');
    const muchos = doc({ cambios: Array.from({ length: CAMBIOS_MAX }, () => ({ texto: 'x', fecha: '2026-11-01T00:00:00Z' })) });
    expect(validarPedidoCambio({ doc: muchos, cuerpo: { texto: 'Otro cambio' }, ahora }).error).toBe('demasiados-cambios');
  });
});

describe('respuestaPublica', () => {
  it('muestra el «no avanzo» solo mientras siga rechazada', () => {
    expect(respuestaPublica(doc({ status: 'rejected', rechazo: { motivo: 'precio', comentario: 'x' } })).rechazo).toEqual({ motivo: 'precio' });
    expect(respuestaPublica(doc({ status: 'sent', rechazo: { motivo: 'precio' } })).rechazo).toBeNull();
    expect(respuestaPublica(doc({ cambios: [{ texto: 'a' }, { texto: 'b' }] })).cambios).toBe(2);
  });
});

describe('cambioPendiente y contarMotivos', () => {
  it('marca el cambio hasta que el dueño edita la propuesta', () => {
    const p = doc({ cambios: [{ texto: 'x', fecha: '2026-11-15T10:00:00Z' }], updatedAt: '2026-11-14T10:00:00Z' });
    expect(cambioPendiente(p).texto).toBe('x');
    expect(cambioPendiente({ ...p, updatedAt: '2026-11-15T12:00:00Z' })).toBeNull();
    expect(cambioPendiente({ ...p, aceptacion: {} })).toBeNull();
  });

  it('cuenta los motivos de más a menos frecuente', () => {
    const lista = [{ rechazo: { motivo: 'precio' } }, { rechazo: { motivo: 'tiempos' } }, { rechazo: { motivo: 'precio' } }];
    expect(contarMotivos(lista).map(m => [m.motivo, m.veces])).toEqual([['precio', 2], ['tiempos', 1]]);
  });
});

describe('vencimiento y recordatorio', () => {
  // 16/11/2026 a las 9 de Argentina.
  const ahora = new Date('2026-11-16T12:00:00Z');

  it('calcula el último día y la fecha de hoy en Argentina', () => {
    expect(ultimoDia({ propuesta: { fecha: '2026-11-10', validez: 10 } })).toBe('2026-11-20');
    expect(ultimoDia({ propuesta: { fecha: '2026-11-10', validez: 0 } })).toBe('');
    expect(hoyArgentina(new Date('2026-11-17T02:00:00Z'))).toBe('2026-11-16');
  });

  it('avisa en los últimos 3 días, una vez por vencimiento', () => {
    expect(porVencer(doc({ payload: { propuesta: { fecha: '2026-11-10', validez: 9 } } }), ahora)).toEqual({ vence: '2026-11-19', quedan: 3 });
    expect(porVencer(doc(), ahora)).toBeNull(); // vence el 20: faltan 4
    const cerca = doc({ payload: { propuesta: { fecha: '2026-11-10', validez: 7 } } });
    expect(recordatorioPendiente(cerca, ahora)).toEqual({ vence: '2026-11-17', quedan: 1 });
    expect(recordatorioPendiente({ ...cerca, recordatorio: { vence: '2026-11-17' } }, ahora)).toBeNull();
    expect(recordatorioPendiente({ ...cerca, recordatorio: { vence: '2026-11-12' } }, ahora)).not.toBeNull();
  });

  it('no avisa si ya respondió, venció o el link no está activo', () => {
    const cerca = doc({ payload: { propuesta: { fecha: '2026-11-10', validez: 7 } } });
    expect(porVencer({ ...cerca, aceptacion: {} }, ahora)).toBeNull();
    expect(porVencer({ ...cerca, status: 'rejected' }, ahora)).toBeNull();
    expect(porVencer({ ...cerca, publico: false }, ahora)).toBeNull();
    expect(porVencer(doc({ payload: { propuesta: { fecha: '2026-11-01', validez: 5 } } }), ahora)).toBeNull();
  });

  it('en Gratis mira la versión que ve el cliente', () => {
    const p = doc({ marca: true, publicado: { propuesta: { fecha: '2026-11-10', validez: 7 } } });
    expect(porVencer(p, ahora)?.vence).toBe('2026-11-17');
  });

  it('arma el texto de cuándo vence y el mensaje para el cliente', () => {
    expect(venceTexto('2026-11-16', 0)).toBe('hoy');
    expect(venceTexto('2026-11-17', 1)).toBe('mañana');
    expect(venceTexto('2026-11-19', 3)).toMatch(/^el jueves 19 de noviembre$/);
    const m = mensajeRecordatorio({ cliente: 'Laura Gómez', titulo: 'Web', vence: '2026-11-17', quedan: 1, link: 'https://dealit.com.ar/p/X' });
    expect(m).toContain('Hola Laura!');
    expect(m).toContain('«Web»: vence mañana');
    expect(m.endsWith('https://dealit.com.ar/p/X')).toBe(true);
  });
});
