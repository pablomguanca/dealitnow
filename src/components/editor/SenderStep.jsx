// Paso 1 del editor: datos de identidad del emisor, logo, foto de perfil, redes y vinculación de portfolio.

export function SenderStep() {
  return (
    <details className="paso">
        <summary className="paso__resumen">
          <span className="paso__num">1</span>
          <span className="paso__titulo">Tus datos</span>
          <span className="paso__desc">Quién presenta la propuesta</span>
        </summary>
        <div className="paso__contenido grilla">
          <label className="campo campo--ancho">
            <span className="campo__etiqueta">Tu nombre o el de tu marca</span>
            <input className="control" type="text" data-campo="emisor.nombre" autoComplete="name" placeholder="Ej.: Estudio Norte" />
          </label>
          <label className="campo campo--ancho">
            <span className="campo__etiqueta">Qué hacés</span>
            <input className="control" type="text" data-campo="emisor.rol" placeholder="Ej.: Diseño y desarrollo web" />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">Email</span>
            <input className="control" type="email" data-campo="emisor.email" autoComplete="email" placeholder="hola@tumarca.com" />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">WhatsApp</span>
            <input className="control" type="tel" data-campo="emisor.telefono" autoComplete="tel" placeholder="+54 9 11 0000-0000" />
          </label>
          <p className="campo__ayuda campo--ancho">Tu cliente acepta la propuesta con un mensaje a tu WhatsApp o a tu email: cargá al menos uno. Para WhatsApp incluí el código de país.</p>
          <label className="campo campo--ancho">
            <span className="campo__etiqueta">Sitio web o portfolio</span>
            <input className="control" type="text" data-campo="emisor.web" placeholder="tumarca.com" />
          </label>
          <label className="campo campo--ancho">
            <span className="campo__etiqueta">Presentación breve</span>
            <textarea className="control" rows="4" data-campo="emisor.presentacion" placeholder="Contale a tu cliente quién sos, cómo trabajás y por qué sos la persona indicada para este proyecto."></textarea>
          </label>
          <div className="campo">
            <span className="campo__etiqueta">Logo (opcional)</span>
            <div className="logo">
              <img className="logo__vista" id="logo-vista" alt="Logo cargado" hidden />
              <label className="boton boton--secundario boton--chico">
                <span id="logo-texto">Subir logo</span>
                <input className="visualmente-oculto" id="campo-logo" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" />
              </label>
              <button type="button" className="boton boton--texto boton--chico" data-accion="quitar-logo" id="logo-quitar" hidden>Quitar</button>
            </div>
            <p className="campo__ayuda">Marca o logotipo para la cabecera.</p>
          </div>
          <div className="campo">
            <span className="campo__etiqueta">Foto de perfil o equipo (opcional)</span>
            <div className="logo">
              <img className="logo__vista logo__vista--avatar" id="foto-emisor-vista" alt="Foto de perfil" hidden />
              <label className="boton boton--secundario boton--chico">
                <span id="foto-emisor-texto">Subir foto</span>
                <input className="visualmente-oculto" id="campo-foto-emisor" type="file" accept="image/png,image/jpeg,image/webp" />
              </label>
              <button type="button" className="boton boton--texto boton--chico" data-accion="quitar-foto-emisor" id="foto-emisor-quitar" hidden>Quitar</button>
            </div>
            <p className="campo__ayuda">Se luce en tu presentación «Sobre mí».</p>
          </div>
          <label className="campo">
            <span className="campo__etiqueta">Ubicación / Modalidad (opcional)</span>
            <input className="control" type="text" data-campo="emisor.ubicacion" placeholder="Ej.: Buenos Aires · Remoto" />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">Instagram (opcional)</span>
            <input className="control" type="text" data-campo="emisor.instagram" placeholder="Ej.: @tumarca" />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">LinkedIn (opcional)</span>
            <input className="control" type="text" data-campo="emisor.linkedin" placeholder="linkedin.com/in/tuperfil" />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">Behance / Dribbble / GitHub</span>
            <input className="control" type="text" data-campo="emisor.behance" placeholder="behance.net/tuperfil o github.com/..." />
          </label>
          <div className="campo campo--ancho portafolio-vincular" id="campo-vincular-portafolio">
            <div className="portafolio-vincular__cabecera">
              <span className="campo__etiqueta">Mostrar portfolio en esta propuesta</span>
              <div className="portafolio-vincular__links">
                <button type="button" className="boton boton--texto boton--chico" data-accion="nuevo-portafolio">+ Crear portfolio</button>
                <button type="button" className="boton boton--texto boton--chico" data-accion="ir-portafolios">Mis portfolios</button>
              </div>
            </div>
            <select className="control" id="propuesta-portafolio-select" data-campo="opciones.portafolioId">
              <option value="">No incluir portfolio en esta propuesta</option>
            </select>
            <p className="campo__ayuda">Elegí qué portfolio querés mostrarle a este cliente dentro de la propuesta (por ejemplo, tu portfolio de diseño, de software o de casos conceptuales).</p>
          </div>
        </div>
      </details>
  );
}
