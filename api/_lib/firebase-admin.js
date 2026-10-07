// Firebase Admin para las funciones de Vercel. Las credenciales vienen de la variable
// secreta FIREBASE_SERVICE_ACCOUNT (el JSON de la cuenta de servicio, completo).
// Admin no pasa por las reglas de Firestore: cada función valida todo por su cuenta.
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

let cuenta;
const cuentaDeServicio = () => {
  if (cuenta) return cuenta;
  const credenciales = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!credenciales) throw new Error('Falta la variable de entorno FIREBASE_SERVICE_ACCOUNT');
  cuenta = JSON.parse(credenciales);
  return cuenta;
};

const app = () => getApps()[0] || initializeApp({ credential: cert(cuentaDeServicio()) });

export const firestore = () => getFirestore(app());
export { FieldValue };

// Verificación del token de sesión de Firebase con jose, como indica la documentación
// de Firebase para librerías JWT propias. No se usa firebase-admin/auth porque arrastra
// jwks-rsa, que carga jose con require() y rompe la función en el entorno de Vercel.
const CLAVES_GOOGLE = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let verificador;
const verificarToken = async token => {
  if (!verificador) {
    const { createRemoteJWKSet, jwtVerify } = await import('jose');
    const claves = createRemoteJWKSet(new URL(CLAVES_GOOGLE));
    const proyecto = cuentaDeServicio().project_id;
    verificador = t => jwtVerify(t, claves, {
      algorithms: ['RS256'],
      audience: proyecto,
      issuer: `https://securetoken.google.com/${proyecto}`
    });
  }
  const { payload } = await verificador(token);
  return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
};

// Si quien llama tiene la sesión iniciada, devuelve su uid. Nunca falla: un token
// inválido o ausente se trata como visitante anónimo.
export const uidDeLaSolicitud = async req => {
  const encabezado = req.headers?.authorization || '';
  if (!encabezado.startsWith('Bearer ')) return null;
  try {
    return await verificarToken(encabezado.slice(7));
  } catch {
    return null;
  }
};
