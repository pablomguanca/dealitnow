# Dealit

Propuestas comerciales que se comparten como link: el dueño (freelancer, agencia, estudio) arma la propuesta, la comparte, y el cliente la abre en el celular, suma opcionales y la acepta online. Mercado principal: Argentina (precios en ARS; USD fuera del país).

Repo: `github.com/pablomguanca/dealitnow`. Hosting en Vercel; datos en Firebase (proyecto `dealit-7f735`).

## Stack

- **Frontend:** React 18 + Vite + SCSS Partials. React dibuja la estructura (`src/components/`) y un controlador modular la maneja (`src/controlador/`, un módulo por área). `src/main.jsx` carga, según la URL, la app del dueño (`App.jsx`) o la vista del cliente (`ClienteApp.jsx`), cada una en su propio paquete.
- **Firebase:** Auth (Google y email/contraseña, con `signInWithPopup`), Firestore, Storage (logos) y App Check, con el SDK **modular**. La vista del cliente usa Firestore Lite (`src/firebase-publico.js`), solo lectura.
- **Avisos y confirmaciones:** react-hot-toast y un modal propio (`elegir` / `confirmar` en `src/controlador/avisos.js`). Nunca `alert`, `confirm` ni `prompt`.
- **Servidor:** funciones de Vercel en `api/` (Node 22) con `firebase-admin/firestore`. El token de sesión se verifica con `jose`, **no** con `firebase-admin/auth` (arrastra `jwks-rsa`, que rompe la función en Vercel).
- **App de Android:** Capacitor 8 (`capacitor.config.json`, proyecto en `android/`). La app abre `https://dealit.com.ar` en una ventana nativa (`server.url`), así que cada push a `main` la actualiza sin publicar en la tienda; adentro solo va `movil/www/` (pantalla sin conexión). `src/nativo.js` suma lo nativo: botón «atrás», barras del sistema, pantalla de inicio, login con Google nativo (`@capacitor-firebase/authentication`; Google no deja entrar desde una ventana web embebida), compartir y PDF (complemento propio `ImprimirPlugin.java`). En el navegador no hace nada.
- **Tests:** Vitest. **Lint:** ESLint. **CI:** GitHub Actions corre lint + tests + build en cada push a `main`.

## Comandos

```bash
npm run dev      # local contra el Firebase real
npm run dev:demo # base simulada en el navegador (tests/mocks/firebase.js), sin tocar Firebase
npm run check    # lint + tests + build, lo mismo que CI
firebase deploy --only firestore:rules,firestore:indexes,storage   # reglas e índices
npm run android  # sincroniza y abre el proyecto en Android Studio (compila con Java 21, no con el 25 que trae Android Studio)
```

En modo demo, `/` es el panel del dueño y `/p/DEMO0000000000000001` la vista del cliente. Los datos quedan en la clave `dealit-demo` del localStorage.

## Estructura

| Ruta | Qué hay |
| --- | --- |
| `src/main.jsx`, `src/App.jsx`, `src/ClienteApp.jsx`, `src/components/` | Estructura de la interfaz (React) |
| `src/controlador/` | Lógica de la interfaz por área: `iniciar.js` (dueño), `iniciar-cliente.js` (cliente), `contexto.js` (estado compartido), panel, editor, hoja en celular, plan, versiones, etc. |
| `src/planes.js` | Reglas de los planes (límite de envíos, quién es Pro), compartidas por la app y el servidor |
| `src/modelo.js` | Temas, valores por defecto, normalización y cálculo de totales |
| `src/plantillas-catalogo.js` | Catálogo ampliado de plantillas de propuesta (rubros nuevos, 1 gratis y 13 PRO) con sus diseños (`TEMAS_CATALOGO`). `modelo.js` las suma a `PLANTILLAS` con `catalogo: true`: no van en los atajos del editor sino en «Explorar más plantillas» (pestaña Plantillas del panel) |
| `src/portfolios-catalogo.js` | Catálogo ampliado de plantillas de portfolio (10 rubros: 1 gratis y 9 PRO), con diseños de `TEMAS`. `modelo.js` las suma a `PLANTILLAS_PORTAFOLIO` con `catalogo: true`; se eligen en «Mis portfolios» y en el editor del portfolio |
| `src/video.js` | Video de la propuesta y del portfolio: reconoce links de YouTube, Vimeo, Loom, Google Drive y archivos .mp4/.webm por https, y arma la URL de inserción oficial (nunca el link tal cual). En el documento va como portada con play (`videoSeccionHTML` en `lib/render.js`); el reproductor se carga al tocarla (`controlador/video.js`) |
| `src/resultados.js` | Cálculo de la pantalla Resultados (`/resultados`): ganado, conversión, embudo, en juego y a quién seguir hoy; la pantalla está en `controlador/resultados.js` |
| `src/aceptacion.js` | Reglas de aceptación, compartidas por la app y el servidor |
| `src/firebase.js`, `src/firebase-publico.js`, `src/firebase-config.js` | Firebase de la app del dueño, de la vista del cliente y su configuración |
| `src/controlador/accion-email.js` | Vuelta del link de verificación de los emails de Firebase Auth. La URL de acción de las plantillas es la de Firebase (`dealit-7f735.firebaseapp.com/__/auth/action`) y la consola no deja cambiarla: verifica allá y «Continuar» vuelve a `/?verificado=<email>`. Avisa qué email quedó verificado y, si hay otra sesión abierta, ofrece entrar con la cuenta nueva. También resuelve `/accion?mode=verifyEmail`, por si algún día se puede apuntar ahí |
| `src/lib/formato.js` | Utilidades de texto, números, fechas y DOM |
| `api/visto.js` | `POST /api/visto`: registra visitas al link |
| `api/aceptar.js` | `POST /api/aceptar`: aceptación del cliente, validada en una transacción |
| `api/ia-propuesta.js` | `POST /api/ia-propuesta`: «Armá tu propuesta con IA» (en el código, «Contala y la armamos»). Gemini (Google AI Studio) arma la propuesta a partir de lo dictado (reglas, esquema y validación en `src/ia.js`; cliente en `api/_lib/gemini.js`, con `fetch` a `generateContent` y salida JSON con esquema); cuenta el uso del mes en `planes/{uid}.ia` |
| `api/activar.js` | `POST /api/activar`: el dueño activa o actualiza el link de una propuesta o, con `tipo: 'portafolio'`, de un portfolio; aplica el plan (límite de envíos, diseños PRO, marca, link congelado en Gratis y mismo cliente) |
| `api/suscripcion.js` | `POST /api/suscripcion`: crea la suscripción a Pro en Mercado Pago y devuelve el link de pago |
| `api/mercadopago.js` | `POST /api/mercadopago`: avisos de Mercado Pago (firma verificada); actualiza `planes/{uid}` |
| `api/cobro-mp.js` | Cobrar con el Mercado Pago de cada freelancer (OAuth, en una sola función por el límite de Vercel): `GET` recibe la vuelta del OAuth y guarda la cuenta; `POST` con `accion` `vincular` (URL para autorizar), `estado`, `desvincular` y `pagar` (el cliente, con la propuesta aceptada: crea el pago con el token del freelancer por el primer pago, calculado en el servidor). Lógica en `api/_lib/mp-connect.js`; en la app, `controlador/cobro.js` y `aceptar.js` |
| `api/push.js` | `POST /api/push`: alta y baja de las notificaciones push de cada dispositivo del dueño (navegador con Web Push, o app de Android con su token de Firebase Messaging), y aviso de prueba |
| `api/_lib/` | Firebase Admin, verificación del token, utilidades HTTP, cliente de Mercado Pago y avisos al dueño (`avisos.js`: primera visita y aceptación, solo Pro, por email y por push con `push.js`) |
| `public/` | App instalable (PWA): `manifest.webmanifest`, `sw.js` (muestra los push; no cachea nada) e `iconos/`. El manifest solo se carga en la app del dueño (`main.jsx`); el botón para activar las push está en Mi cuenta (`controlador/push.js`) |
| `firestore.rules`, `storage.rules` | Reglas de seguridad (versionadas) |
| `index.html`, `terminos.html`, `privacidad.html` | Páginas; `/p/:id` se reescribe a `/` (ver `vercel.json`) |

## Modelo de datos (Firestore)

- `users/{uid}`: `email`, `displayName`, `photoURL`, `createdAt`, `emisor` (datos del negocio por defecto: nombre, rol, email, teléfono, web, presentación, logo del Storage de Dealit).
- `proposals/{id}`: `userId`, `title`, `clientName`, `amount`, `status` (`draft | sent | accepted | rejected`), `theme`, `payload` (la propuesta completa), `publico` (si el link está activo), `createdAt`, `updatedAt`.
  - Campos que **solo escribe el servidor**: `vistas`, `vistoPrimero`, `vistoUltimo`, `aceptacion`, `enviadaEn` (primer envío), `marca` (link con la marca de Dealit, en Gratis), `publicado` y `publicadoEn` (en Gratis, la versión que ve el cliente) y `clienteEnviado` (el cliente de la primera vez, para no reusar el link con otro). Las reglas impiden que el navegador los toque.
  - **Link congelado en Gratis** (`contenidoDelLink` en `src/planes.js`): el cliente ve `publicado`, no el `payload` que se está editando; compartir de nuevo lo actualiza. Si cambió el cliente (`mismoCliente`: se puede corregir el nombre o la empresa, no los dos), `api/activar` responde `otro-cliente` y la app ofrece duplicarla (envío nuevo). Con Pro (`marca: false`) el link muestra siempre la última versión. Los links de Gratis activados antes de este cambio se congelan en la primera visita (`api/visto`). La aceptación (`api/aceptar`) usa la misma versión que ve el cliente.
  - Los links largos de las primeras versiones (`#p=…`, `#f=…`, con la propuesta comprimida en el link) ya no se generan ni se abren: cualquiera podía armar uno a mano, sin cuenta ni límite.
  - Activar el link (`publico: true`) solo lo hace `api/activar`; el navegador solo puede desactivarlo.
  - Cualquiera puede leer una propuesta con `publico == true` por ID (el link del cliente). Solo el dueño puede listarlas.
  - `proposals/{id}/versiones/{vid}` (y lo mismo en `portfolios`): versiones guardadas por el dueño (`payload`, `title`, `motivo`, `createdAt`). Se crean o se borran; no se editan.
- `portfolios/{id}`: como las propuestas, sin aceptación ni límite de envíos. Activar el link también pasa por `api/activar` (controla los diseños PRO, escribe `marca` y, en Gratis, `publicado`); el navegador solo puede desactivarlo.
- `payload.cobro`: método de cobro (`metodo`: `transferencia | mercadopago | ambos | acordar`), `conDatos` (hay datos bancarios cargados) y `conMp` (Mercado Pago vinculado), para lo que ve el cliente. Mercado Pago cobra en pesos: en propuestas en dólares no se muestra el botón de pago. **Nunca** lleva el CBU, el alias ni el titular, porque el `payload` se puede leer con el link.
- `cobros/{uid}`: datos para cobrar por transferencia (`titular`, `cbu`, `alias`, `actualizado`), uno por cuenta y para todas sus propuestas. Solo los lee y escribe el dueño (editor: `controlador/cobro.js`). El cliente los recibe recién al aceptar: `api/aceptar` los lee y los guarda en `aceptacion.cobro`, y desde ahí se muestran en el link aceptado (tarjeta en `lib/render.js`).
- `mpCuentas/{uid}`: cuenta de Mercado Pago vinculada por OAuth (`mpUserId`, `nombre`, `email`, `token` y `refresh` **cifrados** con AES-256-GCM, `vence`, `produccion`, `vinculada`). La escribe y la lee **solo el servidor** (`api/cobro-mp`); el navegador no puede (regla general). El token se renueva solo cuando está por vencer.
- `payload.video` (y lo mismo en portfolios): `url`, `titulo`, `texto`. Solo links: no se suben videos a Storage.
- `payload.plantilla`: la plantilla de origen (si se cargó completa); con `payload.tema.preset` define si la propuesta usa algo PRO (`usosPro` en `src/planes.js`).
- `push/{uid}/dispositivos/{id}`: cada dispositivo con push activadas: navegador (`suscripcion`, Web Push) o app de Android (`fcm` = token de Firebase Messaging, `plataforma`), con `creado`; `id` = hash del endpoint o del token, hasta 10 por cuenta. La escribe **solo el servidor** (`api/push`) y el navegador no la puede leer (cae en la regla general que lo niega todo).
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
- Secretos, solo como variables de entorno en Vercel y nunca en el repo: `FIREBASE_SERVICE_ACCOUNT` (JSON de la cuenta de servicio), `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET` (Mercado Pago; primero las de prueba). Cobros con el Mercado Pago de cada freelancer (OAuth): `MP_CLIENT_ID` y `MP_CLIENT_SECRET` de la aplicación de Dealit en Mercado Pago, que tiene que tener cargada la URL de redireccionamiento `https://dealit.com.ar/api/cobro-mp`; sin ellas no se ofrece. Si se cambia el secreto, cada freelancer tiene que volver a vincular (los tokens se cifran con él). Logo y medios de pago oficiales (Brand Brick del SDK de Mercado Pago, `src/lib/mp-marca.js`): `VITE_MP_PUBLIC_KEY`, la clave **pública** de producción de esa aplicación (no es secreta; va en el navegador y se lee al compilar, así que hace falta un redeploy). Sin ella se muestra un texto en lugar del Brick. IA: `GEMINI_API_KEY` (clave de Google AI Studio, aistudio.google.com; sin ella, los botones de «Armá tu propuesta con IA» no se muestran) y opcional `IA_MODELO` (por defecto `gemini-3.8-flash`; `gemini-3.5-flash-lite` si hiciera falta bajar el costo). Opcional: `APP_URL` (URL de vuelta tras pagar y de los links en los emails). Avisos por email (Resend): `RESEND_API_KEY` y `EMAIL_REMITENTE` (ej. `Dealit <avisos@tudominio.com>`, de un dominio verificado en Resend); sin la clave no se mandan. Notificaciones push: `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` (se generan con `npx web-push generate-vapid-keys`; si se cambian, cada dispositivo las tiene que volver a activar) y opcional `VAPID_SUBJECT` (`mailto:` o URL de contacto, por defecto `APP_URL`); sin ellas, Mi cuenta no las ofrece en el navegador. La app de Android usa Firebase Cloud Messaging con la cuenta de servicio de siempre (no necesita claves aparte; canal «avisos» e ícono `ic_stat_dealit`).
- Interruptor de los planes: `PLANES_ACTIVOS=1` prende el límite de Gratis y la oferta de Pro para todos; `PLANES_PRUEBA` (emails separados por coma) los prende solo para esas cuentas. Apagado, los envíos se cuentan pero no se frenan (ver `api/_lib/planes-activos.js`).

## Planes (freemium, definido el 2026-10-07)

Planes: **Gratis · Pro · Estudio**.

- **Sin cuenta:** una propuesta en el navegador. No puede compartir, guardar ni bajar PDF, y lo impreso con Ctrl+P lleva marca de agua.
- **Si cancela:** sigue con Pro hasta `vence` (`finDePro` en `src/planes.js`). En Mi cuenta, la tarjeta Pro muestra «Tu plan Pro finaliza el…», la cuenta regresiva, lo que pierde y los botones para seguir; en el panel, un aviso en los últimos 7 días y hasta 14 después (se puede cerrar), y un punto en «Cuenta». Si vuelve antes de que termine, `api/suscripcion` pone `start_date` = `vence`: no paga dos veces.
- **Vencimiento:** Pro sigue mientras `vence` (próximo cobro) + 3 días de margen esté por delante. Si el cobro no entra, vuelve solo a Gratis; con la fecha pasada, la app consulta `/api/sincronizar` una vez.
- **Gratis:** hasta 100 borradores y 2 propuestas enviadas (links activados) por mes calendario. Incluye aceptación online, logo y colores propios y la marca «Propuesta creada con Dealit» (o «Portfolio creado…») obligatoria en el link y el PDF (campo `marca`, lo escribe `api/activar`). Elegir un diseño o una plantilla PRO abre un cartel para pasarse a Pro (o elegir uno gratis) y no se aplica (`disenoProPermitido` en `controlador/plan.js`); si una propuesta ya tiene uno, no se puede enviar (`diseno-pro`) y al imprimir lleva marca de agua. Para enviar hay que cargar el cliente (`sin-cliente`), y el link muestra la versión enviada: no se reusa para otro cliente (ver «Link congelado en Gratis» arriba). Sin seguimiento de vistas ni avisos por email. 3 propuestas armadas con IA por mes (Pro: sin límite visible, tope anti abuso de 150).
- **Pro:** ARS 13.900/mes o 139.000/año; USD 9/mes o 90/año fuera de Argentina (los pesos se ajustan cada trimestre). Borradores y envíos ilimitados, sin marca, seguimiento completo (vistas, cuándo, avisos en vivo) y avisos cuando el cliente abre la propuesta (la primera vez por email y push; cada vez que vuelve a abrirla, solo push, con 30 segundos de pausa para no contar recargas) y cuando la acepta. En iPhone, las push solo funcionan con la app agregada a la pantalla de inicio.
- **Estudio:** equipos de hasta 3 usuarios, alrededor de ARS 38.900/mes. Sale como «Próximamente» con lista de espera.
- Los límites se aplican en el servidor: activar un link pasa por una función de Vercel y las reglas no dejan que el navegador lo haga solo.
- Pagos con Mercado Pago Suscripciones dentro de la app. La landing va en este mismo repo (sin WordPress).
- **En la app de Android no se vende Pro** (decidido el 2026-11-13): Google Play exige su propio cobro para suscripciones digitales y Argentina no está en sus programas de cobro alternativo, así que no se puede abrir Mercado Pago ni mandar a pagar a la web. Ahí los carteles de Pro solo informan (sin precios ni botones de pago; `ventaPermitida` y `MOTIVOS_APP` en `controlador/plan.js`) y el CSS oculta ofertas y links de Mercado Pago (`.app-nativa` en `_paneles.scss`). Quien pagó en la web tiene Pro también en la app. «Cobrar con Mercado Pago» (el freelancer les cobra a sus clientes) sí se queda: no es un bien digital de Dealit. Etapa 2, si la app se vuelve un canal importante: Google Play Billing.
- La idea: que el usuario gratis viva el momento «mi cliente aceptó», pero que quien trabaja en serio choque el límite cada mes.
