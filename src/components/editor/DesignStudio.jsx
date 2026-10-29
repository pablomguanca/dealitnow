// Estudio de diseño visual: plantillas por rubro, temas cromáticos, decoraciones SVG, portadas, estilos de bloques, tipografías y escalas.

export function DesignStudio() {
  return (
    <details className="paso" open>
        <summary className="paso__resumen">
          <span className="paso__num icono-pincel"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 1.5l3 3-8.5 8.5H3v-3l8.5-8.5z"/></svg></span>
          <span className="paso__titulo">Diseño y plantillas</span>
          <span className="paso__desc">Rubros, temas, decoración tipo Canva y disposición</span>
        </summary>
        <div className="paso__contenido">
          <div id="plantillas-propuesta-wrap">
          <div className="estudio-cabecera">
            <h3 className="separador-campos">Partir de una plantilla por rubro</h3>
            <p className="campo__ayuda">Cargá una propuesta completa con textos, servicios y diseño pensados para tu actividad.</p>
          </div>
          <div className="plantillas-rubro" id="plantillas-grid">
            <button type="button" className="plantilla-chip" data-plantilla="en-blanco">
              <span className="plantilla-chip__rubro">Lienzo limpio</span>
              <span className="plantilla-chip__nombre">En blanco (desde cero)</span>
            </button>
            <button type="button" className="plantilla-chip" data-plantilla="diseno-web">
              <span className="plantilla-chip__rubro">Diseño &amp; Web</span>
              <span className="plantilla-chip__nombre">Branding y Tienda Online</span>
            </button>
            <button type="button" className="plantilla-chip" data-plantilla="software-saas">
              <span className="plantilla-chip__rubro">Software &amp; Tech <em className="insignia-pro">PRO</em></span>
              <span className="plantilla-chip__nombre">App Web y Panel Operativo</span>
            </button>
            <button type="button" className="plantilla-chip" data-plantilla="marketing-redes">
              <span className="plantilla-chip__rubro">Agencia &amp; Redes <em className="insignia-pro">PRO</em></span>
              <span className="plantilla-chip__nombre">Reels, Redes y Campañas</span>
            </button>
            <button type="button" className="plantilla-chip" data-plantilla="arquitectura-interiorismo">
              <span className="plantilla-chip__rubro">Arquitectura &amp; Obra <em className="insignia-pro">PRO</em></span>
              <span className="plantilla-chip__nombre">Interiorismo y Reforma</span>
            </button>
            <button type="button" className="plantilla-chip" data-plantilla="consultoria-b2b">
              <span className="plantilla-chip__rubro">Consultoría B2B</span>
              <span className="plantilla-chip__nombre">Procesos y Ventas CRM</span>
            </button>
            <button type="button" className="plantilla-chip" data-plantilla="audiovisual-eventos">
              <span className="plantilla-chip__rubro">Audiovisual &amp; Foto <em className="insignia-pro">PRO</em></span>
              <span className="plantilla-chip__nombre">Rodaje y Campaña 4K</span>
            </button>
          </div>
          </div>
          <div id="plantillas-portafolio-wrap" hidden>
            <div className="estudio-cabecera">
              <h3 className="separador-campos">Partir de una plantilla de portfolio</h3>
              <p className="campo__ayuda">Modelos pensados tanto para agencias y freelancers con casos de estudio como para mostrar proyectos conceptuales y expertise técnica.</p>
            </div>
            <div className="plantillas-rubro" id="plantillas-portafolio-grid">
              <button type="button" className="plantilla-chip" data-plantilla-portafolio="en-blanco">
                <span className="plantilla-chip__rubro">Lienzo limpio</span>
                <span className="plantilla-chip__nombre">En blanco (desde cero)</span>
              </button>
              <button type="button" className="plantilla-chip" data-plantilla-portafolio="diseno-web">
                <span className="plantilla-chip__rubro">Diseño &amp; Estudio</span>
                <span className="plantilla-chip__nombre">Diseño, Branding &amp; Web</span>
              </button>
              <button type="button" className="plantilla-chip" data-plantilla-portafolio="software-producto">
                <span className="plantilla-chip__rubro">Desarrollo &amp; SaaS <em className="insignia-pro">PRO</em></span>
                <span className="plantilla-chip__nombre">Software, Apps &amp; Tech</span>
              </button>
              <button type="button" className="plantilla-chip" data-plantilla-portafolio="marketing-contenido">
                <span className="plantilla-chip__rubro">Agencia &amp; Contenido <em className="insignia-pro">PRO</em></span>
                <span className="plantilla-chip__nombre">Marketing, Redes &amp; Video</span>
              </button>
              <button type="button" className="plantilla-chip" data-plantilla-portafolio="conceptos-expertise">
                <span className="plantilla-chip__rubro">Sin clientes previos</span>
                <span className="plantilla-chip__nombre">Conceptos &amp; Expertise</span>
              </button>
            </div>
          </div>

          <h3 className="separador-campos">Tema visual</h3>
          <div className="temas" id="temas-grid">
            <button type="button" className="tema-card" data-tema="lienzo-blanco">
              <div className="tema-card__muestra"><span style={{ background: '#FFFFFF', border: '1px solid #CBD5E1' }}></span><span style={{ background: '#111827' }}></span><span style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}></span></div>
              <span className="tema-card__nombre">Lienzo en blanco</span>
              <span className="tema-card__sub">100% Blanco</span>
            </button>
            <button type="button" className="tema-card tema-card--activo" data-tema="elegante-oscuro">
              <div className="tema-card__muestra"><span style={{ background: '#06060A' }}></span><span style={{ background: '#C9A84C' }}></span><span style={{ background: '#F0EBE0' }}></span></div>
              <span className="tema-card__nombre">Elegante oscuro</span>
              <span className="tema-card__sub">Noir &amp; Oro</span>
            </button>
            <button type="button" className="tema-card" data-tema="corporativo">
              <div className="tema-card__muestra"><span style={{ background: '#FFFFFF' }}></span><span style={{ background: '#2563EB' }}></span><span style={{ background: '#0F172A' }}></span></div>
              <span className="tema-card__nombre">Corporativo</span>
              <span className="tema-card__sub">Ejecutivo B2B</span>
            </button>
            <button type="button" className="tema-card" data-tema="moderno">
              <div className="tema-card__muestra"><span style={{ background: '#0F172A' }}></span><span style={{ background: '#8B5CF6' }}></span><span style={{ background: '#E2E8F0' }}></span></div>
              <span className="tema-card__nombre">Moderno</span>
              <span className="tema-card__sub">Violeta Digital</span>
            </button>
            <button type="button" className="tema-card" data-tema="calido">
              <div className="tema-card__muestra"><span style={{ background: '#FFFBEB' }}></span><span style={{ background: '#B45309' }}></span><span style={{ background: '#292524' }}></span></div>
              <span className="tema-card__nombre">Cálido</span>
              <span className="tema-card__sub">Editorial Crema</span>
            </button>
            <button type="button" className="tema-card" data-tema="minimalista">
              <div className="tema-card__muestra"><span style={{ background: '#FAFAFA' }}></span><span style={{ background: '#18181B' }}></span><span style={{ background: '#171717' }}></span></div>
              <span className="tema-card__nombre">Minimalista</span>
              <span className="tema-card__sub">Puro &amp; Limpio</span>
            </button>
            <button type="button" className="tema-card" data-tema="botanico">
              <span className="tema-card__badge">PRO</span>
              <div className="tema-card__muestra"><span style={{ background: '#F4F7F4' }}></span><span style={{ background: '#15803D' }}></span><span style={{ background: '#14261A' }}></span></div>
              <span className="tema-card__nombre">Botánico</span>
              <span className="tema-card__sub">Orgánico Natural</span>
            </button>
            <button type="button" className="tema-card" data-tema="aurora-tech">
              <span className="tema-card__badge">PRO</span>
              <div className="tema-card__muestra"><span style={{ background: '#050914' }}></span><span style={{ background: '#06B6D4' }}></span><span style={{ background: '#ECFEFF' }}></span></div>
              <span className="tema-card__nombre">Aurora Tech</span>
              <span className="tema-card__sub">SaaS &amp; Futuro</span>
            </button>
            <button type="button" className="tema-card" data-tema="editorial-studio">
              <span className="tema-card__badge">PRO</span>
              <div className="tema-card__muestra"><span style={{ background: '#FAF6F0' }}></span><span style={{ background: '#E11D48' }}></span><span style={{ background: '#181311' }}></span></div>
              <span className="tema-card__nombre">Estudio Bold</span>
              <span className="tema-card__sub">Agencia &amp; Bauhaus</span>
            </button>
            <button type="button" className="tema-card" data-tema="arquitectura">
              <span className="tema-card__badge">PRO</span>
              <div className="tema-card__muestra"><span style={{ background: '#F5F4F0' }}></span><span style={{ background: '#9A3412' }}></span><span style={{ background: '#1C1917' }}></span></div>
              <span className="tema-card__nombre">Arquitectura</span>
              <span className="tema-card__sub">Piedra &amp; Obra</span>
            </button>
            <button type="button" className="tema-card" data-tema="oceano-dinamico">
              <span className="tema-card__badge">PRO</span>
              <div className="tema-card__muestra"><span style={{ background: '#071324' }}></span><span style={{ background: '#38BDF8' }}></span><span style={{ background: '#F0F9FF' }}></span></div>
              <span className="tema-card__nombre">Océano Vivo</span>
              <span className="tema-card__sub">Fluido &amp; Creativo</span>
            </button>
          </div>

          <h3 className="separador-campos">Decoración gráfica</h3>
          <div className="opciones-visuales" id="decoraciones-grid">
            <button type="button" className="opcion-visual opcion-visual--activa" data-decoracion="marco">
              <svg viewBox="0 0 36 24" aria-hidden="true"><rect x="3" y="3" width="30" height="18" fill="none" stroke="currentColor" strokeWidth="1.3"/><rect x="5.5" y="5.5" width="25" height="13" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.55"/><circle cx="27" cy="8.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.7"/><polygon points="18,1.8 19.6,3 18,4.2 16.4,3" fill="currentColor"/></svg>
              <span>Marco</span>
            </button>
            <button type="button" className="opcion-visual" data-decoracion="organica">
              <svg viewBox="0 0 36 24" aria-hidden="true"><path d="M25 2c5 0 9 4 8 9.5S27 22 20 21 11 16 13 10.5 20 2 25 2z" fill="currentColor" opacity="0.22"/><path d="M23 19c2-5 5-9 9-12M25 14c-2-1.5-2-3.5 0-4.5 1.8 1 1.8 3 0 4.5z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M3 20c3-5 9-7 15-5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.65"/></svg>
              <span>Orgánica</span>
            </button>
            <button type="button" className="opcion-visual" data-decoracion="geometrica">
              <svg viewBox="0 0 36 24" aria-hidden="true"><circle cx="26" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2"/><circle cx="26" cy="9" r="4" fill="currentColor" opacity="0.22"/><path d="M3 21L15 7v14H3z" fill="currentColor" opacity="0.2"/><path d="M7 6h4M9 4v4" stroke="currentColor" strokeWidth="1.2"/></svg>
              <span>Bauhaus</span>
            </button>
            <button type="button" className="opcion-visual" data-decoracion="aurora">
              <svg viewBox="0 0 36 24" aria-hidden="true"><circle cx="24" cy="9" r="8" fill="currentColor" opacity="0.22"/><ellipse cx="24" cy="9" rx="8" ry="4" transform="rotate(-18 24 9)" fill="none" stroke="currentColor" strokeWidth="1"/><path d="M3 20h30M7 17h22" stroke="currentColor" strokeWidth="0.7" opacity="0.45"/><path d="M28 3.5l0.9 2.2 2.2 0.9-2.2 0.9L28 9.7l-0.9-2.2-2.2-0.9 2.2-0.9z" fill="currentColor"/></svg>
              <span>Aurora</span>
            </button>
            <button type="button" className="opcion-visual" data-decoracion="trama">
              <svg viewBox="0 0 36 24" aria-hidden="true"><path d="M4 8h28M4 16h28M12 3v18M22 3v18" stroke="currentColor" strokeWidth="0.6" opacity="0.35"/><circle cx="26" cy="9" r="5" fill="none" stroke="currentColor" strokeWidth="1.1"/><path d="M26 4a5 5 0 0 1 5 5" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M5 19h4M7 17v4" stroke="currentColor" strokeWidth="1.2"/></svg>
              <span>Trama</span>
            </button>
            <button type="button" className="opcion-visual" data-decoracion="ondas">
              <svg viewBox="0 0 36 24" aria-hidden="true"><path d="M2 13c6-4.5 11 4.5 17 0s11-4.5 15 0" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="M2 16.5c6-4.5 11 4.5 17 0s11-4.5 15 0" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.65"/><path d="M2 20c6-4.5 11 4.5 17 0s11-4.5 15 0" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.4"/><circle cx="28" cy="6.5" r="3" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/></svg>
              <span>Ondas</span>
            </button>
            <button type="button" className="opcion-visual" data-decoracion="ninguna">
              <svg viewBox="0 0 36 24" aria-hidden="true"><rect x="4" y="4" width="28" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35"/><line x1="9" y1="18" x2="27" y2="6" stroke="currentColor" strokeWidth="1.3"/></svg>
              <span>Limpio</span>
            </button>
          </div>

          <h3 className="separador-campos">Disposición de portada</h3>
          <div className="opciones-visuales opciones-visuales--4" id="portadas-grid">
            <button type="button" className="opcion-visual opcion-visual--activa" data-portada="editorial">
              <svg viewBox="0 0 36 24" aria-hidden="true"><rect x="4" y="4" width="10" height="2" fill="currentColor"/><rect x="4" y="10" width="24" height="4" fill="currentColor"/><rect x="4" y="19" width="28" height="1.5" fill="currentColor" opacity="0.45"/></svg>
              <span>Editorial</span>
            </button>
            <button type="button" className="opcion-visual" data-portada="dividida">
              <svg viewBox="0 0 36 24" aria-hidden="true"><rect x="2" y="2" width="8" height="20" fill="currentColor" opacity="0.35"/><rect x="13" y="8" width="19" height="4" fill="currentColor"/><rect x="13" y="15" width="14" height="5" fill="currentColor" opacity="0.25"/></svg>
              <span>Dividida</span>
            </button>
            <button type="button" className="opcion-visual" data-portada="insignia">
              <svg viewBox="0 0 36 24" aria-hidden="true"><rect x="12" y="4" width="12" height="2.5" rx="1.2" fill="currentColor" opacity="0.45"/><rect x="6" y="9" width="24" height="4" fill="currentColor"/><rect x="8" y="17" width="20" height="4" rx="1.5" fill="currentColor" opacity="0.25"/></svg>
              <span>Centrada</span>
            </button>
            <button type="button" className="opcion-visual" data-portada="impacto">
              <svg viewBox="0 0 36 24" aria-hidden="true"><path d="M2 2h32v11L2 16z" fill="currentColor" opacity="0.3"/><rect x="5" y="7" width="22" height="4" fill="currentColor"/><rect x="5" y="18" width="8" height="3.5" fill="currentColor" opacity="0.4"/><rect x="15" y="18" width="8" height="3.5" fill="currentColor" opacity="0.4"/></svg>
              <span>Impacto</span>
            </button>
          </div>

          <h3 className="separador-campos">Estilo de bloques y servicios</h3>
          <div className="opciones-visuales opciones-visuales--4" id="estilos-grid">
            <button type="button" className="opcion-visual opcion-visual--activa" data-estilo="editorial">
              <svg viewBox="0 0 36 24" aria-hidden="true"><text x="4" y="12" fontSize="8" fill="currentColor" fontWeight="bold">01</text><line x1="14" y1="7" x2="32" y2="7" stroke="currentColor" strokeWidth="2"/><line x1="14" y1="13" x2="30" y2="13" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/><line x1="14" y1="18" x2="32" y2="18" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/></svg>
              <span>Editorial</span>
            </button>
            <button type="button" className="opcion-visual" data-estilo="tarjetas">
              <svg viewBox="0 0 36 24" aria-hidden="true"><rect x="3" y="4" width="30" height="7" rx="2" fill="currentColor" opacity="0.22" stroke="currentColor" strokeWidth="1"/><rect x="3" y="13" width="30" height="7" rx="2" fill="currentColor" opacity="0.22" stroke="currentColor" strokeWidth="1"/></svg>
              <span>Tarjetas</span>
            </button>
            <button type="button" className="opcion-visual" data-estilo="bento">
              <svg viewBox="0 0 36 24" aria-hidden="true"><rect x="3" y="4" width="14" height="16" rx="2" fill="currentColor" opacity="0.28"/><rect x="19" y="4" width="14" height="7" rx="2" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1"/><rect x="19" y="13" width="14" height="7" rx="2" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1"/></svg>
              <span>Bento</span>
            </button>
            <button type="button" className="opcion-visual" data-estilo="minimal">
              <svg viewBox="0 0 36 24" aria-hidden="true"><line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2.5"/><line x1="10" y1="7" x2="30" y2="7" stroke="currentColor" strokeWidth="2"/><line x1="10" y1="13" x2="26" y2="13" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/><line x1="10" y1="17" x2="28" y2="17" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/></svg>
              <span>Lateral</span>
            </button>
          </div>

          <div className="personalizar-cabecera">
            <h3 className="separador-campos">Personalizar colores, tipografía y espaciados</h3>
            <button type="button" className="boton boton--texto boton--chico personalizar-reset" id="tema-restablecer-colores" data-accion="restablecer-colores" hidden>Restablecer ajustes</button>
          </div>
          <div className="grilla">
            <label className="campo">
              <span className="campo__etiqueta">Color de acento</span>
              <span className="color-campo">
                <input className="color-input" type="color" id="tema-acento" defaultValue="#C9A84C" />
                <span className="color-campo__texto">Tu color de marca</span>
              </span>
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Color de tipografía</span>
              <span className="color-campo">
                <input className="color-input" type="color" id="tema-color-texto" defaultValue="#F0EBE0" />
                <span className="color-campo__texto">Títulos y textos</span>
              </span>
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Fondo de portada</span>
              <span className="color-campo">
                <input className="color-input" type="color" id="tema-color-portada" defaultValue="#06060A" />
                <span className="color-campo__texto">Cabecera Hero</span>
              </span>
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Fondo de página</span>
              <span className="color-campo">
                <input className="color-input" type="color" id="tema-color-fondo" defaultValue="#06060A" />
                <span className="color-campo__texto">Cuerpo y secciones</span>
              </span>
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Color de decoración SVG</span>
              <span className="color-campo">
                <input className="color-input" type="color" id="tema-color-svg" defaultValue="#C9A84C" />
                <span className="color-campo__texto">Líneas, tramas y sello</span>
              </span>
            </label>
            <label className="campo">
              <span className="campo__etiqueta campo__etiqueta--fila">
                <span>Intensidad del SVG</span>
                <output className="campo__valor" id="tema-opacidad-valor" htmlFor="tema-opacidad-svg">100%</output>
              </span>
              <input className="rango-input" type="range" id="tema-opacidad-svg" min="0" max="200" step="5" defaultValue="100" />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Tipografía de títulos</span>
              <select className="control" id="tema-fuente-titulos">
                <option>Bebas Neue</option>
                <option>Playfair Display</option>
                <option>Poppins</option>
                <option>Oswald</option>
                <option>Raleway</option>
                <option>Inter</option>
                <option>DM Sans</option>
                <option>Space Grotesk</option>
                <option>Outfit</option>
                <option>Sora</option>
                <option>Archivo Black</option>
              </select>
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Tipografía de cuerpo</span>
              <select className="control" id="tema-fuente-cuerpo">
                <option>Montserrat</option>
                <option>Inter</option>
                <option>Open Sans</option>
                <option>Lato</option>
                <option>Source Sans 3</option>
                <option>DM Sans</option>
                <option>Nunito</option>
                <option>Work Sans</option>
                <option>Rubik</option>
                <option>IBM Plex Sans</option>
              </select>
            </label>
            <label className="campo">
              <span className="campo__etiqueta campo__etiqueta--fila">
                <span>Tamaño título de portada</span>
                <output className="campo__valor" id="tema-escala-portada-valor" htmlFor="tema-escala-portada">100%</output>
              </span>
              <input className="rango-input" type="range" id="tema-escala-portada" min="60" max="150" step="5" defaultValue="100" />
            </label>
            <label className="campo">
              <span className="campo__etiqueta campo__etiqueta--fila">
                <span>Tamaño títulos de sección</span>
                <output className="campo__valor" id="tema-escala-titulos-valor" htmlFor="tema-escala-titulos">100%</output>
              </span>
              <input className="rango-input" type="range" id="tema-escala-titulos" min="70" max="140" step="5" defaultValue="100" />
            </label>
            <label className="campo">
              <span className="campo__etiqueta campo__etiqueta--fila">
                <span>Tamaño de texto general</span>
                <output className="campo__valor" id="tema-escala-texto-valor" htmlFor="tema-escala-texto">100%</output>
              </span>
              <input className="rango-input" type="range" id="tema-escala-texto" min="85" max="125" step="5" defaultValue="100" />
            </label>
            <label className="campo">
              <span className="campo__etiqueta campo__etiqueta--fila">
                <span>Espaciado entre secciones</span>
                <output className="campo__valor" id="tema-espaciado-secciones-valor" htmlFor="tema-espaciado-secciones">100%</output>
              </span>
              <input className="rango-input" type="range" id="tema-espaciado-secciones" min="40" max="170" step="5" defaultValue="100" />
            </label>
            <label className="campo campo--ancho">
              <span className="campo__etiqueta campo__etiqueta--fila">
                <span>Espaciado interno de bloques y tarjetas</span>
                <output className="campo__valor" id="tema-espaciado-interno-valor" htmlFor="tema-espaciado-interno">100%</output>
              </span>
              <input className="rango-input" type="range" id="tema-espaciado-interno" min="60" max="150" step="5" defaultValue="100" />
            </label>
          </div>
        </div>
      </details>
  );
}
