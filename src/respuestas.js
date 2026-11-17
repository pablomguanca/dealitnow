// Lo que el cliente puede responder además de aceptar: «No avanzo por ahora» (con el
// motivo) y «Pedir un cambio». Y el recordatorio al dueño cuando una propuesta enviada está
// por vencer sin respuesta. Módulo puro: lo usan el servidor (api/aceptar, api/visto) para
// validar y la app para mostrar lo mismo.
import { limpiarNombre, NOMBRE_MAX } from './aceptacion.js';
import { desdeISO, numero } from './lib/formato.js';
import { contenidoDelLink } from './planes.js';

export const MOTIVOS_RECHAZO = {
  precio: 'El precio no me cierra',
  tiempos: 'Los tiempos no me sirven',
  alcance: 'Necesito otra cosa',
  'otro-proveedor': 'Elegí otra opción',
  momento: 'No es el momento',
  otro: 'Otro motivo'
};

export const COMENTARIO_MAX = 500;
export const CAMBIO_MIN = 5;
export const CAMBIO_MAX = 1000;
// Pedidos de cambio por propuesta, y pausa entre uno y otro (para que no sea un chat).
export const CAMBIOS_MAX = 10;
export const PAUSA_CAMBIO_MS = 60 * 1000;

const limpiarTexto = (t, max) => (typeof t === 'string' ? t.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max) : '');
const error = (codigo, estado) => ({ error: codigo, estado });
const milisDe = v => (typeof v?.toMillis === 'function' ? v.toMillis() : v instanceof Date ? v.getTime() : typeof v === 'string' ? Date.parse(v) : null);

// El nombre es opcional: si viene, se limpia como en la aceptación.
const nombreOpcional = nombre => {
  const n = limpiarNombre(nombre);
  return n.length > NOMBRE_MAX ? n.slice(0, NOMBRE_MAX) : n;
};

const disponible = doc => {
  if (!doc || doc.publico !== true) return error('no-disponible', 404);
  if (doc.aceptacion) return error('ya-aceptada', 409);
  return null;
};

// «No avanzo por ahora». Devuelve { datos, nuevo } (nuevo: si antes no la había rechazado,
// para avisarle al dueño una sola vez) o { error, estado }.
export const validarRechazo = ({ doc, cuerpo }) => {
  const no = disponible(doc);
  if (no) return no;
  const motivo = typeof cuerpo?.motivo === 'string' && MOTIVOS_RECHAZO[cuerpo.motivo] ? cuerpo.motivo : '';
  if (!motivo) return error('motivo-invalido', 400);
  const comentario = limpiarTexto(cuerpo?.comentario, COMENTARIO_MAX);
  if (motivo === 'otro' && !comentario) return error('falta-comentario', 400);
  const nombre = nombreOpcional(cuerpo?.nombre);
  return {
    datos: { motivo, ...(comentario ? { comentario } : {}), ...(nombre ? { nombre } : {}) },
    nuevo: doc.status !== 'rejected'
  };
};

// «Pedir un cambio». Devuelve { datos } con el pedido (sin fecha: la pone quien guarda) o
// { error, estado }.
export const validarPedidoCambio = ({ doc, cuerpo, ahora = new Date() }) => {
  const no = disponible(doc);
  if (no) return no;
  const texto = limpiarTexto(cuerpo?.texto, CAMBIO_MAX);
  if (texto.length < CAMBIO_MIN) return error('falta-texto', 400);
  const previos = Array.isArray(doc.cambios) ? doc.cambios : [];
  if (previos.length >= CAMBIOS_MAX) return error('demasiados-cambios', 429);
  const ultimo = milisDe(previos[previos.length - 1]?.fecha);
  if (ultimo && ahora.getTime() - ultimo < PAUSA_CAMBIO_MS) return error('muy-seguido', 429);
  const nombre = nombreOpcional(cuerpo?.nombre);
  return { datos: { texto, ...(nombre ? { nombre } : {}) } };
};

export const MENSAJES_RESPUESTA = {
  'no-disponible': 'Esta propuesta ya no está disponible. Pedile a quien te la mandó un link nuevo.',
  'ya-aceptada': 'Esta propuesta ya fue aceptada.',
  'motivo-invalido': 'Elegí un motivo.',
  'falta-comentario': 'Contanos brevemente el motivo.',
  'falta-texto': 'Contá qué te gustaría cambiar.',
  'demasiados-cambios': 'Ya mandaste varios pedidos. Escribile directamente a quien te la mandó.',
  'muy-seguido': 'Esperá un minuto antes de mandar otro pedido.',
  'propia': 'Es tu propia propuesta: para probarlo, abrí el link en una ventana de incógnito.'
};

// Lo que el link del cliente necesita saber de sus respuestas: si dijo «No avanzo por
// ahora» (y sigue así: si el dueño la vuelve a compartir, ya no) y cuántos cambios pidió.
export const respuestaPublica = doc => {
  const cambios = Array.isArray(doc?.cambios) ? doc.cambios : [];
  return {
    rechazo: doc?.status === 'rejected' && doc.rechazo ? { motivo: doc.rechazo.motivo } : null,
    cambios: cambios.length,
    ultimoCambio: cambios[cambios.length - 1]?.fecha || null
  };
};

const fechaDe = v => {
  const ms = milisDe(v) ?? (typeof v?.toDate === 'function' ? v.toDate().getTime() : null);
  return Number.isFinite(ms) ? new Date(ms) : null;
};

// El último cambio que pidió el cliente si todavía no se atendió: sin aceptar y posterior a
// la última vez que el dueño la editó (si ya la tocó después, no hace falta seguir marcándolo).
export const cambioPendiente = p => {
  if (!p || p.aceptacion) return null;
  const cambios = Array.isArray(p.cambios) ? p.cambios : [];
  const ultimo = cambios[cambios.length - 1];
  if (!ultimo) return null;
  const pedido = fechaDe(ultimo.fecha);
  const editada = fechaDe(p.updatedAt);
  return !pedido || !editada || pedido > editada ? { ...ultimo, fecha: pedido } : null;
};

// ---------- Recordatorio antes del vencimiento ----------

export const DIAS_AVISO_VENCE = 3;
const DIA = 86400000;

// Fecha de hoy en Argentina, «AAAA-MM-DD».
const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' });
export const hoyArgentina = (ahora = new Date()) => formatoDia.format(ahora);

const isoDe = f => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;

// Último día de vigencia («AAAA-MM-DD»), o '' si no vence.
export const ultimoDia = contenido => {
  const fecha = desdeISO(contenido?.propuesta?.fecha);
  const dias = Math.max(0, Math.round(numero(contenido?.propuesta?.validez)));
  if (!fecha || !dias) return '';
  return isoDe(new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias));
};

const diasEntre = (desde, hasta) => Math.round((desdeISO(hasta) - desdeISO(desde)) / DIA);

// Propuesta enviada, sin respuesta y en sus últimos días: { vence, quedan } o null.
export const porVencer = (doc, ahora = new Date()) => {
  if (!doc || doc.publico !== true || doc.aceptacion || doc.status !== 'sent') return null;
  const vence = ultimoDia(contenidoDelLink(doc));
  if (!vence) return null;
  const quedan = diasEntre(hoyArgentina(ahora), vence);
  return quedan < 0 || quedan > DIAS_AVISO_VENCE ? null : { vence, quedan };
};

// Si hay que avisarle al dueño (tarea diaria). Una vez por vencimiento: si el dueño lo
// extiende y vuelve a quedar cerca, avisa de nuevo.
export const recordatorioPendiente = (doc, ahora = new Date()) => {
  const p = porVencer(doc, ahora);
  return p && doc.recordatorio?.vence !== p.vence ? p : null;
};

// «hoy», «mañana» o «el jueves 20 de noviembre».
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const venceTexto = (vence, quedan) => {
  if (quedan === 0) return 'hoy';
  if (quedan === 1) return 'mañana';
  const f = desdeISO(vence);
  return f ? `el ${DIAS_SEMANA[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]}` : 'en pocos días';
};

// Mensaje para que el dueño le recuerde a su cliente (por WhatsApp o copiado).
export const mensajeRecordatorio = ({ cliente = '', titulo = '', vence = '', quedan = null, link = '' }) => {
  const nombre = String(cliente).trim().split(/\s+/)[0];
  return [
    `Hola${nombre ? ` ${nombre}` : ''}! Te escribo por la propuesta «${String(titulo).trim() || 'que te mandé'}»${vence ? `: vence ${venceTexto(vence, quedan)}` : ''}.`,
    '¿Pudiste verla? Si tenés alguna duda o querés ajustar algo, decime y lo vemos.',
    ...(link ? [link] : [])
  ].join('\n');
};
