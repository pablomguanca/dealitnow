import { Link } from 'react-router-dom';
// Barra de pestañas abajo, solo en celular y fuera del editor (como en una app nativa).
// Usa las mismas acciones que la barra de arriba; mostrarVista marca la pestaña actual.

export function TabBar() {
  return (
    <nav className="tabbar solo-inicio" aria-label="Secciones">
      <Link className="tabbar__item" to="/" data-accion="ir-panel" data-seccion="panel">
        <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="3" width="11" height="10" rx="1.5" /><path d="M5.5 6.5h5M5.5 9.5h3.5" /></svg>
        <span>Propuestas</span>
      </Link>
      <Link className="tabbar__item" to="/resultados" data-accion="ir-resultados" data-seccion="resultados">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 13.5h11M4.5 11V8M8 11V4.5M11.5 11V6.5" /></svg>
        <span>Resultados</span>
      </Link>
      <button type="button" className="tabbar__crear" data-accion="crear-nuevo" aria-label="Crear nueva propuesta o portfolio">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
      </button>
      <Link className="tabbar__item" to="/portafolios" data-accion="ir-portafolios" data-seccion="portafolios">
        <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9.5" rx="1.5" /><path d="M5.5 3.5V2.3h5v1.2M2 7.5h12" /></svg>
        <span>Portfolios</span>
      </Link>
      <Link className="tabbar__item" to="/cuenta" data-accion="ir-cuenta" data-seccion="cuenta">
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="5.5" r="2.5" /><path d="M3.2 13.2c.8-2.2 2.6-3.4 4.8-3.4s4 1.2 4.8 3.4" /></svg>
        <span>Cuenta</span>
      </Link>
    </nav>
  );
}
