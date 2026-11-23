import { describe, expect, it } from 'vitest';
import { huellaGuia, editoClienteYPrecios, pasosHechos, pasoActual } from '../src/guia.js';

const ejemplo = () => ({
  cliente: { nombre: 'Gastón Peralta', empresa: 'Almacén Botánico' },
  servicios: [{ nombre: 'Identidad', precio: 100 }, { nombre: 'Tienda', precio: 200 }]
});

describe('guía de primeros pasos', () => {
  const base = huellaGuia(ejemplo());

  it('recién cargado, no editó nada y sigue el primer paso', () => {
    expect(editoClienteYPrecios(base, ejemplo())).toBe(false);
    expect(pasoActual({ base, hechos: [] }, ejemplo())).toBe('editar');
  });

  it('cambiar solo el cliente o solo un precio no alcanza', () => {
    const soloCliente = { ...ejemplo(), cliente: { nombre: 'Lucía', empresa: '' } };
    const soloPrecio = ejemplo();
    soloPrecio.servicios[0].precio = 150;
    expect(editoClienteYPrecios(base, soloCliente)).toBe(false);
    expect(editoClienteYPrecios(base, soloPrecio)).toBe(false);
  });

  it('con el cliente y un precio cambiados, el paso «editar» está hecho', () => {
    const editada = { ...ejemplo(), cliente: { nombre: 'Lucía', empresa: '' } };
    editada.servicios[1].precio = 250;
    expect(pasosHechos({ base, hechos: [] }, editada)).toEqual(['editar']);
    expect(pasoActual({ base, hechos: [] }, editada)).toBe('ver');
  });

  it('los pasos anotados cuentan aunque se deshaga la edición', () => {
    expect(pasosHechos({ base, hechos: ['editar', 'ver'] }, ejemplo())).toEqual(['editar', 'ver']);
    expect(pasoActual({ base, hechos: ['editar', 'ver'] }, ejemplo())).toBe('compartir');
    expect(pasoActual({ base, hechos: ['editar', 'ver', 'compartir'] }, ejemplo())).toBeNull();
  });

  it('compartir termina la guía aunque se haya salteado un paso', () => {
    expect(pasoActual({ base, hechos: ['editar', 'compartir'] }, ejemplo())).toBeNull();
  });

  it('tolera datos incompletos', () => {
    expect(huellaGuia(undefined)).toEqual({ cliente: '|', servicios: '' });
    expect(pasosHechos(null, ejemplo())).toEqual([]);
  });
});
