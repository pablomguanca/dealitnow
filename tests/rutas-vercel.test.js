import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { leerCookies, resolverRuta } from '../src/lib/rutas-vercel.js';

const VERCEL = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const ir = (ruta, { query = '', cookie = '' } = {}) =>
  resolverRuta(VERCEL, { ruta, query: new URLSearchParams(query), cookies: leerCookies(cookie) });

describe('rutas de vercel.json', () => {
  it('la raíz muestra la landing a quien llega por primera vez', () => {
    expect(ir('/')).toEqual({ destino: '/inicio.html' });
  });

  it('la raíz muestra la app a quien ya la usa en este navegador', () => {
    expect(ir('/', { cookie: 'otra=1; dealit_app=1' })).toEqual({ destino: '/app.html' });
  });

  it('las vueltas a la raíz con parámetros de la app van a la app, sin cookie', () => {
    for (const query of ['verificado=a%40b.com', 'ingresar', 'propuesta=x', 'portafolio=x', 'seccion=cuenta']) {
      expect(ir('/', { query })).toEqual({ destino: '/app.html' });
    }
  });

  it('las puertas de entrada y las rutas de la app van a la app', () => {
    for (const ruta of ['/empezar', '/ingresar', '/cuenta', '/resultados', '/p/DEMO0000000000000001', '/portafolio/abc', '/propuesta/abc', '/editar-portafolio/abc', '/accion']) {
      expect(ir(ruta)).toEqual({ destino: '/app.html' });
    }
  });

  it('/inicio sigue mostrando la landing, también con la cookie (sin reescritura: es el archivo)', () => {
    expect(ir('/inicio', { cookie: 'dealit_app=1' })).toBeNull();
  });

  it('las páginas sueltas siguen como están', () => {
    expect(ir('/terminos')).toBeNull();
    expect(ir('/privacidad')).toBeNull();
  });
});
