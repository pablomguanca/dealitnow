// Video de la propuesta o del portfolio («Contale un poco más a tu cliente con un video»).
// Módulo puro, compartido por el editor y la vista del cliente: a partir del link que pega
// el dueño arma el reproductor. Nunca se usa el link tal cual en un iframe: se reconoce el
// servicio, se extrae el ID y se arma la URL de inserción oficial.
//
// Servicios: YouTube (videos, Shorts y en vivo), Vimeo, Loom, Google Drive y archivos de
// video directos (https, .mp4/.webm/.mov/.m4v), por ejemplo en Dropbox o un hosting propio.

const RE_YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

const aUrl = valor => {
  const t = String(valor || '').trim();
  if (!t) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
};

const host = url => url.hostname.toLowerCase().replace(/^(www|m)\./, '');

// Segundos de inicio de YouTube (?t=90, ?t=1m30s, ?start=90).
const segundosYoutube = url => {
  const t = url.searchParams.get('t') || url.searchParams.get('start') || '';
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  return m ? (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0) : 0;
};

const youtube = url => {
  const h = host(url);
  let id = '';
  let vertical = false;
  if (h === 'youtu.be') id = url.pathname.split('/')[1] || '';
  else if (h === 'youtube.com' || h === 'music.youtube.com' || h === 'youtube-nocookie.com') {
    const partes = url.pathname.split('/').filter(Boolean);
    if (partes[0] === 'watch') id = url.searchParams.get('v') || '';
    else if (['embed', 'shorts', 'live', 'v'].includes(partes[0])) {
      id = partes[1] || '';
      vertical = partes[0] === 'shorts';
    }
  } else return null;
  if (!RE_YOUTUBE_ID.test(id)) return null;
  const inicio = segundosYoutube(url);
  return {
    proveedor: 'youtube',
    nombre: 'YouTube',
    id,
    vertical,
    // youtube-nocookie: no deja cookies hasta que el cliente le da play.
    embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1${inicio ? `&start=${inicio}` : ''}`,
    miniatura: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    enlace: `https://www.youtube.com/watch?v=${id}${inicio ? `&t=${inicio}s` : ''}`
  };
};

const vimeo = url => {
  const h = host(url);
  if (h !== 'vimeo.com' && h !== 'player.vimeo.com') return null;
  const partes = url.pathname.split('/').filter(Boolean);
  const i = partes.findIndex(p => /^\d{5,12}$/.test(p));
  if (i < 0) return null;
  const id = partes[i];
  // Videos «no listados»: llevan un hash después del ID o en ?h=.
  const hash = url.searchParams.get('h') || (/^[a-f0-9]{6,20}$/i.test(partes[i + 1] || '') ? partes[i + 1] : '');
  return {
    proveedor: 'vimeo',
    nombre: 'Vimeo',
    id,
    vertical: false,
    embed: `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1${hash ? `&h=${hash}` : ''}`,
    miniatura: '',
    enlace: `https://vimeo.com/${id}${hash ? `/${hash}` : ''}`
  };
};

const loom = url => {
  if (host(url) !== 'loom.com') return null;
  const m = url.pathname.match(/^\/(?:share|embed)\/([a-f0-9]{32})/i);
  if (!m) return null;
  return {
    proveedor: 'loom',
    nombre: 'Loom',
    id: m[1],
    vertical: false,
    embed: `https://www.loom.com/embed/${m[1]}?autoplay=1&hide_owner=true&hide_share=true`,
    miniatura: '',
    enlace: `https://www.loom.com/share/${m[1]}`
  };
};

const drive = url => {
  if (host(url) !== 'drive.google.com') return null;
  const id = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/)?.[1] || url.searchParams.get('id') || '';
  if (!/^[A-Za-z0-9_-]{10,}$/.test(id)) return null;
  return {
    proveedor: 'drive',
    nombre: 'Google Drive',
    id,
    vertical: false,
    embed: `https://drive.google.com/file/d/${id}/preview`,
    miniatura: '',
    enlace: `https://drive.google.com/file/d/${id}/view`
  };
};

// Archivo de video directo (solo https, para que se vea dentro de la propuesta segura).
const archivo = url => {
  if (url.protocol !== 'https:' || !/\.(mp4|webm|mov|m4v)$/i.test(url.pathname)) return null;
  // Dropbox: con ?dl=0 muestra su página; con raw=1 entrega el archivo.
  if (host(url) === 'dropbox.com') {
    url.searchParams.delete('dl');
    url.searchParams.set('raw', '1');
  }
  return {
    proveedor: 'archivo',
    nombre: 'Video',
    id: '',
    vertical: false,
    embed: '',
    archivo: url.href,
    miniatura: '',
    enlace: url.href
  };
};

// Reconoce el link. null si no es un video que se pueda mostrar.
export const analizarVideo = valor => {
  const url = aUrl(valor);
  if (!url) return null;
  return youtube(url) || vimeo(url) || loom(url) || drive(url) || archivo(url);
};

export const SERVICIOS_VIDEO = 'YouTube, Vimeo, Loom, Google Drive o un link directo a un archivo .mp4';

// Texto de ayuda del editor según lo que pegó.
export const estadoVideo = valor => {
  if (!String(valor || '').trim()) return { tipo: 'vacio', texto: `Pegá el link de ${SERVICIOS_VIDEO}.` };
  const v = analizarVideo(valor);
  if (!v) return { tipo: 'error', texto: `No reconocemos ese link. Usá uno de ${SERVICIOS_VIDEO}.` };
  const extra = v.proveedor === 'drive'
    ? ' Revisá que el archivo esté compartido como «Cualquier persona con el enlace».'
    : v.proveedor === 'youtube' ? ' Tip: si no querés que aparezca en tu canal, subilo como «No listado».' : '';
  return { tipo: 'ok', texto: `Video de ${v.nombre} listo.${extra}`, video: v };
};

export const vacioVideo = () => ({ url: '', titulo: '', texto: '' });

export const normalizarVideo = (v, limpiarTexto = x => String(x ?? '')) => {
  const d = v && typeof v === 'object' ? v : {};
  return {
    url: limpiarTexto(d.url).trim().slice(0, 600),
    titulo: limpiarTexto(d.titulo).slice(0, 120),
    texto: limpiarTexto(d.texto).slice(0, 600)
  };
};
