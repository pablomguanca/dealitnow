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

// Las claves del portfolio llevan «pf:» adelante y apuntan a los atributos de su editor
// (data-campo-pf, data-lista-pf, data-indice-pf, data-item-pf): 'pf:portafolio.titulo',
// 'pf:proyectos:2:titulo', 'pf:proyectos:2', 'pf:lista:galeria'. Los datos del emisor y los
// pasos son los mismos en los dos editores y van sin prefijo ('emisor.nombre', 'paso:Portada').
const sinPf = clave => (typeof clave === 'string' && clave.startsWith('pf:') ? clave.slice(3) : clave || '');
const pfDe = clave => (typeof clave === 'string' && clave.startsWith('pf:') ? 'pf:' : '');

// Selector del campo del editor (dentro de #editor-cuerpo) para una clave.
export const selectorDeClave = clave => {
  if (!clave || typeof clave !== 'string') return null;
  const pf = pfDe(clave) !== '';
  const c = sinPf(clave);
  if (!c) return null;
  const s = pf ? '-pf' : '';
  if (c.startsWith('paso:')) return pf ? null : `details.paso[data-corto="${comillas(c.slice(5))}"]`;
  if (c.startsWith('lista:')) return `.lista[data-lista${s}="${comillas(c.slice(6))}"]`;
  const partes = c.split(':');
  if (partes.length === 1) return `[data-campo${s}="${comillas(c)}"]`;
  const [lista, indice, item] = partes;
  if (!lista || !/^\d+$/.test(indice || '')) return null;
  const base = `.lista[data-lista${s}="${comillas(lista)}"] > [data-indice${s}="${indice}"]`;
  return item ? `${base} [data-item${s}="${comillas(item)}"]` : base;
};

// Clave de un campo del editor, a partir de sus datos (data-campo, o lista + índice + item).
// Con pf, la del editor del portfolio.
export const claveDeCampo = ({ campo, lista, indice, item, pf = false } = {}) => {
  const pre = pf ? 'pf:' : '';
  if (campo) return pre + campo;
  if (!lista || indice === undefined || indice === null || indice === '') return null;
  return pre + (item ? `${lista}:${indice}:${item}` : `${lista}:${indice}`);
};

// Un paso o una lista entera: se abren, no se escribe en ellos.
export const esRespaldo = clave => /^(paso|lista):/.test(sinPf(clave));
const esItem = clave => /^[^:]+:\d+$/.test(sinPf(clave));

// Campos por los que se pasa con «anterior / siguiente» en el modo foco: los del documento,
// en el orden en que se leen, sin repetir y sin los respaldos (pasos, listas, ítems enteros).
const esCampo = clave => !esRespaldo(clave) && !esItem(clave);
export const clavesNavegables = claves => [...new Set(claves.filter(c => c && esCampo(c)))];

// La clave vecina de la actual (paso -1 o +1), o null en los extremos o si no está.
export const claveVecina = (claves, actual, paso) => {
  const i = claves.indexOf(actual);
  return i < 0 ? null : claves[i + paso] ?? null;
};

// Tocar un ítem entero (la tarjeta de un servicio) en el modo foco abre su primer campo.
export const primerCampoDe = (claves, clave) => (esItem(clave)
  ? claves.find(c => c.startsWith(`${clave}:`)) || clave
  : clave);

// Para resaltar en el documento: la clave exacta y, si no está dibujada (un campo que no se
// ve, como el precio de un servicio incluido), la del ítem que la contiene.
export const clavesParaResaltar = clave => {
  if (!clave) return [];
  const partes = sinPf(clave).split(':');
  return partes.length === 3 ? [clave, `${pfDe(clave)}${partes[0]}:${partes[1]}`] : [clave];
};
