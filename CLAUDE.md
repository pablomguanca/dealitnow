# Dealit

Propuestas comerciales que se comparten como link: el dueño (freelancer, agencia, estudio) arma la propuesta, la comparte, y el cliente la abre en el celular, suma opcionales y la acepta online. Mercado principal: Argentina (precios en ARS; USD fuera del país).

Repo: `github.com/pablomguanca/dealitnow`. Hosting en Vercel; datos en Firebase (proyecto `dealit-7f735`).

## Stack

- **Frontend:** React 18 + Vite + SCSS Partials. React dibuja la estructura (`src/components/`) y un controlador modular la maneja (`src/controlador/`, un módulo por área). `src/main.jsx` carga, según la URL, la app del dueño (`App.jsx`) o la vista del cliente (`ClienteApp.jsx`), cada una en su propio paquete.
- **Firebase:** Auth (Google y email/contraseña, con `signInWithPopup`), Firestore, Storage (logos) y App Check, con el SDK **modular**. La vista del cliente usa Firestore Lite (`src/firebase-publico.js`), solo lectura.
- **Avisos y confirmaciones:** react-hot-toast y un modal propio (`elegir` / `confirmar` en `src/controlador/avisos.js`). Nunca `alert`, `confirm` ni `prompt`.
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
| `src/main.jsx`, `src/App.jsx`, `src/ClienteApp.jsx`, `src/components/` | Estructura de la interfaz (React) |
| `src/controlador/` | Lógica de la interfaz por área: `iniciar.js` (dueño), `iniciar-cliente.js` (cliente), `contexto.js` (estado compartido), panel, editor, hoja en celular, plan, versiones, etc. |
| `src/planes.js` | Reglas de los planes (límite de envíos, quién es Pro), compartidas por la app y el servidor |
| `src/modelo.js` | Temas, valores por defecto, normalización y cálculo de totales |
| `src/resultados.js` | Cálculo de la pantalla Resultados (`/resultados`): ganado, conversión, embudo, en juego y a quién seguir hoy; la pantalla está en `controlador/resultados.js` |
| `src/aceptacion.js` | Reglas de aceptación, compartidas por la app y el servidor |
| `src/firebase.js`, `src/firebase-publico.js`, `src/firebase-config.js` | Firebase de la app del dueño, de la vista del cliente y su configuración |
| `src/link.js` | Links largos viejos (`#p=…`, propuesta comprimida); hoy solo para abrirlos |
| `src/lib/formato.js` | Utilidades de texto, números, fechas y DOM |
| `api/visto.js` | `POST /api/visto`: registra visitas al link |
| `api/aceptar.js` | `POST /api/aceptar`: aceptación del cliente, validada en una transacción |
| `api/activar.js` | `POST /api/activar`: el dueño activa el link; aplica el límite del plan |
| `api/suscripcion.js` | `POST /api/suscripcion`: crea la suscripción a Pro en Mercado Pago y devuelve el link de pago |
| `api/mercadopago.js` | `POST /api/mercadopago`: avisos de Mercado Pago (firma verificada); actualiza `planes/{uid}` |
| `api/_lib/` | Firebase Admin, verificación del token, utilidades HTTP, cliente de Mercado Pago y avisos por email al dueño (`avisos.js`: primera visita y aceptación, solo Pro) |
| `firestore.rules`, `storage.rules` | Reglas de seguridad (versionadas) |
| `index.html`, `terminos.html`, `privacidad.html` | Páginas; `/p/:id` se reescribe a `/` (ver `vercel.json`) |

## Modelo de datos (Firestore)

- `users/{uid}`: `email`, `displayName`, `photoURL`, `createdAt`, `emisor` (datos del negocio por defecto: nombre, rol, email, teléfono, web, presentación, logo del Storage de Dealit).
- `proposals/{id}`: `userId`, `title`, `clientName`, `amount`, `status` (`draft | sent | accepted | rejected`), `theme`, `payload` (la propuesta completa), `publico` (si el link está activo), `createdAt`, `updatedAt`.
  - Campos que **solo escribe el servidor**: `vistas`, `vistoPrimero`, `vistoUltimo`, `aceptacion`, `enviadaEn` (primer envío), `marca` (link con la marca de Dealit, en Gratis). Las reglas impiden que el navegador los toque.
  - Activar el link (`publico: true`) solo lo hace `api/activar`; el navegador solo puede desactivarlo.
  - Cualquiera puede leer una propuesta con `publico == true` por ID (el link del cliente). Solo el dueño puede listarlas.
  - `proposals/{id}/versiones/{vid}` (y lo mismo en `portfolios`): versiones guardadas por el dueño (`payload`, `title`, `motivo`, `createdAt`). Se crean o se borran; no se editan.
- `portfolios/{id}`: como las propuestas, sin aceptación. El navegador puede activar su link.
- `payload.plantilla`: la plantilla de origen (si se cargó completa); con `payload.tema.preset` define si la propuesta usa algo PRO (`usosPro` en `src/planes.js`).
- `planes/{uid}`: `tipo` (`gratis | pro`), `estado` (`activa | pendiente | pausada | cancelada`), `periodo`, `vence`, `mpSuscripcionId`, `envios` (`{ "2026-11": 3 }`, en hora de Argentina). Lo escribe **solo el servidor**; el dueño lo lee.

## Principios

- **El servidor decide.** Todo lo que importa (aceptación, total, vigencia, opcionales, visitas, y a futuro los límites del plan) se valida en `api/`. El navegador solo propone. Firebase Admin no pasa por las reglas, así que cada función valida todo por su cuenta.
- La lógica compartida entre app y servidor va en `src/` como módulo puro (ej. `aceptacion.js`) y tiene tests.
- Código, nombres, comentarios, textos de la interfaz y mensajes de commit en **español** (rioplatense en la interfaz: «abrila», «compartí»).
- Commits con prefijo convencional: `feat:`, `fix:`, `chore:`.

## Forma de trabajo

- **Directo en `main`, sin ramas ni pull requests.** Los deploys de prueba de Vercel piden login por la Deployment Protection, así que lo que se pushea a `main` va derecho a producción.
- Por eso: verificar en local antes de pushear (`npm run check` y probar en `npm run dev:demo`), y pushear solo cuando el dueño lo pida.
- Si un cambio necesita publicar reglas o índices de Firebase, avisar y hacerlo **antes** del push.
- Secretos, solo como variables de entorno en Vercel y nunca en el repo: `FIREBASE_SERVICE_ACCOUNT` (JSON de la cuenta de servicio), `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET` (Mercado Pago; primero las de prueba). Opcional: `APP_URL` (URL de vuelta tras pagar y de los links en los emails). Avisos por email (Resend): `RESEND_API_KEY` y `EMAIL_REMITENTE` (ej. `Dealit <avisos@tudominio.com>`, de un dominio verificado en Resend); sin la clave no se mandan.
- Interruptor de los planes: `PLANES_ACTIVOS=1` prende el límite de Gratis y la oferta de Pro para todos; `PLANES_PRUEBA` (emails separados por coma) los prende solo para esas cuentas. Apagado, los envíos se cuentan pero no se frenan (ver `api/_lib/planes-activos.js`).

## Planes (freemium, definido el 2026-10-07)

Planes: **Gratis · Pro · Estudio**.

- **Sin cuenta:** una propuesta en el navegador. No puede compartir, guardar ni bajar PDF, y lo impreso con Ctrl+P lleva marca de agua.
- **Vencimiento:** Pro sigue mientras `vence` (próximo cobro) + 3 días de margen esté por delante. Si el cobro no entra, vuelve solo a Gratis; con la fecha pasada, la app consulta `/api/sincronizar` una vez.
- **Gratis:** hasta 100 borradores y 2 propuestas enviadas (links activados) por mes calendario. Incluye aceptación online, logo y colores propios y la marca «Propuesta creada con Dealit» (o «Portfolio creado…») obligatoria en el link y el PDF (campo `marca`, lo escribe `api/activar`). Los diseños y plantillas PRO se pueden probar en el editor, pero no enviar (`diseno-pro`); al imprimir llevan marca de agua. Sin seguimiento de vistas ni avisos por email.
- **Pro:** ARS 13.900/mes o 139.000/año; USD 9/mes o 90/año fuera de Argentina (los pesos se ajustan cada trimestre). Borradores y envíos ilimitados, sin marca, seguimiento completo (vistas, cuándo, avisos en vivo) y avisos por email al aceptar.
- **Estudio:** equipos de hasta 3 usuarios, alrededor de ARS 38.900/mes. Sale como «Próximamente» con lista de espera.
- Los límites se aplican en el servidor: activar un link pasa por una función de Vercel y las reglas no dejan que el navegador lo haga solo.
- Pagos con Mercado Pago Suscripciones dentro de la app. La landing va en este mismo repo (sin WordPress).
- La idea: que el usuario gratis viva el momento «mi cliente aceptó», pero que quien trabaja en serio choque el límite cada mes.
