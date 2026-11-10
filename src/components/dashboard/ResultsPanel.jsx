// Panel «Resultados»: lo ganado, la conversión, lo que está en juego y a quién seguir hoy.
// El contenido lo arma controlador/resultados.js.

export function ResultsPanel() {
  return (
    <main className="panel resultados" id="resultados" aria-labelledby="resultados-titulo" hidden>
      <div className="panel__contenido">
        <div className="panel__cabecera">
          <div>
            <p className="panel__saludo">Tus números</p>
            <h1 className="panel__titulo" id="resultados-titulo">Resultados</h1>
            <p className="panel__bajada">Cuánto ganás, cuánto convertís y qué propuestas conviene seguir hoy.</p>
          </div>
          <div className="segmentos resultados__periodos" role="group" aria-label="Período">
            <button type="button" className="segmento" data-accion="resultados-periodo" data-periodo="mes" aria-pressed="true">Este mes</button>
            <button type="button" className="segmento" data-accion="resultados-periodo" data-periodo="trimestre" aria-pressed="false">90 días</button>
            <button type="button" className="segmento" data-accion="resultados-periodo" data-periodo="anio" aria-pressed="false">12 meses</button>
          </div>
        </div>
        <div id="resultados-contenido" aria-live="polite"></div>
      </div>
    </main>
  );
}
