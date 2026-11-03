// Configuración del proyecto de Firebase (dealit-7f735). Es pública: la seguridad la
// dan las reglas de Firestore y Storage, no ocultar estos valores.
export const firebaseConfig = {
  apiKey:            'AIzaSyA4fAtms8k5hOEvtFiTnf6B2ijg2jiWDtg',
  authDomain:        'dealitnow.vercel.app',
  projectId:         'dealit-7f735',
  storageBucket:     'dealit-7f735.firebasestorage.app',
  messagingSenderId: '837213426465',
  appId:             '1:837213426465:web:91f1c863f453efe950e460'
};

// URLs de descarga de los logos e imágenes subidos al Storage de Dealit.
export const PREFIJO_URL_LOGO = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/`;
