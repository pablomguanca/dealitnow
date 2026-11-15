// Punto de entrada de Dealit. Según la URL carga una de dos apps, cada una en su propio
// paquete: la vista del cliente (links /p/…, /portafolio/…, #p=…, #f=…), liviana para
// que la propuesta abra rápido en el celular, o la app del dueño.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/styles.scss';
import { tipoLinkCliente } from './lib/links-cliente.js';
import { aplicarModoApp } from './lib/modo-app.js';

const contenedor = document.getElementById('root');
if (contenedor) {
  const esCliente = !!tipoLinkCliente();
  // El modo oscuro es solo de la app del dueño; se aplica antes de dibujar para que no parpadee.
  if (!esCliente) aplicarModoApp();
  // Solo la app del dueño es instalable: el link del cliente no ofrece instalar Dealit.
  if (!esCliente) {
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = '/manifest.webmanifest';
    document.head.append(manifest);
  }
  const modulo = esCliente ? import('./ClienteApp.jsx') : import('./App.jsx');
  modulo.then(({ default: Raiz }) => {
    createRoot(contenedor).render(
      <StrictMode>
        <Raiz />
      </StrictMode>
    );
  });
}
