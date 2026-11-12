// Panel «Mi cuenta»: perfil de usuario, datos predefinidos del negocio, seguridad y eliminación de cuenta.

export function AccountPanel() {
  return (
    <main className="cuenta" id="cuenta" aria-labelledby="cuenta-titulo" hidden>
  <div className="cuenta__contenido">
    <h1 className="panel__titulo" id="cuenta-titulo">Mi cuenta</h1>

    <section className="tarjeta tarjeta--plan" aria-labelledby="plan-titulo" hidden>
      <div className="tarjeta__cabecera">
        <h2 className="tarjeta__titulo" id="plan-titulo">Tu plan</h2>
        <p className="tarjeta__ayuda" id="plan-estado" role="status">Plan Gratis.</p>
      </div>
      {/* Con Pro: la tarjeta se viste de Pro (plan.js pone .tarjeta--pro y muestra esto). */}
      <div className="plan-pro" id="plan-pro" hidden>
        <div className="plan-pro__cabecera">
          <img className="plan-pro__logo" src="/iconos/icono-192.png" alt="" width="52" height="52" />
          <div>
            <p className="plan-pro__marca">Dealit <span>Pro</span></p>
            <p className="plan-pro__estado" id="plan-pro-estado"></p>
          </div>
        </div>
        <ul className="plan-pro__beneficios" aria-label="Lo que incluye tu plan">
          <li>Envíos ilimitados</li>
          <li>Diseños y plantillas PRO</li>
          <li>IA sin límite</li>
          <li>Sin la marca de Dealit</li>
          <li>Avisos en vivo</li>
        </ul>
      </div>
      <div className="plan-uso" id="plan-uso" aria-hidden="true"><span></span></div>
      <div className="plan-ofertas" id="plan-ofertas">
        <ul className="plan-beneficios">
          <li>Propuestas ilimitadas, sin tope mensual</li>
          <li>Todas las plantillas y diseños PRO</li>
          <li>Propuestas con IA sin límite (en Gratis, 3 por mes)</li>
          <li>Sin la marca «Propuesta creada con Dealit»</li>
          <li>Te avisamos al instante, por email y en el celular, cuando tu cliente abre o acepta</li>
        </ul>
        <div className="plan-botones">
          <button type="button" className="boton boton--primario" data-accion="suscribir-pro" data-periodo="mensual">
            Pro mensual · <span data-precio-pro="mensual"></span>
          </button>
          <button type="button" className="boton boton--secundario" data-accion="suscribir-pro" data-periodo="anual">
            Pro anual · <span data-precio-pro="anual"></span>
          </button>
        </div>
        <p className="tarjeta__ayuda">El pago se hace en Mercado Pago. Cancelás cuando quieras y seguís con Pro hasta el final del período pago.</p>
      </div>
      <button type="button" className="boton boton--texto boton--chico" id="plan-sincronizar" data-accion="sincronizar-plan">Ya pagué, actualizar mi plan</button>
      <a className="boton boton--texto" id="plan-administrar" href="https://www.mercadopago.com.ar/subscriptions" target="_blank" rel="noopener" hidden>Administrar o cancelar la suscripción en Mercado Pago</a>
    </section>

    <section className="tarjeta" id="tarjeta-mp" aria-labelledby="mp-titulo" hidden>
      <div className="tarjeta__cabecera">
        <h2 className="tarjeta__titulo" id="mp-titulo">Cobrar con Mercado Pago</h2>
        <p className="tarjeta__ayuda">Vinculá tu cuenta en dos toques y tus clientes pagan desde la propuesta aceptada.</p>
      </div>
      <div className="cobro-mp" data-mp-bloque>
              <div className="cobro-mp__cabecera">
                <span className="cobro-mp__logo" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12.5" rx="2.2" /><path d="M3 10h18M6.5 15h4" /></svg>
                </span>
                <div>
                  <p className="cobro-mp__titulo">Mercado Pago</p>
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
    </section>

    <section className="tarjeta" id="tarjeta-push" aria-labelledby="push-titulo" hidden>
      <div className="tarjeta__cabecera">
        <h2 className="tarjeta__titulo" id="push-titulo">Notificaciones</h2>
        <p className="tarjeta__ayuda" id="push-estado" role="status" aria-live="polite"></p>
      </div>
      <div className="plan-botones">
        <button type="button" className="boton boton--primario" id="push-activar" data-accion="activar-push" hidden>Activar en este dispositivo</button>
        <button type="button" className="boton boton--secundario" id="push-probar" data-accion="probar-push" hidden>Mandarme un aviso de prueba</button>
        <button type="button" className="boton boton--texto boton--chico" id="push-desactivar" data-accion="desactivar-push" hidden>Desactivar en este dispositivo</button>
      </div>
    </section>

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
        <h2 className="tarjeta__titulo">Borradores en archivo</h2>
        <p className="tarjeta__ayuda">Si antes guardaste propuestas como archivo (.json), abrilas acá: quedan guardadas en tu cuenta como propuestas nuevas.</p>
      </div>
      <button type="button" className="boton boton--secundario" data-accion="abrir-archivo-viejo">Abrir un archivo guardado</button>
      <input className="visualmente-oculto" id="campo-borrador" type="file" accept="application/json,.json" tabIndex="-1" aria-hidden="true" />
    </section>

    <section className="tarjeta">
      <div className="tarjeta__cabecera">
        <h2 className="tarjeta__titulo">Apariencia</h2>
        <p className="tarjeta__ayuda">Cambia los colores de la app. Tus propuestas se ven siempre con su propio diseño.</p>
      </div>
      <button type="button" className="boton boton--secundario cuenta__interruptor" data-accion="alternar-modo" role="switch" aria-checked="false" id="cuenta-modo-oscuro">
        <span>Modo oscuro</span>
        <span className="interruptor" aria-hidden="true"></span>
      </button>
    </section>

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
