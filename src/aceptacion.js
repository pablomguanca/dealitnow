// Reglas de la aceptación de una propuesta. Las usa el servidor (api/aceptar.js)
// para validar y registrar, y la app para mostrar el mismo resultado.
import { desdeISO, numero } from './lib/formato.js';
import { calcularTotales, normalizarPropuesta } from './modelo.js';

export const ID_PROPUESTA = /^[A-Za-z0-9]{20}$/;
export const NOMBRE_MIN = 2;
export const NOMBRE_MAX = 120;
const OPCIONALES_MAX = 50;

// La vigencia se cuenta en días calendario del emisor. Como el servidor no sabe su
// zona horaria, se da un margen de 14 h para que nadie pierda el último día.
const MARGEN_ZONA_MS = 14 * 3600 * 1000;

export const propuestaVencida = (contenido, ahora = new Date()) => {
  const fecha = desdeISO(contenido?.propuesta?.fecha);
  const dias = Math.max(0, Math.round(numero(contenido?.propuesta?.validez)));
  if (!fecha || !dias) return false;
  const finUltimoDia = Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias + 1);
  return ahora.getTime() > finUltimoDia + MARGEN_ZONA_MS;
};

export const limpiarNombre = nombre => (typeof nombre === 'string' ? nombre.trim().replace(/\s+/g, ' ') : '');

const error = (codigo, estado) => ({ error: codigo, estado });

// doc: el documento de Firestore de la propuesta. cuerpo: lo que mandó el cliente.
// Devuelve { datos } con lo que hay que guardar, o { error, estado } con el motivo.
export const validarAceptacion = ({ doc, cuerpo, ahora = new Date() }) => {
  if (!doc || doc.publico !== true) return error('no-disponible', 404);
  if (doc.aceptacion) return error('ya-aceptada', 409);

  const nombre = limpiarNombre(cuerpo?.nombre);
  if (nombre.length < NOMBRE_MIN || nombre.length > NOMBRE_MAX) return error('nombre-invalido', 400);
  if (cuerpo?.acepto !== true) return error('falta-conformidad', 400);

  // El logo ya se validó al guardar; acá no se descarta.
  const contenido = normalizarPropuesta(doc.payload, { logoValido: () => true });
  if (propuestaVencida(contenido, ahora)) return error('vencida', 410);

  const disponibles = new Map(contenido.servicios.filter(s => s.opcional).map(s => [s.id, s]));
  const pedidos = Array.isArray(cuerpo?.opcionales) ? cuerpo.opcionales : [];
  if (pedidos.length > OPCIONALES_MAX || pedidos.some(id => typeof id !== 'string' || !disponibles.has(id))) {
    return error('opcionales-invalidos', 400);
  }
  const sumados = new Set(pedidos);
  const totales = calcularTotales(contenido, sumados);

  return {
    datos: {
      nombre,
      opcionales: [...sumados].map(id => ({ id, nombre: disponibles.get(id).nombre })),
      inicial: totales.inicial.total,
      mensual: totales.mensual.total,
      moneda: contenido.inversion.moneda,
      // Copia de lo que se aceptó: si después se edita la propuesta, queda constancia.
      contenido: doc.payload
    }
  };
};

export const MENSAJES_ACEPTACION = {
  'no-disponible': 'Esta propuesta ya no está disponible. Pedile a quien te la mandó un link nuevo.',
  'ya-aceptada': 'Esta propuesta ya fue aceptada.',
  'nombre-invalido': 'Escribí tu nombre completo.',
  'falta-conformidad': 'Marcá la casilla para confirmar que aceptás la propuesta.',
  vencida: 'Esta propuesta venció. Pedile a quien te la mandó una versión actualizada.',
  'opcionales-invalidos': 'La propuesta cambió mientras la mirabas. Recargá la página y volvé a intentar.',
  'propia': 'Es tu propia propuesta: para probar la aceptación, abrí el link en una ventana de incógnito.'
};
