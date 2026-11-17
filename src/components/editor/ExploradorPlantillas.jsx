// Explorador de plantillas del editor: se abre en la misma columna del editor (en celular,
// en la hoja) desde «Explorar más plantillas», con miniaturas reales de cada plantilla para
// probarlas sobre la propuesta abierta. Lo maneja controlador/explorador-plantillas.js.

export function ExploradorPlantillas() {
  return (
    <div className="explorador" id="explorador-plantillas" role="region" aria-labelledby="explorador-titulo" hidden>
      <div className="explorador__cabecera">
        <button type="button" className="explorador__volver" data-accion="cerrar-explorador" aria-label="Volver al editor">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" /></svg>
        </button>
        <h2 className="explorador__titulo" id="explorador-titulo">Plantillas</h2>
        <span className="explorador__cuenta" id="explorador-cuenta"></span>
      </div>
      <div className="explorador__filtros">
        <label className="galeria-buscar explorador__buscar">
          <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.75" /><path d="M10.5 10.5l3.5 3.5" /></svg>
          <input className="galeria-buscar__campo" type="search" id="explorador-buscar" placeholder="Buscá tu rubro: boda, obra, tienda…" aria-label="Buscar plantillas" autoComplete="off" />
        </label>
        <div className="explorador__chips" id="explorador-categorias" role="toolbar" aria-label="Filtrar plantillas por categoría"></div>
      </div>
      <div className="explorador__cuerpo" id="explorador-cuerpo">
        <p className="explorador__ayuda">Tocá una para probarla en tu propuesta. Si no te convence, la deshacés.</p>
        <ul className="explorador__grilla" id="explorador-grilla" aria-label="Plantillas de propuesta"></ul>
        <p className="explorador__vacio" id="explorador-vacio" hidden></p>
      </div>
    </div>
  );
}
