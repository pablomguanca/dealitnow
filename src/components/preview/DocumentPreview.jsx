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
    <div className="visor__escenario visor__escenario--escritorio" id="escenario">
      <article className="doc doc--web" id="documento"></article>
    </div>
  </section>
  );
}
