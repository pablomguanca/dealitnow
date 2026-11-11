import { describe, expect, it } from 'vitest';
import { MAX_DISPOSITIVOS, clavePublicaPush, crearEnviadorPush, idDispositivo, idDispositivoFcm, mensajeFcm, suscripcionValida, tokenFcmValido } from '../api/_lib/push.js';
import { contenidoPush, crearAvisador } from '../api/_lib/avisos.js';
import { crearHandler } from '../api/push.js';
import { claveEnBytes } from '../src/controlador/push.js';
import { vacio } from '../src/modelo.js';

const ID = 'AAAAAAAAAAAAAAAAAAA1';
const URL_APP = 'https://dealit.test';
const ENTORNO = { VAPID_PUBLIC_KEY: 'publica', VAPID_PRIVATE_KEY: 'privada', APP_URL: URL_APP };

const suscripcion = (n = 1) => ({
  endpoint: `https://fcm.googleapis.com/fcm/send/disp-${n}`,
  keys: { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' }
});

const propuesta = () => ({
  userId: 'duenio',
  title: 'Web',
  payload: { ...vacio(), propuesta: { titulo: 'Sitio nuevo', numero: '', fecha: '2026-10-01', validez: 30 }, cliente: { ...vacio().cliente, nombre: 'Laura' } }
});

// Firestore en memoria con colecciones anidadas (push/{uid}/dispositivos/{id}).
const crearDb = (inicial = {}) => {
  const datos = { ...inicial };
  const ref = ruta => ({
    id: ruta.split('/').at(-1),
    get: async () => ({ exists: ruta in datos, data: () => datos[ruta] }),
    set: async v => { datos[ruta] = v; },
    delete: async () => { delete datos[ruta]; },
    collection: nombre => coleccion(`${ruta}/${nombre}`)
  });
  const coleccion = ruta => ({
    doc: id => ref(`${ruta}/${id}`),
    get: async () => {
      const docs = Object.keys(datos)
        .filter(k => k.startsWith(`${ruta}/`) && !k.slice(ruta.length + 1).includes('/'))
        .map(k => ({ id: k.split('/').at(-1), ref: ref(k), get: c => datos[k]?.[c], data: () => datos[k] }));
      return { empty: !docs.length, docs };
    }
  });
  return { db: () => ({ collection: coleccion }), datos };
};
const dispositivos = datos => Object.keys(datos).filter(k => k.startsWith('push/duenio/dispositivos/'));

const res = () => {
  const r = { estado: null, cuerpo: undefined };
  r.setHeader = () => {};
  r.status = e => { r.estado = e; return r; };
  r.json = c => { r.cuerpo = c; return r; };
  r.end = () => r;
  return r;
};
const post = body => ({ method: 'POST', headers: { 'content-type': 'application/json', host: 'dealit.test' }, body });
const llamar = async (h, body) => { const r = res(); await h(post(body), r); return r; };

describe('suscripciones', () => {
  it('acepta la de un servicio de push con sus claves', () => {
    expect(suscripcionValida(suscripcion())).toEqual(suscripcion());
    expect(suscripcionValida({ ...suscripcion(), endpoint: 'https://web.push.apple.com/QGuQyavXutnMH' })).not.toBeNull();
  });

  it('rechaza otras direcciones y claves raras', () => {
    expect(suscripcionValida({ ...suscripcion(), endpoint: 'https://evil.test/hook' })).toBeNull();
    expect(suscripcionValida({ ...suscripcion(), endpoint: 'http://fcm.googleapis.com/fcm/send/x' })).toBeNull();
    expect(suscripcionValida({ ...suscripcion(), endpoint: 'https://fcm.googleapis.com.evil.test/x' })).toBeNull();
    expect(suscripcionValida({ ...suscripcion(), keys: { p256dh: 'no válida', auth: 'x' } })).toBeNull();
    expect(suscripcionValida(null)).toBeNull();
  });

  it('sin las dos claves VAPID no hay push', () => {
    expect(clavePublicaPush({ VAPID_PUBLIC_KEY: 'p' })).toBe('');
    expect(clavePublicaPush(ENTORNO)).toBe('publica');
  });

  it('la clave base64url se pasa a bytes', () => {
    expect([...claveEnBytes('AQID')]).toEqual([1, 2, 3]);
    expect([...claveEnBytes('-_8')]).toEqual([251, 255]);
  });
});

describe('envío de avisos push', () => {
  it('manda a cada dispositivo y borra los vencidos', async () => {
    const { db, datos } = crearDb({
      [`push/duenio/dispositivos/${idDispositivo('a')}`]: { suscripcion: suscripcion(1) },
      [`push/duenio/dispositivos/${idDispositivo('b')}`]: { suscripcion: suscripcion(2) }
    });
    const pedidos = [];
    const webpush = {
      sendNotification: async (s, carga, opciones) => {
        pedidos.push({ s, carga: JSON.parse(carga), opciones });
        if (s.endpoint.endsWith('disp-2')) throw Object.assign(new Error('gone'), { statusCode: 410 });
      }
    };
    const enviar = crearEnviadorPush({ entorno: ENTORNO, cargarWebPush: async () => webpush });
    const enviados = await enviar({ db, uid: 'duenio', mensaje: { titulo: 'Hola', cuerpo: 'x', url: '/', tag: 't' } });
    expect(enviados).toBe(1);
    expect(pedidos).toHaveLength(2);
    expect(pedidos[0].carga.titulo).toBe('Hola');
    expect(pedidos[0].opciones.vapidDetails).toEqual({ subject: URL_APP, publicKey: 'publica', privateKey: 'privada' });
    expect(dispositivos(datos)).toEqual([`push/duenio/dispositivos/${idDispositivo('a')}`]);
  });

  it('sin claves VAPID no manda a los navegadores', async () => {
    const { db } = crearDb({ [`push/duenio/dispositivos/${idDispositivo('a')}`]: { suscripcion: suscripcion(1) } });
    const enviar = crearEnviadorPush({ entorno: {}, cargarWebPush: async () => { throw new Error('no debería cargarse'); } });
    expect(await enviar({ db, uid: 'duenio', mensaje: {} })).toBe(0);
  });

  it('a la app de Android le manda por FCM (sin claves VAPID) y borra los tokens vencidos', async () => {
    const tokenBueno = 'token-bueno:' + 'a'.repeat(40);
    const tokenViejo = 'token-viejo:' + 'b'.repeat(40);
    const { db, datos } = crearDb({
      [`push/duenio/dispositivos/${idDispositivoFcm(tokenBueno)}`]: { fcm: tokenBueno },
      [`push/duenio/dispositivos/${idDispositivoFcm(tokenViejo)}`]: { fcm: tokenViejo }
    });
    const enviados = [];
    const fcm = {
      send: async m => {
        if (m.token === tokenViejo) throw Object.assign(new Error('no registrado'), { code: 'messaging/registration-token-not-registered' });
        enviados.push(m);
      }
    };
    const enviar = crearEnviadorPush({ entorno: {}, cargarMensajeria: async () => fcm, cargarWebPush: async () => { throw new Error('no debería cargarse'); } });
    const n = await enviar({ db, uid: 'duenio', mensaje: { titulo: 'Hola', cuerpo: 'x', url: 'https://dealit.test/propuesta/1', tag: 'vista-1' } });
    expect(n).toBe(1);
    expect(enviados[0]).toMatchObject({ token: tokenBueno, notification: { title: 'Hola', body: 'x' }, data: { url: 'https://dealit.test/propuesta/1' } });
    expect(enviados[0].android.notification).toMatchObject({ channelId: 'avisos', tag: 'vista-1' });
    expect(dispositivos(datos)).toEqual([`push/duenio/dispositivos/${idDispositivoFcm(tokenBueno)}`]);
  });

  it('el mensaje de FCM lleva siempre texto en data (FCM no acepta otros tipos)', () => {
    const m = mensajeFcm('t', { titulo: 'a', cuerpo: 'b' });
    expect(m.data).toEqual({ url: '', tag: '' });
    expect(m.android.notification.tag).toBeUndefined();
  });

  it('contenido: corto, con link a la propuesta y una etiqueta por aviso', () => {
    const vista = contenidoPush({ tipo: 'vista', id: ID, propuesta: propuesta(), urlApp: URL_APP });
    expect(vista).toMatchObject({ titulo: 'Laura abrió «Sitio nuevo»', url: `${URL_APP}/propuesta/${ID}`, tag: `vista-${ID}` });
    const aceptada = contenidoPush({ tipo: 'aceptada', id: ID, propuesta: propuesta(), urlApp: URL_APP, aceptacion: { nombre: 'Laura', inicial: 500, mensual: 50, moneda: 'USD' } });
    expect(aceptada.titulo).toBe('🎉 Laura aceptó «Sitio nuevo»');
    expect(aceptada.cuerpo).toContain('por mes');
  });
});

describe('el avisador también manda push', () => {
  const dbAvisos = (usuario, plan) => () => ({
    collection: nombre => ({
      doc: id => ({ get: async () => {
        const d = nombre === 'users' ? usuario : nombre === 'planes' ? plan : null;
        return { exists: !!d && id === 'duenio', data: () => d };
      } })
    })
  });
  const aviso = { tipo: 'vista', id: ID, propuesta: propuesta(), urlApp: URL_APP };
  const PRO = { tipo: 'pro', estado: 'activa', vence: '2099-01-01T00:00:00Z' };

  it('a Pro le llegan email y push', async () => {
    const push = [];
    const avisar = crearAvisador({ db: dbAvisos({ email: 'a@b.com' }, PRO), planesActivos: () => true, enviar: async () => true, enviarPush: async a => { push.push(a); return 1; } });
    expect(await avisar(aviso)).toBe('enviado');
    expect(push[0]).toMatchObject({ uid: 'duenio', mensaje: { tag: `vista-${ID}` } });
  });

  it('a Gratis, ninguno', async () => {
    const push = [];
    const avisar = crearAvisador({ db: dbAvisos({ email: 'a@b.com' }, {}), planesActivos: () => true, enviar: async () => true, enviarPush: async a => { push.push(a); return 1; } });
    expect(await avisar(aviso)).toBe('gratis');
    expect(push).toHaveLength(0);
  });

  it('sin email igual manda push, y si push falla el email sale igual', async () => {
    const push = [];
    const sinEmail = crearAvisador({ db: dbAvisos({}, PRO), planesActivos: () => true, enviar: async () => true, enviarPush: async a => { push.push(a); return 1; } });
    expect(await sinEmail(aviso)).toBe('sin-email');
    expect(push).toHaveLength(1);
    const pushCaido = crearAvisador({ db: dbAvisos({ email: 'a@b.com' }, PRO), planesActivos: () => true, enviar: async () => true, enviarPush: async () => { throw new Error('caído'); } });
    expect(await pushCaido(aviso)).toBe('enviado');
  });
});

describe('POST /api/push', () => {
  const handler = (db, { sesion = { uid: 'duenio' }, clave = 'publica', enviar = async () => 0 } = {}) =>
    crearHandler({ db, sesionDe: async () => sesion, clave: () => clave, enviar });

  it('pide sesión', async () => {
    const { db } = crearDb();
    expect((await llamar(handler(db, { sesion: null }), { accion: 'alta', suscripcion: suscripcion() })).estado).toBe(401);
  });

  it('alta guarda el dispositivo una sola vez; baja lo borra', async () => {
    const { db, datos } = crearDb();
    const h = handler(db);
    expect((await llamar(h, { accion: 'alta', suscripcion: suscripcion() })).estado).toBe(204);
    expect((await llamar(h, { accion: 'alta', suscripcion: suscripcion() })).estado).toBe(204);
    expect(dispositivos(datos)).toHaveLength(1);
    expect(datos[dispositivos(datos)[0]].suscripcion).toEqual(suscripcion());
    expect((await llamar(h, { accion: 'baja', endpoint: suscripcion().endpoint })).estado).toBe(204);
    expect(dispositivos(datos)).toHaveLength(0);
  });

  it('rechaza suscripciones inválidas y, sin claves, el alta', async () => {
    const { db } = crearDb();
    expect((await llamar(handler(db), { accion: 'alta', suscripcion: { endpoint: 'https://evil.test/x', keys: {} } })).cuerpo).toEqual({ error: 'suscripcion-invalida' });
    expect((await llamar(handler(db, { clave: '' }), { accion: 'alta', suscripcion: suscripcion() })).estado).toBe(503);
    expect((await llamar(handler(db), { accion: 'otra' })).estado).toBe(400);
  });

  it('alta y baja de la app de Android con su token, aunque no haya claves VAPID', async () => {
    const { db, datos } = crearDb();
    const token = 'abc:' + 'x'.repeat(60);
    const h = handler(db, { clave: '' });
    expect((await llamar(h, { accion: 'alta', token })).estado).toBe(204);
    expect(datos[`push/duenio/dispositivos/${idDispositivoFcm(token)}`]).toMatchObject({ fcm: token, plataforma: 'android' });
    expect((await llamar(h, { accion: 'alta', token: 'corto' })).cuerpo).toEqual({ error: 'token-invalido' });
    expect((await llamar(h, { accion: 'alta', token: 'x'.repeat(30) + ' <script>' })).estado).toBe(400);
    expect((await llamar(h, { accion: 'baja', token })).estado).toBe(204);
    expect(dispositivos(datos)).toHaveLength(0);
    expect(tokenFcmValido(123)).toBeNull();
  });

  it(`guarda hasta ${MAX_DISPOSITIVOS} dispositivos: los más viejos salen`, async () => {
    const inicial = {};
    for (let n = 0; n < MAX_DISPOSITIVOS; n++) {
      inicial[`push/duenio/dispositivos/${idDispositivo(suscripcion(n).endpoint)}`] = { suscripcion: suscripcion(n), creado: { toMillis: () => n } };
    }
    const { db, datos } = crearDb(inicial);
    await llamar(handler(db), { accion: 'alta', suscripcion: suscripcion(99) });
    expect(dispositivos(datos)).toHaveLength(MAX_DISPOSITIVOS);
    expect(datos[`push/duenio/dispositivos/${idDispositivo(suscripcion(0).endpoint)}`]).toBeUndefined();
    expect(datos[`push/duenio/dispositivos/${idDispositivo(suscripcion(99).endpoint)}`]).toBeDefined();
  });

  it('baja de todos al eliminar la cuenta', async () => {
    const { db, datos } = crearDb({ 'push/duenio/dispositivos/a': {}, 'push/duenio/dispositivos/b': {}, 'push/otro/dispositivos/c': {} });
    await llamar(handler(db), { accion: 'baja', todos: true });
    expect(dispositivos(datos)).toHaveLength(0);
    expect(datos['push/otro/dispositivos/c']).toBeDefined();
  });

  it('prueba: manda un aviso a los dispositivos propios', async () => {
    const { db } = crearDb();
    const pedidos = [];
    const r = await llamar(handler(db, { enviar: async a => { pedidos.push(a); return 2; } }), { accion: 'prueba' });
    expect(r.cuerpo).toEqual({ enviados: 2 });
    expect(pedidos[0]).toMatchObject({ uid: 'duenio', mensaje: { tag: 'prueba', url: 'https://dealit.test/cuenta' } });
  });
});
