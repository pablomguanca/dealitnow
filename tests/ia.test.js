import { describe, expect, it } from 'vitest';
import { LIMITE_IA_GRATIS, esquemaIA, instruccionesIA, preciosDeReferencia, propuestaDesdeIA, temasPermitidos } from '../src/ia.js';
import { LIMITE_EDICION_GRATIS, SECCIONES_EDICION, aplicarCambios, cambiosDesdeIA, contenidoParaEditar, detalleCambio, esquemaEdicion } from '../src/ia-editar.js';
import { crearHandler } from '../api/ia-propuesta.js';
import { TEMAS, vacio } from '../src/modelo.js';

const AHORA = new Date('2026-11-15T15:00:00-03:00');
const MES = '2026-11';

const respuestaIA = (cambios = {}) => ({
  titulo: 'Reforma de baño',
  cliente: { nombre: 'Javier', empresa: '', cargo: '' },
  contexto: 'Baño de cortesía.',
  objetivos: ['Baño nuevo en 15 días'],
  servicios: [
    { nombre: 'Mano de obra', descripcion: 'Demolición y colocación', entregables: ['Baño terminado'], modalidad: 'unico', cantidad: 1, precio: 1200000, opcional: false },
    { nombre: 'Termotanque', descripcion: 'Cambio', entregables: [], modalidad: 'unico', cantidad: 1, precio: 300000, opcional: true }
  ],
  etapas: [],
  faqs: [{ pregunta: '¿Incluye materiales?', respuesta: 'No, se cotizan aparte.' }],
  moneda: 'ARS',
  montoGlobal: 0,
  abonoMensual: 0,
  descuento: 0,
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

  it('suma las preguntas frecuentes y saca viñetas o números que ya pone la vista', () => {
    const { contenido } = propuestaDesdeIA(respuestaIA({
      condiciones: ['• Materiales aparte', '- Dos rondas de cambios'],
      proximosPasos: ['1. Aceptar la propuesta desde este link', '2) Coordinar la visita']
    }));
    expect(contenido.faqs).toEqual([expect.objectContaining({ pregunta: '¿Incluye materiales?', respuesta: 'No, se cotizan aparte.' })]);
    expect(contenido.faqs[0].id).toBeTruthy();
    expect(contenido.condiciones).toBe('Materiales aparte\nDos rondas de cambios');
    expect(contenido.proximosPasos).toBe('Aceptar la propuesta desde este link\nCoordinar la visita');
  });

  it('precio total: va en montoGlobal con los servicios incluidos', () => {
    const { contenido } = propuestaDesdeIA(respuestaIA({
      montoGlobal: 1500000,
      servicios: [
        { nombre: 'Demolición', descripcion: '', entregables: [], modalidad: 'incluido', cantidad: 1, precio: 500, opcional: false },
        { nombre: 'Colocación', descripcion: '', entregables: [], modalidad: 'incluido', cantidad: 1, precio: 0, opcional: false }
      ]
    }));
    expect(contenido.inversion.montoGlobal).toBe(1500000);
    expect(contenido.servicios.every(s => s.precio === 0)).toBe(true);
  });

  it('si el monto global repite la suma de los ítems, no se cuenta dos veces', () => {
    const { contenido } = propuestaDesdeIA(respuestaIA({
      montoGlobal: 1200000,
      abonoMensual: 50000,
      servicios: [
        { nombre: 'Obra', descripcion: '', entregables: [], modalidad: 'unico', cantidad: 1, precio: 1200000, opcional: false },
        { nombre: 'Mantenimiento', descripcion: '', entregables: [], modalidad: 'mensual', cantidad: 1, precio: 50000, opcional: false },
        { nombre: 'Extra', descripcion: '', entregables: [], modalidad: 'unico', cantidad: 1, precio: 300000, opcional: true }
      ]
    }));
    expect(contenido.inversion).toMatchObject({ montoGlobal: 0, abonoMensual: 0 });
  });

  it('el descuento solo va si vino (y queda entre 0 y 100)', () => {
    expect(propuestaDesdeIA(respuestaIA()).contenido.inversion.descuento).toBe(0);
    expect(propuestaDesdeIA(respuestaIA({ descuento: 10 })).contenido.inversion.descuento).toBe(10);
    expect(propuestaDesdeIA(respuestaIA({ descuento: 250 })).contenido.inversion.descuento).toBe(100);
  });

  it('las instrucciones llevan los datos del emisor y solo los temas permitidos', () => {
    const sistema = instruccionesIA(['calido'], { nombre: 'Estudio Sur', rol: 'Arquitectura', ubicacion: 'Rosario' });
    expect(sistema).toContain('Emisor / marca: Estudio Sur');
    expect(sistema).toContain('Rubro / rol habitual: Arquitectura');
    expect(sistema).toContain('Ubicación: Rosario');
    expect(sistema).not.toContain('aurora-tech');
    expect(instruccionesIA(['calido'])).toContain('Sin datos cargados');
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
const crearDb = (planes = {}, users = {}) => {
  const datos = { planes: structuredClone(planes) };
  const coleccionUsers = { doc: id => ({ get: async () => ({ exists: !!users[id], data: () => users[id] }) }) };
  const consulta = { where: () => consulta, orderBy: () => consulta, limit: () => consulta, get: async () => ({ docs: [] }) };
  const db = {
    collection: nombre => (nombre === 'proposals' ? consulta : nombre === 'users' ? coleccionUsers : {
      doc: id => ({
        get: async () => ({ exists: !!datos.planes[id], data: () => datos.planes[id] }),
        set: async (valor) => {
          const actual = datos.planes[id] || {};
          datos.planes[id] = { ...actual, ...valor, ia: { ...actual.ia, ...valor.ia }, iaEdicion: { ...actual.iaEdicion, ...valor.iaEdicion } };
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

  it('le pasa a la IA los datos del negocio del dueño', async () => {
    const { db } = crearDb({}, { duenio: { emisor: { nombre: 'Estudio Sur', rol: 'Arquitectura', email: 'no@va.com' } } });
    let pedido;
    const r = res();
    await handler(db, { generar: async p => { pedido = p; return respuestaIA(); } })(post({ texto: TEXTO }), r);
    expect(r.estado).toBe(200);
    expect(pedido.sistema).toContain('Estudio Sur');
    expect(pedido.sistema).not.toContain('no@va.com');
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

// --- Editar con IA ---
const PROPUESTA = {
  ...vacio(),
  propuesta: { ...vacio().propuesta, titulo: 'Web para Café Molino', validez: 15 },
  cliente: { nombre: 'Ana', empresa: 'Café Molino', cargo: '' },
  servicios: [
    { id: 's1', nombre: 'Diseño web', descripcion: 'Sitio de 5 páginas', entregables: 'Diseño\nSitio publicado', modalidad: 'unico', cantidad: 1, precio: 500000, opcional: false, imagen: 'https://foto/1.jpg' },
    { id: 's2', nombre: 'Fotos', descripcion: '', entregables: '', modalidad: 'unico', cantidad: 1, precio: 200000, opcional: true, imagen: '' }
  ],
  inversion: { ...vacio().inversion, moneda: 'ARS', pagos: [{ id: 'p1', concepto: 'Al aceptar', porcentaje: 50 }, { id: 'p2', concepto: 'Al entregar', porcentaje: 50 }] },
  condiciones: 'Dos rondas de cambios\nHosting aparte',
  emisor: { ...vacio().emisor, nombre: 'Estudio Sur', logo: 'data:image/png;base64,AAAA' }
};

describe('reglas de Editar con IA', () => {
  it('lo que ve la IA no lleva fotos, logo ni datos del emisor', () => {
    const c = contenidoParaEditar(PROPUESTA);
    const json = JSON.stringify(c);
    expect(json).not.toContain('foto/1.jpg');
    expect(json).not.toContain('base64');
    expect(json).not.toContain('Estudio Sur');
    expect(c.servicios[0]).toMatchObject({ id: 's1', entregables: ['Diseño', 'Sitio publicado'] });
    expect(c.pagos).toHaveLength(2);
    expect(c.validezDias).toBe(15);
    // Compactar dos veces da lo mismo (el servidor vuelve a compactar lo que manda la app).
    expect(contenidoParaEditar(c)).toEqual(c);
  });

  it('el esquema de cambios es opcional por sección', () => {
    const e = esquemaEdicion();
    expect(e.required).toEqual(['respuesta', 'resumen', 'cambios', 'avisos']);
    expect(e.properties.cambios.required).toBeUndefined();
    expect(Object.keys(e.properties.cambios.properties)).toEqual(Object.keys(SECCIONES_EDICION));
  });

  it('descarta lo que quedó igual, los pagos que no suman 100 y los ids inventados', () => {
    const actual = contenidoParaEditar(PROPUESTA);
    const r = cambiosDesdeIA({
      respuesta: 'Bajé los precios.',
      resumen: [{ seccion: 'servicios', texto: 'Precios 10 % más bajos' }, { seccion: 'titulo', texto: 'igual' }],
      cambios: {
        titulo: 'Web para Café Molino',
        servicios: [
          { ...actual.servicios[0], precio: 450000 },
          { ...actual.servicios[1], id: 'inventado', precio: 180000 }
        ],
        pagos: [{ concepto: 'Todo', porcentaje: 90 }]
      },
      avisos: []
    }, actual);
    expect(Object.keys(r.cambios)).toEqual(['servicios']);
    expect(r.cambios.servicios.map(s => s.id)).toEqual(['s1', '']);
    expect(r.resumen).toEqual([{ seccion: 'servicios', texto: 'Precios 10 % más bajos' }]);
    expect(r.avisos.join(' ')).toContain('100');
  });

  it('el monto global no repite la suma de los ítems', () => {
    const actual = contenidoParaEditar(PROPUESTA);
    const r = cambiosDesdeIA({ cambios: { inversion: { ...actual.inversion, montoGlobal: 500000, descuento: 10 } } }, actual);
    expect(r.cambios.inversion).toMatchObject({ montoGlobal: 0, descuento: 10 });
  });

  it('aplica solo lo elegido y conserva fotos e ids de los servicios', () => {
    const actual = contenidoParaEditar(PROPUESTA);
    const cambios = {
      servicios: [{ ...actual.servicios[0], precio: 450000 }, { id: '', nombre: 'Mantenimiento', descripcion: '', entregables: [], modalidad: 'mensual', cantidad: 1, precio: 80000, opcional: true }],
      condiciones: ['Una ronda de cambios']
    };
    const nuevo = aplicarCambios(PROPUESTA, cambios, ['servicios']);
    expect(nuevo.servicios[0]).toMatchObject({ id: 's1', precio: 450000, imagen: 'https://foto/1.jpg', entregables: 'Diseño\nSitio publicado' });
    expect(nuevo.servicios[1]).toMatchObject({ nombre: 'Mantenimiento', imagen: '' });
    expect(nuevo.servicios[1].id).toBeTruthy();
    expect(nuevo.condiciones).toBe(PROPUESTA.condiciones);
    expect(PROPUESTA.servicios[0].precio).toBe(500000);
    expect(detalleCambio('servicios', cambios.servicios, actual)).toEqual([
      '«Diseño web»: $ 500.000 → $ 450.000',
      'Nuevo opcional: «Mantenimiento» ($ 80.000/mes)',
      'Se quita: «Fotos»'
    ]);
  });
});

describe('POST /api/ia-propuesta con accion editar', () => {
  const handler = (db, { generar, activos = true } = {}) => crearHandler({
    db,
    sesionDe: async () => ({ uid: 'duenio', email: 'a@b.com' }),
    planesActivos: () => activos,
    generar,
    ahora: () => AHORA
  });
  const editar = (extra = {}) => post({ accion: 'editar', pedido: 'Bajá 10 % los precios', propuesta: PROPUESTA, ...extra });

  it('devuelve solo los cambios y cuenta aparte de las propuestas armadas', async () => {
    const { db, datos } = crearDb({ duenio: { ia: { [MES]: 3 } } });
    let pedido;
    const r = res();
    await handler(db, {
      generar: async p => {
        pedido = p;
        return { respuesta: 'Listo', resumen: [{ seccion: 'validezDias', texto: '30 días' }], cambios: { validezDias: 30 }, avisos: [] };
      }
    })(editar(), r);
    expect(r.estado).toBe(200);
    expect(r.cuerpo).toMatchObject({ cambios: { validezDias: 30 }, usados: 1, limite: LIMITE_EDICION_GRATIS });
    expect(datos.planes.duenio).toMatchObject({ ia: { [MES]: 3 }, iaEdicion: { [MES]: 1 } });
    expect(pedido.mensaje).toContain('Bajá 10 % los precios');
    expect(pedido.mensaje).not.toContain('base64');
  });

  it('en Gratis frena al llegar al límite y valida el pedido', async () => {
    const { db } = crearDb({ duenio: { iaEdicion: { [MES]: LIMITE_EDICION_GRATIS } } });
    let llamada = false;
    const generar = async () => { llamada = true; return {}; };
    const limite = res();
    await handler(db, { generar })(editar(), limite);
    const corto = res();
    await handler(db, { generar })(editar({ pedido: 'hola' }), corto);
    const sinPropuesta = res();
    await handler(db, { generar })(editar({ propuesta: null }), sinPropuesta);
    expect([limite.estado, corto.estado, sinPropuesta.estado]).toEqual([403, 400, 400]);
    expect(limite.cuerpo.error).toBe('limite-edicion');
    expect(llamada).toBe(false);
  });
});
