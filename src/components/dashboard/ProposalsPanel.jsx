// Panel «Mis propuestas»: métricas de negocio, buscador, filtros por estado y listado en tiempo real.

export function ProposalsPanel() {
  return (
    <main className="panel" id="panel" aria-labelledby="panel-titulo" hidden>
  <div className="panel__contenido">
    <div className="panel__cabecera">
      <div>
        <p className="panel__saludo" id="panel-saludo"></p>
        <h1 className="panel__titulo" id="panel-titulo">Mis propuestas</h1>
        <p className="panel__bajada" id="panel-resumen"></p>
      </div>
      <div className="panel__acciones">
        <button type="button" className="boton boton--secundario" data-accion="nueva-ejemplo">Usar una plantilla</button>
        <button type="button" className="boton boton--primario" data-accion="nueva">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>
          Nueva propuesta
        </button>
      </div>
    </div>

    <section className="metricas" id="panel-metricas" aria-label="Resumen de tus propuestas" hidden></section>

    <div className="panel__herramientas" id="panel-herramientas" hidden>
      <div className="filtros" id="panel-filtros" role="group" aria-label="Filtrar por estado"></div>
      <label className="visualmente-oculto" htmlFor="panel-buscar">Buscar propuestas</label>
      <input className="control panel__buscar" id="panel-buscar" type="search" placeholder="Buscar por título o cliente" autoComplete="off" />
    </div>

    <p className="panel__estado" id="panel-estado" role="status" aria-live="polite"></p>
    <ul className="propuestas" id="lista-propuestas" aria-label="Propuestas"></ul>

    <div className="panel__vacio" id="panel-vacio" hidden>
      <h2 className="panel__vacio-titulo">Todavía no tenés propuestas</h2>
      <p>Creá la primera desde cero o partí de una plantilla profesional por rubro y cambiá los datos por los de tu proyecto.</p>
      <div className="panel__acciones">
        <button type="button" className="boton boton--secundario" data-accion="nueva-ejemplo">Elegir una plantilla</button>
        <button type="button" className="boton boton--primario" data-accion="nueva">Crear mi primera propuesta</button>
      </div>
    </div>
  </div>
</main>
  );
}
