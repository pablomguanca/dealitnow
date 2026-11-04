import { describe, it, expect } from 'vitest';
import { normalizarPortafolio, vacioPortafolio, LISTAS_PORTAFOLIO } from '../src/modelo.js';
import { proyectoCardHTML } from '../src/lib/render.js';

const FOTO = n => `data:image/png;base64,FOTO${n}`;
const proyectoCon = (cambios = {}) => {
  const base = vacioPortafolio();
  base.proyectos = [{ ...LISTAS_PORTAFOLIO.proyectos.nuevo(), titulo: 'Casa Norte', imagen: FOTO(1), galeria: [FOTO(2), FOTO(3)], ...cambios }];
  return normalizarPortafolio(base).proyectos[0];
};

describe('fotos de un proyecto del portfolio', () => {
  it('por defecto se ven todas en grilla pareja y centradas', () => {
    const p = proyectoCon({ disposicionFotos: undefined, encuadre: undefined });
    expect(p.disposicionFotos).toBe('grilla');
    expect(p.encuadre).toBe('centro');
    const html = proyectoCardHTML(p, 0, true);
    expect(html).toContain('proyecto-fotos--grilla');
    expect((html.match(/proyecto-fotos__item/g) || []).length).toBe(3);
    expect(html).not.toContain('proyecto-card__tira');
  });

  it('valores desconocidos vuelven a los de por defecto', () => {
    const p = proyectoCon({ disposicionFotos: 'otra', encuadre: 'diagonal' });
    expect(p.disposicionFotos).toBe('grilla');
    expect(p.encuadre).toBe('centro');
  });

  it('«destacada» conserva una grande y miniaturas', () => {
    const html = proyectoCardHTML(proyectoCon({ disposicionFotos: 'destacada' }), 0, true);
    expect(html).toContain('proyecto-card__tira');
    expect(html).not.toContain('proyecto-fotos--');
  });

  it('el encuadre se aplica a las fotos', () => {
    const html = proyectoCardHTML(proyectoCon({ encuadre: 'arriba' }), 0, true);
    expect(html).toContain('object-position:center top');
  });
});
