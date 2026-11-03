import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Modo demo: la app usa una base simulada en lugar de Firebase (ver tests/mocks/firebase.js).
const FIREBASE_REAL = ['src/firebase.js', 'src/firebase-publico.js'].map(f => resolve(import.meta.dirname, f));
const firebaseDemo = () => ({
  name: 'firebase-demo',
  enforce: 'pre',
  resolveId(origen, importador) {
    if (importador && /firebase(-publico)?\.js$/.test(origen) && FIREBASE_REAL.includes(resolve(dirname(importador), origen))) {
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
