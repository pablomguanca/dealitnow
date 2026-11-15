import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { leerCookies, resolverRuta } from '../src/lib/rutas-vercel.js';

const VERCEL = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const ir = (ruta, { query = '', cookie = '' } = {}) =>
  resolverRuta(VERCEL, { ruta, query: new URLSearchParams(query), cookies: leerCookies(cookie) });

describe('rutas de vercel.json', () => {
  it('la raíz muestra la landing a quien llega por primera vez', () => {
    expect(ir('/')).toEqual({ destino: '/inicio' });
  });

  it('la raíz muestra la app a quien ya la usa en este navegador', () => {
    expect(ir('/', { cookie: 'otra=1; dealit_app=1' })).toEqual({ destino: '/app' });
  });

  it('las vueltas a la raíz con parámetros de la app van a la app, sin cookie', () => {
    for (const query of ['verificado=a%40b.com', 'ingresar', 'propuesta=x', 'portafolio=x', 'seccion=cuenta']) {
      expect(ir('/', { query })).toEqual({ destino: '/app' });
    }
  });

  it('las puertas de entrada y las rutas de la app van a la app', () => {
    for (const ruta of ['/empezar', '/ingresar', '/cuenta', '/resultados', '/p/DEMO0000000000000001', '/portafolio/abc', '/propuesta/abc', '/editar-portafolio/abc', '/accion']) {
      expect(ir(ruta)).toEqual({ destino: '/app' });
    }
  });

  it('/inicio sigue mostrando la landing, también con la cookie (sin reescritura: es el archivo)', () => {
    expect(ir('/inicio', { cookie: 'dealit_app=1' })).toBeNull();
  });

  it('los lectores de vista previa de un link de cliente van a /api/vista-previa', () => {
    const whatsapp = { 'user-agent': 'WhatsApp/2.24.1.6 A' };
    const facebook = { 'user-agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' };
    expect(resolverRuta(VERCEL, { ruta: '/p/AAAAAAAAAAAAAAAAAAA1', cabeceras: whatsapp }))
      .toEqual({ destino: '/api/vista-previa?tipo=propuesta&id=AAAAAAAAAAAAAAAAAAA1' });
    expect(resolverRuta(VERCEL, { ruta: '/portafolio/AAAAAAAAAAAAAAAAAAA1', cabeceras: facebook }))
      .toEqual({ destino: '/api/vista-previa?tipo=portafolio&id=AAAAAAAAAAAAAAAAAAA1' });
  });

  it('una persona que abre el link va a la app, también desde el navegador del celular', () => {
    const chrome = { 'user-agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36' };
    expect(resolverRuta(VERCEL, { ruta: '/p/AAAAAAAAAAAAAAAAAAA1', cabeceras: chrome })).toEqual({ destino: '/app' });
  });

  it('las páginas sueltas siguen como están', () => {
    expect(ir('/terminos')).toBeNull();
    expect(ir('/privacidad')).toBeNull();
  });
});
