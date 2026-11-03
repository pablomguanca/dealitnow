// Modo claro u oscuro de la app del dueño (panel, editor, cuenta). Las propuestas y la
// vista del cliente tienen su propio tema y no cambian. Por defecto sigue al sistema.

const CLAVE_MODO = 'dealit-modo';
const consultaOscuro = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null);

// 'claro' | 'oscuro' | 'sistema'
export const modoGuardado = () => {
  try {
    const modo = localStorage.getItem(CLAVE_MODO);
    return modo === 'claro' || modo === 'oscuro' ? modo : 'sistema';
  } catch {
    return 'sistema';
  }
};

export const esModoOscuro = () => document.documentElement.dataset.temaApp === 'oscuro';

export const aplicarModoApp = (modo = modoGuardado()) => {
  const oscuro = modo === 'oscuro' || (modo === 'sistema' && !!consultaOscuro()?.matches);
  document.documentElement.dataset.temaApp = oscuro ? 'oscuro' : 'claro';
  return oscuro;
};

export const guardarModoApp = modo => {
  try { localStorage.setItem(CLAVE_MODO, modo); } catch { }
  return aplicarModoApp(modo);
};

// Mientras no elija uno, acompaña los cambios del sistema (por ejemplo, de noche).
export const seguirModoDelSistema = alCambiar => {
  consultaOscuro()?.addEventListener('change', () => {
    if (modoGuardado() !== 'sistema') return;
    aplicarModoApp('sistema');
    alCambiar?.();
  });
};
