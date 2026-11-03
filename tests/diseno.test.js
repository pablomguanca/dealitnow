import { describe, it, expect } from 'vitest';
import {
  TEMAS,
  PORTADAS,
  DECORACIONES,
  ESTILOS_BLOQUES,
  PLANTILLAS,
  LISTAS,
  FUENTES_TITULOS,
  FUENTES_CUERPO,
  COMBINACIONES_FUENTES,
  normalizarPropuesta
} from '../src/modelo.js';
import { obtener } from '../src/lib/formato.js';

describe('temas', () => {
  it('cada tema usa una portada, una decoración, un estilo y fuentes que existen', () => {
    for (const [id, t] of Object.entries(TEMAS)) {
      expect(PORTADAS[t.portada], `${id}: portada`).toBeTruthy();
      expect(DECORACIONES[t.decoracion], `${id}: decoración`).toBeTruthy();
      expect(ESTILOS_BLOQUES[t.estilo], `${id}: estilo`).toBeTruthy();
      expect(FUENTES_TITULOS, `${id}: títulos`).toContain(t.fuenteTitulos);
      expect(FUENTES_CUERPO, `${id}: cuerpo`).toContain(t.fuenteCuerpo);
    }
  });
});

describe('combinaciones de tipografía', () => {
  it('solo usan fuentes que están en los selectores del editor', () => {
    for (const c of COMBINACIONES_FUENTES) {
      expect(FUENTES_TITULOS).toContain(c.titulos);
      expect(FUENTES_CUERPO).toContain(c.cuerpo);
    }
  });

  it('no repiten id', () => {
    const ids = COMBINACIONES_FUENTES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('plantillas', () => {
  it('al normalizarlas quedan con todas las listas del editor y su diseño', () => {
    for (const [id, tpl] of Object.entries(PLANTILLAS)) {
      const n = normalizarPropuesta(tpl.crear());
      for (const conf of Object.values(LISTAS)) expect(Array.isArray(obtener(n, conf.ruta)), `${id}: ${conf.ruta}`).toBe(true);
      expect(TEMAS[n.tema.preset], `${id}: tema`).toBeTruthy();
      expect(n.tema.portada, `${id}: portada`).toBe(tpl.crear().tema.portada);
    }
  });

  it('«Tienda online» conserva su diseño original', () => {
    const t = normalizarPropuesta(PLANTILLAS['diseno-web'].crear()).tema;
    expect(t).toMatchObject({
      preset: 'elegante-oscuro',
      acento: '#C9A84C',
      fuenteTitulos: 'Bebas Neue',
      fuenteCuerpo: 'Montserrat',
      portada: 'editorial',
      decoracion: 'marco',
      estilo: 'editorial'
    });
  });
});
