// Cookie que le dice a Vercel qué mostrar en dealit.com.ar/: la app a quien ya la usa en este
// navegador y la landing a quien llega por primera vez (ver vercel.json). Solo dice a qué
// pantalla ir: no lleva datos de la cuenta ni da permisos.

export const COOKIE_APP = 'dealit_app';

// 400 días: el máximo que aceptan los navegadores. Se renueva cada vez que se abre la app.
const DURACION = 400 * 24 * 60 * 60;

export const recordarApp = () => {
  try {
    const segura = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_APP}=1; Path=/; Max-Age=${DURACION}; SameSite=Lax${segura}`;
  } catch { }
};
