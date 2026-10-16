# Dealit

Propuestas comerciales que se comparten como link: el dueño (freelancer, agencia, estudio) arma la propuesta, la comparte, y el cliente la abre en el celular, suma opcionales y la acepta online. Mercado principal: Argentina (precios en ARS; USD fuera del país).

Repo: `github.com/pablomguanca/dealitnow`. Hosting en Vercel; datos en Firebase (proyecto `dealit-7f735`).

## Stack

- **Frontend:** JavaScript sin framework (módulos ES) + SCSS, empaquetado con Vite. Toda la interfaz vive en `src/main.js` (editor, panel «Mis propuestas», vista del cliente, Mi cuenta).
- **Firebase:** Auth (Google y email/contraseña, con `signInWithPopup`), Firestore, Storage (logos) y App Check. Se usa el SDK **compat** (`firebase/compat/*`, estilo `db.collection(...)`), no el modular.
- **Servidor:** funciones de Vercel en `api/` (Node 22) con `firebase-admin/firestore`. El token de sesión se verifica con `jose`, **no** con `firebase-admin/auth` (arrastra `jwks-rsa`, que rompe la función en Vercel).
- **Tests:** Vitest. **Lint:** ESLint. **CI:** GitHub Actions corre lint + tests + build en cada push a `main`.

## Comandos

```bash
npm run dev      # local contra el Firebase real
npm run dev:demo # base simulada en el navegador (tests/mocks/firebase.js), sin tocar Firebase
npm run check    # lint + tests + build, lo mismo que CI
firebase deploy --only firestore:rules,firestore:indexes,storage   # reglas e índices
```

En modo demo, `/` es el panel del dueño y `/p/DEMO0000000000000001` la vista del cliente. Los datos quedan en la clave `dealit-demo` del localStorage.

## Estructura

| Ruta | Qué hay |
| --- | --- |
| `src/main.js` | Toda la interfaz |
| `src/modelo.js` | Temas, valores por defecto, normalización y cálculo de totales |
| `src/aceptacion.js` | Reglas de aceptación, compartidas por la app y el servidor |
| `src/firebase.js` | Auth, Firestore, Storage, App Check y operaciones de datos |
| `src/link.js` | Links largos viejos (`#p=…`, propuesta comprimida); hoy solo para abrirlos |
| `src/lib/formato.js` | Utilidades de texto, números, fechas y DOM |
| `api/visto.js` | `POST /api/visto`: registra visitas al link |
| `api/aceptar.js` | `POST /api/aceptar`: aceptación del cliente, validada en una transacción |
| `api/_lib/` | Firebase Admin, verificación del token y utilidades HTTP |
| `firestore.rules`, `storage.rules` | Reglas de seguridad (versionadas) |
| `index.html`, `terminos.html`, `privacidad.html` | Páginas; `/p/:id` se reescribe a `/` (ver `vercel.json`) |

## Modelo de datos (Firestore)

- `users/{uid}`: `email`, `displayName`, `photoURL`, `createdAt`, `emisor` (datos del negocio por defecto: nombre, rol, email, teléfono, web, presentación, logo del Storage de Dealit).
- `proposals/{id}`: `userId`, `title`, `clientName`, `amount`, `status` (`draft | sent | accepted | rejected`), `theme`, `payload` (la propuesta completa), `publico` (si el link está activo), `createdAt`, `updatedAt`.
  - Campos que **solo escribe el servidor**: `vistas`, `vistoPrimero`, `vistoUltimo`, `aceptacion`. Las reglas impiden que el navegador los toque.
  - Cualquiera puede leer una propuesta con `publico == true` por ID (el link del cliente). Solo el dueño puede listarlas.

## Principios

- **El servidor decide.** Todo lo que importa (aceptación, total, vigencia, opcionales, visitas, y a futuro los límites del plan) se valida en `api/`. El navegador solo propone. Firebase Admin no pasa por las reglas, así que cada función valida todo por su cuenta.
- La lógica compartida entre app y servidor va en `src/` como módulo puro (ej. `aceptacion.js`) y tiene tests.
- Código, nombres, comentarios, textos de la interfaz y mensajes de commit en **español** (rioplatense en la interfaz: «abrila», «compartí»).
- Commits con prefijo convencional: `feat:`, `fix:`, `chore:`.

## Forma de trabajo

- **Directo en `main`, sin ramas ni pull requests.** Los deploys de prueba de Vercel piden login por la Deployment Protection, así que lo que se pushea a `main` va derecho a producción.
- Por eso: verificar en local antes de pushear (`npm run check` y probar en `npm run dev:demo`), y pushear solo cuando el dueño lo pida.
- Si un cambio necesita publicar reglas o índices de Firebase, avisar y hacerlo **antes** del push.
- Secretos: `FIREBASE_SERVICE_ACCOUNT` (JSON de la cuenta de servicio) solo como variable de entorno en Vercel. Nunca va al repo.

## Planes (freemium, definido el 2026-10-07)

Planes: **Gratis · Pro · Estudio**.

- **Sin cuenta:** una propuesta en el navegador. No puede compartir, guardar ni bajar PDF, y lo impreso con Ctrl+P lleva marca de agua.
- **Gratis:** hasta 100 borradores y 5 propuestas enviadas (links activados) por mes calendario. Incluye aceptación online, logo y colores propios y la marca «Hecha con Dealit» en el link y el PDF. Sin seguimiento de vistas ni avisos por email.
- **Pro:** ARS 13.900/mes o 139.000/año; USD 9/mes o 90/año fuera de Argentina (los pesos se ajustan cada trimestre). Borradores y envíos ilimitados, sin marca, seguimiento completo (vistas, cuándo, avisos en vivo) y avisos por email al aceptar.
- **Estudio:** equipos de hasta 3 usuarios, alrededor de ARS 38.900/mes. Sale como «Próximamente» con lista de espera.
- Los límites se aplican en el servidor: activar un link pasa por una función de Vercel y las reglas no dejan que el navegador lo haga solo.
- Pagos con Mercado Pago Suscripciones dentro de la app. La landing va en este mismo repo (sin WordPress).
- La idea: que el usuario gratis viva el momento «mi cliente aceptó», pero que quien trabaja en serio choque el límite cada mes.
