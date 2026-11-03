// Acceso de solo lectura para la vista del cliente: abre una propuesta o un portfolio
// publicado (las reglas solo lo permiten si el link está activo). Usa Firestore Lite,
// mucho más liviano que el SDK completo: el cliente no necesita tiempo real ni caché offline.
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore/lite';
import { firebaseConfig, PREFIJO_URL_LOGO } from './firebase-config.js';

const crearAteneaPublico = () => {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const leerPublico = async (coleccion, id) => {
    try {
      const snap = await getDoc(doc(db, coleccion, id));
      return snap.exists() && snap.data().payload ? snap.data() : null;
    } catch (e) {
      if (e.code === 'permission-denied') return null;
      throw e;
    }
  };

  const obtenerPublica = async id => {
    const datos = await leerPublico('proposals', id);
    return datos ? { payload: datos.payload, aceptacion: datos.aceptacion || null } : null;
  };

  const obtenerPortafolioPublico = async id => {
    const datos = await leerPublico('portfolios', id);
    return datos ? { payload: datos.payload } : null;
  };

  // Si quien abre el link es el dueño con su sesión iniciada, /api no cuenta su visita ni
  // le deja aceptar su propia propuesta. Auth se carga recién cuando hace falta el token,
  // después de mostrar la propuesta.
  let auth = null;
  const tokenDeSesion = async () => {
    auth ||= import('firebase/auth').then(({ getAuth }) => getAuth(app));
    const a = await auth;
    await a.authStateReady();
    return a.currentUser ? a.currentUser.getIdToken() : null;
  };

  return {
    auth: { tokenDeSesion },
    logos: { prefijoURL: PREFIJO_URL_LOGO },
    proposals: { obtenerPublica },
    portfolios: { obtenerPublico: obtenerPortafolioPublico }
  };
};

let AteneaDB = null;
let AteneaDBError = null;
try {
  AteneaDB = crearAteneaPublico();
} catch (e) {
  console.error('Firebase no pudo inicializarse:', e);
  AteneaDBError = e;
}

export { AteneaDB, AteneaDBError };
