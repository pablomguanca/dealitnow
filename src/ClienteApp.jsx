// Raíz de la vista del cliente: el documento compartido y lo necesario para aceptarlo.
// No carga el editor, el panel ni React Router (ver src/main.jsx).

import { useEffect } from 'react';
import { DialogoAceptar, Aviso, VisorLightbox } from './components/modals/ModalesComunes.jsx';
import { inicializarVistaCliente } from './controlador/iniciar-cliente.js';

export default function ClienteApp() {
  useEffect(() => {
    inicializarVistaCliente();
  }, []);

  return (
    <>
      <main className="app" id="app">
        <section className="visor" aria-label="Propuesta">
          <div className="visor__escenario visor__escenario--escritorio" id="escenario">
            <article className="doc doc--web" id="documento"></article>
          </div>
        </section>
      </main>
      <DialogoAceptar />
      <Aviso />
      <VisorLightbox />
    </>
  );
}
