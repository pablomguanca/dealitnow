import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Modo demo: la app usa una base simulada en lugar de Firebase (ver tests/mocks/firebase.js).
const firebaseDemo = () => ({
  name: 'firebase-demo',
  enforce: 'pre',
  resolveId(origen, importador) {
    if (
      (origen === './firebase.js' || origen === '../firebase.js') &&
      importador &&
      (resolve(importador) === resolve(import.meta.dirname, 'src/main.js') ||
       resolve(importador) === resolve(import.meta.dirname, 'src/hooks/useDealitController.js'))
    ) {
      return resolve(import.meta.dirname, 'tests/mocks/firebase.js');
    }
  }
});

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'demo' ? [firebaseDemo()] : [])
  ],
  build: {
    rollupOptions: {
      input: {
        app: resolve(import.meta.dirname, 'index.html'),
        privacidad: resolve(import.meta.dirname, 'privacidad.html'),
        terminos: resolve(import.meta.dirname, 'terminos.html')
      }
    }
  },
  test: {
    include: ['tests/**/*.test.js']
  }
}));
