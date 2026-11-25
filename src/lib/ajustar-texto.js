// Que ninguna palabra se corte ni se salga: los títulos grandes del portfolio se miden ya
// dibujados y, si alguna palabra no entra en su caja (fuentes anchas, palabras largas,
// celular), se achica la letra hasta que entre. El CSS no deja partir palabras.
// Corre al dibujar, cuando terminan de cargar las fuentes y cuando cambia el ancho.

const SELECTOR = [
  '.pf-hero__titulo',
  '.pf-hero__palabra',
  '.pf-hero__monograma',
  '.pf-hero__marca',
  '.pf-sobre__titulo',
  '.pf-sec__titulo',
  '.pf-caso__titulo',
  '.pf-contacto__titulo',
  '.pf-hero__datos dd',
  '.pf-caso__afiche-num'
].join(', ');

const ajustarUno = el => {
  el.style.fontSize = '';
  if (!el.clientWidth) return;
  let tam = parseFloat(getComputedStyle(el).fontSize);
  const minimo = tam * 0.4;
  for (let i = 0; i < 40 && el.scrollWidth > el.clientWidth + 1 && tam > minimo; i++) {
    tam *= 0.94;
    el.style.fontSize = `${tam.toFixed(2)}px`;
  }
};

export const ajustarTextos = raiz => {
  if (!raiz?.querySelectorAll) return;
  raiz.querySelectorAll(SELECTOR).forEach(ajustarUno);
};

const observados = new WeakSet();

// Ajusta ahora, al cargar las fuentes y cada vez que el documento cambia de ancho.
export const ajustarTextosSiempre = raiz => {
  if (!raiz || typeof window === 'undefined') return;
  ajustarTextos(raiz);
  document.fonts?.ready?.then(() => ajustarTextos(raiz));
  if (observados.has(raiz) || typeof ResizeObserver !== 'function') return;
  observados.add(raiz);
  let ancho = raiz.clientWidth;
  let pendiente = 0;
  new ResizeObserver(() => {
    if (raiz.clientWidth === ancho) return;
    ancho = raiz.clientWidth;
    cancelAnimationFrame(pendiente);
    pendiente = requestAnimationFrame(() => ajustarTextos(raiz));
  }).observe(raiz);
};
