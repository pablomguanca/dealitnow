import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { leerCookies, resolverRuta } from './src/lib/rutas-vercel.js';

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

// Las rutas de vercel.json también en local (dev y preview): la raíz muestra la landing o la
// app según la cookie, y /p/…, /cuenta, /empezar, etc. van a la app (src/lib/rutas-vercel.js).
const VERCEL = JSON.parse(readFileSync(resolve(import.meta.dirname, 'vercel.json'), 'utf8'));
const rutasVercel = () => {
  const middleware = (req, res, next) => {
    const url = new URL(req.url, 'http://local');
    // Los archivos (con extensión) y lo interno de Vite pasan derecho.
    if (/\.\w+$/.test(url.pathname) || url.pathname.startsWith('/@') || url.pathname.startsWith('/node_modules/')) return next();
    const pedido = { ruta: url.pathname, query: url.searchParams, cookies: leerCookies(req.headers.cookie), cabeceras: req.headers };
    let r = resolverRuta(VERCEL, pedido);
    // Las funciones de /api (la vista previa para WhatsApp y compañía) solo existen en Vercel:
    // en local, esa ruta se resuelve como para una persona.
    if (r?.destino?.startsWith('/api/')) r = resolverRuta(VERCEL, { ...pedido, cabeceras: {} });
    if (r?.redirigir) {
      res.statusCode = 302;
      res.setHeader('Location', r.redirigir);
      return res.end();
    }
    // Con cleanUrls, Vercel nombra los archivos sin .html (/app → app.html); Vite necesita el nombre real.
    if (r?.destino) req.url = (/\.\w+$/.test(r.destino) ? r.destino : `${r.destino}.html`) + url.search;
    next();
  };
  return {
    name: 'rutas-vercel',
    configureServer: servidor => { servidor.middlewares.use(middleware); },
    configurePreviewServer: servidor => { servidor.middlewares.use(middleware); }
  };
};

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    rutasVercel(),
    ...(mode === 'demo' ? [firebaseDemo()] : [])
  ],
  build: {
    rollupOptions: {
      input: {
        app: resolve(import.meta.dirname, 'app.html'),
        inicio: resolve(import.meta.dirname, 'inicio.html'),
        privacidad: resolve(import.meta.dirname, 'privacidad.html'),
        terminos: resolve(import.meta.dirname, 'terminos.html')
      }
    }
  },
  test: {
    include: ['tests/**/*.test.js']
  }
}));
