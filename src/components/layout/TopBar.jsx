import { Link } from 'react-router-dom';
// Barra superior de navegación, selector de secciones, acciones de compartir/PDF y menú de usuario.

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
    <Link className="barra__nav-link" to="/portafolios" data-accion="ir-portafolios" data-seccion="portafolios">Portfolios</Link>
    <Link className="barra__nav-link solo-cuenta" to="/cuenta" data-accion="ir-cuenta" data-seccion="cuenta">Mi cuenta</Link>
  </nav>
  <div className="barra__acciones">
    <button type="button" className="boton boton--secundario solo-invitado" data-accion="ingresar">Iniciar sesión</button>
    <button type="button" className="boton boton--secundario barra__pdf solo-editor" data-accion="pdf" title="Descargar PDF">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v7.5M5 7.5l3 3 3-3M3 12.5h10"/></svg>
      <span className="boton__extra">Descargar</span><span>PDF</span>
    </button>
    <button type="button" className="boton boton--primario solo-editor" data-accion="compartir">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.8 9.2a3 3 0 0 0 4.3 0l2-2a3 3 0 0 0-4.3-4.3l-.9.9M9.2 6.8a3 3 0 0 0-4.3 0l-2 2a3 3 0 0 0 4.3 4.3l.9-.9"/></svg>
      <span className="boton__extra">Compartir</span><span>link</span>
    </button>
    <Link className="barra__avatar solo-cuenta" id="barra-avatar" to="/cuenta" data-accion="ir-cuenta" aria-label="Mi cuenta" title="Mi cuenta"></Link>
    <div className="menu" id="menu">
      <button type="button" className="boton boton--secundario menu__alternar" data-accion="menu" aria-expanded="false" aria-controls="menu-panel" aria-label="Abrir menú lateral">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M2.5 8h11M2.5 12h11"/></svg>
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
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>
          </button>
        </div>
        <div className="menu__cuerpo">
          <div className="menu__grupo">
            <span className="menu__grupo-titulo">Navegación</span>
            <button type="button" className="boton boton--texto menu__opcion" data-accion="ir-panel">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="3" width="11" height="10" rx="1.5"/><path d="M5.5 6.5h5M5.5 9.5h3.5"/></svg>
              <span>Mis propuestas</span>
            </button>
            <button type="button" className="boton boton--texto menu__opcion" data-accion="nueva">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>
              <span>Nueva propuesta</span>
            </button>
            <button type="button" className="boton boton--texto menu__opcion" data-accion="ir-portafolios">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9.5" rx="1.5"/><path d="M5.5 3.5V2.3h5v1.2M2 7.5h12"/></svg>
              <span>Mis portfolios</span>
            </button>
            <button type="button" className="boton boton--texto menu__opcion" data-accion="nuevo-portafolio">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>
              <span>Nuevo portfolio</span>
            </button>
            <button type="button" className="boton boton--texto menu__opcion solo-cuenta" data-accion="ir-cuenta">
              <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="5.5" r="2.5"/><path d="M3.2 13.2c.8-2.2 2.6-3.4 4.8-3.4s4 1.2 4.8 3.4"/></svg>
              <span>Mi cuenta</span>
            </button>
          </div>
          <div className="menu__grupo">
            <span className="menu__grupo-titulo" id="menu-grupo-actual">Propuesta actual</span>
            <button type="button" className="boton boton--texto menu__opcion" data-accion="abrir-borrador">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h2.8l1.4 1.5H12A1.5 1.5 0 0 1 13.5 7v4.5A1.5 1.5 0 0 1 12 13H4a1.5 1.5 0 0 1-1.5-1.5V5.5z"/></svg>
              <span>Abrir borrador (.json)</span>
            </button>
            <button type="button" className="boton boton--texto menu__opcion solo-editor" data-accion="guardar-borrador">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5h7.2l2.3 2.3v8.2a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1v-9.5a1 1 0 0 1 1-1z"/><path d="M5.5 2.5v3.5h5V2.5M5.5 13.5v-4h5v4"/></svg>
              <span>Guardar borrador (.json)</span>
            </button>
            <button type="button" className="boton boton--texto menu__opcion solo-editor" data-accion="pdf">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v7.5M5 7.5l3 3 3-3M3 12.5h10"/></svg>
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>
        <div className="menu__pie solo-cuenta">
          <button type="button" className="boton boton--texto menu__opcion menu__opcion--salir solo-cuenta" data-accion="cerrar-sesion">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2.5H3.8A1.3 1.3 0 0 0 2.5 3.8v8.4a1.3 1.3 0 0 0 1.3 1.3H6M10.5 5.2L13.5 8l-3 2.8M6.5 8h7"/></svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </div>
  </div>
</header>

<nav className="pestanas" role="tablist" aria-label="Cambiar vista">
  <button type="button" className="pestana" role="tab" aria-selected="true" data-accion="ver-editor">Editar</button>
  <button type="button" className="pestana" role="tab" aria-selected="false" data-accion="ver-previa">Vista previa</button>
</nav>
    </>
  );
}
