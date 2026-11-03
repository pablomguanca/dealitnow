// Botones y links con data-accion: cada módulo registra las acciones que atiende
// y un único oyente en el documento las despacha.

const manejadores = new Map();

// registrarAcciones({ 'nombre-accion': (boton, ev) => { … } })
export const registrarAcciones = mapa => {
  Object.entries(mapa).forEach(([accion, fn]) => manejadores.set(accion, fn));
};

export const instalarAcciones = () => {
  document.addEventListener('click', async ev => {
    const boton = ev.target.closest('[data-accion]');
    if (!boton) return;
    const accion = boton.dataset.accion;
    const fn = manejadores.get(accion);
    if (fn) await fn(boton, ev);
  });
};
