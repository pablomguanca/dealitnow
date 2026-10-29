// Panel lateral del editor interactivo que compone el estudio de diseño y los pasos de propuesta o portfolio.

import { DesignStudio } from './DesignStudio.jsx';
import { SenderStep } from './SenderStep.jsx';
import { ProposalSteps } from './ProposalSteps.jsx';
import { PortfolioSteps } from './PortfolioSteps.jsx';

export function EditorSidebar() {
  return (
    <section className="editor" aria-label="Editor de la propuesta">
      <div className="editor__intro">
      <div className="editor__migas">
        <a className="editor__volver" id="editor-volver" href="/" data-accion="ir-panel">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5"/></svg>
          <span id="editor-volver-texto">Mis propuestas</span>
        </a>
        <button type="button" className="boton boton--texto boton--chico editor__alternar-seccion" id="editor-ir-otra-seccion" data-accion="ir-portafolios">
          Ir a Mis portfolios →
        </button>
      </div>
      <h1 className="editor__titulo" id="editor-titulo">Armá tu propuesta</h1>
      <div className="editor__invitado solo-invitado">
        <p>Estás probando Dealit sin cuenta: tus propuestas y portfolios se guardan en este navegador.</p>
        <button type="button" className="boton boton--primario boton--chico" data-accion="registrarse">Crear cuenta gratis</button>
      </div>
      <p className="editor__aceptada" id="editor-aceptada" role="status" hidden></p>
      <p className="editor__bajada" id="editor-bajada">Elegí una plantilla, escribí tus datos y mandala como link interactivo: el diseño se arma solo.</p>
    </div>
      <form id="formulario" noValidate>
        <DesignStudio />
        <SenderStep />
        <ProposalSteps />
        <PortfolioSteps />
      </form>
      <div className="editor__pie">
        <p className="editor__estado" id="estado-guardado" aria-live="polite">Los cambios se guardan en tu cuenta.</p>
        <p>Tu cliente abre la propuesta desde el link, sin crear una cuenta.</p>
        <p>Plantilla creada por Dealit.</p>
      </div>
    </section>
  );
}
