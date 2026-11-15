// Marca de «sesión iniciada» para Vercel: con ella, dealit.com.ar/ abre la app (el panel); sin
// ella, la landing (ver vercel.json). Se pone al entrar a la cuenta y se saca al cerrar sesión o
// cuando la app ve que no hay sesión. Solo dice a qué pantalla ir: no lleva datos de la cuenta,
// no da permisos y no reemplaza la sesión de Firebase.

export const COOKIE_SESION = 'dealit_sesion';

// 400 días: el máximo que aceptan los navegadores. Se renueva cada vez que se entra.
const DURACION = 400 * 24 * 60 * 60;

const escribir = (nombre, valor, segundos) => {
  try {
    const segura = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${nombre}=${valor}; Path=/; Max-Age=${segundos}; SameSite=Lax${segura}`;
  } catch { }
};

export const marcarSesion = () => escribir(COOKIE_SESION, '1', DURACION);

export const quitarMarcaSesion = () => {
  escribir(COOKIE_SESION, '', 0);
  // La cookie anterior (dealit_app) se ponía a cualquiera que abría la app, aun sin cuenta.
  escribir('dealit_app', '', 0);
};

// ¿Hay una sesión de Firebase guardada en este navegador? Firebase Auth la guarda en IndexedDB
// (firebaseLocalStorageDb). Lo usa la landing para mandar a la app a quien ya tiene cuenta y
// todavía no tiene la marca. Ante cualquier duda, false: se queda en la landing.
export const haySesionGuardada = () => new Promise(resolver => {
  try {
    if (!('indexedDB' in window)) return resolver(false);
    const pedido = indexedDB.open('firebaseLocalStorageDb');
    // Si la base no existía, se está creando ahora: no hay sesión. Se cancela para no dejarla creada.
    pedido.onupgradeneeded = () => { pedido.transaction.abort(); resolver(false); };
    pedido.onerror = () => resolver(false);
    pedido.onsuccess = () => {
      const db = pedido.result;
      try {
        const lectura = db.transaction('firebaseLocalStorage', 'readonly').objectStore('firebaseLocalStorage').getAllKeys();
        lectura.onsuccess = () => {
          db.close();
          resolver(lectura.result.some(clave => String(clave).startsWith('firebase:authUser:')));
        };
        lectura.onerror = () => { db.close(); resolver(false); };
      } catch {
        db.close();
        resolver(false);
      }
    };
  } catch {
    resolver(false);
  }
});
