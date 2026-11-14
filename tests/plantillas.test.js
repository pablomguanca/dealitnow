import { describe, expect, it } from 'vitest';
import { PLANTILLAS, PLANTILLAS_PORTAFOLIO, TEMAS, FUENTES_TITULOS, FUENTES_CUERPO, normalizarPropuesta, normalizarPortafolio, calcularTotales } from '../src/modelo.js';
import { PLANTILLAS_CATALOGO, TEMAS_CATALOGO } from '../src/plantillas-catalogo.js';
import { PLANTILLAS_PORTFOLIO_CATALOGO } from '../src/portfolios-catalogo.js';
import { usosPro } from '../src/planes.js';
import { generarPropuestaHTML, generarPortafolioHTML } from '../src/lib/render.js';

const catalogo = Object.keys(PLANTILLAS_CATALOGO);

describe('catálogo ampliado de plantillas', () => {
  it('suma al menos 1 gratis y 10 PRO, todas marcadas como catálogo', () => {
    const planes = catalogo.map(id => PLANTILLAS[id].plan);
    expect(planes.filter(p => p === 'gratis').length).toBeGreaterThanOrEqual(1);
    expect(planes.filter(p => p === 'pro').length).toBeGreaterThanOrEqual(10);
    catalogo.forEach(id => expect(PLANTILLAS[id].catalogo).toBe(true));
  });

  it('no pisa las plantillas ni los diseños que ya existían', () => {
    expect(PLANTILLAS['diseno-web'].catalogo).toBeUndefined();
    Object.keys(TEMAS_CATALOGO).forEach(id => expect(TEMAS[id]).toBe(TEMAS_CATALOGO[id]));
  });

  it('los diseños nuevos usan tipografías que el editor ofrece', () => {
    Object.entries(TEMAS_CATALOGO).forEach(([id, t]) => {
      expect(FUENTES_TITULOS, id).toContain(t.fuenteTitulos);
      expect(FUENTES_CUERPO, id).toContain(t.fuenteCuerpo);
    });
  });

  it.each(catalogo)('«%s» arma una propuesta completa y válida', id => {
    const tpl = PLANTILLAS[id];
    const datos = normalizarPropuesta({ ...tpl.crear(), plantilla: id });
    expect(datos.plantilla).toBe(id);
    expect(TEMAS[datos.tema.preset]).toBeTruthy();
    expect(datos.propuesta.titulo).not.toBe('');
    expect(datos.servicios.length).toBeGreaterThanOrEqual(4);
    expect(datos.servicios.every(s => s.id && s.nombre)).toBe(true);
    expect(datos.etapas.length).toBeGreaterThanOrEqual(3);
    expect(datos.inversion.pagos.reduce((a, p) => a + p.porcentaje, 0)).toBe(100);
    const t = calcularTotales(datos);
    expect(t.inicial.total + t.mensual.total).toBeGreaterThan(0);
    expect(generarPropuestaHTML(datos)).toContain(datos.propuesta.titulo);
    // Una plantilla PRO cuenta como uso PRO (no se puede enviar en Gratis); la gratis, no.
    expect(usosPro({ ...datos, plantilla: id }).length > 0).toBe(tpl.plan === 'pro');
  });

  it('cada plantilla nueva crea IDs nuevos cada vez', () => {
    const a = PLANTILLAS['oficios-reformas'].crear();
    const b = PLANTILLAS['oficios-reformas'].crear();
    expect(a.servicios[0].id).not.toBe(b.servicios[0].id);
  });
});

describe('catálogo de plantillas de portfolio', () => {
  const ids = Object.keys(PLANTILLAS_PORTFOLIO_CATALOGO);

  it('suma 10 plantillas: 1 gratis y 9 PRO, sin pisar las que había', () => {
    expect(ids).toHaveLength(10);
    expect(ids.filter(id => PLANTILLAS_PORTFOLIO_CATALOGO[id].plan === 'gratis')).toHaveLength(1);
    ['en-blanco', 'diseno-web', 'software-producto', 'marketing-contenido', 'conceptos-expertise']
      .forEach(id => expect(PLANTILLAS_PORTAFOLIO[id].catalogo).toBeUndefined());
  });

  it.each(ids)('«%s» arma un portfolio completo con un diseño que existe', id => {
    const tpl = PLANTILLAS_PORTAFOLIO[id];
    expect(tpl.catalogo).toBe(true);
    const datos = normalizarPortafolio({ ...tpl.crear(), plantilla: id }, { logoValido: () => true });
    expect(datos.plantilla).toBe(id);
    expect(TEMAS[datos.tema.preset]).toBeTruthy();
    expect(datos.tema.preset).toBe(PLANTILLAS_PORTFOLIO_CATALOGO[id].datos().tema);
    expect(datos.portafolio.titulo).not.toBe('');
    expect(datos.proyectos.length).toBeGreaterThanOrEqual(3);
    expect(datos.especialidades.every(e => e.id && e.texto)).toBe(true);
    // La gratis usa un diseño gratis; las PRO cuentan como uso PRO.
    expect(usosPro(datos, { esPortafolio: true }).length > 0).toBe(tpl.plan === 'pro');
    const html = generarPortafolioHTML(datos, { web: true, tipoDecoracion: datos.tema.decoracion, tipoPortada: datos.tema.portada });
    expect(html).toContain(datos.proyectos[0].titulo.replace(/&/g, '&amp;'));
  });
});
