// Guía de primeros pasos del editor sin cuenta (la pinta controlador/guia.js): tres pasos
// para quien recién elige su rubro y no sabe qué hacer con el ejemplo cargado.
//   1. «editar»: cambió el cliente y los servicios o precios respecto de cómo arrancó.
//   2. «ver»: miró la propuesta como la ve el cliente (vista Celular, o bajar la hoja).
//   3. «compartir»: crear la cuenta y mandar el link. Sin cuenta no se completa: queda como
//      el paso que sigue.

export const PASOS_GUIA = ['editar', 'ver', 'compartir'];

const texto = v => String(v ?? '').trim();

// Lo que se compara para saber si ya la hizo suya: el cliente y los servicios con su precio.
export const huellaGuia = estado => ({
  cliente: [texto(estado?.cliente?.nombre), texto(estado?.cliente?.empresa)].join('|'),
  servicios: (Array.isArray(estado?.servicios) ? estado.servicios : [])
    .map(s => `${texto(s?.nombre)}:${Number(s?.precio) || 0}`)
    .join('|')
});

export const editoClienteYPrecios = (base, estado) => {
  if (!base) return false;
  const ahora = huellaGuia(estado);
  return ahora.cliente !== base.cliente && ahora.servicios !== base.servicios;
};

// Pasos hechos, en el orden de la guía. «editar» queda hecho una vez logrado (aunque después
// deshaga); «ver» y «compartir» se anotan en `hechos` al hacerlos.
export const pasosHechos = (guia, estado) => {
  const hechos = Array.isArray(guia?.hechos) ? guia.hechos : [];
  return PASOS_GUIA.filter(paso => hechos.includes(paso)
    || (paso === 'editar' && editoClienteYPrecios(guia?.base, estado)));
};

// El paso que sigue: el primero sin hacer (null si hizo todos).
export const pasoActual = (guia, estado) => {
  const hechos = pasosHechos(guia, estado);
  return PASOS_GUIA.find(paso => !hechos.includes(paso)) ?? null;
};
