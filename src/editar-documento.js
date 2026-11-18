// Tocar el documento para editarlo: en el editor, cada texto de la vista previa lleva
// data-editar con la clave del campo que lo arma, y tocarlo abre ese campo en el editor.
// Al revés, enfocar un campo resalta su bloque en el documento.
//
// Claves:
//   'propuesta.titulo'        → el campo [data-campo="propuesta.titulo"]
//   'servicios:3:nombre'      → el campo «nombre» del ítem 3 de la lista de servicios
//   'servicios:3'             → el ítem 3 entero (la tarjeta del servicio)
//   'lista:testimonios'       → la lista entera
//   'paso:Inversión'          → el paso del editor (el <details data-corto>)
//
// La vista del cliente y el PDF no llevan nada de esto: render.js solo lo agrega con
// { editable: true }, que pasa el editor del dueño.

const comillas = v => String(v).replace(/["\\]/g, '\\$&');

// Devuelve la función que arma el atributo: con editable en false, no agrega nada.
export const atributoEditar = editable => (editable
  ? clave => (clave ? ` data-editar="${String(clave).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"` : '')
  : () => '');

// Selector del campo del editor (dentro de #editor-cuerpo) para una clave.
export const selectorDeClave = clave => {
  if (!clave || typeof clave !== 'string') return null;
  if (clave.startsWith('paso:')) return `details.paso[data-corto="${comillas(clave.slice(5))}"]`;
  if (clave.startsWith('lista:')) return `.lista[data-lista="${comillas(clave.slice(6))}"]`;
  const partes = clave.split(':');
  if (partes.length === 1) return `[data-campo="${comillas(clave)}"]`;
  const [lista, indice, item] = partes;
  if (!lista || !/^\d+$/.test(indice || '')) return null;
  const base = `.lista[data-lista="${comillas(lista)}"] > [data-indice="${indice}"]`;
  return item ? `${base} [data-item="${comillas(item)}"]` : base;
};

// Clave de un campo del editor, a partir de sus datos (data-campo, o lista + índice + item).
export const claveDeCampo = ({ campo, lista, indice, item } = {}) => {
  if (campo) return campo;
  if (!lista || indice === undefined || indice === null || indice === '') return null;
  return item ? `${lista}:${indice}:${item}` : `${lista}:${indice}`;
};

// Campos por los que se pasa con «anterior / siguiente» en el modo foco: los del documento,
// en el orden en que se leen, sin repetir y sin los respaldos (pasos, listas, ítems enteros).
const esCampo = clave => !/^(paso|lista):/.test(clave) && !/^[^:]+:\d+$/.test(clave);
export const clavesNavegables = claves => [...new Set(claves.filter(c => c && esCampo(c)))];

// La clave vecina de la actual (paso -1 o +1), o null en los extremos o si no está.
export const claveVecina = (claves, actual, paso) => {
  const i = claves.indexOf(actual);
  return i < 0 ? null : claves[i + paso] ?? null;
};

// Tocar un ítem entero (la tarjeta de un servicio) en el modo foco abre su primer campo.
export const primerCampoDe = (claves, clave) => (/^[^:]+:\d+$/.test(clave || '')
  ? claves.find(c => c.startsWith(`${clave}:`)) || clave
  : clave);

// Para resaltar en el documento: la clave exacta y, si no está dibujada (un campo que no se
// ve, como el precio de un servicio incluido), la del ítem que la contiene.
export const clavesParaResaltar = clave => {
  if (!clave) return [];
  const partes = clave.split(':');
  return partes.length === 3 ? [clave, `${partes[0]}:${partes[1]}`] : [clave];
};
