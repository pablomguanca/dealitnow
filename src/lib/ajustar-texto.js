// Que ninguna palabra se corte ni se salga: los títulos grandes (propuesta y portfolio) se miden ya
// dibujados y, si alguna palabra no entra en su caja (fuentes anchas, palabras largas,
// celular), se achica la letra hasta que entre. El CSS no deja partir palabras.
// Corre al dibujar, cuando terminan de cargar las fuentes y cuando cambia el ancho.

const SELECTOR = [
  // Propuesta y presupuesto
  '.portada__titulo',
  '.portada__marca',
  '.presu__titulo',
  '.bloque__titulo',
  '.cierre__titulo',
  // Portfolio
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

// Palabras con guion entre letras («e-commerce», «multi-depósito»): el navegador las parte
// en el guion. Se envuelven en un span que no se corta (los títulos que no entran se
// achican después). No toca links de correo ni web, ni campos.
const CON_GUION = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+/gu;
const NO_TOCAR = 'script, style, svg, textarea, input, .pf-junto, [contenteditable], a[href^="mailto:"], a[href^="http"]';

export const protegerGuiones = raiz => {
  if (!raiz || typeof document === 'undefined') return;
  const textos = [];
  const recorrido = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (n.nodeValue.includes('-') && !n.parentElement?.closest(NO_TOCAR)
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
  });
  while (recorrido.nextNode()) textos.push(recorrido.currentNode);
  for (const nodo of textos) {
    const valor = nodo.nodeValue;
    CON_GUION.lastIndex = 0;
    if (!CON_GUION.test(valor)) continue;
    CON_GUION.lastIndex = 0;
    const partes = document.createDocumentFragment();
    let desde = 0;
    for (const m of valor.matchAll(CON_GUION)) {
      if (m.index > desde) partes.append(valor.slice(desde, m.index));
      const span = document.createElement('span');
      span.className = 'pf-junto';
      span.textContent = m[0];
      partes.append(span);
      desde = m.index + m[0].length;
    }
    if (desde < valor.length) partes.append(valor.slice(desde));
    nodo.replaceWith(partes);
  }
};

export const ajustarTextos = raiz => {
  if (!raiz?.querySelectorAll) return;
  protegerGuiones(raiz);
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
