import { describe, expect, it } from 'vitest';
import { crearHandler as crearAceptar } from '../api/aceptar.js';
import { crearHandler as crearVisto } from '../api/visto.js';
import { vacio } from '../src/modelo.js';

const ID = 'AAAAAAAAAAAAAAAAAAA1';

// Firestore mínimo en memoria con transacciones.
const crearDb = docs => {
  const escrituras = [];
  const ref = id => ({ id });
  const snap = id => ({
    exists: id in docs,
    data: () => docs[id],
    get: campo => docs[id]?.[campo]
  });
  const db = {
    collection: () => ({ doc: ref }),
    runTransaction: async fn => fn({
      get: async r => snap(r.id),
      update: (r, cambios) => {
        escrituras.push({ id: r.id, cambios });
        Object.assign(docs[r.id], cambios);
      }
    })
  };
  return { db: () => db, escrituras };
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

const propuesta = (cambios = {}) => ({
  userId: 'duenio',
  publico: true,
  status: 'sent',
  payload: {
    ...vacio(),
    propuesta: { titulo: 'Web', numero: '', fecha: '2026-10-01', validez: 30 },
    servicios: [{ id: 's1', nombre: 'Sitio', modalidad: 'unico', cantidad: 1, precio: 500, opcional: false }]
  },
  ...cambios
});

describe('POST /api/visto', () => {
  it('cuenta la visita y marca la primera vez', async () => {
    const { db, escrituras } = crearDb({ [ID]: propuesta() });
    const r = res();
    await crearVisto({ db, uidDe: async () => null })(post({ id: ID }), r);
    expect(r.estado).toBe(204);
    expect(Object.keys(escrituras[0].cambios).sort()).toEqual(['vistas', 'vistoPrimero', 'vistoUltimo']);
  });

  it('no cuenta las visitas del dueño', async () => {
    const { db, escrituras } = crearDb({ [ID]: propuesta() });
    const r = res();
    await crearVisto({ db, uidDe: async () => 'duenio' })(post({ id: ID }), r);
    expect(r.estado).toBe(204);
    expect(escrituras).toHaveLength(0);
  });

  it('responde 404 si el link no está activo', async () => {
    const { db } = crearDb({ [ID]: propuesta({ publico: false }) });
    const r = res();
    await crearVisto({ db, uidDe: async () => null })(post({ id: ID }), r);
    expect(r.estado).toBe(404);
  });

  it('valida método, formato e ID', async () => {
    const { db } = crearDb({});
    const h = crearVisto({ db, uidDe: async () => null });
    const r1 = res(); await h({ method: 'GET', headers: {} }, r1);
    const r2 = res(); await h({ method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'x' }, r2);
    const r3 = res(); await h(post({ id: '../../users/x' }), r3);
    expect([r1.estado, r2.estado, r3.estado]).toEqual([405, 415, 400]);
  });
});

describe('POST /api/aceptar', () => {
  const ahora = () => new Date('2026-10-06T12:00:00Z');

  it('registra la aceptación y pasa la propuesta a aceptada', async () => {
    const { db, escrituras } = crearDb({ [ID]: propuesta() });
    const r = res();
    await crearAceptar({ db, uidDe: async () => null, ahora })(post({ id: ID, nombre: 'Laura', acepto: true, opcionales: [] }), r);
    expect(r.estado).toBe(200);
    expect(r.cuerpo.aceptacion).toMatchObject({ nombre: 'Laura', inicial: 500, moneda: 'USD' });
    expect(r.cuerpo.aceptacion.contenido).toBeUndefined();
    expect(escrituras[0].cambios.status).toBe('accepted');
    expect(escrituras[0].cambios.aceptacion.contenido.propuesta.titulo).toBe('Web');
  });

  it('no deja aceptar dos veces', async () => {
    const { db } = crearDb({ [ID]: propuesta() });
    const h = crearAceptar({ db, uidDe: async () => null, ahora });
    await h(post({ id: ID, nombre: 'Laura', acepto: true }), res());
    const r = res();
    await h(post({ id: ID, nombre: 'Otro', acepto: true }), r);
    expect(r.estado).toBe(409);
  });

  it('el dueño no puede aceptar su propia propuesta', async () => {
    const { db, escrituras } = crearDb({ [ID]: propuesta() });
    const r = res();
    await crearAceptar({ db, uidDe: async () => 'duenio', ahora })(post({ id: ID, nombre: 'Yo', acepto: true }), r);
    expect(r.estado).toBe(403);
    expect(escrituras).toHaveLength(0);
  });

  it('devuelve el motivo cuando los datos no son válidos', async () => {
    const { db } = crearDb({ [ID]: propuesta() });
    const r = res();
    await crearAceptar({ db, uidDe: async () => null, ahora })(post({ id: ID, nombre: 'Laura' }), r);
    expect(r.estado).toBe(400);
    expect(r.cuerpo.error).toBe('falta-conformidad');
  });
});
