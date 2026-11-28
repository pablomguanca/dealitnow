// Dashboard del dueño: «Mis propuestas» (métricas, filtros y grilla en tiempo real) y
// «Clientes» (las mismas propuestas agrupadas por cliente) como pestañas, y «Plantillas»
// (catálogo con vista previa para arrancar una propuesta), que es su propia sección.

import { IconoIA } from '../IconoIA.jsx';

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
            {/* Un solo «+ Nueva»: con IA, en blanco, desde una plantilla o un portfolio (navegacion.js). */}
            <button type="button" className="boton boton--primario" data-accion="crear-nuevo" data-tipo="propuesta" aria-haspopup="dialog">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9" /></svg>
              Nueva propuesta
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

        <div className="panel-pestanas" id="panel-pestanas" role="tablist" aria-label="Secciones del panel">
          <a className="panel-pestana" role="tab" id="pestana-propuestas" href="/" data-accion="panel-pestana" data-pestana="propuestas" aria-controls="panel-propuestas" aria-selected="true">
            Mis propuestas <span className="panel-pestana__cuenta" id="pestana-propuestas-cuenta"></span>
          </a>
          <a className="panel-pestana" role="tab" id="pestana-clientes" href="/clientes" data-accion="panel-pestana" data-pestana="clientes" aria-controls="panel-clientes" aria-selected="false">
            Clientes <span className="panel-pestana__cuenta" id="pestana-clientes-cuenta"></span>
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

          {/* Cuenta sin propuestas: el mismo arranque que la bienvenida sin cuenta (controlador/arranque.js):
              el rubro y después «¿Cómo querés arrancar?». */}
          <div className="panel__vacio arranque" id="panel-vacio" hidden>
            <div className="arranque__paso" id="arranque-rubros-paso">
              <h2 className="panel__vacio-titulo">Armemos tu primera propuesta</h2>
              <p>¿A qué te dedicás? Arrancás con un ejemplo de tu rubro y lo cambiás por lo tuyo.</p>
              <div className="arranque__rubros" id="arranque-rubros" role="group" aria-label="Rubros"></div>
              <p className="arranque__mas">¿No está tu rubro? <a href="/plantillas" data-accion="panel-pestana" data-pestana="plantillas">Mirá todas las plantillas</a></p>
            </div>
            <div className="arranque__paso" id="arranque-como" hidden>
              <button type="button" className="arranque__volver" data-accion="arranque-volver">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" /></svg>
                Cambiar rubro
              </button>
              <h2 className="panel__vacio-titulo" id="arranque-como-titulo">¿Cómo querés arrancar?</h2>
              <p>Elegiste <strong id="arranque-rubro"></strong>.</p>
              <div className="arranque__opciones" role="group" aria-labelledby="arranque-como-titulo">
                <button type="button" className="arranque__opcion arranque__opcion--ia" data-accion="arranque-ia">
                  <span className="arranque__icono"><IconoIA /></span>
                  <span className="arranque__texto">
                    <span className="arranque__titulo">Contásela a la IA <span className="arranque__recomendado">Recomendado</span></span>
                    <span className="arranque__detalle">Dictá o escribí el trabajo y el precio: la IA arma la propuesta en segundos.</span>
                  </span>
                </button>
                <button type="button" className="arranque__opcion" data-accion="arranque-ejemplo">
                  <span className="arranque__icono">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.8 2.7a1.6 1.6 0 0 1 2.3 2.3l-7.4 7.4-3 .7.7-3z" /></svg>
                  </span>
                  <span className="arranque__texto">
                    <span className="arranque__titulo" id="arranque-ejemplo-titulo">Editar el ejemplo</span>
                    <span className="arranque__detalle" id="arranque-ejemplo-detalle">Una propuesta ya armada de tu rubro: cambiás el cliente, los servicios y los precios.</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Clientes: las propuestas agrupadas por cliente (src/clientes.js, controlador/clientes.js). */}
        <section id="panel-clientes" role="tabpanel" aria-labelledby="pestana-clientes" hidden>
          <div className="panel__herramientas" id="clientes-herramientas" hidden>
            <label className="visualmente-oculto" htmlFor="clientes-buscar">Buscar clientes</label>
            <input className="control panel__buscar" id="clientes-buscar" type="search" placeholder="Buscar cliente" autoComplete="off" />
          </div>
          <p className="panel__estado" id="clientes-estado" role="status" aria-live="polite"></p>
          <ul className="clientes" id="lista-clientes" aria-label="Clientes"></ul>
        </section>

        {/* Plantillas: sección propia (barra de arriba y «+ Nueva»), sin las pestañas. */}
        <section id="panel-plantillas" aria-label="Plantillas" hidden>
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
