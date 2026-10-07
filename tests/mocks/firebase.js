// Modo demo (npm run dev:demo): reemplaza src/firebase.js por una base en memoria
// guardada en localStorage, y simula las funciones de /api con las mismas reglas del
// servidor. Sirve para probar la app de punta a punta sin tocar Firebase.
//   /                 → el dueño, con sesión iniciada
//   /p/DEMO0000000000000001 → el cliente, sin sesión (abrilo en otra pestaña)
// Para empezar de cero: localStorage.removeItem('dealit-demo') y recargar.
import { validarAceptacion } from '../../src/aceptacion.js';
import { ejemplo } from '../../src/modelo.js';

const CLAVE = 'dealit-demo';
const ID_DEMO = 'DEMO0000000000000001';
const UID = 'demo-duenio';

const hoy = () => new Date().toISOString().slice(0, 10);
const semilla = () => {
  const payload = ejemplo();
  payload.propuesta.fecha = hoy();
  const ahora = new Date().toISOString();
  return {
    [ID_DEMO]: {
      userId: UID, title: payload.propuesta.titulo, clientName: payload.cliente.empresa,
      amount: 4570, status: 'sent', theme: 'elegante-oscuro', publico: true, payload,
      createdAt: ahora, updatedAt: ahora
    }
  };
};

const leer = () => {
  const guardados = JSON.parse(localStorage.getItem(CLAVE) || 'null');
  if (guardados) return guardados;
  const nuevos = semilla(); // se guarda ya: los IDs de los servicios tienen que ser estables
  localStorage.setItem(CLAVE, JSON.stringify(nuevos));
  return nuevos;
};
const guardar = docs => {
  localStorage.setItem(CLAVE, JSON.stringify(docs));
  emitir();
};

// Firestore devuelve Timestamps: se imitan con { toDate }.
const FECHAS = ['createdAt', 'updatedAt', 'vistoPrimero', 'vistoUltimo'];
const comoFirestore = (id, d) => {
  const doc = { id, ...structuredClone(d) };
  for (const k of FECHAS) if (doc[k]) doc[k] = { toDate: () => new Date(d[k]) };
  if (doc.aceptacion?.fecha) doc.aceptacion.fecha = { toDate: () => new Date(d.aceptacion.fecha) };
  return doc;
};

const oyentes = new Set();
const emitir = () => {
  const docs = Object.entries(leer()).filter(([, d]) => d.userId === UID).map(([id, d]) => comoFirestore(id, d));
  setTimeout(() => oyentes.forEach(cb => cb(docs)), 20);
};
window.addEventListener('storage', e => { if (e.key === CLAVE) emitir(); });

const esCliente = location.pathname.startsWith('/p/');
// Sin sesión al empezar si se cerró sesión antes (para probar el editor sin cuenta).
const USUARIO = { uid: UID, email: 'demo@dealit.test', displayName: 'Cuenta demo', emailVerified: true };
let usuario = esCliente || localStorage.getItem(CLAVE + ':sin-sesion') ? null : USUARIO;
const oyentesSesion = new Set();
let n = 0;

const actualizarDoc = (id, cambios) => {
  const docs = leer();
  if (!docs[id]) throw Object.assign(new Error('not-found'), { code: 'not-found' });
  Object.assign(docs[id], cambios, { updatedAt: new Date().toISOString() });
  guardar(docs);
};

export const AteneaDB = {
  auth: {
    getUser: () => usuario,
    getUid: () => usuario?.uid,
    onAuthChange: cb => {
      oyentesSesion.add(cb);
      setTimeout(() => cb(usuario), 30);
      return () => oyentesSesion.delete(cb);
    },
    signInGoogle: async () => {
      usuario = USUARIO;
      localStorage.removeItem(`${CLAVE}:sin-sesion`);
      oyentesSesion.forEach(cb => cb(usuario));
    },
    signOut: async () => {
      usuario = null;
      localStorage.setItem(`${CLAVE}:sin-sesion`, '1');
    },
    enviarVerificacion: async () => {},
    comprobarVerificacion: async () => true,
    recuperarPassword: async () => {},
    usaPassword: () => false,
    eliminarCuenta: async () => { localStorage.removeItem(CLAVE); },
    tokenDeSesion: async () => (usuario ? 'token-demo' : null)
  },
  logos: { prefijoURL: 'https://demo.invalid/', subir: async () => { throw new Error('Sin Storage en el modo demo'); } },
  perfil: {
    obtener: async () => JSON.parse(localStorage.getItem(`${CLAVE}:perfil`) || '{}'),
    guardar: async datos => { localStorage.setItem(`${CLAVE}:perfil`, JSON.stringify(datos)); }
  },
  proposals: {
    nuevoId: () => `DEMO${String(Date.now()).slice(-12)}${String(++n).padStart(4, '0')}`,
    crear: async (datos, id) => {
      const docs = leer();
      const ahora = new Date().toISOString();
      docs[id] = { status: 'draft', ...datos, userId: UID, createdAt: ahora, updatedAt: ahora };
      guardar(docs);
      return id;
    },
    obtener: async id => (leer()[id] ? comoFirestore(id, leer()[id]) : null),
    obtenerPublica: async id => {
      const d = leer()[id];
      if (!d || d.publico !== true) return null;
      const doc = comoFirestore(id, d);
      return { payload: doc.payload, aceptacion: doc.aceptacion || null };
    },
    actualizar: async (id, cambios) => actualizarDoc(id, cambios),
    borrar: async id => { const docs = leer(); delete docs[id]; guardar(docs); },
    escuchar: cb => { oyentes.add(cb); emitir(); return () => oyentes.delete(cb); }
  }
};
export const AteneaDBError = null;

// API simulada con las mismas validaciones que api/visto.js y api/aceptar.js.
const respuesta = (estado, cuerpo) => new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
  status: estado, headers: { 'Content-Type': 'application/json' }
});
const fetchReal = window.fetch.bind(window);
window.fetch = async (url, opciones = {}) => {
  const ruta = typeof url === 'string' ? url : url.url;
  if (!ruta.startsWith('/api/')) return fetchReal(url, opciones);
  await new Promise(r => setTimeout(r, 300));
  const cuerpo = JSON.parse(opciones.body || '{}');
  const uid = opciones.headers?.Authorization ? UID : null;
  const docs = leer();
  const doc = docs[cuerpo.id];
  if (ruta === '/api/visto') {
    if (!doc || doc.publico !== true) return respuesta(404, { error: 'no-disponible' });
    if (uid !== doc.userId) {
      const ahora = new Date().toISOString();
      doc.vistas = (doc.vistas || 0) + 1;
      doc.vistoUltimo = ahora;
      doc.vistoPrimero ||= ahora;
      guardar(docs);
    }
    return respuesta(204);
  }
  if (ruta === '/api/aceptar') {
    if (doc && uid === doc.userId) return respuesta(403, { error: 'propia' });
    const { datos, error, estado } = validarAceptacion({ doc, cuerpo });
    if (error) return respuesta(estado, { error });
    const fecha = new Date().toISOString();
    Object.assign(doc, { status: 'accepted', aceptacion: { ...datos, fecha }, updatedAt: fecha });
    guardar(docs);
    const { contenido, ...resumen } = datos;
    return respuesta(200, { aceptacion: { ...resumen, fecha } });
  }
  return respuesta(404, { error: 'ruta-desconocida' });
};
