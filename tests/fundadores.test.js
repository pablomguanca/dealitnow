import { describe, expect, it } from 'vitest';
import {
  CUPOS_FUNDADORES, esFundador, finTarifaPendiente, fundadorAlSuscribirse, mesGratisDisponible,
  precioFundador, preciosProPara, proximoCupo, sumarMeses, tarifaFundadorVigente
} from '../src/fundadores.js';
import { PRECIOS_PRO } from '../src/planes.js';
import { crearHandler as crearActivar } from '../api/activar.js';
import { crearHandler as crearSuscripcion } from '../api/suscripcion.js';
import { crearHandler as crearWebhook } from '../api/mercadopago.js';
import { crearFinTarifas } from '../api/_lib/tarifa-fundador.js';
import { vacio } from '../src/modelo.js';

const AHORA = new Date('2026-12-01T12:00:00Z');
const fundador = (extra = {}) => ({ fundador: { numero: 3, ...extra } });

describe('reglas de Fundadores', () => {
  it('tarifa: 30% OFF redondeado a la decena', () => {
    expect(precioFundador(13900)).toBe(9730);
    expect(precioFundador(139000)).toBe(97300);
  });

  it('cupos: del 1 al 25 y después ninguno', () => {
    expect(proximoCupo(0)).toBe(1);
    expect(proximoCupo(undefined)).toBe(1);
    expect(proximoCupo(CUPOS_FUNDADORES - 1)).toBe(CUPOS_FUNDADORES);
    expect(proximoCupo(CUPOS_FUNDADORES)).toBeNull();
  });

  it('quién es Fundador', () => {
    expect(esFundador({})).toBe(false);
    expect(esFundador({ fundador: { numero: 0 } })).toBe(false);
    expect(esFundador(fundador())).toBe(true);
  });

  it('precios: los de fundador mientras dura la tarifa, después los normales', () => {
    expect(preciosProPara({}, AHORA)).toBe(PRECIOS_PRO);
    expect(preciosProPara(fundador(), AHORA).mensual).toMatchObject({ monto: 9730, fundador: true, normal: 13900 });
    expect(preciosProPara(fundador({ tarifaHasta: '2027-06-01T00:00:00.000Z' }), AHORA).anual.monto).toBe(97300);
    expect(preciosProPara(fundador({ tarifaHasta: '2026-11-01T00:00:00.000Z' }), AHORA)).toBe(PRECIOS_PRO);
    expect(tarifaFundadorVigente(fundador({ tarifaFinal: true }), AHORA)).toBe(false);
  });

  it('el mes gratis es uno solo', () => {
    expect(mesGratisDisponible(fundador())).toBe(true);
    expect(mesGratisDisponible(fundador({ suscripto: '2026-12-01' }))).toBe(false);
    expect(mesGratisDisponible({})).toBe(false);
  });

  it('al suscribirse: la tarifa corre 12 meses desde el primer cobro', () => {
    const suscripcion = { status: 'authorized', auto_recurring: { start_date: '2027-01-01T12:00:00.000Z' } };
    expect(fundadorAlSuscribirse(fundador(), suscripcion, AHORA)).toEqual({
      suscripto: AHORA.toISOString(),
      tarifaHasta: '2028-01-01T12:00:00.000Z'
    });
    expect(fundadorAlSuscribirse(fundador(), { ...suscripcion, status: 'pending' }, AHORA)).toBeNull();
    expect(fundadorAlSuscribirse(fundador({ suscripto: 'x' }), suscripcion, AHORA)).toBeNull();
    expect(fundadorAlSuscribirse({}, suscripcion, AHORA)).toBeNull();
  });

  it('fin de la tarifa: unos días antes de tarifaHasta', () => {
    expect(finTarifaPendiente(fundador({ tarifaHasta: '2026-12-03T12:00:00.000Z' }), AHORA)).toBe(true);
    expect(finTarifaPendiente(fundador({ tarifaHasta: '2026-12-10T12:00:00.000Z' }), AHORA)).toBe(false);
    expect(finTarifaPendiente(fundador({ tarifaHasta: '2026-12-03T12:00:00.000Z', tarifaFinal: true }), AHORA)).toBe(false);
    expect(finTarifaPendiente(fundador(), AHORA)).toBe(false);
  });

  it('sumarMeses', () => {
    expect(sumarMeses(new Date('2026-12-01T12:00:00Z'), 1).toISOString()).toBe('2027-01-01T12:00:00.000Z');
  });
});

// Firestore mínimo en memoria, por colección, con transacciones y merge profundo.
const fusionar = (destino, origen) => {
  for (const [k, v] of Object.entries(origen)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && !v.constructor?.name?.includes('Transform') && typeof destino[k] === 'object' && destino[k]) fusionar(destino[k], v);
    else destino[k] = v;
  }
  return destino;
};

const crearDb = (datos = {}) => {
  const ref = (col, id) => ({ col, id, path: `${col}/${id}` });
  const snap = r => ({ exists: r.path in datos, data: () => datos[r.path], get: c => datos[r.path]?.[c] });
  const escribir = (r, cambios, merge) => {
    datos[r.path] = merge || !(r.path in datos) ? fusionar(datos[r.path] || {}, cambios) : { ...cambios };
  };
  const db = {
    collection: col => ({ doc: id => ref(col, id) }),
    runTransaction: async fn => fn({
      get: async r => snap(r),
      set: (r, cambios, opciones) => escribir(r, cambios, opciones?.merge),
      update: (r, cambios) => escribir(r, cambios, true)
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
const post = body => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body });

const ID = 'AAAAAAAAAAAAAAAAAAA1';
const propuesta = () => ({
  userId: 'ana',
  status: 'draft',
  payload: { ...vacio(), cliente: { nombre: 'Pedro', empresa: '' } }
});

describe('POST /api/activar: cupos de Fundador', () => {
  const activar = db => crearActivar({ db, sesionDe: async () => ({ uid: 'ana', email: 'ana@x.com' }), planesActivos: () => false, ahora: () => AHORA });

  it('compartir le da el próximo cupo y lo avisa', async () => {
    const { db, datos } = crearDb({ [`proposals/${ID}`]: propuesta(), 'fundadores/cupos': { asignados: 4 } });
    const r = res();
    await activar(db)(post({ id: ID }), r);
    expect(r.estado).toBe(200);
    expect(r.cuerpo.fundador).toBe(5);
    expect(datos['fundadores/cupos'].asignados).toBe(5);
    expect(datos['planes/ana'].fundador.numero).toBe(5);
    expect(datos['planes/ana'].envios).toBeDefined();
  });

  it('quien ya es Fundador no gasta otro cupo', async () => {
    const { db, datos } = crearDb({ [`proposals/${ID}`]: propuesta(), 'fundadores/cupos': { asignados: 4 }, 'planes/ana': fundador() });
    const r = res();
    await activar(db)(post({ id: ID }), r);
    expect(r.cuerpo.fundador).toBeUndefined();
    expect(datos['fundadores/cupos'].asignados).toBe(4);
    expect(datos['planes/ana'].fundador.numero).toBe(3);
  });

  it('sin cupos, comparte igual y no es Fundador', async () => {
    const { db, datos } = crearDb({ [`proposals/${ID}`]: propuesta(), 'fundadores/cupos': { asignados: CUPOS_FUNDADORES } });
    const r = res();
    await activar(db)(post({ id: ID }), r);
    expect(r.estado).toBe(200);
    expect(r.cuerpo.fundador).toBeUndefined();
    expect(datos['planes/ana'].fundador).toBeUndefined();
  });

  it('si el envío no pasa (límite de Gratis), no se lleva cupo', async () => {
    const { db, datos } = crearDb({
      [`proposals/${ID}`]: propuesta(),
      'planes/ana': { envios: { '2026-12': 2 } }
    });
    const r = res();
    await crearActivar({ db, sesionDe: async () => ({ uid: 'ana', email: 'ana@x.com' }), planesActivos: () => true, ahora: () => AHORA })(post({ id: ID }), r);
    expect(r.estado).toBe(403);
    expect(datos['fundadores/cupos']).toBeUndefined();
  });
});

describe('POST /api/suscripcion: Fundadores', () => {
  const suscribir = async plan => {
    const { db } = crearDb({ 'planes/ana': plan, 'users/ana': { email: 'ana@x.com' } });
    const creadas = [];
    // La función lee con .get() directo (sin transacción).
    const base = db();
    const conGet = () => ({
      ...base,
      collection: col => ({ doc: id => ({ get: async () => { const r = base.collection(col).doc(id); return (await base.runTransaction(async tx => tx.get(r))); } }) })
    });
    const r = res();
    await crearSuscripcion({
      db: conGet,
      sesionDe: async () => ({ uid: 'ana', email: 'ana@x.com' }),
      planesActivos: () => true,
      mp: { crearSuscripcion: async d => { creadas.push(d); return { init_point: 'https://mp/pagar' }; } },
      urlApp: () => 'https://dealit.com.ar',
      ahora: () => AHORA
    })(post({ periodo: 'mensual' }), r);
    return { r, datos: creadas[0] };
  };

  it('Fundador nuevo: tarifa de fundador y primer cobro al mes', async () => {
    const { r, datos } = await suscribir(fundador());
    expect(r.estado).toBe(200);
    expect(datos.auto_recurring).toMatchObject({ transaction_amount: 9730, start_date: '2027-01-01T12:00:00.000Z' });
    expect(datos.reason).toContain('Fundador');
  });

  it('Fundador que ya usó el mes: tarifa sin mes gratis', async () => {
    const { datos } = await suscribir(fundador({ suscripto: '2026-11-01', tarifaHasta: '2027-11-01T00:00:00.000Z' }));
    expect(datos.auto_recurring.transaction_amount).toBe(9730);
    expect(datos.auto_recurring.start_date).toBeUndefined();
  });

  it('sin ser Fundador: precio normal, cobro inmediato', async () => {
    const { datos } = await suscribir({});
    expect(datos.auto_recurring.transaction_amount).toBe(13900);
    expect(datos.auto_recurring.start_date).toBeUndefined();
    expect(datos.reason).not.toContain('Fundador');
  });
});

describe('POST /api/mercadopago: primera suscripción de un Fundador', () => {
  it('fija la tarifa y conserva su número', async () => {
    const { db, datos } = crearDb({ 'planes/ana12345678': fundador() });
    const suscripcion = { id: 'S1', status: 'authorized', external_reference: 'ana12345678', next_payment_date: '2027-01-01T12:00:00.000Z', auto_recurring: { frequency: 1, start_date: '2027-01-01T12:00:00.000Z' } };
    const r = res();
    await crearWebhook({
      db,
      mp: { obtenerSuscripcion: async () => suscripcion },
      verificarFirma: () => true,
      ahora: () => AHORA
    })({ method: 'POST', headers: {}, query: { type: 'subscription_preapproval', 'data.id': 'S1' }, body: {} }, r);
    expect(r.estado).toBe(200);
    expect(datos['planes/ana12345678']).toMatchObject({
      tipo: 'pro',
      estado: 'activa',
      fundador: { numero: 3, suscripto: AHORA.toISOString(), tarifaHasta: '2028-01-01T12:00:00.000Z' }
    });
  });
});

describe('Tarea diaria: fin de la tarifa de fundador', () => {
  const crearDbPlanes = planes => {
    const marcados = [];
    const db = {
      collection: () => ({
        where: (_c, _op, tope) => ({
          get: async () => ({
            docs: Object.entries(planes)
              .filter(([, p]) => p.fundador?.tarifaHasta && p.fundador.tarifaHasta <= tope)
              .map(([id, p]) => ({ id, data: () => p, ref: { set: async c => { marcados.push({ id, c }); fusionar(p, c); } } }))
          })
        })
      })
    };
    return { db: () => db, marcados };
  };

  it('sube el monto a las activas, marca las canceladas y deja las que faltan', async () => {
    const { db, marcados } = crearDbPlanes({
      activa: { estado: 'activa', periodo: 'anual', mpSuscripcionId: 'S1', ...fundador({ tarifaHasta: '2026-12-02T00:00:00.000Z' }) },
      cancelada: { estado: 'cancelada', mpSuscripcionId: 'S2', ...fundador({ tarifaHasta: '2026-11-01T00:00:00.000Z' }) },
      lejos: { estado: 'activa', mpSuscripcionId: 'S3', ...fundador({ tarifaHasta: '2027-06-01T00:00:00.000Z' }) },
      lista: { estado: 'activa', mpSuscripcionId: 'S4', ...fundador({ tarifaHasta: '2026-11-01T00:00:00.000Z', tarifaFinal: true }) }
    });
    const cambios = [];
    const fin = crearFinTarifas({ db, mp: { actualizarMontoSuscripcion: async (id, p) => { cambios.push({ id, ...p }); } }, ahora: () => AHORA });
    const detalle = await fin();
    expect(cambios).toEqual([{ id: 'S1', monto: 139000, moneda: 'ARS' }]);
    expect(marcados.map(m => m.id)).toEqual(['activa', 'cancelada']);
    expect(detalle).toEqual([
      { uid: 'activa', resultado: 'precio-normal-139000' },
      { uid: 'cancelada', resultado: 'sin-suscripcion-activa' }
    ]);
  });

  it('si Mercado Pago falla, no marca: mañana reintenta', async () => {
    const { db, marcados } = crearDbPlanes({ a: { estado: 'activa', mpSuscripcionId: 'S1', ...fundador({ tarifaHasta: '2026-12-02T00:00:00.000Z' }) } });
    const fin = crearFinTarifas({ db, mp: { actualizarMontoSuscripcion: async () => { throw new Error('caído'); } }, ahora: () => AHORA });
    expect(await fin()).toEqual([{ uid: 'a', resultado: 'error' }]);
    expect(marcados).toHaveLength(0);
  });
});
