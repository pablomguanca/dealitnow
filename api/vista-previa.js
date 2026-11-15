// GET /api/vista-previa?tipo=propuesta|portafolio&id=… — la vista previa del link compartido
// (WhatsApp, Telegram, Facebook, iMessage, LinkedIn, Slack…). Esos lectores no ejecutan
// JavaScript: leen las etiquetas og: del HTML. vercel.json manda acá solo a esos lectores
// (por su user-agent) cuando piden /p/… o /portafolio/…; las personas abren la app como siempre.
//
// La imagen es el logo que el dueño cargó en esa propuesta o portfolio, en cualquier plan; sin
// logo, el ícono de Dealit. Se usa la misma versión que ve el cliente (contenidoDelLink).
//
// Con &imagen=1 devuelve el logo en un cuadrado (centrado, con margen y el color de su fondo):
// WhatsApp muestra chica, al costado, una imagen cuadrada, y enorme arriba una apaisada.
import { createHash } from 'node:crypto';
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

export const LADO_IMAGEN = 400;
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

const esc = texto => String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Solo logos del Storage de Firebase (los que sube Dealit), por https: el servidor los descarga
// para armar el cuadrado y no tiene que ir a buscar nada a otro lado.
export const logoDe = contenido => {
  const logo = String(contenido?.emisor?.logo || '').trim();
  return logo.length <= 1000 && /^https:\/\/(firebasestorage|storage)\.googleapis\.com\/[^\s"'<>]+$/.test(logo) ? logo : '';
};

export const htmlVistaPrevia = ({ titulo, descripcion, url, imagen, nombre, cuadrada }) => `<!DOCTYPE html>
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
${cuadrada ? `<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="${LADO_IMAGEN}">
<meta property="og:image:height" content="${LADO_IMAGEN}">
` : ''}<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(descripcion)}">
<meta name="twitter:image" content="${esc(imagen)}">
</head>
<body><p><a href="${esc(url)}">${esc(titulo)}</a></p></body>
</html>
`;

// El logo en un cuadrado de LADO_IMAGEN, ocupando el 80 %. El fondo es el color de la esquina
// del logo (así un logo sobre negro queda en un cuadrado negro); si es transparente, blanco.
export const logoCuadrado = async datos => {
  const { default: sharp } = await import('sharp');
  const { data } = await sharp(datos).ensureAlpha().extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  const fondo = data[3] > 200 ? { r: data[0], g: data[1], b: data[2], alpha: 1 } : { r: 255, g: 255, b: 255, alpha: 1 };
  const interior = Math.round(LADO_IMAGEN * 0.8);
  // Antes se le saca el borde liso que traiga el logo, para que aproveche el cuadrado.
  const recortado = await sharp(datos).trim({ threshold: 12 }).toBuffer().catch(() => datos);
  const logo = await sharp(recortado).resize(interior, interior, { fit: 'contain', background: fondo }).flatten({ background: fondo }).toBuffer();
  const margen = (LADO_IMAGEN - interior) / 2;
  return sharp(logo).extend({ top: margen, bottom: margen, left: margen, right: margen, background: fondo }).png().toBuffer();
};

const descargar = async (fetchFn, url) => {
  const respuesta = await fetchFn(url, { signal: AbortSignal.timeout(5000) });
  if (!respuesta.ok) throw new Error(`logo ${respuesta.status}`);
  const datos = Buffer.from(await respuesta.arrayBuffer());
  if (datos.length > MAX_LOGO_BYTES) throw new Error('logo demasiado grande');
  return datos;
};

export const crearHandler = ({ db, fetchFn = fetch }) => async (req, res) => {
  const tipo = TIPOS[req.query?.tipo] ? req.query.tipo : 'propuesta';
  const config = TIPOS[tipo];
  const id = String(req.query?.id || '');
  const app = urlAppDe(req);
  const url = `${app}/${config.ruta}/${encodeURIComponent(id)}`;
  const icono = `${app}/iconos/icono-512.png`;
  let contenido = null;
  if (ID_PROPUESTA.test(id)) {
    try {
      const snap = await db().collection(config.coleccion).doc(id).get();
      if (snap.exists && snap.get('publico') === true) contenido = contenidoDelLink(snap.data());
    } catch { /* sin datos, va la vista previa genérica */ }
  }
  const logo = logoDe(contenido);

  if (req.query?.imagen) {
    // Sin logo (o si no se puede armar el cuadrado), el ícono de Dealit, que ya es cuadrado.
    if (logo) {
      try {
        const png = await logoCuadrado(await descargar(fetchFn, logo));
        res.setHeader('Content-Type', 'image/png');
        // La URL lleva la versión del logo (&v=): si cambia el logo, cambia la URL.
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, immutable');
        return res.status(200).send(png);
      } catch { /* va el ícono */ }
    }
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
    res.setHeader('Location', icono);
    return res.status(302).end();
  }

  const version = logo ? createHash('sha256').update(logo).digest('hex').slice(0, 12) : '';
  const imagen = logo
    ? `${app}/api/vista-previa?tipo=${tipo}&id=${encodeURIComponent(id)}&imagen=1&v=${version}`
    : icono;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Unos minutos en la caché de Vercel: si cambia el logo, se ve enseguida en los links nuevos.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
  return res.status(200).send(htmlVistaPrevia({ ...config, url, imagen, nombre: contenido?.emisor?.nombre, cuadrada: !!logo }));
};

export default crearHandler({ db: firestore });
