// Punto de entrada de React 18 para Dealit.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/styles.scss';
import { App } from './App.jsx';

const contenedor = document.getElementById('root');
if (contenedor) {
  createRoot(contenedor).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
