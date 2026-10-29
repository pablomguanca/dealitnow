// Pasos 2 a 4 del editor de portfolios y páginas web: portada Hero, casos/proyectos, servicios web, galería, testimonios, FAQs y cierre.

export function PortfolioSteps() {
  return (
    <div id="pasos-portafolio" hidden>
        <details className="paso" open>
          <summary className="paso__resumen">
            <span className="paso__num">2</span>
            <span className="paso__titulo">Portada Hero de tu página</span>
            <span className="paso__desc">Título, foto de fondo, enfoque y disponibilidad</span>
          </summary>
          <div className="paso__contenido grilla">
            <label className="campo campo--ancho">
              <span className="campo__etiqueta">Nombre interno (para identificarlo en tu lista)</span>
              <input className="control" type="text" data-campo-pf="portafolio.nombreInterno" placeholder="Ej.: Portfolio E-commerce / Mi Página Web" />
              <span className="campo__ayuda">Solo lo ves vos en «Mis portfolios» y en el selector al armar una propuesta.</span>
            </label>
            <label className="campo campo--ancho">
              <span className="campo__etiqueta">Título principal de portada (Hero)</span>
              <input className="control" type="text" data-campo-pf="portafolio.titulo" placeholder="Ej.: Diseño y tecnología para marcas que quieren crecer" />
            </label>
            <label className="campo campo--ancho">
              <span className="campo__etiqueta">Subtítulo o propuesta de valor</span>
              <input className="control" type="text" data-campo-pf="portafolio.subtitulo" placeholder="Ej.: Diseño UX/UI, identidad visual y desarrollo web a medida." />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Etiqueta superior</span>
              <input className="control" type="text" data-campo-pf="portafolio.insignia" placeholder="Portfolio &amp; Página Web" />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Disponibilidad</span>
              <input className="control" type="text" data-campo-pf="portafolio.disponibilidad" placeholder="Ej.: Disponible para nuevos proyectos" />
            </label>
            <div className="campo campo--ancho">
              <span className="campo__etiqueta">Foto de fondo en portada Hero (opcional)</span>
              <div className="logo">
                <img className="logo__vista proyecto-imagen__vista" id="portada-pf-vista" alt="Fondo de portada" hidden />
                <label className="boton boton--secundario boton--chico">
                  <span id="portada-pf-texto">Subir foto de portada</span>
                  <input className="visualmente-oculto" id="campo-portada-pf" type="file" accept="image/png,image/jpeg,image/webp" />
                </label>
                <button type="button" className="boton boton--texto boton--chico" data-accion="quitar-portada-pf" id="portada-pf-quitar" hidden>Quitar</button>
              </div>
              <p className="campo__ayuda">Acepta imágenes de hasta 50 MB (se optimizan solas) y se combina con el color de tu portada para que el texto se lea perfecto.</p>
            </div>
            <label className="campo campo--ancho" id="portada-pf-opacidad-wrap" hidden>
              <span className="campo__etiqueta campo__etiqueta--fila">
                <span>Intensidad de la foto de portada</span>
                <output className="campo__valor" id="portada-pf-opacidad-val">35%</output>
              </span>
              <input className="rango-input" type="range" min="10" max="85" step="5" data-campo-pf="portafolio.opacidadPortada" data-tipo="numero" />
            </label>
          </div>
        </details>

        <details className="paso" open>
          <summary className="paso__resumen">
            <span className="paso__num">3</span>
            <span className="paso__titulo">Proyectos y casos con fotos</span>
            <span className="paso__desc">Casos reales, prototipos, proporción y galería por proyecto</span>
          </summary>
          <div className="paso__contenido">
            <p className="paso__nota">Podés cargar foto principal y sumar fotos adicionales por proyecto (para abrir en pantalla completa), elegir la proporción de recorte o usar portadas tipográficas automáticas.</p>
            <div className="lista" data-lista-pf="proyectos" data-vacio="Todavía no agregaste proyectos a tu página."></div>
            <button type="button" className="boton boton--agregar" data-accion="agregar-pf" data-lista-pf="proyectos">Agregar proyecto o caso</button>
          </div>
        </details>

        <details className="paso">
          <summary className="paso__resumen">
            <span className="paso__num">4</span>
            <span className="paso__titulo">Galería de fotos libre</span>
            <span className="paso__desc">Mosaico Bento, grilla, editorial o carrusel deslizable</span>
          </summary>
          <div className="paso__contenido">
            <p className="paso__nota">Ideal para mostrar fotografía de producto, arquitectura, gastronomía, detrás de escena, equipo o capturas de interfaz.</p>
            <div className="grilla" style={{ marginBottom: '1rem' }}>
              <label className="campo campo--ancho">
                <span className="campo__etiqueta">Título de la sección de galería</span>
                <input className="control" type="text" data-campo-pf="opciones.galeriaTitulo" placeholder="Ej.: Galería visual / Nuestro estudio" />
              </label>
              <label className="campo campo--ancho">
                <span className="campo__etiqueta">Bajada o descripción (opcional)</span>
                <input className="control" type="text" data-campo-pf="opciones.galeriaSubtitulo" placeholder="Ej.: Tocá cualquier imagen para verla en pantalla completa." />
              </label>
              <label className="campo">
                <span className="campo__etiqueta">Disposición de galería</span>
                <select className="control" data-campo-pf="opciones.galeriaLayout">
                  <option value="bento">Mosaico Bento (destaca la 1ª foto)</option>
                  <option value="grilla">Grilla uniforme (2 columnas)</option>
                  <option value="editorial">Editorial (1 columna grande)</option>
                  <option value="carrusel">Tira deslizable horizontal</option>
                </select>
              </label>
              <label className="campo">
                <span className="campo__etiqueta">Proporción por defecto</span>
                <select className="control" data-campo-pf="opciones.galeriaProporcion">
                  <option value="panoramica">Panorámica (16:9)</option>
                  <option value="cuadrada">Cuadrada (1:1)</option>
                  <option value="vertical">Vertical (4:5)</option>
                  <option value="natural">Proporción original</option>
                </select>
              </label>
            </div>
            <div className="lista" data-lista-pf="galeria" data-vacio="Todavía no subiste fotos a la galería libre."></div>
            <div className="acciones-galeria">
              <button type="button" className="boton boton--agregar" data-accion="agregar-pf" data-lista-pf="galeria">+ Agregar foto</button>
              <label className="boton boton--secundario boton--chico">
                <span>Subir varias fotos juntas</span>
                <input className="visualmente-oculto" type="file" data-galeria-multi="portafolio" accept="image/png,image/jpeg,image/webp" multiple />
              </label>
            </div>
          </div>
        </details>

        <details className="paso">
          <summary className="paso__resumen">
            <span className="paso__num">5</span>
            <span className="paso__titulo">Secciones de tu Landing Page</span>
            <span className="paso__desc">Especialidades, packs/servicios, testimonios y FAQ</span>
          </summary>
          <div className="paso__contenido">
            <h3 className="separador-campos" style={{ marginTop: '0.2rem' }}>Especialidades o habilidades clave</h3>
            <div className="lista" data-lista-pf="especialidades" data-vacio="Sumá las áreas, tecnologías o servicios en los que te especializás."></div>
            <button type="button" className="boton boton--agregar" data-accion="agregar-pf" data-lista-pf="especialidades">Agregar especialidad</button>

            <h3 className="separador-campos">Servicios o packs ofrecidos (opcional)</h3>
            <label className="campo" style={{ marginBottom: '0.75rem' }}>
              <span className="campo__etiqueta">Título de la sección de servicios</span>
              <input className="control" type="text" data-campo-pf="opciones.serviciosTitulo" placeholder="Ej.: Servicios y soluciones" />
            </label>
            <div className="lista" data-lista-pf="serviciosWeb" data-vacio="Mostrá qué servicios o paquetes ofrecés en tu página web."></div>
            <button type="button" className="boton boton--agregar" data-accion="agregar-pf" data-lista-pf="serviciosWeb">Agregar servicio o pack</button>

            <h3 className="separador-campos">Testimonios de clientes (opcional)</h3>
            <div className="lista" data-lista-pf="testimonios" data-vacio="Sumá reseñas reales con foto o avatar de tus clientes."></div>
            <button type="button" className="boton boton--agregar" data-accion="agregar-pf" data-lista-pf="testimonios">Agregar testimonio</button>

            <h3 className="separador-campos">Preguntas frecuentes — FAQ (opcional)</h3>
            <div className="lista" data-lista-pf="faqs" data-vacio="Respondé las preguntas más comunes antes de que te escriban."></div>
            <button type="button" className="boton boton--agregar" data-accion="agregar-pf" data-lista-pf="faqs">Agregar pregunta frecuente</button>
          </div>
        </details>

        <details className="paso">
          <summary className="paso__resumen">
            <span className="paso__num">6</span>
            <span className="paso__titulo">Navegación y contacto (CTA)</span>
            <span className="paso__desc">Menú de tu página, visor Lightbox y botón de contacto</span>
          </summary>
          <div className="paso__contenido">
            <div className="grilla">
              <label className="campo campo--ancho">
                <span className="campo__etiqueta">Texto del botón principal (Contactar / Contratar)</span>
                <input className="control" type="text" data-campo-pf="portafolio.ctaTexto" placeholder="Ej.: Contactar / Contratar / Pedir presupuesto" />
              </label>
              <label className="campo campo--ancho">
                <span className="campo__etiqueta">Título del bloque de cierre</span>
                <input className="control" type="text" data-campo-pf="portafolio.cierreTitulo" placeholder="Ej.: ¿Trabajamos juntos en tu próximo proyecto?" />
              </label>
              <label className="campo campo--ancho">
                <span className="campo__etiqueta">Mensaje de cierre</span>
                <textarea className="control" rows="3" data-campo-pf="portafolio.cierreTexto" placeholder="Ej.: Contame qué necesitás resolver o construir y armamos una propuesta a medida."></textarea>
              </label>
              <label className="casilla campo--ancho">
                <input type="checkbox" data-campo-pf="opciones.barraNav" />
                <span>Mostrar barra de navegación tipo Landing Page (Sobre mí · Proyectos · Galería · Servicios · Contacto)</span>
              </label>
              <label className="casilla campo--ancho">
                <input type="checkbox" data-campo-pf="opciones.lightbox" />
                <span>Permitir ampliar fotos en pantalla completa (Lightbox) al hacer clic</span>
              </label>
              <label className="casilla campo--ancho">
                <input type="checkbox" data-campo-pf="opciones.credito" />
                <span>Mencionar al autor de la plantilla al pie</span>
              </label>
            </div>
          </div>
        </details>
      </div>
  );
}
