import { describe, expect, it } from 'vitest';
import {
  DECORACIONES,
  ESTILOS_BLOQUES,
  PLANTILLAS,
  PORTADAS,
  TEMAS,
  calcularTotales,
  ejemplo,
  normalizarPropuesta,
  vacio
} from '../src/modelo.js';

const conServicios = (servicios, inversion = {}) => ({
  ...vacio(),
  servicios,
  inversion: { ...vacio().inversion, ...inversion }
});

describe('calcularTotales', () => {
  it('separa pagos únicos de mensuales', () => {
    const t = calcularTotales(conServicios([
      { id: 'a', modalidad: 'unico', cantidad: 2, precio: 100 },
      { id: 'b', modalidad: 'hora', cantidad: 3, precio: 10 },
      { id: 'c', modalidad: 'mensual', cantidad: 1, precio: 50 }
    ]));
    expect(t.inicial.total).toBe(230);
    expect(t.mensual.total).toBe(50);
  });

  it('suma los opcionales solo si el cliente los eligió', () => {
    const p = conServicios([
      { id: 'a', modalidad: 'unico', cantidad: 1, precio: 100 },
      { id: 'b', modalidad: 'unico', cantidad: 1, precio: 40, opcional: true }
    ]);
    expect(calcularTotales(p).inicial.total).toBe(100);
    expect(calcularTotales(p, new Set(['b'])).inicial.total).toBe(140);
  });

  it('aplica el descuento antes del impuesto', () => {
    const t = calcularTotales(conServicios([{ id: 'a', modalidad: 'unico', cantidad: 1, precio: 1000 }], { descuento: 10, impuesto: 21 }));
    expect(t.inicial.desc).toBe(100);
    expect(t.inicial.imp).toBeCloseTo(189);
    expect(t.inicial.total).toBeCloseTo(1089);
  });

  it('limita el descuento entre 0 y 100 %', () => {
    const p = conServicios([{ id: 'a', modalidad: 'unico', cantidad: 1, precio: 100 }], { descuento: 150 });
    expect(calcularTotales(p).inicial.total).toBe(0);
  });
});

describe('normalizarPropuesta', () => {
  it('completa una propuesta vacía o inválida con valores por defecto', () => {
    for (const entrada of [null, 'texto', 42, {}]) {
      const n = normalizarPropuesta(entrada);
      expect(n.servicios).toEqual([]);
      expect(n.tema.preset).toBe('elegante-oscuro');
      expect(n.tema.portada).toBe('editorial');
      expect(n.tema.decoracion).toBe('marco');
      expect(n.tema.estilo).toBe('editorial');
      expect(n.inversion.moneda).toBe('USD');
    }
  });

  it('corrige valores desconocidos y toma valores por defecto del preset', () => {
    const n = normalizarPropuesta({
      tema: { preset: 'no-existe', portada: 'invalida', decoracion: 'invalida', estilo: 'invalido' },
      servicios: [{ nombre: 5, modalidad: 'trimestral' }, null, 'basura']
    });
    expect(n.tema.preset).toBe('elegante-oscuro');
    expect(n.tema.portada).toBe('editorial');
    expect(n.tema.decoracion).toBe('marco');
    expect(n.tema.estilo).toBe('editorial');
    expect(n.servicios).toHaveLength(1);
    expect(n.servicios[0]).toMatchObject({ nombre: '5', modalidad: 'unico' });
    expect(n.servicios[0].id).toBeTruthy();

    const aurora = normalizarPropuesta({ tema: { preset: 'aurora-tech' } });
    expect(aurora.tema.portada).toBe('impacto');
    expect(aurora.tema.decoracion).toBe('aurora');
    expect(aurora.tema.estilo).toBe('bento');
  });

  it('descarta logos que no pasan la validación', () => {
    expect(normalizarPropuesta({ emisor: { logo: 'https://otro-sitio.example/pixel.png' } }).emisor.logo).toBe('');
    expect(normalizarPropuesta({ emisor: { logo: 'data:image/png;base64,AAAA' } }).emisor.logo).toBe('data:image/png;base64,AAAA');
    const deStorage = 'https://firebasestorage.googleapis.com/v0/b/x/o/logo.webp';
    const logoValido = l => l.startsWith('https://firebasestorage.googleapis.com/v0/b/x/o/');
    expect(normalizarPropuesta({ emisor: { logo: deStorage } }, { logoValido }).emisor.logo).toBe(deStorage);
  });

  it('es idempotente con la propuesta de ejemplo y con todas las plantillas por rubro', () => {
    const una = normalizarPropuesta(ejemplo());
    expect(normalizarPropuesta(una)).toEqual(una);
    for (const [id, tpl] of Object.entries(PLANTILLAS)) {
      const creada = normalizarPropuesta(tpl.crear());
      expect(normalizarPropuesta(creada), `plantilla ${id}`).toEqual(creada);
      expect(TEMAS[creada.tema.preset]).toBeTruthy();
      expect(PORTADAS[creada.tema.portada]).toBeTruthy();
      expect(DECORACIONES[creada.tema.decoracion]).toBeTruthy();
      expect(ESTILOS_BLOQUES[creada.tema.estilo]).toBeTruthy();
    }
  });
});
