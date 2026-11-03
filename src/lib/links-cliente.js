// Links que abre el cliente. Módulo sin dependencias: lo usa src/main.jsx para decidir,
// antes de cargar nada más, si arranca la vista del cliente o la app del dueño.

export const PREFIJO = '#p=';
export const PREFIJO_PORTAFOLIO = '#f=';
export const RUTA_LINK = /^\/p\/([A-Za-z0-9]{20})\/?$/; // IDs de Firestore: 20 caracteres
export const RUTA_PORTAFOLIO = /^\/portafolio\/([A-Za-z0-9]{20})\/?$/;

// Qué link de cliente es la URL actual, o null si es la app del dueño.
export const tipoLinkCliente = () => {
  if (location.pathname.startsWith('/portafolio/')) return 'portafolio-corto';
  if (location.hash.startsWith(PREFIJO_PORTAFOLIO)) return 'portafolio-largo';
  if (location.pathname.startsWith('/p/')) return 'propuesta-corto';
  if (location.hash.startsWith(PREFIJO)) return 'propuesta-largo';
  return null;
};
