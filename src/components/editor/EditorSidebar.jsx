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
        {/* Título a la izquierda (sección y campo); a la derecha, anterior / siguiente en un
            grupo, como deshacer / rehacer de la barra de arriba, y «Listo» con un tilde. */}
        <div className="hoja__foco" id="hoja-foco">
          <p className="hoja__foco-titulo" id="hoja-foco-titulo" aria-live="polite">
            <span className="hoja__foco-seccion" id="hoja-foco-seccion"></span>
            <span className="hoja__foco-campo" id="hoja-foco-campo"></span>
          </p>
          <div className="hoja__foco-pasos" role="group" aria-label="Pasar de campo">
            <button type="button" className="hoja__foco-paso" data-accion="foco-anterior" aria-label="Campo anterior" title="Campo anterior">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" /></svg>
            </button>
            <button type="button" className="hoja__foco-paso" data-accion="foco-siguiente" aria-label="Campo siguiente" title="Campo siguiente">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" /></svg>
            </button>
          </div>
          <button type="button" className="hoja__foco-listo" id="hoja-foco-listo" data-accion="foco-listo" aria-label="Listo" title="Listo">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
          </button>
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
          {/* Guía de primeros pasos (controlador/guia.js): sin cuenta, en el editor de prueba (reemplaza
              la caja de abajo); con cuenta, en la primera propuesta. */}
          <section className="guia" id="guia" aria-labelledby="guia-titulo" hidden>
            <div className="guia__cabecera">
              <h2 className="guia__titulo" id="guia-titulo">Tu primera propuesta en 3 pasos</h2>
              <button type="button" className="guia__cerrar" data-accion="guia-cerrar" aria-label="Cerrar la guía" title="Cerrar la guía">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
            </div>
            <div className="guia__barra" id="guia-barra" aria-hidden="true"><span></span></div>
            <ol className="guia__pasos">
              <li className="guia__paso" data-paso-guia="editar">
                <span className="guia__marca" aria-hidden="true"></span>
                <div>
                  <p className="guia__nombre">Cambiá el cliente y los precios</p>
                  <p className="guia__detalle">Tocá cualquier texto de la propuesta para cambiarlo, o completá los pasos de acá abajo.</p>
                </div>
              </li>
              <li className="guia__paso" data-paso-guia="ver">
                <span className="guia__marca" aria-hidden="true"></span>
                <div>
                  <p className="guia__nombre">Mirá cómo la ve tu cliente</p>
                  <p className="guia__detalle">Así le llega al celular cuando abre el link.</p>
                  <button type="button" className="boton boton--secundario boton--chico guia__accion" data-accion="guia-ver">Ver como cliente</button>
                </div>
              </li>
              <li className="guia__paso" data-paso-guia="compartir">
                <span className="guia__marca" aria-hidden="true"></span>
                <div>
                  <p className="guia__nombre">Compartila por WhatsApp</p>
                  <p className="guia__detalle" id="guia-compartir-detalle">Creás tu cuenta gratis, te damos el link y te avisamos cuando la acepte.</p>
                  <button type="button" className="boton boton--primario boton--chico guia__accion" data-accion="compartir">Compartir propuesta</button>
                </div>
              </li>
            </ol>
            <p className="guia__pie" id="guia-pie">Se guarda en este navegador mientras la armás.</p>
          </section>
          <div className="editor__invitado solo-invitado">
            <p>Estás probando Dealit sin cuenta: tus propuestas y portfolios se guardan en este navegador.</p>
            <button type="button" className="boton boton--primario boton--chico" data-accion="registrarse">Crear cuenta gratis</button>
          </div>
          <p className="editor__aceptada" id="editor-aceptada" role="status" hidden></p>
          {/* Pagos con Mercado Pago de esta propuesta: estado e historial (controlador/pagos.js). */}
          <div className="editor__aceptada editor__pagos" id="editor-pagos" role="status" hidden></div>
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
