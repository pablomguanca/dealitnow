import { describe, it, expect } from 'vitest';
import { crearHistorial } from '../src/historial.js';

describe('historial de deshacer y rehacer', () => {
  it('arranca sin nada para deshacer ni rehacer', () => {
    const h = crearHistorial();
    expect(h.puedeDeshacer()).toBe(false);
    expect(h.puedeRehacer()).toBe(false);
    h.iniciar('a');
    expect(h.actual()).toBe('a');
    expect(h.puedeDeshacer()).toBe(false);
    expect(h.deshacer()).toBeNull();
  });

  it('deshace y rehace paso por paso, y dice dónde fue el cambio', () => {
    const h = crearHistorial();
    h.iniciar('a');
    h.registrar('b', { lugar: 'campo-1', ahora: 0 });
    h.registrar('c', { lugar: 'campo-2', ahora: 5000 });
    expect(h.deshacer()).toEqual({ foto: 'b', lugar: 'campo-2', etiqueta: '' });
    expect(h.deshacer()).toEqual({ foto: 'a', lugar: 'campo-1', etiqueta: '' });
    expect(h.deshacer()).toBeNull();
    expect(h.rehacer()).toEqual({ foto: 'b', lugar: 'campo-1', etiqueta: '' });
    expect(h.rehacer()).toEqual({ foto: 'c', lugar: 'campo-2', etiqueta: '' });
    expect(h.rehacer()).toBeNull();
  });

  it('no suma un paso si el documento no cambió', () => {
    const h = crearHistorial();
    h.iniciar('a');
    expect(h.registrar('a')).toBe(false);
    expect(h.puedeDeshacer()).toBe(false);
  });

  it('un cambio nuevo descarta lo que se podía rehacer', () => {
    const h = crearHistorial();
    h.iniciar('a');
    h.registrar('b', { ahora: 0 });
    h.deshacer();
    expect(h.puedeRehacer()).toBe(true);
    h.registrar('x', { ahora: 10 });
    expect(h.puedeRehacer()).toBe(false);
    expect(h.deshacer().foto).toBe('a');
  });

  it('escribir de corrido en el mismo campo es un solo paso', () => {
    const h = crearHistorial();
    h.iniciar('');
    h.registrar('h', { grupo: 'titulo', ahora: 0 });
    h.registrar('ho', { grupo: 'titulo', ahora: 200 });
    h.registrar('hol', { grupo: 'titulo', ahora: 400 });
    expect(h.deshacer().foto).toBe('');
    expect(h.puedeDeshacer()).toBe(false);
  });

  it('una pausa, otro campo o un paso largo cortan el grupo', () => {
    const h = crearHistorial({ pausa: 1000, tramo: 5000 });
    h.iniciar('0');
    h.registrar('1', { grupo: 'a', ahora: 0 });
    h.registrar('2', { grupo: 'a', ahora: 1500 }); // pausa
    h.registrar('3', { grupo: 'b', ahora: 1600 }); // otro campo
    let t = 1600;
    for (let i = 4; i < 12; i++) h.registrar(String(i), { grupo: 'b', ahora: (t += 800) }); // pasa los 5 s
    const fotos = [];
    let paso;
    while ((paso = h.deshacer())) fotos.push(paso.foto);
    expect(fotos).toEqual(['9', '2', '1', '0']);
  });

  it('después de deshacer, escribir en el mismo campo no pisa el paso recuperado', () => {
    const h = crearHistorial();
    h.iniciar('');
    h.registrar('a', { grupo: 'x', ahora: 0 });
    h.registrar('b', { grupo: 'y', ahora: 100 });
    h.deshacer(); // vuelve a 'a', que era del grupo x
    h.registrar('ac', { grupo: 'x', ahora: 200 });
    expect(h.deshacer().foto).toBe('a');
  });

  it('los pasos sin grupo nunca se juntan', () => {
    const h = crearHistorial();
    h.iniciar('a');
    h.registrar('b', { ahora: 0 });
    h.registrar('c', { ahora: 10 });
    expect(h.deshacer().foto).toBe('b');
  });

  it('cortar cierra el paso abierto', () => {
    const h = crearHistorial();
    h.iniciar('');
    h.registrar('a', { grupo: 'x', ahora: 0 });
    h.cortar();
    h.registrar('ab', { grupo: 'x', ahora: 100 });
    expect(h.deshacer().foto).toBe('a');
  });

  it('se queda con los últimos pasos y no se pasa del peso máximo', () => {
    const h = crearHistorial({ pasosMax: 3 });
    h.iniciar('0');
    for (let i = 1; i <= 6; i++) h.registrar(String(i), { ahora: i * 10000 });
    const fotos = [];
    let paso;
    while ((paso = h.deshacer())) fotos.push(paso.foto);
    expect(fotos).toEqual(['5', '4']);

    const p = crearHistorial({ pesoMax: 25 });
    p.iniciar('x'.repeat(10));
    p.registrar('y'.repeat(10), { ahora: 0 });
    p.registrar('z'.repeat(10), { ahora: 10000 });
    expect(p.deshacer().foto).toBe('y'.repeat(10));
    expect(p.deshacer()).toBeNull();
  });

  it('registrar sin iniciar toma el documento como base', () => {
    const h = crearHistorial();
    expect(h.registrar('a')).toBe(false);
    expect(h.actual()).toBe('a');
    h.registrar('b', { ahora: 0 });
    expect(h.deshacer().foto).toBe('a');
  });
});
