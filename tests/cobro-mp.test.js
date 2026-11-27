import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cifrar, descifrar, firmarEstado, tokenVigente, verificarEstado } from '../api/_lib/mp-connect.js';
import { crearHandler } from '../api/cobro-mp.js';
import { crearHandler as crearWebhook, firmaCobroValida } from '../api/mercadopago.js';
import { contenidoAviso, contenidoPush } from '../api/_lib/avisos.js';
import { primerPago, vacio } from '../src/modelo.js';
import { debeActualizar, estadoDesdeMp, pagoPublico, puedePagar } from '../src/pagos.js';
import { estadoPagoHTML } from '../src/lib/render.js';

const ID = 'AAAAAAAAAAAAAAAAAAA1';
const ENTORNO = { MP_CLIENT_ID: '123', MP_CLIENT_SECRET: 'secreto-de-prueba', APP_URL: 'https://dealit.test' };
const AHORA = Date.parse('2026-11-12T12:00:00Z');

// Firestore mínimo: colecciones con doc().get/set/update/delete y transacciones.
const crearDb = (inicial = {}) => {
  const datos = structuredClone(inicial);
  const copia = v => JSON.parse(JSON.stringify(v));
  const db = {
    collection: c => ({
      doc: id => ({
        get: async () => ({ exists: !!datos[c]?.[id], data: () => (datos[c]?.[id] ? copia(datos[c][id]) : undefined) }),
        set: async v => { (datos[c] ||= {})[id] = copia(v); },
        update: async v => { datos[c][id] = { ...datos[c][id], ...copia(v) }; },
        delete: async () => { delete datos[c]?.[id]; }
      })
    }),
    runTransaction: async fn => fn({ get: ref => ref.get(), set: (ref, v) => ref.set(v), update: (ref, v) => ref.update(v) })
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
    // { falla } simula un error de Mercado Pago; sin respuesta, «no existe».
    if (valor?.falla) return { ok: false, status: valor.falla, json: async () => ({ message: 'error' }) };
    return { ok: valor !== undefined, status: valor === undefined ? 404 : 200, json: async () => valor ?? { message: 'no' } };
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
    // La vuelta no dice cómo salió: el estado lo confirma el servidor.
    expect(pref.body.back_urls).toEqual({ success: `https://dealit.test/p/${ID}?pago=mp`, pending: `https://dealit.test/p/${ID}?pago=mp`, failure: `https://dealit.test/p/${ID}?pago=mp` });
    expect(pref.body.notification_url).toBe(`https://dealit.test/api/mercadopago?cobro=${ID}&source_news=webhooks`);
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

// ---------- Confirmación de los pagos (webhook de Mercado Pago y vuelta al link) ----------
const SECRETO_WH = 'secreto-webhooks';
const ENTORNO_WH = { ...ENTORNO, MP_COBROS_WEBHOOK_SECRET: SECRETO_WH };
const PAGO_ID = '123';

const pagoMp = (cambios = {}) => ({
  id: Number(PAGO_ID),
  status: 'approved',
  status_detail: 'accredited',
  external_reference: ID,
  collector_id: 99,
  transaction_amount: 50000,
  transaction_amount_refunded: 0,
  currency_id: 'ARS',
  date_created: '2026-11-12T12:00:00.000-03:00',
  date_approved: '2026-11-12T12:01:00.000-03:00',
  date_last_updated: '2026-11-12T12:01:00.000-03:00',
  order: { id: 9, type: 'mercadopago' },
  live_mode: false,
  payer: { email: 'laura@mail.com', identification: { number: '30111222' } },
  card: { last_four_digits: '4242' },
  ...cambios
});

const inicialCobro = (extra = {}) => ({
  proposals: { [ID]: aceptada() },
  mpCuentas: { duenio: { mpUserId: '99', token: cifrar('APP_USR-del-freelancer', ENTORNO.MP_CLIENT_SECRET), refresh: '', vence: AHORA + 100 * 86400000 } },
  ...extra
});

// Aviso como lo manda Mercado Pago: data.id y type en la URL, firma en x-signature.
const firmar = (id, { ts = '1731420000', rid = 'req-1', secreto = SECRETO_WH } = {}) =>
  `ts=${ts},v1=${createHmac('sha256', secreto).update(`id:${id};request-id:${rid};ts:${ts};`).digest('hex')}`;
const aviso = ({ id = PAGO_ID, tipo = 'payment', cobro = ID, firma = firmar(id) } = {}) => ({
  method: 'POST',
  query: { cobro, 'data.id': id, type: tipo, source_news: 'webhooks' },
  headers: { host: 'dealit.test', 'content-type': 'application/json', 'x-signature': firma, 'x-request-id': 'req-1' },
  body: { action: 'payment.updated', type: tipo, data: { id }, user_id: 99 }
});

// Mercado Pago simulado: los pagos (se pueden cambiar entre avisos), la búsqueda y la orden.
const mpConPagos = (pagos = { [PAGO_ID]: pagoMp() }) => {
  const fijas = {
    '/merchant_orders/9': { id: 9, preference_id: '99-pref-abc' },
    '/v1/payments/search': () => ({ results: Object.values(pagos).filter(Boolean) })
  };
  const respuestas = new Proxy(fijas, {
    get: (obj, ruta) => {
      const m = /^\/v1\/payments\/(\d+)$/.exec(ruta);
      return m ? pagos[m[1]] : obj[ruta];
    }
  });
  return { ...crearFetch(respuestas), pagos };
};

const webhook = ({ db, fetchFn, avisar = async () => {} }) => crearWebhook({
  db,
  mp: {},
  verificarFirma: () => false,
  verificarFirmaCobro: datos => firmaCobroValida(datos, ENTORNO_WH),
  avisar,
  entorno: ENTORNO_WH,
  fetchFn,
  ahora: () => new Date(AHORA)
});

const espia = () => {
  const llamadas = [];
  const fn = async datos => { llamadas.push(datos); return 'enviado'; };
  return { fn, llamadas };
};

describe('webhook de pagos (api/mercadopago?cobro=)', () => {
  it('firma válida y pago aprobado: lo pide a Mercado Pago con el token del freelancer y lo registra', async () => {
    const { db, datos } = crearDb(inicialCobro());
    const { fn, pedidos } = mpConPagos();
    const r = res();
    await webhook({ db, fetchFn: fn })(aviso(), r);
    expect(r.estado).toBe(200);
    expect(r.cuerpo).toMatchObject({ ok: true, estado: 'acreditado' });
    const consulta = pedidos.find(p => p.ruta === `/v1/payments/${PAGO_ID}`);
    expect(consulta.auth).toBe('Bearer APP_USR-del-freelancer');
    const pago = datos.pagos[`mp_${PAGO_ID}`];
    expect(pago).toMatchObject({
      mpPagoId: PAGO_ID, propuestaId: ID, userId: 'duenio', mpCuentaId: '99', monto: 50000, moneda: 'ARS',
      concepto: 'Seña', numero: 1, estado: 'acreditado', estadoMp: 'approved', detalleMp: 'accredited',
      preferencia: '99-pref-abc', aprobado: '2026-11-12T15:01:00.000Z'
    });
    // Nada de la tarjeta ni de quien pagó.
    expect(JSON.stringify(pago)).not.toMatch(/4242|30111222|laura@mail/);
    expect(datos.proposals[ID].pago).toMatchObject({ id: `mp_${PAGO_ID}`, estado: 'acreditado', monto: 50000, concepto: 'Seña' });
  });

  it('firma inválida (o de otro secreto): 401 y no consulta nada', async () => {
    for (const firma of [firmar(PAGO_ID, { secreto: 'otro' }), 'ts=1,v1=abc', '']) {
      const { db, datos } = crearDb(inicialCobro());
      const { fn, pedidos } = mpConPagos();
      const r = res();
      await webhook({ db, fetchFn: fn })(aviso({ firma }), r);
      expect(r.estado).toBe(401);
      expect(pedidos).toHaveLength(0);
      expect(datos.pagos).toBeUndefined();
    }
    // La firma es del id del aviso: no sirve para otro pago.
    const { db, datos } = crearDb(inicialCobro());
    const r = res();
    await webhook({ db, fetchFn: mpConPagos().fn })(aviso({ id: '456', firma: firmar(PAGO_ID) }), r);
    expect(r.estado).toBe(401);
    expect(datos.pagos).toBeUndefined();
  });

  it('un aviso que no es de un pago se responde 200 sin hacer nada', async () => {
    const { db, datos } = crearDb(inicialCobro());
    const { fn, pedidos } = mpConPagos();
    const r = res();
    await webhook({ db, fetchFn: fn })(aviso({ tipo: 'topic_merchant_order_wh' }), r);
    expect(r.estado).toBe(200);
    expect(r.cuerpo.ignorado).toBe('otro-aviso');
    expect(pedidos).toHaveLength(0);
    expect(datos.pagos).toBeUndefined();
  });

  it('pago o propuesta inexistentes: 200 (no reintentar) y sin registro', async () => {
    const casos = [
      [aviso({ id: '777' }), 'sin-pago'],
      [aviso({ cobro: 'BBBBBBBBBBBBBBBBBBB2' }), 'sin-propuesta'],
      [aviso({ cobro: '../x' }), 'propuesta-invalida']
    ];
    for (const [req, motivo] of casos) {
      const { db, datos } = crearDb(inicialCobro());
      const r = res();
      await webhook({ db, fetchFn: mpConPagos().fn })(req, r);
      expect(r.estado).toBe(200);
      expect(r.cuerpo.ignorado).toBe(motivo);
      expect(datos.pagos).toBeUndefined();
    }
  });

  it('descarta el pago de otra cuenta, otra propuesta, otro monto u otra moneda', async () => {
    const casos = [
      [{ collector_id: 1234 }, 'otra-cuenta'],
      [{ external_reference: 'BBBBBBBBBBBBBBBBBBB2' }, 'otra-propuesta'],
      [{ transaction_amount: 49999 }, 'otro-monto'],
      [{ transaction_amount: 100000 }, 'otro-monto'],
      [{ currency_id: 'USD' }, 'otra-moneda']
    ];
    for (const [cambio, motivo] of casos) {
      const { db, datos } = crearDb(inicialCobro());
      const r = res();
      const { fn: avisar, llamadas } = espia();
      await webhook({ db, fetchFn: mpConPagos({ [PAGO_ID]: pagoMp(cambio) }).fn, avisar })(aviso(), r);
      expect(r.estado).toBe(200);
      expect(r.cuerpo.ignorado).toBe(motivo);
      expect(datos.pagos).toBeUndefined();
      expect(datos.proposals[ID].pago).toBeUndefined();
      expect(llamadas).toHaveLength(0);
    }
  });

  it('una cuenta vinculada sin id de Mercado Pago no da por bueno ningún pago', async () => {
    const inicial = inicialCobro();
    inicial.mpCuentas.duenio.mpUserId = '';
    const { db, datos } = crearDb(inicial);
    const r = res();
    await webhook({ db, fetchFn: mpConPagos().fn })(aviso(), r);
    expect(r.cuerpo.ignorado).toBe('otra-cuenta');
    expect(datos.pagos).toBeUndefined();
  });

  it('pendiente, en proceso, rechazado y cancelado quedan con su estado, sin aviso', async () => {
    const casos = [['pending', 'pendiente'], ['in_process', 'en-proceso'], ['rejected', 'rechazado'], ['cancelled', 'cancelado']];
    for (const [status, estado] of casos) {
      const { db, datos } = crearDb(inicialCobro());
      const { fn: avisar, llamadas } = espia();
      await webhook({ db, fetchFn: mpConPagos({ [PAGO_ID]: pagoMp({ status, status_detail: 'x', date_approved: null }) }).fn, avisar })(aviso(), res());
      expect(datos.pagos[`mp_${PAGO_ID}`]).toMatchObject({ estado, aprobado: null });
      expect(datos.proposals[ID].pago.estado).toBe(estado);
      expect(llamadas).toHaveLength(0);
    }
  });

  it('aviso duplicado: un solo registro y un solo aviso al dueño', async () => {
    const { db, datos } = crearDb(inicialCobro());
    const { fn: avisar, llamadas } = espia();
    const h = webhook({ db, fetchFn: mpConPagos().fn, avisar });
    await h(aviso(), res());
    await h(aviso(), res());
    await h(aviso(), res());
    expect(Object.keys(datos.pagos)).toEqual([`mp_${PAGO_ID}`]);
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0]).toMatchObject({ tipo: 'pago-acreditado', id: ID, pago: { monto: 50000, concepto: 'Seña' } });
    expect(datos.pagos[`mp_${PAGO_ID}`].avisos).toEqual({ acreditado: true, revertido: false });
  });

  it('fuera de orden: un estado viejo no pisa uno nuevo', async () => {
    const { db, datos } = crearDb(inicialCobro());
    const mp = mpConPagos();
    const h = webhook({ db, fetchFn: mp.fn });
    await h(aviso(), res());
    // Llega tarde una lectura de cuando todavía estaba en proceso.
    mp.pagos[PAGO_ID] = pagoMp({ status: 'in_process', date_approved: null, date_last_updated: '2026-11-12T12:00:30.000-03:00' });
    const r = res();
    await h(aviso(), r);
    expect(r.cuerpo.estado).toBe('acreditado');
    expect(datos.pagos[`mp_${PAGO_ID}`].estado).toBe('acreditado');
    expect(datos.proposals[ID].pago.estado).toBe('acreditado');
  });

  it('reembolso o contracargo después de acreditado: cambia el estado y avisa una vez', async () => {
    for (const [status, estado] of [['refunded', 'reembolsado'], ['charged_back', 'contracargo']]) {
      const { db, datos } = crearDb(inicialCobro());
      const mp = mpConPagos();
      const { fn: avisar, llamadas } = espia();
      const h = webhook({ db, fetchFn: mp.fn, avisar });
      await h(aviso(), res());
      mp.pagos[PAGO_ID] = pagoMp({ status, status_detail: status, transaction_amount_refunded: 50000, date_last_updated: '2026-11-20T10:00:00.000-03:00' });
      await h(aviso(), res());
      await h(aviso(), res());
      expect(datos.pagos[`mp_${PAGO_ID}`]).toMatchObject({ estado, reembolsado: 50000 });
      expect(datos.proposals[ID].pago.estado).toBe(estado);
      expect(llamadas.map(l => l.tipo)).toEqual(['pago-acreditado', 'pago-revertido']);
    }
  });

  it('varios intentos en una propuesta: cada uno con su registro y el resumen muestra el acreditado', async () => {
    const { db, datos } = crearDb(inicialCobro());
    const mp = mpConPagos({
      111: pagoMp({ id: 111, status: 'rejected', status_detail: 'cc_rejected_insufficient_amount', date_approved: null, date_last_updated: '2026-11-12T11:00:00.000-03:00' }),
      222: pagoMp({ id: 222 })
    });
    const h = webhook({ db, fetchFn: mp.fn });
    await h(aviso({ id: '111' }), res());
    expect(datos.proposals[ID].pago).toMatchObject({ id: 'mp_111', estado: 'rechazado' });
    await h(aviso({ id: '222' }), res());
    // El aviso del intento rechazado llega de nuevo, tarde: no tapa el acreditado.
    await h(aviso({ id: '111' }), res());
    expect(Object.keys(datos.pagos).sort()).toEqual(['mp_111', 'mp_222']);
    expect(datos.pagos.mp_111.estado).toBe('rechazado');
    expect(datos.proposals[ID].pago).toMatchObject({ id: 'mp_222', estado: 'acreditado' });
  });

  it('si Mercado Pago falla, responde con error para que reintente', async () => {
    const { db, datos } = crearDb(inicialCobro());
    const r = res();
    await webhook({ db, fetchFn: mpConPagos({ [PAGO_ID]: { falla: 500 } }).fn })(aviso(), r);
    expect(r.estado).toBe(500);
    expect(datos.pagos).toBeUndefined();
  });

  it('sin ?cobro sigue siendo el webhook de las suscripciones', async () => {
    const { db } = crearDb(inicialCobro());
    const { fn, pedidos } = mpConPagos();
    const r = res();
    const req = aviso();
    delete req.query.cobro;
    await webhook({ db, fetchFn: fn })(req, r);
    // La firma de las suscripciones se verifica aparte (acá, siempre inválida).
    expect(r.estado).toBe(401);
    expect(pedidos).toHaveLength(0);
  });
});

describe('estado del pago al volver al link (accion estado-pago)', () => {
  const handlerEstado = (db, fetchFn, { ahora = AHORA, avisar } = {}) =>
    crearHandler({ db, sesionDe: async () => null, entorno: ENTORNO, fetchFn, ahora: () => ahora, avisar });

  it('busca el pago en Mercado Pago, lo registra y devuelve solo lo que ve el cliente', async () => {
    const { db, datos } = crearDb(inicialCobro());
    const { fn, pedidos } = mpConPagos();
    const r = res();
    await handlerEstado(db, fn)(post({ accion: 'estado-pago', id: ID }), r);
    expect(r.estado).toBe(200);
    expect(r.cuerpo.pago).toEqual({ estado: 'acreditado', monto: 50000, moneda: 'ARS', concepto: 'Seña', aprobado: '2026-11-12T15:01:00.000Z' });
    expect(pedidos.find(p => p.ruta === '/v1/payments/search').auth).toBe('Bearer APP_USR-del-freelancer');
    expect(datos.pagos[`mp_${PAGO_ID}`].estado).toBe('acreditado');
  });

  it('cambiar la URL o el pedido no aprueba nada: el estado lo da Mercado Pago', async () => {
    const { db, datos } = crearDb(inicialCobro());
    const { fn } = mpConPagos({ [PAGO_ID]: pagoMp({ status: 'pending', date_approved: null }) });
    const r = res();
    await handlerEstado(db, fn)(post({ accion: 'estado-pago', id: ID, estado: 'acreditado', pago: { estado: 'acreditado' }, monto: 1 }), r);
    expect(r.cuerpo.pago.estado).toBe('pendiente');
    expect(datos.proposals[ID].pago.estado).toBe('pendiente');
  });

  it('sin pagos en Mercado Pago no hay estado; y no consulta de nuevo antes de la pausa', async () => {
    const { db } = crearDb(inicialCobro());
    const { fn, pedidos } = mpConPagos({});
    const r = res();
    await handlerEstado(db, fn)(post({ accion: 'estado-pago', id: ID }), r);
    expect(r.cuerpo.pago).toBeNull();
    await handlerEstado(db, fn, { ahora: AHORA + 1000 })(post({ accion: 'estado-pago', id: ID }), res());
    expect(pedidos.filter(p => p.ruta === '/v1/payments/search')).toHaveLength(1);
    await handlerEstado(db, fn, { ahora: AHORA + 5000 })(post({ accion: 'estado-pago', id: ID }), res());
    expect(pedidos.filter(p => p.ruta === '/v1/payments/search')).toHaveLength(2);
  });

  it('el aviso al dueño sale una vez aunque confirmen el webhook y la vuelta al link', async () => {
    const { db } = crearDb(inicialCobro());
    const { fn } = mpConPagos();
    const { fn: avisar, llamadas } = espia();
    await webhook({ db, fetchFn: fn, avisar })(aviso(), res());
    // Ya acreditado: la vuelta al link ni siquiera vuelve a consultar.
    const r = res();
    await handlerEstado(db, fn, { avisar, ahora: AHORA + 10000 })(post({ accion: 'estado-pago', id: ID }), r);
    expect(r.cuerpo.pago.estado).toBe('acreditado');
    expect(llamadas).toHaveLength(1);
  });

  it('con el pago acreditado no se crea otro', async () => {
    const { db } = crearDb(inicialCobro({ proposals: { [ID]: aceptada({ pago: { id: 'mp_1', estado: 'acreditado', monto: 50000 } }) } }));
    const r = res();
    await handlerEstado(db, crearFetch().fn)(post({ accion: 'pagar', id: ID }), r);
    expect(r.estado).toBe(409);
    expect(r.cuerpo.error).toBe('ya-pagado');
  });
});

describe('reglas de los pagos (src/pagos.js)', () => {
  it('traduce los estados de Mercado Pago', () => {
    expect(['pending', 'in_process', 'authorized', 'approved', 'rejected', 'cancelled', 'in_mediation', 'refunded', 'charged_back', 'raro'].map(estadoDesdeMp))
      .toEqual(['pendiente', 'en-proceso', 'en-proceso', 'acreditado', 'rechazado', 'cancelado', 'en-mediacion', 'reembolsado', 'contracargo', 'pendiente']);
  });

  it('ordena por fecha de Mercado Pago y, con la misma fecha, solo avanza', () => {
    const r = (estado, actualizadoMp) => ({ estado, actualizadoMp });
    expect(debeActualizar(null, r('pendiente'))).toBe(true);
    expect(debeActualizar(r('acreditado', '2026-11-12T10:00:00Z'), r('pendiente', '2026-11-12T09:00:00Z'))).toBe(false);
    expect(debeActualizar(r('acreditado', '2026-11-12T10:00:00Z'), r('reembolsado', '2026-11-13T10:00:00Z'))).toBe(true);
    expect(debeActualizar(r('acreditado', '2026-11-12T10:00:00Z'), r('pendiente', '2026-11-12T10:00:00Z'))).toBe(false);
    // Un reclamo resuelto a favor vuelve a acreditado con fecha nueva.
    expect(debeActualizar(r('en-mediacion', '2026-11-12T10:00:00Z'), r('acreditado', '2026-11-14T10:00:00Z'))).toBe(true);
  });

  it('el link solo ve el estado, el monto y el concepto', () => {
    expect(pagoPublico({ id: 'mp_1', estado: 'acreditado', monto: 10, moneda: 'ARS', concepto: 'Seña', aprobado: 'x', actualizado: 'y' }))
      .toEqual({ estado: 'acreditado', monto: 10, moneda: 'ARS', concepto: 'Seña', aprobado: 'x' });
    expect(pagoPublico({ estado: 'inventado' })).toBeNull();
    expect(puedePagar(null)).toBe(true);
    expect(puedePagar({ estado: 'rechazado' })).toBe(true);
    expect(puedePagar({ estado: 'acreditado' })).toBe(false);
    expect(puedePagar({ estado: 'en-proceso' })).toBe(false);
  });

  it('el link muestra «verificando» hasta que el servidor confirma, y nunca acreditado por su cuenta', () => {
    expect(estadoPagoHTML(null, { verificando: true })).toContain('Estamos verificando tu pago');
    expect(estadoPagoHTML(null)).toBe('');
    expect(estadoPagoHTML(null, { sinConfirmar: true })).toContain('Todavía no recibimos la confirmación');
    const ok = estadoPagoHTML({ estado: 'acreditado', monto: 50000, moneda: 'ARS', concepto: 'Seña', aprobado: '2026-11-12T15:01:00.000Z' });
    expect(ok).toContain('Pago acreditado');
    expect(ok).toContain('Seña');
    expect(estadoPagoHTML({ estado: 'rechazado', monto: 1, moneda: 'ARS' })).toContain('no se completó');
  });

  it('aviso al dueño con el cliente, la propuesta, el importe y el link', () => {
    const propuesta = aceptada();
    const email = contenidoAviso({ tipo: 'pago-acreditado', id: ID, propuesta, pago: { monto: 50000, moneda: 'ARS', concepto: 'Seña', estado: 'acreditado' }, urlApp: 'https://dealit.test' });
    expect(email.asunto).toContain('Laura');
    expect(email.asunto).toContain('Pintura interior');
    expect(email.texto).toMatch(/Seña: \$\s?50\.000/);
    expect(email.texto).toContain(`https://dealit.test/propuesta/${ID}`);
    const push = contenidoPush({ tipo: 'pago-revertido', id: ID, propuesta, pago: { monto: 50000, moneda: 'ARS', concepto: 'Seña', estado: 'contracargo' }, urlApp: 'https://dealit.test' });
    expect(push.titulo).toContain('contracargo');
  });
});

describe('el navegador no puede tocar los pagos (firestore.rules)', () => {
  const reglas = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

  it('pagos/{id}: el dueño lee los suyos y nadie escribe', () => {
    const bloque = reglas.slice(reglas.indexOf('match /pagos/{pagoId}'), reglas.indexOf('match /{document=**}'));
    expect(bloque).toContain('allow get, list: if esDueno(resource.data.userId);');
    expect(bloque).toContain('allow write: if false;');
    expect(bloque).not.toMatch(/allow (create|update|delete)/);
  });

  it('el resumen del pago en la propuesta es un campo del servidor', () => {
    const campos = /function camposDelServidor\(\) \{ return \[([^\]]+)\]/.exec(reglas)[1];
    expect(campos).toContain("'pago'");
    expect(campos).toContain("'pagoConsultado'");
  });
});
