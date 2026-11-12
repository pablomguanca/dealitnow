import { Link } from 'react-router-dom';
// Barra de pestañas abajo, solo en celular y fuera del editor (como en una app nativa).
// Usa las mismas acciones que la barra de arriba; mostrarVista marca la pestaña actual.

export function TabBar() {
  return (
    <nav className="tabbar solo-inicio" aria-label="Secciones">
      <Link className="tabbar__item" to="/" data-accion="ir-panel" data-seccion="panel">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2H4.5A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V5.5z" /><path d="M9.5 2v3.5H13M5.75 8.75h4.5M5.75 11.25h3" /></svg>
        <span>Propuestas</span>
      </Link>
      <Link className="tabbar__item" to="/resultados" data-accion="ir-resultados" data-seccion="resultados">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.25 2.25v10A1.5 1.5 0 0 0 3.75 13.75h10" /><path d="M5 10.25l2.5-3 2 2 3.75-4.5" /><path d="M10.75 4.75h2.5v2.5" /></svg>
        <span>Resultados</span>
      </Link>
      <button type="button" className="tabbar__crear" data-accion="crear-nuevo" aria-label="Crear nueva propuesta o portfolio">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
      </button>
      <Link className="tabbar__item" to="/portafolios" data-accion="ir-portafolios" data-seccion="portafolios">
        <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="4.75" width="12" height="9" rx="1.75" /><path d="M5.75 4.75v-1A1.5 1.5 0 0 1 7.25 2.25h1.5a1.5 1.5 0 0 1 1.5 1.5v1M2 9h12M7 9v1.25h2V9" /></svg>
        <span>Portfolios</span>
      </Link>
      <Link className="tabbar__item" to="/cuenta" data-accion="ir-cuenta" data-seccion="cuenta">
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" /><circle cx="8" cy="6.6" r="2.1" /><path d="M4.1 12.85a4.4 4.4 0 0 1 7.8 0" /></svg>
        <span>Cuenta</span>
      </Link>
    </nav>
  );
}
