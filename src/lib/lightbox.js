import { $ } from './formato.js';

let lightboxItems = [];
let lightboxIndice = 0;

export const pintarLightbox = () => {
  const lightboxImg = $('#lightbox-img');
  const lightboxEpigrafe = $('#lightbox-epigrafe');
  const lightboxContador = $('#lightbox-contador');
  const lightboxAnt = $('#lightbox-ant');
  const lightboxSig = $('#lightbox-sig');
  if (!lightboxItems.length || !lightboxImg) return;
  const item = lightboxItems[lightboxIndice] || lightboxItems[0];
  lightboxImg.src = item.src;
  lightboxImg.alt = item.caption || 'Imagen ampliada';
  if (lightboxEpigrafe) {
    lightboxEpigrafe.textContent = item.caption || '';
    lightboxEpigrafe.hidden = !item.caption;
  }
  const varios = lightboxItems.length > 1;
  if (lightboxContador) {
    lightboxContador.textContent = varios ? `${lightboxIndice + 1} / ${lightboxItems.length}` : '';
  }
  if (lightboxAnt) lightboxAnt.hidden = !varios;
  if (lightboxSig) lightboxSig.hidden = !varios;
};

export const abrirLightboxDesdeNodo = disparador => {
  const dialogoLightbox = $('#dialogo-lightbox');
  if (!dialogoLightbox || typeof dialogoLightbox.showModal !== 'function') return;
  const srcClick = disparador.dataset.lightboxSrc;
  if (!srcClick) return;
  const grupo = disparador.dataset.lightboxGroup || '';
  const doc = $('#documento');
  if (grupo && doc) {
    const nodosGrupo = [...doc.querySelectorAll(`[data-lightbox-group="${CSS.escape(grupo)}"]`)];
    const vistos = new Set();
    lightboxItems = [];
    nodosGrupo.forEach(n => {
      const s = n.dataset.lightboxSrc;
      if (s && !vistos.has(s)) {
        vistos.add(s);
        lightboxItems.push({ src: s, caption: n.dataset.lightboxCaption || '' });
      }
    });
    lightboxIndice = Math.max(0, lightboxItems.findIndex(x => x.src === srcClick));
  } else {
    lightboxItems = [{ src: srcClick, caption: disparador.dataset.lightboxCaption || '' }];
    lightboxIndice = 0;
  }
  pintarLightbox();
  if (!dialogoLightbox.open) dialogoLightbox.showModal();
};

export const moverLightbox = delta => {
  if (lightboxItems.length <= 1) return;
  lightboxIndice = (lightboxIndice + delta + lightboxItems.length) % lightboxItems.length;
  pintarLightbox();
};

export const cerrarLightbox = () => {
  const dialogoLightbox = $('#dialogo-lightbox');
  if (dialogoLightbox?.open) dialogoLightbox.close();
};

export const estaAbiertoLightbox = () => !!$('#dialogo-lightbox')?.open;
