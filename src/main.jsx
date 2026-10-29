// Punto de entrada de React 18 + React Router v6 para Dealit.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/styles.scss';
import { App } from './App.jsx';

const contenedor = document.getElementById('root');
if (contenedor) {
  createRoot(contenedor).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
}
