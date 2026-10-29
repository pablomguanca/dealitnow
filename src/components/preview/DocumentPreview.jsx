// Escenario de vista previa en vivo (computadora, celular y hoja PDF) para propuestas y portfolios.

export function DocumentPreview() {
  return (
    <section className="visor" aria-label="Vista previa de la propuesta">
    <div className="visor__barra">
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
