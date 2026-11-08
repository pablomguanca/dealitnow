import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { LIMITE_ENVIOS_GRATIS, enviosDelMes, esPro, mesDe, planDesdeSuscripcion, puedeEnviar } from '../src/planes.js';
import { crearHandler as crearActivar } from '../api/activar.js';
import { crearHandler as crearSuscripcion } from '../api/suscripcion.js';
import { crearHandler as crearWebhook } from '../api/mercadopago.js';
import { firmaValida } from '../api/_lib/mercadopago.js';
import { crearHandler as crearPlan } from '../api/plan.js';
import { planesActivosPara } from '../api/_lib/planes-activos.js';

const AHORA = new Date('2026-11-15T15:00:00-03:00');
const MES = '2026-11';
const ID = 'AAAAAAAAAAAAAAAAAAA1';

// Firestore mínimo en memoria, por colección, con transacciones y set con merge.
const crearDb = (inicial = {}) => {
  const datos = JSON.parse(JSON.stringify(inicial));
  const unir = (destino, origen) => {
    for (const [k, v] of Object.entries(origen)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && !v.__servidor) destino[k] = unir({ ...(destino[k] || {}) }, v);
      else destino[k] = v;
    }
    return destino;
  };
  const ref = (col, id) => ({ col, id });
  const snap = r => {
    const d = datos[r.col]?.[r.id];
    return { exists: !!d, data: () => d };
  };
  const escribir = (r, cambios, merge) => {
    datos[r.col] ||= {};
    datos[r.col][r.id] = merge || datos[r.col][r.id] ? unir(datos[r.col][r.id] || {}, cambios) : cambios;
  };
  const db = {
    collection: col => ({ doc: id => ({ ...ref(col, id), get: async () => snap(ref(col, id)) }) }),
    runTransaction: async fn => fn({
      get: async r => snap(r),
      update: (r, c) => escribir(r, c, true),
      set: (r, c, o) => escribir(r, c, o?.merge)
    })
  };
  return { db: () => db, datos };
};

const res = () => {
  const r = { estado: null, cuerpo: undefined, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = e => { r.estado = e; return r; };
  r.json = c => { r.cuerpo = c; return r; };
  r.end = () => r;
  return r;
};
const post = (body, headers = {}) => ({ method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body });

describe('reglas del plan', () => {
  it('cuenta los meses en hora de Argentina', () => {
    expect(mesDe(new Date('2026-12-01T02:00:00Z'))).toBe('2026-11'); // 23 h del 30/11 en Argentina
    expect(mesDe(new Date('2026-12-01T03:00:00Z'))).toBe('2026-12');
  });

  it('Gratis puede enviar hasta el límite del mes', () => {
    expect(puedeEnviar({ envios: { [MES]: LIMITE_ENVIOS_GRATIS - 1 } }, AHORA)).toBe(true);
    expect(puedeEnviar({ envios: { [MES]: LIMITE_ENVIOS_GRATIS } }, AHORA)).toBe(false);
    expect(enviosDelMes({ envios: { '2026-10': 9 } }, AHORA)).toBe(0); // el mes anterior no cuenta
  });

  it('Pro sigue activo hasta el fin del período aunque cancele', () => {
    expect(esPro({ tipo: 'pro', estado: 'activa' }, AHORA)).toBe(true);
    expect(esPro({ tipo: 'pro', estado: 'cancelada', vence: '2026-12-01T00:00:00Z' }, AHORA)).toBe(true);
    expect(esPro({ tipo: 'pro', estado: 'cancelada', vence: '2026-11-01T00:00:00Z' }, AHORA)).toBe(false);
    expect(esPro({ tipo: 'gratis', estado: 'activa' }, AHORA)).toBe(false);
  });

  it('traduce la suscripción de Mercado Pago', () => {
    const activa = planDesdeSuscripcion({ id: 'mp1', status: 'authorized', next_payment_date: '2026-12-15T00:00:00Z', auto_recurring: { frequency: 12 } });
    expect(activa).toMatchObject({ tipo: 'pro', estado: 'activa', periodo: 'anual', mpSuscripcionId: 'mp1' });
    const pendiente = planDesdeSuscripcion({ id: 'mp1', status: 'pending' }, {});
    expect(pendiente.tipo).toBe('gratis');
    const cancelada = planDesdeSuscripcion({ id: 'mp1', status: 'cancelled' }, activa);
    expect(cancelada).toMatchObject({ tipo: 'pro', estado: 'cancelada', vence: activa.vence });
  });
});

describe('POST /api/activar', () => {
  const propuesta = (cambios = {}) => ({ userId: 'duenio', status: 'draft', publico: false, ...cambios });
  const activar = (db, uid = 'duenio', activos = true) => crearActivar({
    db,
    sesionDe: async () => (uid ? { uid, email: `${uid}@estudio.com` } : null),
    planesActivos: () => activos,
    ahora: () => AHORA
  });

  it('activa el link, la pasa a enviada y cuenta el envío del mes', async () => {
    const { db, datos } = crearDb({ proposals: { [ID]: propuesta() } });
    const r = res();
    await activar(db)(post({ id: ID }), r);
    expect(r.estado).toBe(200);
    expect(r.cuerpo).toMatchObject({ primeraVez: true, usados: 1, limite: LIMITE_ENVIOS_GRATIS });
    expect(datos.proposals[ID]).toMatchObject({ publico: true, status: 'sent' });
    expect(datos.planes.duenio.envios[MES]).toBe(1);
  });

  it('en Gratis frena al llegar al límite del mes', async () => {
    const { db, datos } = crearDb({ proposals: { [ID]: propuesta() }, planes: { duenio: { envios: { [MES]: LIMITE_ENVIOS_GRATIS } } } });
    const r = res();
    await activar(db)(post({ id: ID }), r);
    expect(r.estado).toBe(403);
    expect(r.cuerpo.error).toBe('limite-envios');
    expect(datos.proposals[ID].publico).toBe(false);
  });

  it('una propuesta ya enviada se reactiva sin contar de nuevo', async () => {
    const { db, datos } = crearDb({ proposals: { [ID]: propuesta({ enviadaEn: 'antes' }) }, planes: { duenio: { envios: { [MES]: LIMITE_ENVIOS_GRATIS } } } });
    const r = res();
    await activar(db)(post({ id: ID }), r);
    expect(r.estado).toBe(200);
    expect(datos.planes.duenio.envios[MES]).toBe(LIMITE_ENVIOS_GRATIS);
  });

  it('con los planes apagados cuenta el envío pero no frena', async () => {
    const { db, datos } = crearDb({ proposals: { [ID]: propuesta() }, planes: { duenio: { envios: { [MES]: LIMITE_ENVIOS_GRATIS } } } });
    const r = res();
    await activar(db, 'duenio', false)(post({ id: ID }), r);
    expect(r.estado).toBe(200);
    expect(datos.proposals[ID].publico).toBe(true);
    expect(datos.planes.duenio.envios[MES]).toBe(LIMITE_ENVIOS_GRATIS + 1);
  });

  it('Pro no tiene límite', async () => {
    const { db } = crearDb({ proposals: { [ID]: propuesta() }, planes: { duenio: { tipo: 'pro', estado: 'activa', envios: { [MES]: 40 } } } });
    const r = res();
    await activar(db)(post({ id: ID }), r);
    expect(r.estado).toBe(200);
    expect(r.cuerpo.limite).toBeNull();
  });

  it('pide sesión y no deja activar propuestas ajenas', async () => {
    const { db } = crearDb({ proposals: { [ID]: propuesta() } });
    const sinSesion = res(); await activar(db, null)(post({ id: ID }), sinSesion);
    expect(sinSesion.estado).toBe(401);
    const ajena = res(); await activar(db, 'otro')(post({ id: ID }), ajena);
    expect(ajena.estado).toBe(403);
  });
});

describe('POST /api/suscripcion', () => {
  it('crea la suscripción en Mercado Pago con el uid como referencia', async () => {
    const { db } = crearDb({ users: { duenio: { email: 'Hola@Estudio.com' } } });
    let enviado;
    const mp = { crearSuscripcion: async d => { enviado = d; return { init_point: 'https://mp/pagar' }; } };
    const r = res();
    await crearSuscripcion({ db, sesionDe: async () => ({ uid: 'duenio', email: 'hola@estudio.com' }), planesActivos: () => true, mp, urlApp: () => 'https://dealit.test' })(post({ periodo: 'anual' }), r);
    expect(r.estado).toBe(200);
    expect(r.cuerpo.url).toBe('https://mp/pagar');
    expect(enviado).toMatchObject({ external_reference: 'duenio', payer_email: 'hola@estudio.com', status: 'pending' });
    expect(enviado.auto_recurring).toMatchObject({ frequency: 12, transaction_amount: 139000, currency_id: 'ARS' });
  });

  it('rechaza períodos desconocidos y a quien ya es Pro', async () => {
    const { db } = crearDb({ users: { duenio: { email: 'a@b.com' } }, planes: { duenio: { tipo: 'pro', estado: 'activa' } } });
    const mp = { crearSuscripcion: async () => ({ init_point: 'x' }) };
    const h = crearSuscripcion({ db, sesionDe: async () => ({ uid: 'duenio', email: 'a@b.com' }), planesActivos: () => true, mp, urlApp: () => 'https://x' });
    const r1 = res(); await h(post({ periodo: 'semanal' }), r1);
    expect(r1.estado).toBe(400);
    const r2 = res(); await h(post({ periodo: 'mensual' }), r2);
    expect(r2.estado).toBe(409);
  });
});

describe('interruptor de los planes', () => {
  it('apagado salvo PLANES_ACTIVOS=1 o los emails de prueba', () => {
    expect(planesActivosPara('a@b.com', {})).toBe(false);
    expect(planesActivosPara('a@b.com', { PLANES_ACTIVOS: '1' })).toBe(true);
    expect(planesActivosPara('Yo@Estudio.com', { PLANES_PRUEBA: 'otro@x.com, yo@estudio.com' })).toBe(true);
    expect(planesActivosPara('', { PLANES_PRUEBA: 'yo@estudio.com' })).toBe(false);
  });

  it('con los planes apagados no se puede suscribir', async () => {
    const { db } = crearDb({ users: { duenio: { email: 'a@b.com' } } });
    const r = res();
    await crearSuscripcion({ db, sesionDe: async () => ({ uid: 'duenio', email: 'a@b.com' }), planesActivos: () => false, mp: {}, urlApp: () => 'https://x' })(post({ periodo: 'mensual' }), r);
    expect(r.estado).toBe(403);
    expect(r.cuerpo.error).toBe('planes-inactivos');
  });

  it('/api/plan le dice a la app si los planes están activos', async () => {
    const r = res();
    await crearPlan({ sesionDe: async () => ({ uid: 'u', email: 'a@b.com' }), planesActivos: () => true })(post({}), r);
    expect(r.cuerpo).toEqual({ activos: true });
    const sinSesion = res();
    await crearPlan({ sesionDe: async () => null, planesActivos: () => true })(post({}), sinSesion);
    expect(sinSesion.estado).toBe(401);
  });
});

describe('POST /api/mercadopago', () => {
  const aviso = (tipo, id) => ({ method: 'POST', headers: { 'x-signature': 'ts=1,v1=x', 'x-request-id': 'r1' }, query: { type: tipo, 'data.id': id }, body: {} });

  it('activa Pro cuando Mercado Pago confirma la suscripción', async () => {
    const { db, datos } = crearDb({});
    const mp = { obtenerSuscripcion: async id => ({ id, status: 'authorized', external_reference: 'duenio1234', next_payment_date: '2026-12-15T00:00:00Z', auto_recurring: { frequency: 1 } }) };
    const r = res();
    await crearWebhook({ db, mp, verificarFirma: () => true })(aviso('subscription_preapproval', 'mp9'), r);
    expect(r.estado).toBe(200);
    expect(datos.planes.duenio1234).toMatchObject({ tipo: 'pro', estado: 'activa', mpSuscripcionId: 'mp9' });
  });

  it('descarta avisos sin firma válida', async () => {
    const { db, datos } = crearDb({});
    const r = res();
    await crearWebhook({ db, mp: {}, verificarFirma: () => false })(aviso('subscription_preapproval', 'mp9'), r);
    expect(r.estado).toBe(401);
    expect(datos.planes).toBeUndefined();
  });

  it('verifica la firma HMAC de Mercado Pago', () => {
    const secreto = 'clave';
    const v1 = createHmac('sha256', secreto).update('id:abc123;request-id:r1;ts:1700;').digest('hex');
    expect(firmaValida({ firma: `ts=1700,v1=${v1}`, idSolicitud: 'r1', idDato: 'ABC123', secreto })).toBe(true);
    expect(firmaValida({ firma: `ts=1701,v1=${v1}`, idSolicitud: 'r1', idDato: 'ABC123', secreto })).toBe(false);
    expect(firmaValida({ firma: `ts=1700,v1=${v1}`, idSolicitud: 'r1', idDato: 'ABC123', secreto: '' })).toBe(false);
  });
});
