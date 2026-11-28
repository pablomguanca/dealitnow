// Modo claro u oscuro de la app del dueño (panel, editor, cuenta). Las propuestas y la
// vista del cliente tienen su propio tema y no cambian. Tres opciones: 'claro' (por
// defecto), 'oscuro' y 'auto' (sigue al dispositivo y cambia si el dispositivo cambia).

const CLAVE_MODO = 'dealit-modo';
const MODOS = ['claro', 'oscuro', 'auto'];

// 'claro' | 'oscuro' | 'auto'
export const modoGuardado = () => {
  try {
    const modo = localStorage.getItem(CLAVE_MODO);
    return MODOS.includes(modo) ? modo : 'claro';
  } catch {
    return 'claro';
  }
};

const consultaOscuro = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null);

export const esModoOscuro = () => document.documentElement.dataset.temaApp === 'oscuro';

// En 'auto', si el dispositivo pasa de claro a oscuro (o al revés), la app lo sigue.
let siguiendoDispositivo = false;
const seguirDispositivo = () => {
  if (siguiendoDispositivo) return;
  const consulta = consultaOscuro();
  if (!consulta?.addEventListener) return;
  siguiendoDispositivo = true;
  consulta.addEventListener('change', () => {
    if (modoGuardado() === 'auto') aplicarModoApp('auto');
  });
};

export const aplicarModoApp = (modo = modoGuardado()) => {
  if (modo === 'auto') seguirDispositivo();
  const oscuro = modo === 'oscuro' || (modo === 'auto' && !!consultaOscuro()?.matches);
  document.documentElement.dataset.temaApp = oscuro ? 'oscuro' : 'claro';
  document.documentElement.dataset.modoApp = MODOS.includes(modo) ? modo : 'claro';
  return oscuro;
};

const sinMovimiento = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Cambia de modo con un fundido suave de los colores (sin efecto si se pidió menos movimiento).
export const guardarModoApp = modo => {
  try { localStorage.setItem(CLAVE_MODO, modo); } catch { }
  const raiz = document.documentElement;
  if (sinMovimiento()) return aplicarModoApp(modo);
  raiz.classList.add('cambiando-modo');
  const oscuro = aplicarModoApp(modo);
  setTimeout(() => raiz.classList.remove('cambiando-modo'), 450);
  return oscuro;
};
