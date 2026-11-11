import { describe, expect, it } from 'vitest';
import { contenidoAviso, contenidoPush, crearAvisador, enviarEmail } from '../api/_lib/avisos.js';
import { crearHandler as crearAceptar } from '../api/aceptar.js';
import { crearHandler as crearVisto } from '../api/visto.js';
import { vacio } from '../src/modelo.js';

const ID = 'AAAAAAAAAAAAAAAAAAA1';
const URL_APP = 'https://dealit.test';

const propuesta = (cambios = {}) => ({
  userId: 'duenio',
  publico: true,
  status: 'sent',
  title: 'Web',
  payload: {
    ...vacio(),
    propuesta: { titulo: 'Sitio <nuevo>', numero: '', fecha: '2026-10-01', validez: 30 },
    cliente: { ...vacio().cliente, nombre: 'Laura' },
    servicios: [{ id: 's1', nombre: 'Sitio', modalidad: 'unico', cantidad: 1, precio: 500, opcional: false }]
  },
  ...cambios
});

// Colecciones en memoria: users, planes y proposals.
const crearDb = colecciones => {
  const db = {
    collection: nombre => ({
      doc: id => ({
        id,
        get: async () => ({ exists: !!colecciones[nombre]?.[id], data: () => colecciones[nombre]?.[id] })
      })
    }),
    runTransaction: async fn => fn({
      get: async r => {
        const d = colecciones.proposals[r.id];
        return { exists: !!d, data: () => d, get: c => d?.[c] };
      },
      update: (r, cambios) => Object.assign(colecciones.proposals[r.id], cambios)
    })
  };
  return () => db;
};

const res = () => {
  const r = { estado: null, cuerpo: undefined };
  r.setHeader = () => {};
  r.status = e => { r.estado = e; return r; };
  r.json = c => { r.cuerpo = c; return r; };
  r.end = () => r;
  return r;
};
const post = body => ({ method: 'POST', headers: { 'content-type': 'application/json', host: 'dealit.test' }, body });

describe('contenido de los avisos', () => {
  it('aceptación: nombre, total, opcionales y link, con el HTML escapado', () => {
    const c = contenidoAviso({
      tipo: 'aceptada', id: ID, propuesta: propuesta(), urlApp: URL_APP,
      aceptacion: { nombre: 'Laura', inicial: 500, mensual: 0, moneda: 'USD', opcionales: [{ id: 'o', nombre: 'Logo' }] }
    });
    expect(c.asunto).toContain('Laura aceptó «Sitio <nuevo>»');
    expect(c.html).toContain('Sitio &lt;nuevo&gt;');
    expect(c.html).not.toContain('<nuevo>');
    expect(c.texto).toContain('Sumó: Logo.');
    expect(c.texto).toContain(`${URL_APP}/propuesta/${ID}`);
  });

  it('primera visita: quién la abrió', () => {
    const c = contenidoAviso({ tipo: 'vista', id: ID, propuesta: propuesta(), urlApp: URL_APP });
    expect(c.asunto).toBe('Laura abrió «Sitio <nuevo>»');
  });
});

describe('enviarEmail', () => {
  it('sin RESEND_API_KEY no manda nada', async () => {
    let llamado = false;
    const r = await enviarEmail({ para: 'a@b.com', asunto: 'x', html: '', texto: '' }, { entorno: {}, fetchFn: async () => { llamado = true; } });
    expect(r).toBe(false);
    expect(llamado).toBe(false);
  });

  it('con la clave llama a Resend con el remitente configurado', async () => {
    let pedido;
    const fetchFn = async (url, opciones) => { pedido = { url, ...opciones, cuerpo: JSON.parse(opciones.body) }; return { ok: true }; };
    await enviarEmail({ para: 'a@b.com', asunto: 'Hola', html: '<p>x</p>', texto: 'x' }, { entorno: { RESEND_API_KEY: 'k', EMAIL_REMITENTE: 'Dealit <avisos@dealit.test>' }, fetchFn });
    expect(pedido.url).toBe('https://api.resend.com/emails');
    expect(pedido.headers.Authorization).toBe('Bearer k');
    expect(pedido.cuerpo).toMatchObject({ from: 'Dealit <avisos@dealit.test>', to: ['a@b.com'], subject: 'Hola' });
  });
});

describe('a quién se avisa', () => {
  const avisador = (planes, activos = true) => {
    const enviados = [];
    const avisar = crearAvisador({
      db: crearDb({ users: { duenio: { email: 'duenio@estudio.com' } }, planes, proposals: {} }),
      planesActivos: () => activos,
      enviar: async m => { enviados.push(m); return true; }
    });
    return { avisar, enviados };
  };
  const aviso = { tipo: 'vista', id: ID, propuesta: propuesta(), urlApp: URL_APP };

  it('a Pro sí, a Gratis no', async () => {
    const pro = avisador({ duenio: { tipo: 'pro', estado: 'activa', vence: '2099-01-01T00:00:00Z' } });
    expect(await pro.avisar(aviso)).toBe('enviado');
    expect(pro.enviados[0].para).toBe('duenio@estudio.com');
    const gratis = avisador({});
    expect(await gratis.avisar(aviso)).toBe('gratis');
    expect(gratis.enviados).toHaveLength(0);
  });

  it('con los planes apagados se avisa a todos', async () => {
    const { avisar } = avisador({}, false);
    expect(await avisar(aviso)).toBe('enviado');
  });

  it('un error al mandar no rompe nada', async () => {
    const avisar = crearAvisador({
      db: crearDb({ users: { duenio: { email: 'a@b.com' } }, planes: {}, proposals: {} }),
      planesActivos: () => false,
      enviar: async () => { throw new Error('caído'); }
    });
    expect(await avisar(aviso)).toBe('error');
  });
});

describe('cuándo se dispara', () => {
  it('la primera visita avisa; las siguientes no', async () => {
    const avisos = [];
    const db = crearDb({ proposals: { [ID]: propuesta() } });
    const h = crearVisto({ db, uidDe: async () => null, avisar: async a => avisos.push(a) });
    await h(post({ id: ID }), res());
    await h(post({ id: ID }), res());
    expect(avisos.map(a => a.tipo)).toEqual(['vista']);
    expect(avisos[0].urlApp).toBe('https://dealit.test');
  });

  it('si vuelve a abrirla después de la pausa, avisa de nuevo (solo push, con las veces)', async () => {
    const avisos = [];
    const hace10min = new Date(Date.now() - 10 * 60 * 1000);
    const db = crearDb({ proposals: { [ID]: { ...propuesta(), vistoPrimero: hace10min, vistoUltimo: hace10min, vistas: 2 } } });
    await crearVisto({ db, uidDe: async () => null, avisar: async a => avisos.push(a) })(post({ id: ID }), res());
    expect(avisos[0]).toMatchObject({ tipo: 'revisita', vistas: 3 });
    const push = contenidoPush({ ...avisos[0], urlApp: URL_APP });
    expect(push.titulo).toContain('volvió a abrir');
    expect(push.cuerpo).toContain('3 veces');
    expect(push.tag).toBe(`vista-${ID}`);
  });

  it('una revisita no manda email', async () => {
    const emails = [];
    const pushes = [];
    const avisar = crearAvisador({
      db: crearDb({ users: { duenio: { email: 'a@b.com' } }, planes: {}, proposals: {} }),
      planesActivos: () => false,
      enviar: async m => { emails.push(m); return true; },
      enviarPush: async m => { pushes.push(m); return 1; }
    });
    expect(await avisar({ tipo: 'revisita', id: ID, propuesta: propuesta(), urlApp: URL_APP, vistas: 2 })).toBe('push');
    expect(emails).toHaveLength(0);
    expect(pushes).toHaveLength(1);
  });

  it('la aceptación avisa con el resumen, sin la copia de la propuesta', async () => {
    const avisos = [];
    const db = crearDb({ proposals: { [ID]: propuesta() } });
    const r = res();
    await crearAceptar({ db, uidDe: async () => null, ahora: () => new Date('2026-10-06T12:00:00Z'), avisar: async a => avisos.push(a) })(
      post({ id: ID, nombre: 'Laura', acepto: true, opcionales: [] }), r);
    expect(r.estado).toBe(200);
    expect(avisos[0]).toMatchObject({ tipo: 'aceptada', aceptacion: { nombre: 'Laura', inicial: 500 } });
    expect(avisos[0].aceptacion.contenido).toBeUndefined();
  });
});
