// Barra del total con «Aceptar» (barraClienteHTML en lib/render.js) en el link y en la
// vista previa del editor. Está siempre al final del documento; además se queda fija abajo
// solo cuando el cliente ya está decidiendo:
// - desde que llega a los opcionales («Para sumar, si querés») o a la inversión, o desde
//   que suma un opcional (el total cambia en vivo), y de ahí en adelante;
// - nunca sobre el cierre («¿Avanzamos?»), que ya tiene el botón de verdad;
// - desde el principio en el formato Presupuesto (el número es lo que se busca y la hoja es
//   corta) y cuando el cliente vuelve a abrir el link (ya leyó la propuesta: viene a decidir).
// Primero el valor, después el precio. Los portfolios no la fijan: su barra no tiene precio.

import { ctx } from './contexto.js';

const DESDE = '.servicios-grilla--opcionales, .resumen, .pagos';
const CLAVE_VISTO = 'dealit-visto:';

// La barra se dibuja de nuevo con cada cambio: lo que ya pasó se recuerda por documento.
let documento = null;
let alcanzada = false;
let enCierre = false;
let observadores = [];

const idDocumento = () => ctx.compartida?.id || ctx.propuestaId || 'local';

const reiniciarSiCambio = () => {
  const id = idDocumento();
  if (id === documento) return;
  documento = id;
  alcanzada = false;
  enCierre = false;
};

// En el link: ¿ya la había abierto en este navegador? Se anota la primera vez.
export const registrarVueltaDelCliente = id => {
  if (!id) return false;
  try {
    const volvio = localStorage.getItem(CLAVE_VISTO + id) === '1';
    localStorage.setItem(CLAVE_VISTO + id, '1');
    return volvio;
  } catch {
    return false;
  }
};

const aplicar = doc => {
  const barra = doc.querySelector(':scope > .barra-cliente');
  if (!barra) return;
  const desdeInicio = !!doc.querySelector('.presu') || (ctx.esCliente && ctx.clienteVolvio);
  const fija = (alcanzada || desdeInicio) && !enCierre;
  if (barra.classList.contains('barra-cliente--fija') !== fija) {
    barra.classList.toggle('barra-cliente--fija', fija);
  }
};

// El cliente sumó o sacó un opcional: el total ya importa.
export const marcarBarraAlcanzada = () => {
  reiniciarSiCambio();
  alcanzada = true;
};

export const prepararBarraCliente = doc => {
  observadores.forEach(o => o.disconnect());
  observadores = [];
  if (!doc || doc.classList.contains('doc--portafolio') || typeof IntersectionObserver !== 'function') return;
  reiniciarSiCambio();
  enCierre = false;
  aplicar(doc);

  const zonas = [...doc.querySelectorAll(DESDE)];
  if (zonas.length && !alcanzada) {
    const desde = new IntersectionObserver(entradas => {
      if (entradas.some(e => e.isIntersecting || e.boundingClientRect.top < 0)) {
        alcanzada = true;
        desde.disconnect();
        aplicar(doc);
      }
    });
    zonas.forEach(z => desde.observe(z));
    observadores.push(desde);
  }

  const cierre = doc.querySelector('.cierre');
  if (cierre) {
    const hasta = new IntersectionObserver(entradas => {
      const visible = entradas.some(e => e.isIntersecting);
      if (visible === enCierre) return;
      enCierre = visible;
      aplicar(doc);
    });
    hasta.observe(cierre);
    observadores.push(hasta);
  }
};
