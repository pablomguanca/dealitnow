// Firebase Admin para las funciones de Vercel. Las credenciales vienen de la variable
// secreta FIREBASE_SERVICE_ACCOUNT (el JSON de la cuenta de servicio, completo).
// Admin no pasa por las reglas de Firestore: cada función valida todo por su cuenta.
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const app = () => {
  if (getApps().length) return getApps()[0];
  const credenciales = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!credenciales) throw new Error('Falta la variable de entorno FIREBASE_SERVICE_ACCOUNT');
  return initializeApp({ credential: cert(JSON.parse(credenciales)) });
};

export const firestore = () => getFirestore(app());
export { FieldValue };

// Si quien llama tiene la sesión iniciada, devuelve su uid. Nunca falla: un token
// inválido o ausente se trata como visitante anónimo.
export const uidDeLaSolicitud = async req => {
  const encabezado = req.headers?.authorization || '';
  if (!encabezado.startsWith('Bearer ')) return null;
  try {
    const { uid } = await getAuth(app()).verifyIdToken(encabezado.slice(7));
    return uid;
  } catch {
    return null;
  }
};
