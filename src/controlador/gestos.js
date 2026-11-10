// Gesto de app nativa: en el editor, deslizar desde el borde izquierdo vuelve a la lista,
// con la pantalla siguiendo al dedo. Solo en iPhone/iPad con Dealit instalada en la pantalla
// de inicio: ahí no hay gesto para volver. En Safari y en Android el sistema ya tiene el suyo
// (sumar este haría volver dos veces).

import { $ } from '../lib/formato.js';

const BORDE = 24; // px desde el borde izquierdo donde arranca el gesto
const UMBRAL = 0.33; // fracción del ancho para volver al soltar
const VELOCIDAD = 0.5; // px/ms: un deslizamiento rápido vuelve aunque sea corto

export const gestoVolverDisponible = () => {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const instalada = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  return ios && instalada;
};

export const instalarGestos = () => {
  if (!gestoVolverDisponible()) return;
  const body = document.body;
  let inicio = null;
  let arrastrando = false;
  let dx = 0;

  const soltar = volver => {
    // Si no vuelve, la pantalla regresa a su lugar con una transición corta.
    if (!volver) {
      body.classList.add('soltando-volver');
      setTimeout(() => body.classList.remove('soltando-volver'), 260);
    }
    body.classList.remove('arrastrando-volver');
    body.style.removeProperty('--arrastre');
    arrastrando = false;
    inicio = null;
    if (volver) $('#editor-volver')?.click();
  };

  document.addEventListener('touchstart', ev => {
    // Solo en el editor, con un dedo y sin un diálogo abierto.
    if (body.classList.contains('vista-inicio') || ev.touches.length !== 1 || document.querySelector('dialog[open]')) return;
    const t = ev.touches[0];
    if (t.clientX > BORDE) return;
    inicio = { x: t.clientX, y: t.clientY, tiempo: performance.now() };
    dx = 0;
  }, { passive: true });

  document.addEventListener('touchmove', ev => {
    if (!inicio) return;
    const t = ev.touches[0];
    dx = Math.max(0, t.clientX - inicio.x);
    const dy = Math.abs(t.clientY - inicio.y);
    if (!arrastrando) {
      if (dy > 12 && dy > dx) { inicio = null; return; } // es un scroll vertical
      if (dx < 8) return;
      arrastrando = true;
      body.classList.add('arrastrando-volver');
    }
    body.style.setProperty('--arrastre', `${dx}px`);
  }, { passive: true });

  const terminar = () => {
    if (!inicio) return;
    if (!arrastrando) { inicio = null; return; }
    const velocidad = dx / Math.max(1, performance.now() - inicio.tiempo);
    soltar(dx > innerWidth * UMBRAL || velocidad > VELOCIDAD);
  };
  document.addEventListener('touchend', terminar);
  document.addEventListener('touchcancel', () => inicio && soltar(false));
};
