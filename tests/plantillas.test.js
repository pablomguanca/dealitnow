import { describe, expect, it } from 'vitest';
import { PLANTILLAS, TEMAS, FUENTES_TITULOS, FUENTES_CUERPO, normalizarPropuesta, calcularTotales } from '../src/modelo.js';
import { PLANTILLAS_CATALOGO, TEMAS_CATALOGO } from '../src/plantillas-catalogo.js';
import { usosPro } from '../src/planes.js';
import { generarPropuestaHTML } from '../src/lib/render.js';

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
