// GET /api/vista-previa?tipo=propuesta|portafolio&id=… — la vista previa del link compartido
// (WhatsApp, Telegram, Facebook, iMessage, LinkedIn, Slack…). Esos lectores no ejecutan
// JavaScript: leen las etiquetas og: del HTML. vercel.json manda acá solo a esos lectores
// (por su user-agent) cuando piden /p/… o /portafolio/…; las personas abren la app como siempre.
//
// La imagen es el logo que el dueño cargó en esa propuesta o portfolio, en cualquier plan; sin
// logo, el ícono de Dealit. Se usa la misma versión que ve el cliente (contenidoDelLink).
import { firestore } from './_lib/firebase-admin.js';
import { urlAppDe } from './_lib/avisos.js';
import { contenidoDelLink } from '../src/planes.js';
import { ID_PROPUESTA } from '../src/aceptacion.js';

const TIPOS = {
  propuesta: {
    coleccion: 'proposals',
    ruta: 'p',
    titulo: 'Tenés una propuesta para revisar',
    descripcion: 'Abrí el link para ver la propuesta completa, sumar opcionales y confirmarla.'
  },
  portafolio: {
    coleccion: 'portfolios',
    ruta: 'portafolio',
    titulo: 'Te compartieron un portfolio',
    descripcion: 'Abrí el link para ver los trabajos, los servicios y cómo contactarte.'
  }
};

const esc = texto => String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Solo logos publicados por https (los del Storage de Dealit); nunca data: ni http.
export const logoDe = contenido => {
  const logo = String(contenido?.emisor?.logo || '').trim();
  return /^https:\/\/[^\s"'<>]+$/.test(logo) && logo.length <= 1000 ? logo : '';
};

export const htmlVistaPrevia = ({ titulo, descripcion, url, imagen, nombre }) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${esc(titulo)}</title>
<meta name="robots" content="noindex">
<meta name="description" content="${esc(descripcion)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(nombre || 'Dealit')}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(imagen)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(descripcion)}">
<meta name="twitter:image" content="${esc(imagen)}">
</head>
<body><p><a href="${esc(url)}">${esc(titulo)}</a></p></body>
</html>
`;

export const crearHandler = ({ db }) => async (req, res) => {
  const tipo = TIPOS[req.query?.tipo] ? req.query.tipo : 'propuesta';
  const config = TIPOS[tipo];
  const id = String(req.query?.id || '');
  const app = urlAppDe(req);
  const url = `${app}/${config.ruta}/${encodeURIComponent(id)}`;
  let contenido = null;
  if (ID_PROPUESTA.test(id)) {
    try {
      const snap = await db().collection(config.coleccion).doc(id).get();
      if (snap.exists && snap.get('publico') === true) contenido = contenidoDelLink(snap.data());
    } catch { /* sin datos, va la vista previa genérica */ }
  }
  const imagen = logoDe(contenido) || `${app}/iconos/icono-512.png`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Unos minutos en la caché de Vercel: si cambia el logo, se ve enseguida en los links nuevos.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
  return res.status(200).send(htmlVistaPrevia({ ...config, url, imagen, nombre: contenido?.emisor?.nombre }));
};

export default crearHandler({ db: firestore });
