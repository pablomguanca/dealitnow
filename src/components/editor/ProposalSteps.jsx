// Pasos 2 a 7 del editor de propuestas comerciales: cliente, contexto, servicios, etapas, galería/testimonios/FAQs, inversión y condiciones.

export function ProposalSteps() {
  return (
    <div id="pasos-propuesta">
      <details className="paso" data-corto="Cliente">
        <summary className="paso__resumen">
          <span className="paso__num">2</span>
          <span className="paso__titulo">Tu cliente</span>
          <span className="paso__desc">A quién va dirigida</span>
        </summary>
        <div className="paso__contenido grilla">
          <label className="campo campo--ancho">
            <span className="campo__etiqueta">Nombre de la persona</span>
            <input className="control" type="text" data-campo="cliente.nombre" placeholder="Ej.: Laura Gómez" />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">Empresa o proyecto</span>
            <input className="control" type="text" data-campo="cliente.empresa" placeholder="Ej.: Café Central" />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">Cargo</span>
            <input className="control" type="text" data-campo="cliente.cargo" placeholder="Ej.: Dueña" />
          </label>
        </div>
      </details>

      <details className="paso" data-corto="Propuesta">
        <summary className="paso__resumen">
          <span className="paso__num">3</span>
          <span className="paso__titulo">La propuesta</span>
          <span className="paso__desc">Título, número y vigencia</span>
        </summary>
        <div className="paso__contenido grilla">
          <label className="campo campo--ancho">
            <span className="campo__etiqueta">Título del proyecto</span>
            <input className="control" type="text" data-campo="propuesta.titulo" placeholder="Ej.: Rediseño del sitio web" />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">Número de propuesta</span>
            <input className="control" type="text" data-campo="propuesta.numero" placeholder="P-2026-001" />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">Fecha</span>
            <input className="control" type="date" data-campo="propuesta.fecha" />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">Válida por (días)</span>
            <input className="control" type="number" min="0" step="1" inputMode="numeric" data-campo="propuesta.validez" data-tipo="numero" />
          </label>
          <p className="campo__ayuda campo--ancho">El link le muestra a tu cliente cuántos días le quedan. Cuando vence, el botón de aceptar se cambia por uno para pedirte una actualización.</p>
          <div className="campo campo--ancho">
            <span className="campo__etiqueta">Foto de fondo en portada Hero (opcional)</span>
            <div className="logo">
              <img className="logo__vista proyecto-imagen__vista" id="portada-prop-vista" alt="Fondo de portada" hidden />
              <label className="boton boton--secundario boton--chico">
                <span id="portada-prop-texto">Subir foto de portada</span>
                <input className="visualmente-oculto" id="campo-portada-prop" type="file" accept="image/png,image/jpeg,image/webp" />
              </label>
              <button type="button" className="boton boton--texto boton--chico" data-accion="quitar-portada-prop" id="portada-prop-quitar" hidden>Quitar</button>
            </div>
          </div>
          <label className="campo campo--ancho" id="portada-prop-opacidad-wrap" hidden>
            <span className="campo__etiqueta campo__etiqueta--fila">
              <span>Intensidad de la foto de portada</span>
              <output className="campo__valor" id="portada-prop-opacidad-val">35%</output>
            </span>
            <input className="rango-input" type="range" min="10" max="85" step="5" data-campo="propuesta.opacidadPortada" data-tipo="numero" />
          </label>
        </div>
      </details>

      <details className="paso" data-corto="Objetivos">
        <summary className="paso__resumen">
          <span className="paso__num">4</span>
          <span className="paso__titulo">Contexto y objetivos</span>
          <span className="paso__desc">Qué entendiste del proyecto</span>
        </summary>
        <div className="paso__contenido">
          <label className="campo">
            <span className="campo__etiqueta">El punto de partida</span>
            <textarea className="control" rows="6" data-campo="contexto" placeholder="Resumí la situación actual de tu cliente con sus propias palabras. Dejá una línea en blanco entre párrafos."></textarea>
          </label>
          <h3 className="separador-campos">Objetivos</h3>
          <div className="lista" data-lista="objetivos" data-vacio="Sumá lo que tu cliente quiere lograr con el proyecto."></div>
          <button type="button" className="boton boton--agregar" data-accion="agregar" data-lista="objetivos">Agregar objetivo</button>
        </div>
      </details>

      <details className="paso" data-corto="Servicios">
        <summary className="paso__resumen">
          <span className="paso__num">5</span>
          <span className="paso__titulo">Alcance</span>
          <span className="paso__desc">Servicios armados a medida</span>
        </summary>
        <div className="paso__contenido">
          <p className="paso__nota">Cargá solo lo que este proyecto necesita, cada servicio con su modalidad de cobro. Lo que marques como opcional tu cliente lo puede sumar desde el link, y el total se actualiza en el momento.</p>
          <div className="lista" data-lista="servicios" data-vacio="Todavía no agregaste servicios."></div>
          <button type="button" className="boton boton--agregar" data-accion="agregar" data-lista="servicios">Agregar servicio</button>
        </div>
      </details>

      <details className="paso" data-corto="Etapas">
        <summary className="paso__resumen">
          <span className="paso__num">6</span>
          <span className="paso__titulo">Etapas</span>
          <span className="paso__desc">Cómo y cuándo se trabaja</span>
        </summary>
        <div className="paso__contenido">
          <div className="lista" data-lista="etapas" data-vacio="Dividí el proyecto en etapas para que tu cliente sepa qué esperar y cuándo."></div>
          <button type="button" className="boton boton--agregar" data-accion="agregar" data-lista="etapas">Agregar etapa</button>
        </div>
      </details>

      <details className="paso" data-corto="Inversión">
        <summary className="paso__resumen">
          <span className="paso__num">7</span>
          <span className="paso__titulo">Inversión</span>
          <span className="paso__desc">Moneda, ajustes y forma de pago</span>
        </summary>
        <div className="paso__contenido">
          <div className="grilla">
            <label className="campo campo--ancho">
              <span className="campo__etiqueta">Moneda</span>
              <select className="control" data-campo="inversion.moneda">
                <option value="ARS">Peso argentino (ARS)</option>
                <option value="USD">Dólar estadounidense (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="MXN">Peso mexicano (MXN)</option>
                <option value="CLP">Peso chileno (CLP)</option>
                <option value="COP">Peso colombiano (COP)</option>
                <option value="UYU">Peso uruguayo (UYU)</option>
                <option value="PEN">Sol peruano (PEN)</option>
              </select>
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Fee / Abono mensual global</span>
              <input className="control" type="number" min="0" step="any" inputMode="decimal" placeholder="0" data-campo="inversion.abonoMensual" data-tipo="numero" />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Monto único global</span>
              <input className="control" type="number" min="0" step="any" inputMode="decimal" placeholder="0" data-campo="inversion.montoGlobal" data-tipo="numero" />
            </label>
            <p className="campo__ayuda campo--ancho">Si trabajás con un único fee mensual o monto fijo que abarca todos los servicios (sin ponerles precio por separado), ingresalo acá y se mostrará como total al final en la sección Inversión.</p>
            <label className="campo">
              <span className="campo__etiqueta">Descuento</span>
              <span className="porcentaje"><input className="control" type="number" min="0" max="100" step="any" inputMode="decimal" data-campo="inversion.descuento" data-tipo="numero" /></span>
            </label>
            <span className="campo" aria-hidden="true"></span>
            <label className="campo">
              <span className="campo__etiqueta">Nombre del impuesto</span>
              <input className="control" type="text" data-campo="inversion.impuestoNombre" placeholder="IVA" />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Impuesto</span>
              <span className="porcentaje"><input className="control" type="number" min="0" max="100" step="any" inputMode="decimal" data-campo="inversion.impuesto" data-tipo="numero" /></span>
            </label>
            <p className="campo__ayuda campo--ancho">Si no aplicás impuestos, dejá el porcentaje en 0 y no se muestra.</p>
          </div>
          <h3 className="separador-campos">Forma de pago</h3>
          <p className="paso__nota">Dividí la inversión inicial en pagos. Los servicios mensuales se cobran aparte, mes a mes.</p>
          <p className="aviso-campo" id="aviso-pagos" hidden></p>
          <div className="lista" data-lista="pagos" data-vacio="Sin pagos cargados, la propuesta muestra solo el total."></div>
          <button type="button" className="boton boton--agregar" data-accion="agregar" data-lista="pagos">Agregar pago</button>

          {/* Método de cobro (controlador/cobro.js): con transferencia, el cliente ve estos
              datos apenas acepta la propuesta. */}
          <h3 className="separador-campos">Método de cobro</h3>
          <div className="cobro-editor" id="cobro-editor">
            <label className="campo campo--ancho">
              <span className="campo__etiqueta">¿Cómo te paga tu cliente?</span>
              <select className="control" data-campo="cobro.metodo" id="cobro-metodo">
                <option value="transferencia">Transferencia bancaria · 0 % de comisión</option>
                <option value="mercadopago" data-requiere-mp>Mercado Pago · tarjeta o dinero en cuenta</option>
                <option value="ambos" data-requiere-mp>Transferencia o Mercado Pago (elige tu cliente)</option>
                <option value="acordar">Lo coordino con mi cliente</option>
              </select>
            </label>
            <div className="cobro-editor__datos" id="cobro-transferencia">
              <p className="cobro-editor__ayuda">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6.5" /></svg>
                <span>Al elegir transferencia, cobrás el 100 % de tu propuesta sin pagar comisiones a pasarelas de pago. Tu cliente ve estos datos recién cuando la acepta. Se guardan en tu cuenta y sirven para todas tus propuestas.</span>
              </p>
              <label className="campo campo--ancho">
                <span className="campo__etiqueta">Titular de la cuenta</span>
                <input className="control" type="text" id="cobro-titular" placeholder="Ej.: Juan Gómez" autoComplete="name" maxLength="120" />
              </label>
              <label className="campo">
                <span className="campo__etiqueta">CBU o CVU</span>
                <input className="control" type="text" id="cobro-cbu" placeholder="22 números" inputMode="numeric" autoComplete="off" maxLength="40" />
                <span className="campo__ayuda" id="cobro-cbu-ayuda" hidden>El CBU o CVU tiene 22 números.</span>
              </label>
              <label className="campo">
                <span className="campo__etiqueta">Alias</span>
                <input className="control" type="text" id="cobro-alias" placeholder="Ej.: gomez.pintura" autoComplete="off" autoCapitalize="none" maxLength="40" />
                <span className="campo__ayuda" id="cobro-alias-ayuda" hidden>El alias va de 6 a 20 caracteres: letras, números, puntos o guiones.</span>
              </label>
            </div>
            <div className="cobro-editor__mp" id="cobro-mercadopago" hidden>
            <div className="cobro-mp" data-mp-bloque>
              {/* Logo oficial de Mercado Pago (public/marcas, del sitio oficial; no se edita), sobre
                  blanco como piden sus pautas, también en modo oscuro. */}
              <div className="cobro-mp__cabecera">
                <span className="cobro-mp__marca">
                  <img src="/marcas/mercadopago-horizontal.svg" alt="Mercado Pago" width="104" height="42" />
                </span>
                <div>
                  <p className="cobro-mp__estado" data-mp-estado>Tu cliente paga con tarjeta o dinero en cuenta y la plata va directo a tu Mercado Pago. Mercado Pago cobra su comisión; Dealit, ninguna.</p>
                </div>
              </div>
              <div className="cobro-mp__acciones">
                <button type="button" className="boton boton--primario cobro-mp__vincular" data-accion="vincular-mp" data-mp-vincular>Vincular Mercado Pago</button>
                <button type="button" className="boton boton--texto boton--chico" data-accion="desvincular-mp" data-mp-desvincular hidden>Desvincular</button>
              </div>
              <div className="cobro-mp__vista" data-mp-vista hidden>
                <span className="cobro-mp__vista-etiqueta">Así lo ve tu cliente</span>
                <div className="mp-marca" data-mp-marca><span className="mp-marca__respaldo">Pagá con <strong>Mercado Pago</strong>: tarjeta o dinero en cuenta</span></div>
              </div>
              <p className="campo__ayuda cobro-mp__aviso" data-mp-moneda hidden>Mercado Pago cobra en pesos: en las propuestas en dólares no se muestra el botón de pago.</p>
            </div>
            </div>
            <p className="campo__ayuda" id="cobro-estado" role="status" aria-live="polite"></p>
            <p className="campo__ayuda" id="cobro-acordar" hidden>Tu cliente acepta la propuesta y el pago lo coordinan ustedes por fuera de Dealit.</p>
          </div>
        </div>
      </details>

      <details className="paso" data-corto="Galería">
        <summary className="paso__resumen">
          <span className="paso__num">8</span>
          <span className="paso__titulo">Galería de fotos y bloques web</span>
          <span className="paso__desc">Fotos libres, testimonios, preguntas frecuentes y navegación</span>
        </summary>
        <div className="paso__contenido">
          <p className="paso__nota">Transformá tu propuesta en una verdadera Landing Page visual: sumá una galería de fotos o referencias, testimonios de clientes y preguntas frecuentes.</p>
          <div className="grilla" style={{ marginBottom: '1rem' }}>
            <label className="campo campo--ancho">
              <span className="campo__etiqueta">Título de la galería de fotos</span>
              <input className="control" type="text" data-campo="opciones.galeriaTitulo" placeholder="Ej.: Galería visual y referencias" />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Diseño de la galería</span>
              <select className="control" data-campo="opciones.galeriaLayout">
                <option value="bento">Mosaico Bento (destaca la 1ª foto)</option>
                <option value="grilla">Grilla uniforme (2 columnas)</option>
                <option value="editorial">Editorial (1 columna grande)</option>
                <option value="carrusel">Tira deslizable horizontal</option>
              </select>
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Proporción por defecto</span>
              <select className="control" data-campo="opciones.galeriaProporcion">
                <option value="panoramica">Panorámica (16:9)</option>
                <option value="cuadrada">Cuadrada (1:1)</option>
                <option value="vertical">Vertical (4:5)</option>
                <option value="natural">Proporción original</option>
              </select>
            </label>
          </div>
          <div className="lista" data-lista="galeria" data-vacio="Sumá fotos de tus trabajos, moodboards, productos o espacios."></div>
          <div className="acciones-galeria">
            <button type="button" className="boton boton--agregar" data-accion="agregar" data-lista="galeria">+ Agregar bloque de foto</button>
            <label className="boton boton--secundario boton--chico">
              <span>Subir varias fotos juntas</span>
              <input className="visualmente-oculto" type="file" data-galeria-multi="propuesta" accept="image/png,image/jpeg,image/webp" multiple />
            </label>
          </div>

          <h3 className="separador-campos">Testimonios y reseñas (opcional)</h3>
          <div className="lista" data-lista="testimonios" data-vacio="Sumá opiniones de clientes anteriores para dar confianza."></div>
          <button type="button" className="boton boton--agregar" data-accion="agregar" data-lista="testimonios">Agregar testimonio</button>

          <h3 className="separador-campos">Preguntas frecuentes — FAQ (opcional)</h3>
          <div className="lista" data-lista="faqs" data-vacio="Respondé de antemano las dudas habituales de tus clientes."></div>
          <button type="button" className="boton boton--agregar" data-accion="agregar" data-lista="faqs">Agregar pregunta frecuente</button>

          <h3 className="separador-campos">Experiencia tipo Landing Page</h3>
          <div className="grilla">
            <label className="casilla campo--ancho">
              <input type="checkbox" data-campo="opciones.barraNav" />
              <span>Mostrar barra de navegación superior con accesos rápidos a cada sección</span>
            </label>
            <label className="casilla campo--ancho">
              <input type="checkbox" data-campo="opciones.lightbox" />
              <span>Permitir ampliar todas las fotos a pantalla completa (Lightbox) al tocarlas</span>
            </label>
          </div>
        </div>
      </details>

      <details className="paso" data-corto="Cierre">
        <summary className="paso__resumen">
          <span className="paso__num">9</span>
          <span className="paso__titulo">Cierre</span>
          <span className="paso__desc">Condiciones y próximos pasos</span>
        </summary>
        <div className="paso__contenido grilla">
          <label className="campo campo--ancho">
            <span className="campo__etiqueta">Condiciones, una por línea</span>
            <textarea className="control" rows="6" data-campo="condiciones" placeholder="Ej.: Incluye dos rondas de cambios por entrega."></textarea>
          </label>
          <label className="campo campo--ancho">
            <span className="campo__etiqueta">Próximos pasos, uno por línea</span>
            <textarea className="control" rows="4" data-campo="proximosPasos" placeholder="Ej.: Aceptar la propuesta y abonar el primer pago."></textarea>
          </label>
          <label className="casilla campo--ancho">
            <input type="checkbox" data-campo="opciones.firmas" />
            <span>Agregar espacio para firmas en el PDF</span>
          </label>
          <label className="casilla campo--ancho">
            <input type="checkbox" data-campo="opciones.credito" />
            <span>Mostrar «Propuesta creada con Dealit» al pie</span>
          </label>
        </div>
      </details>
      </div>
  );
}
