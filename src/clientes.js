// Clientes del dueño: sus propuestas agrupadas por cliente (empresa o, si no hay, nombre).
// Puro y sin datos propios: se arma con la lista de propuestas tal como llega de Firestore.
// La pantalla está en controlador/clientes.js.

const DIA = 86400000;

const texto = v => (v == null ? '' : String(v));

// Fechas de Firestore (Timestamp), ISO o Date → Date (o null).
const fechaDe = v => {
  if (!v) return null;
  const f = typeof v.toDate === 'function' ? v.toDate() : v instanceof Date ? v : new Date(v);
  return Number.isNaN(f.getTime()) ? null : f;
};

// El nombre con que se muestra el cliente: la empresa o, si no hay, la persona.
export const nombreCliente = p => texto(
  p.clientName || p.payload?.cliente?.empresa || p.payload?.cliente?.nombre
).trim().replace(/\s+/g, ' ');

// «Logística Sur», «logistica sur» y «LOGÍSTICA  SUR» son el mismo cliente.
export const claveCliente = nombre => texto(nombre)
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const ultimaActividad = p => [p.updatedAt, p.vistoUltimo, p.aceptacion?.fecha, p.createdAt]
  .map(fechaDe).filter(Boolean).sort((a, b) => b - a)[0] || null;

const sumarPorMoneda = lista => {
  const sumas = new Map();
  lista.forEach(p => {
    const moneda = p.aceptacion.moneda || p.payload?.inversion?.moneda || 'USD';
    sumas.set(moneda, (sumas.get(moneda) || 0) + (Number(p.aceptacion.inicial) || 0));
  });
  return [...sumas].map(([moneda, total]) => ({ moneda, total })).sort((a, b) => b.total - a.total);
};

/**
 * Agrupa las propuestas por cliente, con el más reciente primero.
 * Cada cliente trae: clave, nombre, contacto (persona y cargo, si la empresa es otra),
 * propuestas (más recientes primero), cantidad, aceptadas, enJuego (enviadas sin respuesta),
 * ganado (lo aceptado por moneda), ultima (fecha) y datos (cliente de la última propuesta,
 * para arrancar una nueva). Las propuestas sin cliente quedan en `sinCliente`.
 */
export const agruparClientes = (propuestas = []) => {
  const grupos = new Map();
  let sinCliente = 0;
  for (const p of propuestas) {
    const nombre = nombreCliente(p);
    const clave = claveCliente(nombre);
    if (!clave) {
      sinCliente += 1;
      continue;
    }
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(p);
  }

  const clientes = [...grupos].map(([clave, lista]) => {
    const orden = [...lista].sort((a, b) => (ultimaActividad(b) || 0) - (ultimaActividad(a) || 0));
    const reciente = orden[0];
    const datos = reciente.payload?.cliente || {};
    const nombre = nombreCliente(reciente);
    const persona = texto(datos.nombre).trim();
    const cargo = texto(datos.cargo).trim();
    const contacto = persona && claveCliente(persona) !== clave
      ? [persona, cargo].filter(Boolean).join(' · ')
      : cargo;
    const aceptadas = orden.filter(p => p.aceptacion);
    return {
      clave,
      nombre,
      contacto,
      propuestas: orden,
      cantidad: orden.length,
      aceptadas: aceptadas.length,
      enJuego: orden.filter(p => p.status === 'sent' && !p.aceptacion).length,
      ganado: sumarPorMoneda(aceptadas),
      ultima: ultimaActividad(reciente),
      datos: {
        nombre: persona,
        empresa: texto(datos.empresa).trim(),
        cargo
      }
    };
  }).sort((a, b) => (b.ultima || 0) - (a.ultima || 0));

  return { clientes, sinCliente };
};

// Sin movimiento hace más de 90 días: para marcarlo como cliente para retomar.
export const clienteDormido = (cliente, ahora = new Date()) =>
  !!cliente.ultima && ahora - cliente.ultima > 90 * DIA && cliente.enJuego === 0;
