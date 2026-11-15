import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { crearHandler, logoDe } from '../api/vista-previa.js';

const ID = 'AAAAAAAAAAAAAAAAAAA1';
const LOGO = 'https://firebasestorage.googleapis.com/v0/b/dealit/o/users%2Fu%2Flogos%2Fabc.png?alt=media';

const crearDb = docs => () => ({
  collection: nombre => ({
    doc: id => ({
      get: async () => {
        const datos = docs[`${nombre}/${id}`];
        return { exists: !!datos, data: () => datos, get: campo => datos?.[campo] };
      }
    })
  })
});

const pedir = async (db, query, fetchFn) => {
  const res = {
    cabeceras: {},
    setHeader(k, v) { this.cabeceras[k] = v; },
    status(c) { this.codigo = c; return this; },
    send(cuerpo) { this.cuerpo = cuerpo; return this; },
    end() { return this; }
  };
  await crearHandler({ db, fetchFn })({ query, headers: { host: 'dealit.com.ar' } }, res);
  return res;
};
const imagen = html => html.match(/property="og:image" content="([^"]*)"/)[1].replaceAll('&amp;', '&');

describe('vista previa del link', () => {
  it('usa el logo de la propuesta, también en Gratis (versión que ve el cliente)', async () => {
    const db = crearDb({
      [`proposals/${ID}`]: { publico: true, marca: true, publicado: { emisor: { logo: LOGO, nombre: 'Atenea' } }, payload: { emisor: { logo: '' } } }
    });
    const res = await pedir(db, { tipo: 'propuesta', id: ID });
    expect(res.codigo).toBe(200);
    expect(imagen(res.cuerpo)).toMatch(/^https:\/\/dealit\.com\.ar\/api\/vista-previa\?tipo=propuesta&id=AAAAAAAAAAAAAAAAAAA1&imagen=1&v=[0-9a-f]{12}$/);
    expect(res.cuerpo).toContain('og:image:width" content="400"');
    expect(res.cuerpo).toContain('content="https://dealit.com.ar/p/AAAAAAAAAAAAAAAAAAA1"');
    expect(res.cuerpo).toContain('og:site_name" content="Atenea"');
  });

  it('usa el logo del portfolio', async () => {
    const db = crearDb({ [`portfolios/${ID}`]: { publico: true, marca: false, payload: { emisor: { logo: LOGO } } } });
    const res = await pedir(db, { tipo: 'portafolio', id: ID });
    expect(imagen(res.cuerpo)).toContain('tipo=portafolio&id=AAAAAAAAAAAAAAAAAAA1&imagen=1');
    expect(res.cuerpo).toContain('Te compartieron un portfolio');
  });

  it('sin logo, sin link activo o con un id raro, va el ícono de Dealit', async () => {
    const icono = 'https://dealit.com.ar/iconos/icono-512.png';
    const db = crearDb({
      [`proposals/${ID}`]: { publico: true, payload: { emisor: { logo: '' } } },
      'proposals/BBBBBBBBBBBBBBBBBBB2': { publico: false, payload: { emisor: { logo: LOGO } } }
    });
    expect(imagen((await pedir(db, { tipo: 'propuesta', id: ID })).cuerpo)).toBe(icono);
    expect(imagen((await pedir(db, { tipo: 'propuesta', id: 'BBBBBBBBBBBBBBBBBBB2' })).cuerpo)).toBe(icono);
    expect(imagen((await pedir(db, { tipo: 'propuesta', id: '../x' })).cuerpo)).toBe(icono);
  });

  it('solo acepta logos por https', () => {
    expect(logoDe({ emisor: { logo: LOGO } })).toBe(LOGO);
    expect(logoDe({ emisor: { logo: 'data:image/png;base64,AAAA' } })).toBe('');
    expect(logoDe({ emisor: { logo: 'http://x.com/a.png' } })).toBe('');
    expect(logoDe({ emisor: { logo: 'https://otro-sitio.com/a.png' } })).toBe('');
    expect(logoDe({ emisor: { logo: 'https://x.com/a.png" onload="x' } })).toBe('');
  });

  it('arma el logo apaisado en un cuadrado de 400 con el color de su fondo', async () => {
    const apaisado = await sharp({ create: { width: 900, height: 300, channels: 3, background: '#0b0b10' } })
      .composite([{ input: await sharp({ create: { width: 500, height: 120, channels: 3, background: '#d4af37' } }).png().toBuffer(), left: 200, top: 90 }])
      .png().toBuffer();
    const pedidos = [];
    const fetchFn = async url => { pedidos.push(url); return new Response(apaisado); };
    const db = crearDb({ [`proposals/${ID}`]: { publico: true, payload: { emisor: { logo: LOGO } } } });
    const res = await pedir(db, { tipo: 'propuesta', id: ID, imagen: '1' }, fetchFn);
    expect(pedidos).toEqual([LOGO]);
    expect(res.cabeceras['Content-Type']).toBe('image/png');
    const { width, height } = await sharp(res.cuerpo).metadata();
    expect([width, height]).toEqual([400, 400]);
    const { data } = await sharp(res.cuerpo).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
    expect([...data.subarray(0, 3)]).toEqual([11, 11, 16]);
  });

  it('sin logo, o si no se puede descargar, la imagen redirige al ícono de Dealit', async () => {
    const db = crearDb({
      [`proposals/${ID}`]: { publico: true, payload: { emisor: { logo: '' } } },
      'proposals/BBBBBBBBBBBBBBBBBBB2': { publico: true, payload: { emisor: { logo: LOGO } } }
    });
    const sinLogo = await pedir(db, { tipo: 'propuesta', id: ID, imagen: '1' });
    expect([sinLogo.codigo, sinLogo.cabeceras.Location]).toEqual([302, 'https://dealit.com.ar/iconos/icono-512.png']);
    const caido = await pedir(db, { tipo: 'propuesta', id: 'BBBBBBBBBBBBBBBBBBB2', imagen: '1' }, async () => new Response('', { status: 404 }));
    expect(caido.codigo).toBe(302);
  });
});
