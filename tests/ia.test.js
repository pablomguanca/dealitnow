import { describe, expect, it } from 'vitest';
import { LIMITE_IA_GRATIS, esquemaIA, preciosDeReferencia, propuestaDesdeIA, temasPermitidos } from '../src/ia.js';
import { crearHandler } from '../api/ia-propuesta.js';
import { TEMAS } from '../src/modelo.js';

const AHORA = new Date('2026-11-15T15:00:00-03:00');
const MES = '2026-11';

const respuestaIA = (cambios = {}) => ({
  titulo: 'Reforma de baño',
  cliente: { nombre: 'Javier', empresa: '' },
  contexto: 'Baño de cortesía.',
  objetivos: ['Baño nuevo en 15 días'],
  servicios: [
    { nombre: 'Mano de obra', descripcion: 'Demolición y colocación', entregables: ['Baño terminado'], modalidad: 'unico', cantidad: 1, precio: 1200000, opcional: false },
    { nombre: 'Termotanque', descripcion: 'Cambio', entregables: [], modalidad: 'unico', cantidad: 1, precio: 300000, opcional: true }
  ],
  etapas: [],
  moneda: 'ARS',
  pagos: [{ concepto: 'Seña', porcentaje: 50 }, { concepto: 'Final', porcentaje: 50 }],
  impuesto: 0,
  validezDias: 15,
  condiciones: ['Materiales aparte'],
  proximosPasos: ['Aceptar la propuesta desde este link'],
  tema: 'calido',
  avisos: [],
  ...cambios
});

describe('reglas de la IA', () => {
  it('en Gratis la IA solo puede elegir temas gratis', () => {
    expect(temasPermitidos(false).every(id => TEMAS[id].plan !== 'pro')).toBe(true);
    expect(temasPermitidos(true).length).toBeGreaterThan(temasPermitidos(false).length);
  });

  it('el esquema pide todo y no deja propiedades extra', () => {
    const e = esquemaIA(temasPermitidos(false));
    expect(e.additionalProperties).toBe(false);
    expect(e.required).toContain('servicios');
    expect(e.properties.servicios.items.additionalProperties).toBe(false);
  });

  it('convierte la respuesta en una propuesta válida', () => {
    const { contenido, avisos } = propuestaDesdeIA(respuestaIA(), { temas: temasPermitidos(false) });
    expect(contenido.servicios).toHaveLength(2);
    expect(contenido.servicios[1]).toMatchObject({ opcional: true, precio: 300000 });
    expect(contenido.servicios[0].entregables).toBe('Baño terminado');
    expect(contenido.inversion).toMatchObject({ moneda: 'ARS', impuesto: 0 });
    expect(contenido.tema.preset).toBe('calido');
    expect(avisos).toEqual([]);
  });

  it('corrige lo que no cierra: pagos que no suman 100, tema PRO en Gratis, números raros', () => {
    const { contenido } = propuestaDesdeIA(respuestaIA({
      pagos: [{ concepto: 'Seña', porcentaje: 30 }],
      tema: 'aurora-tech',
      moneda: 'BTC',
      servicios: [{ nombre: 'X', descripcion: '', entregables: [], modalidad: 'otra', cantidad: -3, precio: -10, opcional: 'si' }]
    }), { temas: temasPermitidos(false) });
    expect(contenido.inversion.pagos.map(p => p.porcentaje)).toEqual([50, 50]);
    expect(TEMAS[contenido.tema.preset].plan).not.toBe('pro');
    expect(contenido.inversion.moneda).toBe('ARS');
    expect(contenido.servicios[0]).toMatchObject({ modalidad: 'unico', cantidad: 1, precio: 0, opcional: false });
  });

  it('los precios de referencia priorizan lo aceptado y no repiten', () => {
    const lineas = preciosDeReferencia([
      { payload: { inversion: { moneda: 'ARS' }, servicios: [{ nombre: 'Logo', precio: 100 }] } },
      { aceptacion: {}, payload: { inversion: { moneda: 'ARS' }, servicios: [{ nombre: 'logo', precio: 200 }, { nombre: 'Web', precio: 0 }] } }
    ]);
    expect(lineas).toEqual(['logo: ARS 200 (aceptado)']);
  });
});

// Firestore mínimo: planes (get / set con merge) y proposals (consulta del historial).
const crearDb = (planes = {}) => {
  const datos = { planes: structuredClone(planes) };
  const consulta = { where: () => consulta, orderBy: () => consulta, limit: () => consulta, get: async () => ({ docs: [] }) };
  const db = {
    collection: nombre => (nombre === 'proposals' ? consulta : {
      doc: id => ({
        get: async () => ({ exists: !!datos.planes[id], data: () => datos.planes[id] }),
        set: async (valor) => {
          const actual = datos.planes[id] || {};
          datos.planes[id] = { ...actual, ...valor, ia: { ...actual.ia, ...valor.ia } };
        }
      })
    })
  };
  return { db: () => db, datos };
};
const res = () => {
  const r = { estado: null, cuerpo: undefined };
  r.setHeader = () => {};
  r.status = e => { r.estado = e; return r; };
  r.json = c => { r.cuerpo = c; return r; };
  r.end = () => r;
  return r;
};
const post = body => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body });
const TEXTO = 'Reforma del baño de Javier, mano de obra 1.200.000, 15 días.';

describe('POST /api/ia-propuesta', () => {
  const handler = (db, { generar = async () => respuestaIA(), activos = true, uid = 'duenio' } = {}) => crearHandler({
    db,
    sesionDe: async () => (uid ? { uid, email: 'a@b.com' } : null),
    planesActivos: () => activos,
    generar,
    ahora: () => AHORA
  });

  it('arma la propuesta y cuenta el uso del mes', async () => {
    const { db, datos } = crearDb();
    let pedido;
    const r = res();
    await handler(db, { generar: async p => { pedido = p; return respuestaIA(); } })(post({ texto: TEXTO }), r);
    expect(r.estado).toBe(200);
    expect(r.cuerpo.contenido.servicios).toHaveLength(2);
    expect(r.cuerpo).toMatchObject({ usados: 1, limite: LIMITE_IA_GRATIS });
    expect(datos.planes.duenio.ia[MES]).toBe(1);
    expect(pedido.mensaje).toContain(TEXTO);
    expect(pedido.esquema.properties.tema.enum).not.toContain('aurora-tech');
  });

  it('en Gratis frena al llegar al límite, sin llamar a la IA', async () => {
    const { db } = crearDb({ duenio: { ia: { [MES]: LIMITE_IA_GRATIS } } });
    let llamada = false;
    const r = res();
    await handler(db, { generar: async () => { llamada = true; return respuestaIA(); } })(post({ texto: TEXTO }), r);
    expect(r.estado).toBe(403);
    expect(r.cuerpo.error).toBe('limite-ia');
    expect(llamada).toBe(false);
  });

  it('en Pro no hay límite visible y puede elegir temas PRO', async () => {
    const { db } = crearDb({ duenio: { tipo: 'pro', estado: 'activa', vence: '2026-12-15T00:00:00Z', ia: { [MES]: 10 } } });
    let pedido;
    const r = res();
    await handler(db, { generar: async p => { pedido = p; return respuestaIA({ tema: 'aurora-tech' }); } })(post({ texto: TEXTO }), r);
    expect(r.estado).toBe(200);
    expect(r.cuerpo.limite).toBeNull();
    expect(r.cuerpo.contenido.tema.preset).toBe('aurora-tech');
    expect(pedido.esquema.properties.tema.enum).toContain('aurora-tech');
  });

  it('valida sesión y texto, y no cuenta si la IA falla', async () => {
    const { db, datos } = crearDb();
    const sinSesion = res();
    await handler(db, { uid: null })(post({ texto: TEXTO }), sinSesion);
    const corto = res();
    await handler(db)(post({ texto: 'hola' }), corto);
    const vacia = res();
    await handler(db, { generar: async () => respuestaIA({ servicios: [] }) })(post({ texto: TEXTO }), vacia);
    expect([sinSesion.estado, corto.estado, vacia.estado]).toEqual([401, 400, 422]);
    expect(datos.planes.duenio).toBeUndefined();
  });
});
