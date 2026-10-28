// Procesamiento, compresión y limpieza de imágenes (logos, portadas Hero, proyectos, galerías y avatares).

export const LOGO_ANCHO_MAX = 400;
export const LOGO_ALTO_MAX = 160;
export const LOGO_MAX_BYTES = 18000;
export const LOGO_MAX_LINK = 6000; // En el link (#p=) entra todavía más chico para que la URL no se corte
export const LOGO_MAX_ARCHIVO = 25 * 1024 * 1024; // 25 MB para logos en crudo (se reducen en el navegador)
export const FOTO_MAX_ARCHIVO = 50 * 1024 * 1024; // 50 MB para fotos de portada Hero y galerías (se optimizan en el navegador)
export const LOGO_STORAGE_MAX_BYTES = 920 * 1024; // < 1 MB garantizado para cumplir las reglas de Firebase Storage

export const leerComoDataURL = archivo => new Promise((res, rej) => {
  const lector = new FileReader();
  lector.onload = () => res(lector.result);
  lector.onerror = rej;
  lector.readAsDataURL(archivo);
});

// Carga un File o Blob en un elemento <img> usando ObjectURL (sin inflar la RAM con Base64 en fotos de 10-50 MB)
const cargarImagenElemento = archivo => new Promise((res, rej) => {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && archivo instanceof Blob) {
    const objectUrl = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      res(img);
    };
    img.onerror = err => {
      URL.revokeObjectURL(objectUrl);
      rej(err);
    };
    img.src = objectUrl;
    return;
  }
  leerComoDataURL(archivo).then(src => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  }).catch(rej);
});

export const lienzoLogo = async (archivo, factor = 1) => {
  const img = await cargarImagenElemento(archivo);
  const w0 = img.naturalWidth || LOGO_ANCHO_MAX;
  const h0 = img.naturalHeight || LOGO_ALTO_MAX;
  const escala = Math.min(1, (LOGO_ANCHO_MAX * factor) / w0, (LOGO_ALTO_MAX * factor) / h0);
  const w = Math.max(1, Math.round(w0 * escala));
  const h = Math.max(1, Math.round(h0 * escala));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return c;
};

export const reducirLogo = async archivo => {
  if (archivo.type === 'image/svg+xml' && archivo.size <= LOGO_MAX_BYTES) {
    return leerComoDataURL(archivo);
  }
  for (const [factor, calidad] of [[1, 0.85], [0.75, 0.78], [0.55, 0.7]]) {
    const c = await lienzoLogo(archivo, factor);
    const webp = c.toDataURL('image/webp', calidad);
    const salida = webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/png');
    if (salida.length <= LOGO_MAX_BYTES * 1.37) return salida;
  }
  return (await lienzoLogo(archivo, 0.4)).toDataURL('image/jpeg', 0.7);
};

// Para Storage alcanza con reescalar a 2× (pantallas retina); no hace falta apretar a 18 KB.
export const logoParaSubir = async archivo => {
  const c = await lienzoLogo(archivo, 2);
  const aBlob = (tipo, cal) => new Promise(res => c.toBlob(res, tipo, cal));
  return (await aBlob('image/webp', 0.9)) || (await aBlob('image/png'));
};

// Procesa la imagen de portada o de un proyecto del portfolio/propuesta (soporta archivos crudos de hasta 50 MB)
export const procesarImagenProyecto = async (archivo, paraSubir = false, { anchoMax, altoMax, calidad, maxBytes } = {}) => {
  const img = await cargarImagenElemento(archivo);
  const maxW = anchoMax || (paraSubir ? 1600 : 960);
  const maxH = altoMax || (paraSubir ? 1200 : 720);
  const w0 = img.naturalWidth || maxW;
  const h0 = img.naturalHeight || maxH;
  const escala = Math.min(1, maxW / w0, maxH / h0);
  const w = Math.max(1, Math.round(w0 * escala));
  const h = Math.max(1, Math.round(h0 * escala));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
  }
  if (paraSubir) {
    const topeBytes = maxBytes || LOGO_STORAGE_MAX_BYTES;
    const calInicial = calidad || 0.86;
    const aBlob = (lienzo, tipo, cal) => new Promise(res => lienzo.toBlob(res, tipo, cal));
    for (const cal of [calInicial, 0.76, 0.64, 0.52]) {
      const blob = (await aBlob(c, 'image/webp', cal)) || (await aBlob(c, 'image/jpeg', cal));
      if (blob && blob.size <= topeBytes) return blob;
    }
    // Si aún supera el tope (p. ej. imagen muy compleja), reducimos levemente dimensiones
    const c2 = document.createElement('canvas');
    c2.width = Math.max(1, Math.round(w * 0.78));
    c2.height = Math.max(1, Math.round(h * 0.78));
    c2.getContext('2d').drawImage(c, 0, 0, c2.width, c2.height);
    return (await aBlob(c2, 'image/webp', 0.75)) || (await aBlob(c2, 'image/jpeg', 0.72));
  }
  const calLocal = calidad || 0.8;
  const webp = c.toDataURL('image/webp', calLocal);
  return webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', Math.max(0.65, calLocal - 0.04));
};

export const limpiarImgLink = src => (src && src.startsWith('data:') && src.length > LOGO_MAX_LINK * 2 ? '' : (src || ''));
