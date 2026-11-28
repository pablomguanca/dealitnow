import { describe, expect, it } from 'vitest';
import { agruparClientes, claveCliente, clienteDormido, nombreCliente } from '../src/clientes.js';

const prop = (id, extra = {}) => ({
  id,
  status: 'draft',
  updatedAt: '2026-11-01T12:00:00Z',
  payload: { cliente: { nombre: '', empresa: '', cargo: '' }, inversion: { moneda: 'ARS' } },
  ...extra
});

describe('claveCliente', () => {
  it('ignora mayúsculas, acentos, espacios y signos', () => {
    expect(claveCliente('Logística  Sur')).toBe('logistica sur');
    expect(claveCliente('LOGISTICA SUR.')).toBe('logistica sur');
    expect(claveCliente('  ')).toBe('');
  });
});

describe('nombreCliente', () => {
  it('usa clientName y, si falta, la empresa o la persona del payload', () => {
    expect(nombreCliente(prop('a', { clientName: 'Café Molino' }))).toBe('Café Molino');
    expect(nombreCliente(prop('b', { payload: { cliente: { nombre: 'Ana', empresa: '' } } }))).toBe('Ana');
  });
});

describe('agruparClientes', () => {
  const lista = [
    prop('1', { clientName: 'Logística Sur', updatedAt: '2026-10-01T12:00:00Z', payload: { cliente: { nombre: 'Santiago Morales', empresa: 'Logística Sur', cargo: 'Director' }, inversion: { moneda: 'ARS' } } }),
    prop('2', { clientName: 'logistica sur', status: 'accepted', updatedAt: '2026-11-20T12:00:00Z', aceptacion: { inicial: 500000, moneda: 'ARS', fecha: '2026-11-20T12:00:00Z' }, payload: { cliente: { nombre: 'Santiago Morales', empresa: 'logistica sur', cargo: 'Director' }, inversion: { moneda: 'ARS' } } }),
    prop('3', { clientName: 'Logística Sur', status: 'sent', updatedAt: '2026-11-10T12:00:00Z' }),
    prop('4', { clientName: 'Café Molino', updatedAt: '2026-11-25T12:00:00Z', payload: { cliente: { nombre: 'Café Molino', empresa: '', cargo: '' } } }),
    prop('5', { clientName: '' })
  ];

  it('junta las propuestas del mismo cliente aunque esté escrito distinto', () => {
    const { clientes, sinCliente } = agruparClientes(lista);
    expect(clientes.map(c => c.clave)).toEqual(['cafe molino', 'logistica sur']);
    expect(sinCliente).toBe(1);
    const sur = clientes[1];
    expect(sur.cantidad).toBe(3);
    expect(sur.propuestas.map(p => p.id)).toEqual(['2', '3', '1']);
    expect(sur.nombre).toBe('logistica sur');
  });

  it('cuenta aceptadas, en juego y lo ganado por moneda', () => {
    const sur = agruparClientes(lista).clientes[1];
    expect(sur.aceptadas).toBe(1);
    expect(sur.enJuego).toBe(1);
    expect(sur.ganado).toEqual([{ moneda: 'ARS', total: 500000 }]);
  });

  it('muestra la persona como contacto solo si es distinta del cliente', () => {
    const [cafe, sur] = agruparClientes(lista).clientes;
    expect(sur.contacto).toBe('Santiago Morales · Director');
    expect(cafe.contacto).toBe('');
    expect(sur.datos).toEqual({ nombre: 'Santiago Morales', empresa: 'logistica sur', cargo: 'Director' });
  });

  it('sin propuestas no hay clientes', () => {
    expect(agruparClientes([])).toEqual({ clientes: [], sinCliente: 0 });
  });
});

describe('clienteDormido', () => {
  it('marca a quien no tiene movimiento hace más de 90 días ni nada en juego', () => {
    const ahora = new Date('2026-11-27T12:00:00Z');
    expect(clienteDormido({ ultima: new Date('2026-07-01T12:00:00Z'), enJuego: 0 }, ahora)).toBe(true);
    expect(clienteDormido({ ultima: new Date('2026-07-01T12:00:00Z'), enJuego: 1 }, ahora)).toBe(false);
    expect(clienteDormido({ ultima: new Date('2026-11-01T12:00:00Z'), enJuego: 0 }, ahora)).toBe(false);
  });
});
