// Panel del editor: estudio de diseño y pasos de la propuesta o el portfolio. En escritorio
// es la columna izquierda; en celular es una hoja que sube desde abajo, con una barra de
// secciones, y el documento queda siempre a la vista (ver controlador/hoja.js).

import { DesignStudio } from './DesignStudio.jsx';
import { SenderStep } from './SenderStep.jsx';
import { ProposalSteps } from './ProposalSteps.jsx';
import { PortfolioSteps } from './PortfolioSteps.jsx';
import { IconoIA } from '../IconoIA.jsx';
import { ExploradorPlantillas } from './ExploradorPlantillas.jsx';

export function EditorSidebar() {
  return (
    <section className="editor" aria-label="Editor de la propuesta">
      <div className="hoja__cabecera" id="hoja-cabecera">
        <button type="button" className="hoja__asa" id="hoja-asa" aria-label="Agrandar el editor" aria-controls="editor-cuerpo"></button>
        <nav className="hoja__secciones" id="hoja-secciones" aria-label="Secciones del editor"></nav>
        {/* Modo foco (celular): el campo del texto que se tocó en el documento, solo. */}
        <div className="hoja__foco" id="hoja-foco">
          <button type="button" className="hoja__foco-mover" data-accion="foco-anterior" aria-label="Campo anterior">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5"/></svg>
          </button>
          <p className="hoja__foco-titulo" id="hoja-foco-titulo" aria-live="polite"></p>
          <button type="button" className="hoja__foco-mover" data-accion="foco-siguiente" aria-label="Campo siguiente">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5"/></svg>
          </button>
          <button type="button" className="boton boton--primario boton--chico hoja__foco-listo" id="hoja-foco-listo" data-accion="foco-listo">Listo</button>
        </div>
      </div>
      <div className="editor__cuerpo" id="editor-cuerpo">
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
          {/* Lo que respondió el cliente sin aceptar: «No avanzo por ahora» y pedidos de cambio. */}
          <div className="editor__aceptada editor__respuestas" id="editor-respuestas" role="status" hidden></div>
          <p className="editor__bajada" id="editor-bajada">Elegí una plantilla, escribí tus datos y mandala como link interactivo: el diseño se arma solo.</p>
          <button type="button" className="boton boton--secundario boton--chico boton--ia editor__ia solo-cuenta" id="editor-ia" data-accion="editar-con-ia">
            Editar con IA <IconoIA />
          </button>
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
        </div>
      </div>
      <ExploradorPlantillas />
    </section>
  );
}
