# Dealit

Propuestas comerciales que se comparten como link: el cliente las abre en el celular, suma opcionales y las acepta.

## Desarrollo

Requiere Node 20 o superior.

```bash
npm install
npm run dev      # servidor local con recarga en caliente (usa tu Firebase real)
npm run dev:demo # modo demo: base simulada en el navegador, sin tocar Firebase
npm test         # tests unitarios (Vitest)
npm run lint     # ESLint
npm run build    # build de producción en dist/
npm run check    # lint + tests + build, lo mismo que corre CI
```

## Estructura

| Ruta | Qué hay |
| --- | --- |
| `src/main.js` | Interfaz: editor, panel «Mis propuestas», vista del cliente y cuenta |
| `src/modelo.js` | Temas, valores por defecto, normalización y cálculo de totales |
| `src/link.js` | Links largos (`#p=…`) con la propuesta comprimida |
| `src/firebase.js` | Auth, Firestore, Storage y App Check |
| `src/aceptacion.js` | Reglas de aceptación, compartidas por la app y el servidor |
| `api/` | Funciones de Vercel: `visto` (visitas al link) y `aceptar` (aceptación del cliente) |
| `src/lib/formato.js` | Utilidades de texto, números, fechas y DOM |
| `src/styles/` | Estilos (SCSS) |
| `tests/` | Tests unitarios; `tests/mocks/` tiene la base simulada del modo demo |
| `firestore.rules`, `storage.rules` | Reglas de seguridad de Firebase |

## Modo demo

Con `npm run dev:demo`, `/` es el panel del dueño y `/p/DEMO0000000000000001` es la vista del cliente (abrila en otra pestaña). Los datos quedan en el navegador; para empezar de cero, borrá la clave `dealit-demo` del localStorage.

## Deploy

- **Variables de entorno en Vercel:** `FIREBASE_SERVICE_ACCOUNT` con el JSON completo de la cuenta de servicio de Firebase (Production y Preview). Nunca va al repo.
- **Sitio:** Vercel construye con `npm run build` y publica `dist/` (ver `vercel.json`). Cada rama y pull request tiene su deploy de prueba.
- **Reglas e índices de Firebase:** `firebase deploy --only firestore:rules,firestore:indexes,storage`.
