import { describe, expect, it } from 'vitest';
import { asignar, desdeISO, dinero, esc, lineas, numero, obtener, parrafos, texto } from '../src/lib/formato.js';

describe('numero', () => {
  it('acepta coma decimal y valores vacíos', () => {
    expect(numero('12,5')).toBe(12.5);
    expect(numero('')).toBe(0);
    expect(numero(null)).toBe(0);
    expect(numero('abc')).toBe(0);
  });
});

describe('texto', () => {
  it('convierte a string sin romper con null', () => {
    expect(texto(null)).toBe('');
    expect(texto(5)).toBe('5');
  });
});

describe('esc', () => {
  it('escapa HTML para evitar inyección', () => {
    expect(esc('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(esc("O'Brien & Co")).toBe('O&#39;Brien &amp; Co');
  });
});

describe('lineas', () => {
  it('quita viñetas y líneas vacías', () => {
    expect(lineas('- Uno\n\n• Dos\n  * Tres  ')).toEqual(['Uno', 'Dos', 'Tres']);
  });
});

describe('parrafos', () => {
  it('separa por línea en blanco y escapa el contenido', () => {
    expect(parrafos('Hola <b>\nseguido\n\nOtro')).toBe('<p>Hola &lt;b&gt;<br>seguido</p><p>Otro</p>');
  });
});

describe('dinero', () => {
  it('muestra decimales solo cuando hacen falta', () => {
    expect(dinero(1500, 'USD')).toMatch(/1\.500$/);
    expect(dinero(10.5, 'USD')).toMatch(/10,50$/);
  });

  it('no falla con una moneda inválida', () => {
    expect(dinero(3, 'XXXX')).toBe('XXXX 3');
  });
});

describe('desdeISO', () => {
  it('interpreta la fecha en hora local y rechaza formatos inválidos', () => {
    const d = desdeISO('2026-10-06');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 6]);
    expect(desdeISO('06/10/2026')).toBeNull();
  });
});

describe('obtener y asignar', () => {
  it('leen y escriben rutas con puntos', () => {
    const o = {};
    asignar(o, 'emisor.nombre', 'Ana');
    expect(o).toEqual({ emisor: { nombre: 'Ana' } });
    expect(obtener(o, 'emisor.nombre')).toBe('Ana');
    expect(obtener(o, 'cliente.nombre')).toBeUndefined();
  });
});
