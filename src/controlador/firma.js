// Recuadro para firmar con el dedo (o el mouse) en el diálogo de aceptar. Guarda los
// trazos en el lienzo lógico de src/firma.js (FIRMA_ANCHO × FIRMA_ALTO), así la firma
// no depende del tamaño de la pantalla, y la dibuja en el canvas a la resolución real.

import { FIRMA_ANCHO, FIRMA_ALTO, trazosAFirma, validarFirma } from '../firma.js';

// Distancia mínima (en el lienzo lógico) entre dos puntos seguidos: menos puntos, mismo trazo.
const PASO_MIN = 2;

export const crearPadFirma = (canvas, { alCambiar = () => {} } = {}) => {
  let trazos = [];
  let actual = null;
  const c2d = canvas.getContext('2d');

  const escala = () => canvas.width / FIRMA_ANCHO;

  const dibujar = () => {
    const k = escala();
    c2d.clearRect(0, 0, canvas.width, canvas.height);
    c2d.strokeStyle = getComputedStyle(canvas).color || '#1F1D1A';
    c2d.lineWidth = 3.2 * k;
    c2d.lineCap = 'round';
    c2d.lineJoin = 'round';
    for (const t of trazos) {
      if (!t.length) continue;
      c2d.beginPath();
      c2d.moveTo(t[0].x * k, t[0].y * k);
      if (t.length === 1) c2d.lineTo(t[0].x * k + 0.01, t[0].y * k);
      for (let i = 1; i < t.length - 1; i++) {
        c2d.quadraticCurveTo(t[i].x * k, t[i].y * k, (t[i].x + t[i + 1].x) / 2 * k, (t[i].y + t[i + 1].y) / 2 * k);
      }
      if (t.length > 1) c2d.lineTo(t[t.length - 1].x * k, t[t.length - 1].y * k);
      c2d.stroke();
    }
  };

  // El canvas toma el ancho del diálogo; se mide recién cuando está a la vista.
  const ajustar = () => {
    const ancho = canvas.getBoundingClientRect().width;
    if (!ancho) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(ancho * dpr * FIRMA_ALTO / FIRMA_ANCHO);
    dibujar();
  };

  const punto = e => {
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.min(FIRMA_ANCHO, Math.max(0, (e.clientX - r.left) / r.width * FIRMA_ANCHO)),
      y: Math.min(FIRMA_ALTO, Math.max(0, (e.clientY - r.top) / r.height * FIRMA_ALTO))
    };
  };

  canvas.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    e.preventDefault();
    try { canvas.setPointerCapture?.(e.pointerId); } catch { }
    actual = [punto(e)];
    trazos.push(actual);
    dibujar();
  });
  canvas.addEventListener('pointermove', e => {
    if (!actual) return;
    e.preventDefault();
    // Los puntos intermedios que el navegador juntó en un solo evento (trazo más fino).
    // Algunos devuelven la lista vacía: entonces, el evento mismo.
    const juntados = e.getCoalescedEvents?.();
    const eventos = juntados?.length ? juntados : [e];
    for (const ev of eventos) {
      const p = punto(ev);
      const u = actual[actual.length - 1];
      if (Math.hypot(p.x - u.x, p.y - u.y) >= PASO_MIN) actual.push(p);
    }
    dibujar();
  });
  const soltar = () => {
    if (!actual) return;
    actual = null;
    alCambiar();
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  window.addEventListener('resize', ajustar);

  return {
    ajustar,
    limpiar() {
      trazos = [];
      actual = null;
      dibujar();
      alCambiar();
    },
    vacia: () => !trazos.some(t => t.length),
    // El trazo para el servidor, o '' si todavía no alcanza para una firma.
    firma: () => validarFirma(trazosAFirma(trazos))
  };
};
