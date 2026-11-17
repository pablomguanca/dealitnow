// Historial de deshacer y rehacer del editor (módulo puro, sin DOM).
//
// Guarda fotos del documento (texto JSON) en una lista con un puntero: la foto en
// `indice` es lo que se ve. Deshacer mueve el puntero para atrás; rehacer, para adelante;
// un cambio nuevo descarta lo que se podía rehacer.
//
// Escribir de corrido en el mismo campo es un solo paso, como en cualquier editor de
// texto: se junta con el anterior mientras no haya una pausa (`pausa`) y el paso no lleve
// abierto más de `tramo`. Quitar, mover, elegir una opción o una plantilla son pasos
// propios (`agrupar: false`).

export const PASOS_MAX = 100;
const PESO_MAX = 30_000_000; // caracteres en total, por si hay fotos pesadas en el documento
const PAUSA = 1000;
const TRAMO = 5000;

export const crearHistorial = ({ pasosMax = PASOS_MAX, pesoMax = PESO_MAX, pausa = PAUSA, tramo = TRAMO } = {}) => {
  // Cada entrada: { foto, lugar, grupo, inicio, ultimo, etiqueta }. La primera es la base:
  // cómo estaba el documento al abrirlo; no se deshace más atrás.
  let entradas = [];
  let indice = -1;
  let peso = 0;

  const recortar = () => {
    while (entradas.length > 1 && (entradas.length > pasosMax || peso > pesoMax) && indice > 0) {
      peso -= entradas.shift().foto.length;
      indice--;
    }
  };

  // Arranca de cero con el documento tal como se abrió.
  const iniciar = foto => {
    entradas = [{ foto, lugar: null, grupo: null, inicio: 0, ultimo: 0, etiqueta: '' }];
    indice = 0;
    peso = foto.length;
  };

  return {
    iniciar,

    actual: () => entradas[indice]?.foto ?? null,
    iniciado: () => indice >= 0,

    // Anota el documento después de un cambio. Devuelve true si sumó (o amplió) un paso.
    // grupo: identifica el campo que se está escribiendo (null = paso propio).
    registrar(foto, { grupo = null, lugar = null, etiqueta = '', ahora = Date.now() } = {}) {
      if (indice < 0) {
        iniciar(foto);
        return false;
      }
      const tope = entradas[indice];
      if (tope.foto === foto) return false;
      // Lo que se podía rehacer deja de existir.
      if (indice < entradas.length - 1) {
        entradas.splice(indice + 1).forEach(e => { peso -= e.foto.length; });
      }
      const juntar = indice > 0 && grupo && tope.grupo === grupo
        && ahora - tope.ultimo < pausa && ahora - tope.inicio < tramo;
      if (juntar) {
        peso += foto.length - tope.foto.length;
        tope.foto = foto;
        tope.ultimo = ahora;
        recortar();
        return true;
      }
      entradas.push({ foto, lugar, grupo, inicio: ahora, ultimo: ahora, etiqueta });
      indice++;
      peso += foto.length;
      recortar();
      return true;
    },

    puedeDeshacer: () => indice > 0,
    puedeRehacer: () => indice >= 0 && indice < entradas.length - 1,

    // Devuelven { foto, lugar, etiqueta } del paso aplicado (lugar: dónde fue el cambio
    // que se deshizo o rehízo, para mostrarlo), o null si no hay nada.
    deshacer() {
      if (indice <= 0) return null;
      const deshecho = entradas[indice];
      indice--;
      entradas[indice].grupo = null; // lo próximo que se escriba es un paso nuevo
      return { foto: entradas[indice].foto, lugar: deshecho.lugar, etiqueta: deshecho.etiqueta };
    },
    rehacer() {
      if (indice < 0 || indice >= entradas.length - 1) return null;
      indice++;
      const rehecho = entradas[indice];
      rehecho.grupo = null;
      return { foto: rehecho.foto, lugar: rehecho.lugar, etiqueta: rehecho.etiqueta };
    },

    // Posición del puntero: sirve para saber si el último paso sigue siendo uno dado.
    posicion: () => indice,
    // Cierra el paso abierto: lo próximo que se escriba empieza uno nuevo.
    cortar() {
      if (entradas[indice]) entradas[indice].grupo = null;
    }
  };
};
