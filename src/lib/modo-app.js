// Modo claro u oscuro de la app del dueño (panel, editor, cuenta). Las propuestas y la
// vista del cliente tienen su propio tema y no cambian. Por defecto, modo claro.

const CLAVE_MODO = 'dealit-modo';

// 'claro' | 'oscuro'
export const modoGuardado = () => {
  try {
    return localStorage.getItem(CLAVE_MODO) === 'oscuro' ? 'oscuro' : 'claro';
  } catch {
    return 'claro';
  }
};

export const esModoOscuro = () => document.documentElement.dataset.temaApp === 'oscuro';

export const aplicarModoApp = (modo = modoGuardado()) => {
  document.documentElement.dataset.temaApp = modo === 'oscuro' ? 'oscuro' : 'claro';
  return modo === 'oscuro';
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
