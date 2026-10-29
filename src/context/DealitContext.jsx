// Contexto global de React integrado con React Router v6 para Dealit.

import { createContext, useContext } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDealitController } from '../hooks/useDealitController.js';
import {
  TEMAS,
  PORTADAS,
  DECORACIONES,
  ESTILOS_BLOQUES,
  PLANTILLAS,
  PLANTILLAS_PORTAFOLIO
} from '../modelo.js';

const DealitContext = createContext(null);

export function DealitProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  useDealitController(navigate);

  const valor = {
    navigate,
    location,
    params,
    temas: TEMAS,
    portadas: PORTADAS,
    decoraciones: DECORACIONES,
    estilosBloques: ESTILOS_BLOQUES,
    plantillasPropuesta: PLANTILLAS,
    plantillasPortafolio: PLANTILLAS_PORTAFOLIO
  };

  return (
    <DealitContext.Provider value={valor}>
      {children}
    </DealitContext.Provider>
  );
}

export function useDealit() {
  const ctx = useContext(DealitContext);
  if (!ctx) {
    throw new Error('useDealit debe usarse dentro de un <DealitProvider>');
  }
  return ctx;
}
