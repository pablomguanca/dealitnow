// Escenario de vista previa en vivo (computadora, celular y hoja PDF) para propuestas y portfolios.

export function DocumentPreview() {
  return (
    <section className="visor" aria-label="Vista previa de la propuesta">
    <div className="visor__barra">
      <button type="button" className="icono-boton visor__alternar" id="alternar-editor" data-accion="alternar-editor" aria-controls="editor-cuerpo" aria-expanded="true" aria-label="Ocultar el editor" title="Ocultar el editor">
        <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2.5" width="12" height="11" rx="1.5" /><path d="M6.2 2.5v11" /><path className="visor__alternar-flecha" d="M10.6 6.2 8.8 8l1.8 1.8" /></svg>
      </button>
      <p className="visor__nota" id="visor-nota">Así ve tu cliente la propuesta cuando abre el link.</p>
      <div className="segmentos" role="group" aria-label="Tipo de vista previa">
        <button type="button" className="segmento" data-accion="vista" data-vista="escritorio" aria-pressed="true">Computadora</button>
        <button type="button" className="segmento" data-accion="vista" data-vista="celular" aria-pressed="false">Celular</button>
        <button type="button" className="segmento" data-accion="vista" data-vista="pdf" aria-pressed="false">PDF</button>
      </div>
    </div>
    {/* Aviso de la guía de primeros pasos (controlador/guia.js): se va al tocar un texto. */}
    <p className="guia-tip" id="guia-tip" role="status" hidden>
      <span>Tocá cualquier texto de la propuesta para cambiarlo</span>
      <button type="button" className="guia-tip__cerrar" data-accion="guia-tip-cerrar" aria-label="Entendido">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
      </button>
    </p>
    {/* Vista previa a pantalla completa (el ojito de la barra; controlador/vista-previa.js). */}
    <div className="previa-control" role="toolbar" aria-label="Vista previa">
      <span className="previa-control__etiqueta">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.6 8.35a.9.9 0 0 1 0-.7C2.75 5.2 5.2 3.5 8 3.5s5.25 1.7 6.4 4.15a.9.9 0 0 1 0 .7C13.25 10.8 10.8 12.5 8 12.5S2.75 10.8 1.6 8.35z" /><circle cx="8" cy="8" r="2.1" /></svg>
        Así la ve tu cliente
      </span>
      <div className="segmentos previa-control__segmentos" role="group" aria-label="Ver en">
        <button type="button" className="segmento" data-accion="vista" data-vista="escritorio" aria-pressed="true">Computadora</button>
        <button type="button" className="segmento" data-accion="vista" data-vista="celular" aria-pressed="false">Celular</button>
      </div>
      <button type="button" className="boton boton--primario boton--chico previa-control__salir" id="previa-salir" data-accion="salir-vista-previa">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        Volver a editar
      </button>
    </div>
    <div className="visor__escenario visor__escenario--escritorio" id="escenario">
      <article className="doc doc--web" id="documento"></article>
    </div>
  </section>
  );
}
