import { describe, expect, it } from 'vitest';
import { analizarVideo, estadoVideo, normalizarVideo } from '../src/video.js';
import { normalizarPropuesta, normalizarPortafolio } from '../src/modelo.js';
import { generarPropuestaHTML, generarPortafolioHTML, videoSeccionHTML } from '../src/lib/render.js';

describe('analizarVideo', () => {
  it('reconoce YouTube en todos sus formatos', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'youtube.com/watch?v=dQw4w9WgXcQ&list=x',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/live/dQw4w9WgXcQ?si=abc'
    ]) {
      const v = analizarVideo(url);
      expect(v?.proveedor, url).toBe('youtube');
      expect(v.id).toBe('dQw4w9WgXcQ');
      expect(v.embed).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
      expect(v.miniatura).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    }
  });

  it('Shorts van en vertical y respeta el segundo de inicio', () => {
    expect(analizarVideo('https://youtube.com/shorts/dQw4w9WgXcQ').vertical).toBe(true);
    expect(analizarVideo('https://youtu.be/dQw4w9WgXcQ?t=1m30s').embed).toContain('start=90');
  });

  it('reconoce Vimeo (también no listado), Loom y Google Drive', () => {
    expect(analizarVideo('https://vimeo.com/76979871')).toMatchObject({ proveedor: 'vimeo', id: '76979871' });
    expect(analizarVideo('https://vimeo.com/76979871/abc123def0').embed).toContain('h=abc123def0');
    expect(analizarVideo('https://www.loom.com/share/0123456789abcdef0123456789abcdef').embed)
      .toBe('https://www.loom.com/embed/0123456789abcdef0123456789abcdef?autoplay=1&hide_owner=true&hide_share=true');
    expect(analizarVideo('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing').embed)
      .toBe('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview');
  });

  it('acepta archivos directos solo por https', () => {
    expect(analizarVideo('https://cdn.miweb.com/presentacion.mp4')).toMatchObject({ proveedor: 'archivo', archivo: 'https://cdn.miweb.com/presentacion.mp4' });
    expect(analizarVideo('http://cdn.miweb.com/presentacion.mp4')).toBeNull();
    expect(analizarVideo('https://www.dropbox.com/s/abc/video.mp4?dl=0').archivo).toContain('raw=1');
  });

  it('rechaza lo que no es un video', () => {
    for (const url of ['', 'hola', 'https://instagram.com/p/abc', 'javascript:alert(1)', 'https://youtube.com/watch?v=corto', 'https://ejemplo.com/foto.jpg']) {
      expect(analizarVideo(url), url).toBeNull();
    }
  });
});

describe('estadoVideo y normalizarVideo', () => {
  it('explica qué pasa con el link', () => {
    expect(estadoVideo('').tipo).toBe('vacio');
    expect(estadoVideo('cualquier cosa').tipo).toBe('error');
    expect(estadoVideo('https://youtu.be/dQw4w9WgXcQ')).toMatchObject({ tipo: 'ok' });
    expect(estadoVideo('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view').texto).toContain('Cualquier persona con el enlace');
  });

  it('normaliza y recorta', () => {
    expect(normalizarVideo(null)).toEqual({ url: '', titulo: '', texto: '' });
    expect(normalizarVideo({ url: '  https://youtu.be/x  ', titulo: 'a'.repeat(300) }).titulo).toHaveLength(120);
  });
});

describe('video en el documento', () => {
  const conVideo = { video: { url: 'https://youtu.be/dQw4w9WgXcQ', titulo: 'Mi propuesta en 2 minutos', texto: 'Hola' } };

  it('la propuesta y el portfolio lo guardan normalizado', () => {
    expect(normalizarPropuesta(conVideo).video.url).toBe('https://youtu.be/dQw4w9WgXcQ');
    expect(normalizarPropuesta({}).video).toEqual({ url: '', titulo: '', texto: '' });
    expect(normalizarPortafolio(conVideo).video.titulo).toBe('Mi propuesta en 2 minutos');
  });

  it('en la web muestra la portada con play; en el PDF, el link', () => {
    const web = videoSeccionHTML(conVideo.video, true);
    expect(web).toContain('data-video-reproducir');
    expect(web).toContain('data-video-embed="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(web).not.toContain('<iframe');
    const pdf = videoSeccionHTML(conVideo.video, false);
    expect(pdf).toContain('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(videoSeccionHTML({ url: 'no es un link' })).toBe('');
  });

  it('aparece como sección en la propuesta y en el portfolio', () => {
    const p = generarPropuestaHTML(normalizarPropuesta(conVideo));
    expect(p).toContain('id="sec-prop-video"');
    expect(p).toContain('Mi propuesta en 2 minutos');
    const pf = generarPortafolioHTML(normalizarPortafolio(conVideo));
    expect(pf).toContain('id="sec-video"');
  });

  it('escapa el texto del dueño', () => {
    const html = videoSeccionHTML({ url: 'https://youtu.be/dQw4w9WgXcQ', titulo: '', texto: '<script>x</script>' });
    expect(html).not.toContain('<script>');
  });
});
