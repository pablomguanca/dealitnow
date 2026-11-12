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
            <button type="button" className="boton boton--secundario" data-accion="nueva">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9" /></svg>
              Propuesta en blanco
            </button>
            <button type="button" className="boton boton--primario boton--ia" data-accion="abrir-ia">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="6" y="2" width="4" height="7.5" rx="2" /><path d="M3.8 7.5a4.2 4.2 0 0 0 8.4 0M8 11.7V14" /></svg>
              Contala y la armamos
            </button>
          </div>
        </div>

        {/* Pro por terminar (últimos 7 días) o recién terminado: aviso con salida (plan.js). */}
        <aside className="aviso-pro" id="aviso-pro" aria-labelledby="aviso-pro-titulo" hidden>
          <img className="aviso-pro__logo" src="/iconos/icono-192.png" alt="" width="40" height="40" />
          <div className="aviso-pro__texto">
            <p className="aviso-pro__titulo" id="aviso-pro-titulo"></p>
            <p className="aviso-pro__bajada" id="aviso-pro-bajada"></p>
          </div>
          <button type="button" className="boton boton--primario boton--chico aviso-pro__accion" id="aviso-pro-accion" data-accion="reactivar-pro">Seguir con Pro</button>
          <button type="button" className="aviso-pro__cerrar" data-accion="cerrar-aviso-pro" aria-label="Cerrar el aviso">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </aside>

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
            <p>Contanos el trabajo en un audio y armamos la propuesta por vos. También podés elegir una plantilla de tu rubro o empezar desde cero.</p>
            <div className="panel__acciones">
              <button type="button" className="boton boton--primario boton--ia" data-accion="abrir-ia"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="6" y="2" width="4" height="7.5" rx="2" /><path d="M3.8 7.5a4.2 4.2 0 0 0 8.4 0M8 11.7V14" /></svg> Contala y la armamos</button>
              <a className="boton boton--secundario" href="/plantillas" data-accion="panel-pestana" data-pestana="plantillas">Ver plantillas</a>
              <button type="button" className="boton boton--secundario" data-accion="nueva">Empezar en blanco</button>
            </div>
          </div>
        </section>

        <section id="panel-plantillas" role="tabpanel" aria-labelledby="pestana-plantillas" hidden>
          <p className="panel__bajada galeria-plantillas__bajada">Elegí una plantilla para arrancar: trae textos, servicios y diseño pensados para tu rubro. Después cambiás todo lo que quieras.</p>
          <div className="galeria-filtros">
            <label className="galeria-buscar">
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.75" /><path d="M10.5 10.5l3.25 3.25" /></svg>
              <input className="galeria-buscar__campo" type="search" id="plantillas-buscar" placeholder="Buscá tu rubro: boda, abogado, obra, tienda…" aria-label="Buscar plantillas" autoComplete="off" />
            </label>
            <div className="galeria-chips" id="plantillas-categorias" role="toolbar" aria-label="Filtrar plantillas por categoría"></div>
          </div>
          <p className="galeria-vacio" id="plantillas-vacio" role="status" hidden></p>
          <ul className="galeria-plantillas" id="galeria-plantillas" aria-label="Plantillas de propuesta"></ul>
        </section>
      </div>
    </main>
  );
}
