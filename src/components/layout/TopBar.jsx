import { Link } from 'react-router-dom';
// Barra superior de navegación, selector de secciones, acciones de compartir/PDF y menú hamburguesa.

export function TopBar() {
  return (
    <>
      <header className="barra">
        <div className="barra__marca">
          <Link className="barra__logo" to="/" data-accion="ir-panel" aria-label="Dealit, ir a Mis propuestas">Dealit</Link>
          <span className="barra__producto solo-editor" id="barra-subtitulo">Generá tu propuesta</span>
        </div>
        <nav className="barra__nav solo-inicio" aria-label="Secciones">
          <Link className="barra__nav-link" to="/" data-accion="ir-panel" data-seccion="panel">Propuestas</Link>
          <Link className="barra__nav-link solo-cuenta" to="/resultados" data-accion="ir-resultados" data-seccion="resultados">Resultados</Link>
          <Link className="barra__nav-link" to="/portafolios" data-accion="ir-portafolios" data-seccion="portafolios">Portfolios</Link>
          <Link className="barra__nav-link solo-cuenta" to="/cuenta" data-accion="ir-cuenta" data-seccion="cuenta">Mi cuenta</Link>
        </nav>
        <div className="barra__acciones">
          <button type="button" className="boton boton--secundario boton--ia solo-invitado" data-accion="abrir-ia" title="Dictá el trabajo y armamos la propuesta">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="6" y="2" width="4" height="7.5" rx="2" /><path d="M3.8 7.5a4.2 4.2 0 0 0 8.4 0M8 11.7V14" /></svg>
            <span className="boton__extra">Crear con IA</span>
          </button>
          <button type="button" className="boton boton--secundario solo-invitado" data-accion="ingresar">Iniciar sesión</button>
          <button type="button" className="boton boton--secundario barra__pdf solo-editor" data-accion="pdf" title="Descargar PDF">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v7.5M5 7.5l3 3 3-3M3 12.5h10" /></svg>
            <span className="boton__extra">Descargar</span><span>PDF</span>
          </button>
          <button type="button" className="boton boton--primario solo-editor" data-accion="compartir">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.8 9.2a3 3 0 0 0 4.3 0l2-2a3 3 0 0 0-4.3-4.3l-.9.9M9.2 6.8a3 3 0 0 0-4.3 0l-2 2a3 3 0 0 0 4.3 4.3l.9-.9" /></svg>
            <span className="boton__extra">Compartir</span><span>link</span>
          </button>
          <Link className="barra__avatar solo-cuenta" id="barra-avatar" to="/cuenta" data-accion="ir-cuenta" aria-label="Mi cuenta" title="Mi cuenta"></Link>
          <div className="menu" id="menu">
            <button type="button" className="boton boton--secundario menu__alternar" data-accion="menu" aria-expanded="false" aria-controls="menu-panel" aria-label="Abrir menú principal">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M2.5 8h11M2.5 12h11" /></svg>
              <span className="menu__alternar-texto">Menú</span>
            </button>
            <div className="menu__velo" id="menu-velo" data-accion="cerrar-menu" hidden></div>
            <aside className="menu__panel" id="menu-panel" aria-label="Menú principal" hidden>
              <div className="menu__cabecera">
                <div className="menu__identidad">
                  <span className="menu__marca">Dealit</span>
                  <span className="menu__usuario solo-cuenta" id="menu-usuario"></span>
                </div>
                <button type="button" className="icono-boton menu__cerrar" data-accion="cerrar-menu" aria-label="Cerrar menú">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" /></svg>
                </button>
              </div>
              <div className="menu__cuerpo">
                <div className="menu__grupo">
                  <span className="menu__grupo-titulo">Secciones</span>
                  <button type="button" className="boton boton--texto menu__opcion" data-accion="ir-panel" data-seccion="panel">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="3" width="11" height="10" rx="1.5" /><path d="M5.5 6.5h5M5.5 9.5h3.5" /></svg>
                    <span>Propuestas</span>
                  </button>
                  <button type="button" className="boton boton--texto menu__opcion solo-cuenta" data-accion="ir-resultados" data-seccion="resultados">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 13.5h11M4.5 11V8M8 11V4.5M11.5 11V6.5" /></svg>
                    <span>Resultados</span>
                  </button>
                  <button type="button" className="boton boton--texto menu__opcion" data-accion="ir-portafolios" data-seccion="portafolios">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9.5" rx="1.5" /><path d="M5.5 3.5V2.3h5v1.2M2 7.5h12" /></svg>
                    <span>Portfolios</span>
                  </button>
                  <button type="button" className="boton boton--texto menu__opcion solo-cuenta" data-accion="ir-cuenta" data-seccion="cuenta">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="5.5" r="2.5" /><path d="M3.2 13.2c.8-2.2 2.6-3.4 4.8-3.4s4 1.2 4.8 3.4" /></svg>
                    <span>Mi cuenta</span>
                  </button>
                </div>
                <div className="menu__grupo">
                  <span className="menu__grupo-titulo">Crear nuevo</span>
                  <button type="button" className="boton boton--texto menu__opcion" data-accion="abrir-ia">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="6" y="2" width="4" height="7.5" rx="2" /><path d="M3.8 7.5a4.2 4.2 0 0 0 8.4 0M8 11.7V14" /></svg>
                    <span>Contala y la armamos (IA)</span>
                  </button>
                  <button type="button" className="boton boton--texto menu__opcion" data-accion="nueva">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9" /></svg>
                    <span>+ Nueva propuesta</span>
                  </button>
                  <button type="button" className="boton boton--texto menu__opcion" data-accion="nuevo-portafolio">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9" /></svg>
                    <span>+ Nuevo portfolio</span>
                  </button>
                </div>
                <div className="menu__grupo">
                  <span className="menu__grupo-titulo" id="menu-grupo-actual">Propuesta actual</span>
                  <button type="button" className="boton boton--texto menu__opcion solo-editor" data-accion="guardar-version">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5h7.2l2.3 2.3v8.2a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1v-9.5a1 1 0 0 1 1-1z" /><path d="M5.5 2.5v3.5h5V2.5M5.5 13.5v-4h5v4" /></svg>
                    <span>Guardar versión</span>
                  </button>
                  <button type="button" className="boton boton--texto menu__opcion solo-editor solo-cuenta" data-accion="ver-versiones">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.8 8a5.2 5.2 0 1 0 1.5-3.7M2.5 2.8v2.6h2.6" /><path d="M8 5.3V8l1.9 1.4" /></svg>
                    <span>Versiones anteriores</span>
                  </button>
                  <button type="button" className="boton boton--texto menu__opcion solo-editor" data-accion="pdf">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v7.5M5 7.5l3 3 3-3M3 12.5h10" /></svg>
                    <span>Descargar PDF</span>
                  </button>
                </div>
              </div>
              <div className="menu__grupo menu__grupo--ajustes">
                <button type="button" className="boton boton--texto menu__opcion menu__interruptor" data-accion="alternar-modo" role="switch" aria-checked="false" id="menu-modo-oscuro">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 9.6A5.5 5.5 0 0 1 6.4 3a5.5 5.5 0 1 0 6.6 6.6z" /></svg>
                  <span>Modo oscuro</span>
                  <span className="interruptor" aria-hidden="true"></span>
                </button>
              </div>
              <div className="menu__pie solo-cuenta">
                <button type="button" className="boton boton--texto menu__opcion menu__opcion--salir solo-cuenta" data-accion="cerrar-sesion">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2.5H3.8A1.3 1.3 0 0 0 2.5 3.8v8.4a1.3 1.3 0 0 0 1.3 1.3H6M10.5 5.2L13.5 8l-3 2.8M6.5 8h7" /></svg>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </aside>
          </div>
        </div>
      </header>

    </>
  );
}
