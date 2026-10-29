// Panel «Mi cuenta»: perfil de usuario, datos predefinidos del negocio, seguridad y eliminación de cuenta.

export function AccountPanel() {
  return (
    <main className="cuenta" id="cuenta" aria-labelledby="cuenta-titulo" hidden>
  <div className="cuenta__contenido">
    <h1 className="panel__titulo" id="cuenta-titulo">Mi cuenta</h1>

    <form className="tarjeta" id="cuenta-form" noValidate>
      <div className="tarjeta__cabecera">
        <h2 className="tarjeta__titulo">Perfil</h2>
        <p className="tarjeta__ayuda">Cómo te ve Dealit y cómo iniciás sesión.</p>
      </div>
      <div className="grilla">
        <label className="campo campo--ancho">
          <span className="campo__etiqueta">Tu nombre</span>
          <input className="control" id="cuenta-nombre" type="text" maxLength="80" autoComplete="name" />
        </label>
        <div className="campo campo--ancho">
          <span className="campo__etiqueta">Email</span>
          <p className="cuenta__dato" id="cuenta-email"></p>
        </div>
        <div className="campo campo--ancho">
          <span className="campo__etiqueta">Inicio de sesión</span>
          <p className="cuenta__dato" id="cuenta-acceso"></p>
          <button type="button" className="boton boton--secundario boton--chico cuenta__password" data-accion="cambiar-password" hidden>Cambiar contraseña</button>
        </div>
      </div>

      <div className="tarjeta__cabecera tarjeta__cabecera--seccion">
        <h2 className="tarjeta__titulo">Datos de tu negocio</h2>
        <p className="tarjeta__ayuda">Se completan solos en cada propuesta nueva. Podés cambiarlos en cada propuesta.</p>
      </div>
      <div className="grilla">
        <div className="campo">
          <span className="campo__etiqueta">Logo</span>
          <div className="logo">
            <img className="logo__vista" id="cuenta-logo-vista" alt="Logo de tu negocio" hidden />
            <label className="boton boton--secundario boton--chico">
              <span id="cuenta-logo-texto">Subir logo</span>
              <input className="visualmente-oculto" id="cuenta-logo" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" />
            </label>
            <button type="button" className="boton boton--texto boton--chico" data-accion="quitar-logo-cuenta" id="cuenta-logo-quitar" hidden>Quitar</button>
          </div>
        </div>
        <div className="campo">
          <span className="campo__etiqueta">Foto de perfil o equipo</span>
          <div className="logo">
            <img className="logo__vista logo__vista--avatar" id="cuenta-foto-vista" alt="Foto de perfil" hidden />
            <label className="boton boton--secundario boton--chico">
              <span id="cuenta-foto-texto">Subir foto</span>
              <input className="visualmente-oculto" id="cuenta-foto" type="file" accept="image/png,image/jpeg,image/webp" />
            </label>
            <button type="button" className="boton boton--texto boton--chico" data-accion="quitar-foto-cuenta" id="cuenta-foto-quitar" hidden>Quitar</button>
          </div>
        </div>
        <label className="campo campo--ancho">
          <span className="campo__etiqueta">Tu nombre o el de tu marca</span>
          <input className="control" data-emisor="nombre" type="text" maxLength="200" placeholder="Ej.: Estudio Norte" />
        </label>
        <label className="campo campo--ancho">
          <span className="campo__etiqueta">Qué hacés</span>
          <input className="control" data-emisor="rol" type="text" maxLength="200" placeholder="Ej.: Diseño y desarrollo web" />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Email de contacto</span>
          <input className="control" data-emisor="email" type="email" maxLength="200" placeholder="hola@tumarca.com" />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">WhatsApp</span>
          <input className="control" data-emisor="telefono" type="tel" maxLength="200" placeholder="+54 9 11 0000-0000" />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Sitio web o portfolio</span>
          <input className="control" data-emisor="web" type="text" maxLength="200" placeholder="tumarca.com" />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Ubicación / Modalidad</span>
          <input className="control" data-emisor="ubicacion" type="text" maxLength="200" placeholder="Ej.: Buenos Aires · Remoto" />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Instagram</span>
          <input className="control" data-emisor="instagram" type="text" maxLength="200" placeholder="@tumarca" />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">LinkedIn</span>
          <input className="control" data-emisor="linkedin" type="text" maxLength="200" placeholder="linkedin.com/in/tuperfil" />
        </label>
        <label className="campo campo--ancho">
          <span className="campo__etiqueta">Behance / Dribbble / GitHub</span>
          <input className="control" data-emisor="behance" type="text" maxLength="200" placeholder="behance.net/tuperfil" />
        </label>
        <label className="campo campo--ancho">
          <span className="campo__etiqueta">Presentación breve</span>
          <textarea className="control" data-emisor="presentacion" rows="4" maxLength="2000" placeholder="Quién sos, cómo trabajás y por qué sos la persona indicada."></textarea>
        </label>
      </div>
      <div className="tarjeta__pie">
        <p className="cuenta__estado" id="cuenta-estado" role="status" aria-live="polite"></p>
        <button type="submit" className="boton boton--primario" id="cuenta-guardar">Guardar cambios</button>
      </div>
    </form>

    <section className="tarjeta">
      <div className="tarjeta__cabecera">
        <h2 className="tarjeta__titulo">Sesión</h2>
        <p className="tarjeta__ayuda">Cerrar sesión borra la copia de tus propuestas guardada en este navegador.</p>
      </div>
      <button type="button" className="boton boton--secundario" data-accion="cerrar-sesion">Cerrar sesión</button>
    </section>

    <section className="tarjeta tarjeta--peligro">
      <div className="tarjeta__cabecera">
        <h2 className="tarjeta__titulo">Eliminar cuenta</h2>
        <p className="tarjeta__ayuda">Se borran tu cuenta, tus propuestas y tus logos, y los links que compartiste dejan de funcionar. No se puede deshacer.</p>
      </div>
      <button type="button" className="boton boton--secundario boton--peligro" data-accion="eliminar-cuenta">Eliminar mi cuenta</button>
    </section>
  </div>
</main>
  );
}
