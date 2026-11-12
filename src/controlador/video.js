// Video de la propuesta y del portfolio en la interfaz:
// · En el documento (editor y vista del cliente): al tocar la portada del video se carga el
//   reproductor (iframe del servicio o <video> para archivos directos). Hasta entonces solo
//   hay una imagen, así la propuesta abre rápido y no se cargan cookies de terceros.
// · En el editor: debajo del link, si se reconoce el video o qué hay que corregir.

import { $$, esc } from '../lib/formato.js';
import { estadoVideo } from '../video.js';

const reproducir = boton => {
  const marco = boton.closest('.video-bloque__marco');
  if (!marco) return;
  const embed = marco.dataset.videoEmbed;
  const archivo = marco.dataset.videoArchivo;
  const titulo = marco.dataset.videoTitulo || 'Video';
  if (embed && /^https:\/\//.test(embed)) {
    marco.innerHTML = `<iframe src="${esc(embed)}" title="${esc(titulo)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  } else if (archivo && /^https:\/\//.test(archivo)) {
    marco.innerHTML = `<video src="${esc(archivo)}" controls autoplay playsinline preload="metadata" title="${esc(titulo)}"></video>`;
  } else return;
  marco.classList.add('video-bloque__marco--activo');
};

export const pintarEstadosVideo = (raiz = document) => {
  $$('[data-video-url]', raiz).forEach(input => {
    const aviso = input.closest('[data-video-editor]')?.querySelector('[data-video-estado]');
    if (!aviso) return;
    const { tipo, texto } = estadoVideo(input.value);
    aviso.textContent = texto;
    aviso.dataset.tipo = tipo;
    input.setAttribute('aria-invalid', tipo === 'error' ? 'true' : 'false');
  });
};

export const instalarVideos = () => {
  document.addEventListener('click', ev => {
    const boton = ev.target.closest('[data-video-reproducir]');
    if (!boton) return;
    ev.preventDefault();
    reproducir(boton);
  });
  document.addEventListener('input', ev => {
    if (ev.target.matches?.('[data-video-url]')) pintarEstadosVideo(ev.target.closest('[data-video-editor]') || document);
  });
};
