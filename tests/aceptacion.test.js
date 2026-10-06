import { describe, expect, it } from 'vitest';
import { propuestaVencida, validarAceptacion } from '../src/aceptacion.js';
import { vacio } from '../src/modelo.js';

const payload = (cambios = {}) => ({
  ...vacio(),
  propuesta: { titulo: 'Web', numero: '', fecha: '2026-10-01', validez: 15 },
  servicios: [
    { id: 'base', nombre: 'Sitio', modalidad: 'unico', cantidad: 1, precio: 1000, opcional: false },
    { id: 'extra', nombre: 'Blog', modalidad: 'unico', cantidad: 1, precio: 200, opcional: true },
    { id: 'mes', nombre: 'Soporte', modalidad: 'mensual', cantidad: 1, precio: 50, opcional: false }
  ],
  ...cambios
});

const doc = (cambios = {}) => ({ publico: true, payload: payload(), ...cambios });
const ahora = new Date('2026-10-06T15:00:00Z');
const cuerpo = (cambios = {}) => ({ nombre: '  Laura   Gómez ', acepto: true, opcionales: [], ...cambios });

describe('validarAceptacion', () => {
  it('registra nombre, totales y una copia del contenido', () => {
    const { datos } = validarAceptacion({ doc: doc(), cuerpo: cuerpo({ opcionales: ['extra'] }), ahora });
    expect(datos.nombre).toBe('Laura Gómez');
    expect(datos.inicial).toBe(1200);
    expect(datos.mensual).toBe(50);
    expect(datos.moneda).toBe('USD');
    expect(datos.opcionales).toEqual([{ id: 'extra', nombre: 'Blog' }]);
    expect(datos.contenido.propuesta.titulo).toBe('Web');
  });

  it('calcula el total en el servidor, sin confiar en el cliente', () => {
    const { datos } = validarAceptacion({ doc: doc(), cuerpo: cuerpo({ total: 1 }), ahora });
    expect(datos.inicial).toBe(1000);
  });

  it('rechaza propuestas que no están compartidas o ya fueron aceptadas', () => {
    expect(validarAceptacion({ doc: null, cuerpo: cuerpo(), ahora }).estado).toBe(404);
    expect(validarAceptacion({ doc: doc({ publico: false }), cuerpo: cuerpo(), ahora }).estado).toBe(404);
    expect(validarAceptacion({ doc: doc({ aceptacion: { nombre: 'X' } }), cuerpo: cuerpo(), ahora }).error).toBe('ya-aceptada');
  });

  it('exige nombre y conformidad', () => {
    expect(validarAceptacion({ doc: doc(), cuerpo: cuerpo({ nombre: ' a ' }), ahora }).error).toBe('nombre-invalido');
    expect(validarAceptacion({ doc: doc(), cuerpo: cuerpo({ nombre: 'x'.repeat(121) }), ahora }).error).toBe('nombre-invalido');
    expect(validarAceptacion({ doc: doc(), cuerpo: cuerpo({ nombre: 42 }), ahora }).error).toBe('nombre-invalido');
    expect(validarAceptacion({ doc: doc(), cuerpo: cuerpo({ acepto: 'true' }), ahora }).error).toBe('falta-conformidad');
  });

  it('solo acepta opcionales que existen en la propuesta', () => {
    expect(validarAceptacion({ doc: doc(), cuerpo: cuerpo({ opcionales: ['base'] }), ahora }).error).toBe('opcionales-invalidos');
    expect(validarAceptacion({ doc: doc(), cuerpo: cuerpo({ opcionales: ['inventado'] }), ahora }).error).toBe('opcionales-invalidos');
    expect(validarAceptacion({ doc: doc(), cuerpo: cuerpo({ opcionales: [{}] }), ahora }).error).toBe('opcionales-invalidos');
  });

  it('rechaza propuestas vencidas', () => {
    const vieja = doc({ payload: payload({ propuesta: { titulo: 'Web', numero: '', fecha: '2026-01-01', validez: 15 } }) });
    expect(validarAceptacion({ doc: vieja, cuerpo: cuerpo(), ahora }).estado).toBe(410);
  });
});

describe('propuestaVencida', () => {
  const contenido = { propuesta: { fecha: '2026-10-01', validez: 5 } };

  it('respeta el último día completo en cualquier zona horaria', () => {
    expect(propuestaVencida(contenido, new Date('2026-10-06T23:59:00-03:00'))).toBe(false);
    expect(propuestaVencida(contenido, new Date('2026-10-07T00:30:00-10:00'))).toBe(false);
    expect(propuestaVencida(contenido, new Date('2026-10-08T12:00:00Z'))).toBe(true);
  });

  it('sin fecha o sin días de validez nunca vence', () => {
    expect(propuestaVencida({ propuesta: { fecha: '', validez: 5 } })).toBe(false);
    expect(propuestaVencida({ propuesta: { fecha: '2020-01-01', validez: 0 } })).toBe(false);
  });
});
