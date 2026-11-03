// Dashboard del dueño con dos pestañas: «Plantillas» (catálogo con vista previa para
// arrancar una propuesta) y «Mis propuestas» (métricas, filtros y grilla en tiempo real).

export function ProposalsPanel() {
  return (
    <main className="panel" id="panel" aria-labelledby="panel-titulo" hidden>
      <div className="panel__contenido">
        <div className="panel__cabecera">
          <div>
            <p className="panel__saludo" id="panel-saludo"></p>
            <h1 className="panel__titulo" id="panel-titulo">Tus propuestas</h1>
            <p className="panel__bajada" id="panel-resumen"></p>
          </div>
          <div className="panel__acciones">
            <button type="button" className="boton boton--primario" data-accion="nueva">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9" /></svg>
              Propuesta en blanco
            </button>
          </div>
        </div>

        <div className="panel-pestanas" role="tablist" aria-label="Secciones del panel">
          <a className="panel-pestana" role="tab" id="pestana-propuestas" href="/" data-accion="panel-pestana" data-pestana="propuestas" aria-controls="panel-propuestas" aria-selected="true">
            Mis propuestas <span className="panel-pestana__cuenta" id="pestana-propuestas-cuenta"></span>
          </a>
          <a className="panel-pestana" role="tab" id="pestana-plantillas" href="/plantillas" data-accion="panel-pestana" data-pestana="plantillas" aria-controls="panel-plantillas" aria-selected="false">
            Plantillas
          </a>
        </div>

        <section id="panel-propuestas" role="tabpanel" aria-labelledby="pestana-propuestas">
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
            <p>Elegí una plantilla de tu rubro y cambiá los datos por los de tu proyecto, o empezá desde cero.</p>
            <div className="panel__acciones">
              <a className="boton boton--primario" href="/plantillas" data-accion="panel-pestana" data-pestana="plantillas">Ver plantillas</a>
              <button type="button" className="boton boton--secundario" data-accion="nueva">Empezar en blanco</button>
            </div>
          </div>
        </section>

        <section id="panel-plantillas" role="tabpanel" aria-labelledby="pestana-plantillas" hidden>
          <p className="panel__bajada galeria-plantillas__bajada">Elegí una plantilla para arrancar: trae textos, servicios y diseño pensados para tu rubro. Después cambiás todo lo que quieras.</p>
          <ul className="galeria-plantillas" id="galeria-plantillas" aria-label="Plantillas de propuesta"></ul>
        </section>
      </div>
    </main>
  );
}
