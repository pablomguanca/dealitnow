// Panel «Mis portfolios»: gestión de múltiples portfolios y páginas web por rubro, y las
// plantillas de portfolio para arrancar uno nuevo.

import { PLANTILLAS_PORTAFOLIO } from '../../modelo.js';

const PLANTILLAS = Object.entries(PLANTILLAS_PORTAFOLIO)
  .filter(([id]) => id !== 'en-blanco')
  .sort(([, a], [, b]) => (a.plan === 'gratis' ? 0 : 1) - (b.plan === 'gratis' ? 0 : 1));

export function PortfoliosPanel() {
  return (
    <main className="panel" id="portafolios" aria-labelledby="portafolios-titulo" hidden>
  <div className="panel__contenido">
    <div className="panel__cabecera">
      <div>
        <p className="panel__saludo">Mostrá tu trabajo</p>
        <h1 className="panel__titulo" id="portafolios-titulo">Mis portfolios</h1>
        <p className="panel__bajada" id="portafolios-resumen">Creá diferentes portfolios según el rubro o tipo de cliente. Podés compartirlos por link o sumarlos dentro de cualquier propuesta.</p>
      </div>
      <div className="panel__acciones">
        <button type="button" className="boton boton--secundario" data-accion="nuevo-portafolio-ejemplo">Usar una plantilla</button>
        <button type="button" className="boton boton--primario" data-accion="nuevo-portafolio">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>
          Nuevo portfolio
        </button>
      </div>
    </div>

    <div className="panel__herramientas" id="portafolios-herramientas" hidden>
      <div className="filtros" id="portafolios-plantillas-rapidas">
        <button type="button" className="filtro" data-accion="crear-pf-rubro" data-rubro="diseno-web">+ Diseño &amp; Web</button>
        <button type="button" className="filtro" data-accion="crear-pf-rubro" data-rubro="software-producto">+ Software &amp; Tech</button>
        <button type="button" className="filtro" data-accion="crear-pf-rubro" data-rubro="marketing-contenido">+ Marketing &amp; Redes</button>
        <button type="button" className="filtro" data-accion="crear-pf-rubro" data-rubro="conceptos-expertise">+ Casos Conceptuales</button>
      </div>
      <label className="visualmente-oculto" htmlFor="portafolios-buscar">Buscar portfolios</label>
      <input className="control panel__buscar" id="portafolios-buscar" type="search" placeholder="Buscar por nombre o especialidad" autoComplete="off" />
    </div>

    <p className="panel__estado" id="portafolios-estado" role="status" aria-live="polite"></p>
    <ul className="portafolios-lista" id="lista-portafolios" aria-label="Portfolios"></ul>

    <div className="panel__vacio" id="portafolios-vacio" hidden>
      <h2 className="panel__vacio-titulo">Armá tu primer portfolio</h2>
      <p>Podés tener varios portfolios distintos (por ejemplo, uno de Diseño Web, otro de E-commerce o uno de Casos Conceptuales) para presentar justo lo que cada cliente necesita ver.</p>
      <div className="panel__acciones">
        <button type="button" className="boton boton--secundario" data-accion="crear-pf-rubro" data-rubro="diseno-web">Plantilla Diseño &amp; Web</button>
        <button type="button" className="boton boton--secundario" data-accion="crear-pf-rubro" data-rubro="conceptos-expertise">Plantilla Sin Clientes Previos</button>
        <button type="button" className="boton boton--primario" data-accion="nuevo-portafolio">Crear desde cero</button>
      </div>
    </div>

    <section className="pf-plantillas" aria-labelledby="pf-plantillas-titulo">
      <h2 className="pf-plantillas__titulo" id="pf-plantillas-titulo">Plantillas de portfolio</h2>
      <p className="pf-plantillas__bajada">Arrancá con textos, secciones y diseño pensados para tu rubro. Después cambiás todo por tus trabajos.</p>
      {/* Cada tarjeta lleva una miniatura real de la página (controlador/galeria-portafolios.js),
          como las plantillas de propuesta: tocarla o «Vista previa» la abre entera. */}
      <ul className="galeria-plantillas pf-plantillas__lista" aria-label="Plantillas de portfolio">
        {PLANTILLAS.map(([id, t]) => (
          <li key={id} className="plantilla-card" data-id={id}>
            <div className="plantilla-card__lienzo" inert="" aria-hidden="true">
              <article className="doc doc--web doc--estatico doc--miniatura doc--portafolio" data-miniatura-pf={id}></article>
            </div>
            <button type="button" className="plantilla-card__ver" data-accion="ver-plantilla-pf" data-id={id} aria-label={`Ver la plantilla «${t.nombre}»`}></button>
            <div className="plantilla-card__info">
              <span className="plantilla-card__rubro">
                {t.rubro}
                {t.plan === 'pro' ? <> <em className="insignia-pro">PRO</em></> : <> <em className="pf-plantilla__gratis">Gratis</em></>}
                {t.catalogo && <> <em className="insignia-nueva">Nueva</em></>}
              </span>
              <h3 className="plantilla-card__nombre">{t.nombre}</h3>
              <p className="plantilla-card__desc">{t.desc}</p>
              <div className="plantilla-card__acciones">
                <button type="button" className="boton boton--primario boton--chico" data-accion="crear-pf-rubro" data-rubro={id}>Usar plantilla</button>
                <button type="button" className="boton boton--texto boton--chico" data-accion="ver-plantilla-pf" data-id={id}>Vista previa</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  </div>
</main>
  );
}
