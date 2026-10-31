// Diálogos modales (confirmación, plantillas, compartir, aceptar propuesta, eliminar cuenta, visor Lightbox), notificaciones y plantillas de listas dinámicas.

const TPL_CONTROLES = `<button type="button" class="icono-boton" data-accion="subir"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 10l4-4 4 4"/></svg></button>
  <button type="button" class="icono-boton" data-accion="bajar"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg></button>
  <button type="button" class="icono-boton" data-accion="quitar"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg></button>`;
const TPL_OBJETIVOS = `<div class="item item--fila">
    <label class="campo">
      <span class="visualmente-oculto">Objetivo</span>
      <input class="control" type="text" data-item="texto" placeholder="Ej.: Recibir más consultas desde el sitio">
    </label>
    <div class="item__controles" data-controles></div>
  </div>`;
const TPL_SERVICIOS = `<div class="item">
    <div class="item__cabecera">
      <span class="item__titulo">Servicio <span data-orden></span></span>
      <div class="item__controles" data-controles></div>
    </div>
    <div class="grilla">
      <label class="campo campo--ancho">
        <span class="campo__etiqueta">Nombre del servicio</span>
        <input class="control" type="text" data-item="nombre" placeholder="Ej.: Diseño del sitio web">
      </label>
      <label class="campo campo--ancho">
        <span class="campo__etiqueta">Modalidad de cobro</span>
        <select class="control" data-item="modalidad">
          <option value="incluido">Incluido en el fee / abono (sin precio individual)</option>
          <option value="unico">Pago único</option>
          <option value="mensual">Mensual (con precio individual)</option>
          <option value="hora">Por hora</option>
        </select>
      </label>
      <label class="campo" data-campo-cantidad>
        <span class="campo__etiqueta" data-etiqueta-cantidad>Cantidad</span>
        <input class="control" type="number" min="0" step="any" inputmode="decimal" data-item="cantidad" data-tipo="numero">
      </label>
      <label class="campo" data-campo-precio>
        <span class="campo__etiqueta" data-etiqueta-precio>Precio</span>
        <input class="control" type="number" min="0" step="any" inputmode="decimal" data-item="precio" data-tipo="numero">
      </label>
      <label class="campo campo--ancho">
        <span class="campo__etiqueta">Descripción</span>
        <textarea class="control" rows="3" data-item="descripcion" placeholder="Qué resuelve este servicio para tu cliente."></textarea>
      </label>
      <label class="campo campo--ancho">
        <span class="campo__etiqueta">Entregables, uno por línea</span>
        <textarea class="control" rows="3" data-item="entregables" placeholder="Ej.: Diseño de cinco páginas"></textarea>
      </label>
      <div class="campo campo--ancho">
        <span class="campo__etiqueta">Foto o imagen del servicio (opcional)</span>
        <div class="logo">
          <img class="logo__vista proyecto-imagen__vista" data-srv-img-vista alt="Foto del servicio" hidden>
          <label class="boton boton--secundario boton--chico">
            <span data-srv-img-texto>Subir foto</span>
            <input class="visualmente-oculto" type="file" data-srv-img-input accept="image/png,image/jpeg,image/webp">
          </label>
          <button type="button" class="boton boton--texto boton--chico" data-accion="quitar-img-servicio" data-srv-img-quitar hidden>Quitar</button>
        </div>
      </div>
      <label class="casilla campo--ancho">
        <input type="checkbox" data-item="opcional">
        <span>Opcional: tu cliente decide si lo suma</span>
      </label>
    </div>
    <p class="item__subtotal">Subtotal <strong data-subtotal></strong></p>
  </div>`;
const TPL_ETAPAS = `<div class="item">
    <div class="item__cabecera">
      <span class="item__titulo">Etapa <span data-orden></span></span>
      <div class="item__controles" data-controles></div>
    </div>
    <div class="grilla">
      <label class="campo">
        <span class="campo__etiqueta">Nombre</span>
        <input class="control" type="text" data-item="nombre" placeholder="Ej.: Diseño">
      </label>
      <label class="campo">
        <span class="campo__etiqueta">Duración</span>
        <input class="control" type="text" data-item="duracion" placeholder="Ej.: 2 semanas">
      </label>
      <label class="campo campo--ancho">
        <span class="campo__etiqueta">Qué pasa en esta etapa</span>
        <textarea class="control" rows="2" data-item="descripcion" placeholder="Ej.: Presentamos dos propuestas y ajustamos la elegida."></textarea>
      </label>
    </div>
  </div>`;
const TPL_PAGOS = `<div class="item item--fila item--pago">
    <label class="campo">
      <span class="visualmente-oculto">Momento del pago</span>
      <input class="control" type="text" data-item="concepto" placeholder="Ej.: Al aprobar la propuesta">
    </label>
    <label class="campo">
      <span class="visualmente-oculto">Porcentaje</span>
      <span class="porcentaje"><input class="control" type="number" min="0" max="100" step="any" inputmode="decimal" data-item="porcentaje" data-tipo="numero"></span>
    </label>
    <div class="item__controles" data-controles></div>
  </div>`;
const TPL_ESPECIALIDADES = `<div class="item item--fila">
    <label class="campo">
      <span class="visualmente-oculto">Especialidad</span>
      <input class="control" type="text" data-item-pf="texto" placeholder="Ej.: Diseño UX/UI en Figma">
    </label>
    <div class="item__controles" data-controles></div>
  </div>`;
const TPL_PROYECTOS = `<div class="item">
    <div class="item__cabecera">
      <span class="item__titulo">Proyecto <span data-orden></span></span>
      <div class="item__controles" data-controles></div>
    </div>
    <div class="grilla">
      <label class="campo campo--ancho">
        <span class="campo__etiqueta">Nombre del proyecto o caso</span>
        <input class="control" type="text" data-item-pf="titulo" placeholder="Ej.: Rediseño de tienda online / App Fintech (Concepto)">
      </label>
      <label class="campo">
        <span class="campo__etiqueta">Categoría o rol</span>
        <input class="control" type="text" data-item-pf="categoria" placeholder="Ej.: UX/UI &amp; Desarrollo">
      </label>
      <label class="campo">
        <span class="campo__etiqueta">Cliente o contexto (opcional)</span>
        <input class="control" type="text" data-item-pf="subtitulo" placeholder="Ej.: Almacén Botánico o Caso propio">
      </label>
      <label class="campo campo--ancho">
        <span class="campo__etiqueta">Resultado, métrica o foco destacado (opcional)</span>
        <input class="control" type="text" data-item-pf="destacado" placeholder="Ej.: +140% conversión online / Sistema de 24 pantallas">
      </label>
      <label class="campo campo--ancho">
        <span class="campo__etiqueta">Descripción del proyecto</span>
        <textarea class="control" rows="3" data-item-pf="descripcion" placeholder="Qué problema resolviste, cómo lo trabajaste o qué demuestra este proyecto."></textarea>
      </label>
      <label class="campo campo--ancho">
        <span class="campo__etiqueta">Herramientas o entregables (separados por coma)</span>
        <input class="control" type="text" data-item-pf="tags" placeholder="Ej.: Figma, React, Identidad visual, Fotografía">
      </label>
      <label class="campo">
        <span class="campo__etiqueta">Link al proyecto (opcional)</span>
        <input class="control" type="url" data-item-pf="enlace" placeholder="https://...">
      </label>
      <label class="campo">
        <span class="campo__etiqueta">Texto del botón</span>
        <input class="control" type="text" data-item-pf="textoEnlace" placeholder="Ver proyecto">
      </label>
      <label class="campo">
        <span class="campo__etiqueta">Formato de imagen</span>
        <select class="control" data-item-pf="proporcion">
          <option value="panoramica">Panorámica (16:9)</option>
          <option value="cuadrada">Cuadrada (1:1)</option>
          <option value="vertical">Vertical (4:5)</option>
          <option value="natural">Proporción original</option>
        </select>
      </label>
      <div class="campo">
        <span class="campo__etiqueta">Foto principal del proyecto</span>
        <div class="logo proyecto-imagen-control">
          <img class="logo__vista proyecto-imagen__vista" data-pf-img-vista alt="Portada del proyecto" hidden>
          <label class="boton boton--secundario boton--chico">
            <span data-pf-img-texto>Subir portada</span>
            <input class="visualmente-oculto" type="file" data-pf-img-input accept="image/png,image/jpeg,image/webp">
          </label>
          <button type="button" class="boton boton--texto boton--chico" data-accion="quitar-img-proyecto" data-pf-img-quitar hidden>Quitar</button>
        </div>
      </div>
      <div class="campo campo--ancho">
        <span class="campo__etiqueta">Galería adicional del proyecto (hasta 8 fotos)</span>
        <div class="proyecto-galeria-mini" data-pf-galeria-lista></div>
        <div class="logo">
          <label class="boton boton--secundario boton--chico">
            <span>+ Sumar fotos al proyecto</span>
            <input class="visualmente-oculto" type="file" data-pf-galeria-input accept="image/png,image/jpeg,image/webp" multiple>
          </label>
        </div>
        <p class="campo__ayuda">Si subís varias fotos, el visitante puede recorrerlas en un carrusel interactivo a pantalla completa.</p>
      </div>
    </div>
  </div>`;
const TPL_GALERIA = `<div class="item">
    <div class="item__cabecera">
      <span class="item__titulo">Foto <span data-orden></span></span>
      <div class="item__controles" data-controles></div>
    </div>
    <div class="grilla">
      <div class="campo">
        <span class="campo__etiqueta">Imagen</span>
        <div class="logo">
          <img class="logo__vista proyecto-imagen__vista" data-gal-img-vista alt="Foto de galería" hidden>
          <label class="boton boton--secundario boton--chico">
            <span data-gal-img-texto>Subir foto</span>
            <input class="visualmente-oculto" type="file" data-gal-img-input accept="image/png,image/jpeg,image/webp">
          </label>
          <button type="button" class="boton boton--texto boton--chico" data-accion="quitar-img-galeria" data-gal-img-quitar hidden>Quitar</button>
        </div>
      </div>
      <label class="campo">
        <span class="campo__etiqueta">Recorte / Proporción</span>
        <select class="control" data-item="proporcion" data-item-pf="proporcion">
          <option value="panoramica">Panorámica (16:9)</option>
          <option value="cuadrada">Cuadrada (1:1)</option>
          <option value="vertical">Vertical (4:5)</option>
          <option value="natural">Original</option>
        </select>
      </label>
      <label class="campo">
        <span class="campo__etiqueta">Título o epígrafe (opcional)</span>
        <input class="control" type="text" data-item="titulo" data-item-pf="titulo" placeholder="Ej.: Detalle de packaging / Vista del salón">
      </label>
      <label class="campo">
        <span class="campo__etiqueta">Descripción breve (opcional)</span>
        <input class="control" type="text" data-item="descripcion" data-item-pf="descripcion" placeholder="Ej.: Producción 2026">
      </label>
    </div>
  </div>`;
const TPL_SERVICIOSWEB = `<div class="item">
    <div class="item__cabecera">
      <span class="item__titulo">Servicio / Pack <span data-orden></span></span>
      <div class="item__controles" data-controles></div>
    </div>
    <div class="grilla">
      <label class="campo">
        <span class="campo__etiqueta">Nombre del servicio o pack</span>
        <input class="control" type="text" data-item-pf="titulo" placeholder="Ej.: Identidad Visual &amp; Manual de Marca">
      </label>
      <label class="campo">
        <span class="campo__etiqueta">Precio o referencia (opcional)</span>
        <input class="control" type="text" data-item-pf="precio" placeholder="Ej.: Desde USD 950 / A cotizar">
      </label>
      <label class="campo campo--ancho">
        <span class="campo__etiqueta">Descripción</span>
        <textarea class="control" rows="2" data-item-pf="descripcion" placeholder="Qué incluye este servicio y para quién está pensado."></textarea>
      </label>
      <div class="campo">
        <span class="campo__etiqueta">Foto del servicio (opcional)</span>
        <div class="logo">
          <img class="logo__vista proyecto-imagen__vista" data-sweb-img-vista alt="Foto del servicio" hidden>
          <label class="boton boton--secundario boton--chico">
            <span data-sweb-img-texto>Subir foto</span>
            <input class="visualmente-oculto" type="file" data-sweb-img-input accept="image/png,image/jpeg,image/webp">
          </label>
          <button type="button" class="boton boton--texto boton--chico" data-accion="quitar-img-sweb" data-sweb-img-quitar hidden>Quitar</button>
        </div>
      </div>
      <label class="campo">
        <span class="campo__etiqueta">Texto del botón</span>
        <input class="control" type="text" data-item-pf="cta" placeholder="Consultar">
      </label>
    </div>
  </div>`;
const TPL_TESTIMONIOS = `<div class="item">
    <div class="item__cabecera">
      <span class="item__titulo">Testimonio <span data-orden></span></span>
      <div class="item__controles" data-controles></div>
    </div>
    <div class="grilla">
      <label class="campo campo--ancho">
        <span class="campo__etiqueta">Comentario del cliente</span>
        <textarea class="control" rows="2" data-item="texto" data-item-pf="texto" placeholder="Ej.: El nuevo sitio duplicó las consultas en el primer mes."></textarea>
      </label>
      <label class="campo">
        <span class="campo__etiqueta">Nombre</span>
        <input class="control" type="text" data-item="autor" data-item-pf="autor" placeholder="Ej.: Gastón Peralta">
      </label>
      <label class="campo">
        <span class="campo__etiqueta">Cargo o empresa</span>
        <input class="control" type="text" data-item="rol" data-item-pf="rol" placeholder="Ej.: Fundador de Almacén Botánico">
      </label>
      <div class="campo campo--ancho">
        <span class="campo__etiqueta">Foto de la persona o logo (opcional)</span>
        <div class="logo">
          <img class="logo__vista logo__vista--avatar" data-test-img-vista alt="Foto testimonio" hidden>
          <label class="boton boton--secundario boton--chico">
            <span data-test-img-texto>Subir foto</span>
            <input class="visualmente-oculto" type="file" data-test-img-input accept="image/png,image/jpeg,image/webp">
          </label>
          <button type="button" class="boton boton--texto boton--chico" data-accion="quitar-img-testimonio" data-test-img-quitar hidden>Quitar</button>
        </div>
      </div>
    </div>
  </div>`;
const TPL_FAQS = `<div class="item">
    <div class="item__cabecera">
      <span class="item__titulo">Pregunta <span data-orden></span></span>
      <div class="item__controles" data-controles></div>
    </div>
    <div class="grilla">
      <label class="campo campo--ancho">
        <span class="campo__etiqueta">Pregunta</span>
        <input class="control" type="text" data-item="pregunta" data-item-pf="pregunta" placeholder="Ej.: ¿Cuáles son los plazos y formas de pago?">
      </label>
      <label class="campo campo--ancho">
        <span class="campo__etiqueta">Respuesta</span>
        <textarea class="control" rows="2" data-item="respuesta" data-item-pf="respuesta" placeholder="Ej.: Trabajamos por etapas con un anticipo del 40% y saldo contra entregas."></textarea>
      </label>
    </div>
  </div>`;

export function AppModals() {
  return (
    <>
      <dialog className="dialogo" id="dialogo" aria-labelledby="dialogo-titulo">
  <form method="dialog">
    <h2 className="dialogo__titulo" id="dialogo-titulo"></h2>
    <p className="dialogo__texto" id="dialogo-texto"></p>
    <div className="dialogo__acciones">
      <button className="boton boton--texto" value="cancelar">Cancelar</button>
      <button className="boton boton--primario" value="aceptar" id="dialogo-confirmar"></button>
    </div>
  </form>
</dialog>

<dialog className="dialogo dialogo--ancho" id="dialogo-plantilla" aria-labelledby="plantilla-modal-titulo">
  <form method="dialog">
    <h2 className="dialogo__titulo" id="plantilla-modal-titulo">Aplicar plantilla</h2>
    <p className="dialogo__texto" id="plantilla-modal-texto">¿Querés cargar toda la propuesta de ejemplo de este rubro o aplicar únicamente su diseño visual manteniendo lo que ya escribiste?</p>
    <div className="dialogo__acciones">
      <button className="boton boton--texto" value="cancelar">Cancelar</button>
      <button type="button" className="boton boton--secundario" id="plantilla-solo-diseno">Solo aplicar diseño</button>
      <button type="button" className="boton boton--primario" id="plantilla-completa">Cargar texto y diseño</button>
    </div>
  </form>
</dialog>

<dialog className="dialogo dialogo--ancho" id="dialogo-compartir" aria-labelledby="compartir-titulo">
  <form method="dialog">
    <h2 className="dialogo__titulo" id="compartir-titulo">Tu propuesta está lista para mandar</h2>
    <p className="dialogo__texto">Este link abre la propuesta completa. Tu cliente la recorre desde el celular, suma los opcionales que quiera y la acepta con un toque.</p>
    <div className="enlace">
      <label className="visualmente-oculto" htmlFor="enlace-propuesta">Link de la propuesta</label>
      <input className="control enlace__campo" id="enlace-propuesta" type="text" readOnly />
      <button type="button" className="boton boton--primario" data-accion="copiar-link">Copiar link</button>
    </div>
    <p className="aviso-campo" id="compartir-aviso" hidden></p>
    <div className="dialogo__acciones dialogo__acciones--izq">
      <a className="boton boton--secundario" id="compartir-abrir" target="_blank" rel="noopener">Ver como cliente</a>
      <a className="boton boton--secundario" id="compartir-whatsapp" target="_blank" rel="noopener">Enviar por WhatsApp</a>
      <button type="button" className="boton boton--secundario" data-accion="compartir-nativo" id="compartir-nativo" hidden>Compartir</button>
    </div>
    <p className="campo__ayuda dialogo__nota" id="compartir-nota">Cada link guarda la propuesta tal como está ahora. Si después cambiás algo, generá uno nuevo y mandá ese.</p>
    <div className="dialogo__acciones">
      <button type="button" className="boton boton--texto boton--peligro" data-accion="desactivar-link" id="compartir-desactivar" hidden>Desactivar link</button>
      <button className="boton boton--texto" value="cerrar">Cerrar</button>
    </div>
  </form>
</dialog>

<dialog className="dialogo" id="dialogo-eliminar" aria-labelledby="eliminar-titulo">
  <form method="dialog" id="eliminar-form">
    <h2 className="dialogo__titulo" id="eliminar-titulo">Eliminar tu cuenta</h2>
    <p className="dialogo__texto">Se borran tu cuenta, todas tus propuestas y tus logos. Los links que compartiste dejan de funcionar. <strong>No se puede deshacer.</strong></p>
    <label className="campo">
      <span className="campo__etiqueta">Para confirmar, escribí ELIMINAR</span>
      <input className="control" id="eliminar-confirmacion" type="text" autoComplete="off" autoCapitalize="characters" spellCheck="false" />
    </label>
    <label className="campo" id="eliminar-campo-pass" hidden>
      <span className="campo__etiqueta">Tu contraseña</span>
      <input className="control" id="eliminar-pass" type="password" autoComplete="current-password" />
    </label>
    <p className="campo__ayuda" id="eliminar-ayuda-google" hidden>Google te va a pedir que confirmes que sos vos.</p>
    <p className="auth__error" id="eliminar-error" role="alert" hidden></p>
    <div className="dialogo__acciones">
      <button className="boton boton--texto" value="cancelar" formnovalidate>Cancelar</button>
      <button type="button" className="boton boton--primario boton--destructivo" id="eliminar-confirmar" disabled>Eliminar cuenta</button>
    </div>
  </form>
</dialog>

<dialog className="dialogo" id="dialogo-aceptar" aria-labelledby="aceptar-titulo">
  <form method="dialog">
    <h2 className="dialogo__titulo" id="aceptar-titulo">Confirmar la propuesta</h2>
    <dl className="dialogo__resumen" id="aceptar-resumen"></dl>
    <p className="dialogo__texto" id="aceptar-texto"></p>
    <div className="aceptar__formulario" id="aceptar-formulario" hidden>
      <label className="campo">
        <span className="campo__etiqueta">Tu nombre completo</span>
        <input className="control" id="aceptar-nombre" type="text" autoComplete="name" maxLength="120" />
      </label>
      <label className="casilla">
        <input type="checkbox" id="aceptar-conformidad" />
        <span>Acepto la propuesta y sus condiciones.</span>
      </label>
      <p className="auth__error" id="aceptar-error" role="alert" hidden></p>
    </div>
    <div className="dialogo__acciones dialogo__acciones--apiladas">
      <button type="button" className="boton boton--primario boton--grande" id="aceptar-confirmar" hidden disabled>Aceptar propuesta</button>
      <a className="boton boton--primario boton--grande" id="aceptar-whatsapp" target="_blank" rel="noopener" hidden>Confirmar por WhatsApp</a>
      <a className="boton boton--secundario boton--grande" id="aceptar-email" hidden>Confirmar por email</a>
      <button type="button" className="boton boton--secundario boton--grande" data-accion="copiar-aceptacion" id="aceptar-copiar" hidden>Copiar mensaje de confirmación</button>
      <button className="boton boton--texto" value="cancelar" id="aceptar-cerrar">Volver a la propuesta</button>
    </div>
  </form>
</dialog>

<input className="visualmente-oculto" id="campo-borrador" type="file" accept="application/json,.json" tabIndex="-1" aria-hidden="true" />

<div className="aviso" id="aviso" role="status" aria-live="polite"></div>
      <template id="tpl-controles" dangerouslySetInnerHTML={{ __html: TPL_CONTROLES }} />
      <template id="tpl-objetivos" dangerouslySetInnerHTML={{ __html: TPL_OBJETIVOS }} />
      <template id="tpl-servicios" dangerouslySetInnerHTML={{ __html: TPL_SERVICIOS }} />
      <template id="tpl-etapas" dangerouslySetInnerHTML={{ __html: TPL_ETAPAS }} />
      <template id="tpl-pagos" dangerouslySetInnerHTML={{ __html: TPL_PAGOS }} />
      <template id="tpl-especialidades" dangerouslySetInnerHTML={{ __html: TPL_ESPECIALIDADES }} />
      <template id="tpl-proyectos" dangerouslySetInnerHTML={{ __html: TPL_PROYECTOS }} />
      <template id="tpl-galeria" dangerouslySetInnerHTML={{ __html: TPL_GALERIA }} />
      <template id="tpl-serviciosWeb" dangerouslySetInnerHTML={{ __html: TPL_SERVICIOSWEB }} />
      <template id="tpl-testimonios" dangerouslySetInnerHTML={{ __html: TPL_TESTIMONIOS }} />
      <template id="tpl-faqs" dangerouslySetInnerHTML={{ __html: TPL_FAQS }} />
      <dialog className="lightbox" id="dialogo-lightbox" aria-label="Visor de imagen a pantalla completa">
  <div className="lightbox__barra">
    <span className="lightbox__contador" id="lightbox-contador"></span>
    <button type="button" className="icono-boton lightbox__cerrar" data-accion="lightbox-cerrar" aria-label="Cerrar visor">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>
    </button>
  </div>
  <div className="lightbox__escenario" data-accion="lightbox-fondo">
    <button type="button" className="icono-boton lightbox__nav lightbox__nav--ant" id="lightbox-ant" data-accion="lightbox-ant" aria-label="Foto anterior">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5"/></svg>
    </button>
    <figure className="lightbox__figura">
      <img className="lightbox__img" id="lightbox-img" alt="" />
      <figcaption className="lightbox__epigrafe" id="lightbox-epigrafe" hidden></figcaption>
    </figure>
    <button type="button" className="icono-boton lightbox__nav lightbox__nav--sig" id="lightbox-sig" data-accion="lightbox-sig" aria-label="Foto siguiente">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5"/></svg>
    </button>
  </div>
</dialog>
    </>
  );
}
