# Dealit

Propuestas comerciales que se comparten como link: el cliente las abre en el celular, suma opcionales y las acepta.

## Desarrollo

Requiere Node 20 o superior.

```bash
npm install
npm run dev      # servidor local con recarga en caliente
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
| `src/lib/formato.js` | Utilidades de texto, números, fechas y DOM |
| `src/styles/` | Estilos (SCSS) |
| `tests/` | Tests unitarios |
| `firestore.rules`, `storage.rules` | Reglas de seguridad de Firebase |

## Deploy

- **Sitio:** Vercel construye con `npm run build` y publica `dist/` (ver `vercel.json`). Cada rama y pull request tiene su deploy de prueba.
- **Reglas e índices de Firebase:** `firebase deploy --only firestore:rules,firestore:indexes,storage`.
