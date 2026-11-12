import { describe, expect, it } from 'vitest';
import { cifrar, descifrar, firmarEstado, tokenVigente, verificarEstado } from '../api/_lib/mp-connect.js';
import { crearHandler } from '../api/cobro-mp.js';
import { primerPago, vacio } from '../src/modelo.js';

const ID = 'AAAAAAAAAAAAAAAAAAA1';
const ENTORNO = { MP_CLIENT_ID: '123', MP_CLIENT_SECRET: 'secreto-de-prueba', APP_URL: 'https://dealit.test' };
const AHORA = Date.parse('2026-11-12T12:00:00Z');

// Firestore mínimo: colecciones con doc().get/set/delete.
const crearDb = (inicial = {}) => {
  const datos = structuredClone(inicial);
  const db = {
    collection: c => ({
      doc: id => ({
        get: async () => ({ exists: !!datos[c]?.[id], data: () => datos[c]?.[id] }),
        set: async v => { (datos[c] ||= {})[id] = JSON.parse(JSON.stringify(v)); },
        delete: async () => { delete datos[c]?.[id]; }
      })
    })
  };
  return { db: () => db, datos };
};

// fetch de Mercado Pago simulado: responde según la ruta y anota los pedidos.
const crearFetch = (respuestas = {}) => {
  const pedidos = [];
  const fn = async (url, opciones) => {
    const ruta = new URL(url).pathname;
    const body = opciones.body ? JSON.parse(opciones.body) : null;
    pedidos.push({ ruta, body, auth: opciones.headers?.Authorization });
    const r = respuestas[ruta];
    const valor = typeof r === 'function' ? r(body) : r;
    return { ok: valor !== undefined, status: valor === undefined ? 400 : 200, json: async () => valor ?? { message: 'no' } };
  };
  return { fn, pedidos };
};

const res = () => {
  const r = { estado: null, cuerpo: undefined, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = e => { r.estado = e; return r; };
  r.json = c => { r.cuerpo = c; return r; };
  r.end = () => { r.estado ??= r.statusCode; return r; };
  return r;
};
const post = body => ({ method: 'POST', headers: { 'content-type': 'application/json', host: 'dealit.test' }, body });

const aceptada = (cambios = {}) => ({
  userId: 'duenio',
  publico: true,
  title: 'Pintura',
  payload: { ...vacio(), propuesta: { titulo: 'Pintura interior', numero: '', fecha: '2026-11-01', validez: 30 }, cobro: { metodo: 'mercadopago', conMp: true }, inversion: { ...vacio().inversion, moneda: 'ARS', pagos: [{ id: 'a', concepto: 'Seña', porcentaje: 50 }] } },
  aceptacion: { nombre: 'Laura', inicial: 100000, moneda: 'ARS' },
  ...cambios
});

describe('vinculación segura', () => {
  it('el «state» firmado identifica la cuenta, no se puede falsificar y vence', () => {
    const estado = firmarEstado('duenio', { secreto: 's', ahora: AHORA });
    expect(verificarEstado(estado, { secreto: 's', ahora: AHORA })).toBe('duenio');
    expect(verificarEstado(estado, { secreto: 'otro', ahora: AHORA })).toBeNull();
    expect(verificarEstado(estado.replace(/.$/, c => (c === 'A' ? 'B' : 'A')), { secreto: 's', ahora: AHORA })).toBeNull();
    expect(verificarEstado(estado, { secreto: 's', ahora: AHORA + 16 * 60 * 1000 })).toBeNull();
  });

  it('los tokens se guardan cifrados', () => {
    const guardado = cifrar('APP_USR-token', 's');
    expect(guardado).not.toContain('APP_USR');
    expect(descifrar(guardado, 's')).toBe('APP_USR-token');
  });
});

describe('/api/cobro-mp', () => {
  const handler = (db, fetchFn, sesion = { uid: 'duenio' }) =>
    crearHandler({ db, sesionDe: async () => sesion, entorno: ENTORNO, fetchFn, ahora: () => AHORA });

  it('vincular devuelve la URL de Mercado Pago con el «state» de la cuenta', async () => {
    const { db } = crearDb();
    const r = res();
    await handler(db, crearFetch().fn)(post({ accion: 'vincular' }), r);
    const url = new URL(r.cuerpo.url);
    expect(url.hostname).toBe('auth.mercadopago.com.ar');
    expect(url.searchParams.get('client_id')).toBe('123');
    expect(url.searchParams.get('redirect_uri')).toBe('https://dealit.test/api/cobro-mp');
    expect(verificarEstado(url.searchParams.get('state'), { secreto: ENTORNO.MP_CLIENT_SECRET, ahora: AHORA })).toBe('duenio');
  });

  it('la vuelta del OAuth cambia el código por el token, lo guarda cifrado y vuelve a la app', async () => {
    const { db, datos } = crearDb();
    const { fn, pedidos } = crearFetch({
      '/oauth/token': { access_token: 'APP_USR-acceso', refresh_token: 'TG-refresh', user_id: 99, expires_in: 15552000, live_mode: true },
      '/users/me': { id: 99, nickname: 'PINTURAGOMEZ', email: 'gomez@mail.com' }
    });
    const state = firmarEstado('duenio', { secreto: ENTORNO.MP_CLIENT_SECRET, ahora: AHORA });
    const r = res();
    await handler(db, fn)({ method: 'GET', headers: { host: 'dealit.test' }, query: { code: 'TG-code', state } }, r);
    expect(r.statusCode).toBe(302);
    expect(r.headers.Location).toBe('https://dealit.test/cuenta?mp=vinculado');
    expect(pedidos[0].body).toMatchObject({ grant_type: 'authorization_code', code: 'TG-code', client_secret: ENTORNO.MP_CLIENT_SECRET });
    const guardada = datos.mpCuentas.duenio;
    expect(guardada).toMatchObject({ mpUserId: '99', nombre: 'PINTURAGOMEZ', produccion: true });
    expect(JSON.stringify(guardada)).not.toContain('APP_USR-acceso');
    expect(descifrar(guardada.token, ENTORNO.MP_CLIENT_SECRET)).toBe('APP_USR-acceso');
  });

  it('un «state» inválido o un permiso cancelado no vinculan nada', async () => {
    const { db, datos } = crearDb();
    const r1 = res();
    await handler(db, crearFetch().fn)({ method: 'GET', headers: { host: 'dealit.test' }, query: { code: 'x', state: 'falso.firma' } }, r1);
    expect(r1.headers.Location).toContain('mp=vencido');
    const r2 = res();
    await handler(db, crearFetch().fn)({ method: 'GET', headers: { host: 'dealit.test' }, query: { error: 'access_denied' } }, r2);
    expect(r2.headers.Location).toContain('mp=cancelado');
    expect(datos.mpCuentas).toBeUndefined();
  });

  it('pagar: el servidor calcula el primer pago y crea el pago con el token del freelancer', async () => {
    const { db } = crearDb({
      proposals: { [ID]: aceptada() },
      mpCuentas: { duenio: { token: cifrar('APP_USR-del-freelancer', ENTORNO.MP_CLIENT_SECRET), refresh: '', vence: AHORA + 100 * 86400000 } }
    });
    const { fn, pedidos } = crearFetch({ '/checkout/preferences': { init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=1' } });
    const r = res();
    await handler(db, fn, null)(post({ accion: 'pagar', id: ID, monto: 1 }), r);
    expect(r.estado).toBe(200);
    expect(r.cuerpo).toMatchObject({ url: expect.stringContaining('mercadopago'), monto: 50000 });
    const pref = pedidos.find(p => p.ruta === '/checkout/preferences');
    expect(pref.auth).toBe('Bearer APP_USR-del-freelancer');
    expect(pref.body.items[0]).toMatchObject({ unit_price: 50000, currency_id: 'ARS', quantity: 1 });
    expect(pref.body.external_reference).toBe(ID);
    expect(pref.body.back_urls.success).toBe(`https://dealit.test/p/${ID}?pago=aprobado`);
  });

  it('pagar: sin aceptar, en dólares, sin Mercado Pago o sin cuenta vinculada, no', async () => {
    const casos = [
      [aceptada({ aceptacion: undefined }), 'sin-aceptar'],
      [aceptada({ aceptacion: { nombre: 'L', inicial: 100, moneda: 'USD' } }), 'moneda-no-soportada'],
      [aceptada({ payload: { ...aceptada().payload, cobro: { metodo: 'transferencia' } } }), 'sin-mercadopago'],
      [aceptada(), 'mp-no-vinculado']
    ];
    for (const [doc, error] of casos) {
      const { db } = crearDb({ proposals: { [ID]: doc } });
      const r = res();
      await handler(db, crearFetch().fn, null)(post({ accion: 'pagar', id: ID }), r);
      expect(r.cuerpo.error).toBe(error);
    }
  });

  it('estado y desvincular, solo con sesión', async () => {
    const { db, datos } = crearDb({ mpCuentas: { duenio: { nombre: 'PINTURAGOMEZ', email: 'g@m.com', produccion: true } } });
    const r = res();
    await handler(db, crearFetch().fn)(post({ accion: 'estado' }), r);
    expect(r.cuerpo).toMatchObject({ configurado: true, vinculado: true, nombre: 'PINTURAGOMEZ' });
    await handler(db, crearFetch().fn)(post({ accion: 'desvincular' }), res());
    expect(datos.mpCuentas.duenio).toBeUndefined();
    const sin = res();
    await handler(db, crearFetch().fn, null)(post({ accion: 'estado' }), sin);
    expect(sin.estado).toBe(401);
  });

  it('sin las credenciales de la aplicación, no se ofrece', async () => {
    const { db } = crearDb();
    const r = res();
    await crearHandler({ db, sesionDe: async () => ({ uid: 'duenio' }), entorno: {}, fetchFn: crearFetch().fn })(post({ accion: 'estado' }), r);
    expect(r.cuerpo).toEqual({ configurado: false, vinculado: false });
  });
});

describe('token y primer pago', () => {
  it('renueva el token cuando está por vencer', async () => {
    const cred = { id: '123', secreto: 's' };
    const { db, datos } = crearDb({ mpCuentas: { duenio: { token: cifrar('viejo', 's'), refresh: cifrar('TG-r', 's'), vence: AHORA + 86400000, nombre: 'X' } } });
    const { fn, pedidos } = crearFetch({ '/oauth/token': { access_token: 'nuevo', refresh_token: 'TG-r2', expires_in: 15552000 } });
    expect(await tokenVigente({ db, uid: 'duenio', cred, fetchFn: fn, ahora: AHORA })).toBe('nuevo');
    expect(pedidos[0].body).toMatchObject({ grant_type: 'refresh_token', refresh_token: 'TG-r' });
    expect(descifrar(datos.mpCuentas.duenio.token, 's')).toBe('nuevo');
  });

  it('el primer pago sale de la forma de pago, o es el total', () => {
    expect(primerPago({ inversion: { pagos: [{ concepto: 'Seña', porcentaje: 30 }] } }, 1000)).toEqual({ concepto: 'Seña', porcentaje: 30, monto: 300 });
    expect(primerPago({ inversion: { pagos: [] } }, 1000)).toMatchObject({ porcentaje: 100, monto: 1000 });
    expect(primerPago({ inversion: { pagos: [] } }, 0)).toBeNull();
  });
});
