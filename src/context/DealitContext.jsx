// Contexto global de React para compartir el estado y controlador de Dealit en toda la jerarquía de componentes.

import { createContext, useContext } from 'react';
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
  useDealitController();

  const valor = {
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
