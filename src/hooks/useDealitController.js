// Hook de React que arranca el controlador de Dealit (src/controlador/) una sola vez,
// después del primer render, y le pasa la navegación de React Router.

import { useEffect, useRef } from 'react';
import { inicializarControladorDealit, registrarNavegadorReact } from '../controlador/iniciar.js';

export function useDealitController(navigate) {
  const montadoRef = useRef(false);

  useEffect(() => {
    if (navigate) registrarNavegadorReact(navigate);
  }, [navigate]);

  useEffect(() => {
    if (montadoRef.current) return;
    montadoRef.current = true;
    inicializarControladorDealit();
  }, []);
}
