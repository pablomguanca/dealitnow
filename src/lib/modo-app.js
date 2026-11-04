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

// Cambia de modo con un efecto: el modo nuevo se abre en círculo desde el punto tocado
// (View Transitions). Donde no existe, los colores pasan con un fundido corto.
export const guardarModoApp = (modo, origen) => {
  try { localStorage.setItem(CLAVE_MODO, modo); } catch { }
  const raiz = document.documentElement;
  if (sinMovimiento()) return aplicarModoApp(modo);

  if (typeof document.startViewTransition === 'function') {
    const x = origen?.x ?? innerWidth / 2;
    const y = origen?.y ?? 0;
    const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transicion = document.startViewTransition(() => aplicarModoApp(modo));
    transicion.ready.then(() => {
      raiz.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
        { duration: 550, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => { });
    return modo === 'oscuro';
  }

  raiz.classList.add('cambiando-modo');
  const oscuro = aplicarModoApp(modo);
  setTimeout(() => raiz.classList.remove('cambiando-modo'), 450);
  return oscuro;
};
