// Pantalla de autenticación: inicio de sesión, registro, recuperación de clave y verificación de email.

export function AuthScreen() {
  return (
    <div id="auth-pantalla" className="auth" hidden>
  <div className="auth__fondo"></div>
  <div className="auth__card" role="dialog" aria-modal="true" aria-labelledby="auth-titulo">
    <button type="button" className="auth__cerrar" id="auth-cerrar" aria-label="Volver a mi propuesta" hidden>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>
    </button>
    <div className="auth__marca">
      <span className="auth__logo" id="auth-titulo">Dealit</span>
      <p className="auth__eslogan">Armá propuestas profesionales y cerralas con un link.</p>
      <p className="auth__motivo" id="auth-motivo" hidden></p>
    </div>

    <div id="auth-ingreso">
    <button type="button" className="auth__google" id="auth-google">
      <svg className="auth__google-icon" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09A6.97 6.97 0 0 1 5.48 12c0-.72.13-1.43.36-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.77 14.97.64 12 .64 7.7.64 3.99 3.11 2.18 6.6l3.66 2.84c.87-2.6 3.3-4.06 6.16-4.06z" fill="#EA4335"/></svg>
      <span>Continuar con Google</span>
    </button>

    <div className="auth__separador">
      <span>o con email</span>
    </div>

    <details className="auth__email-toggle">
      <summary className="auth__email-link">Usar email y contraseña</summary>

      <div className="auth__tabs">
        <button type="button" className="auth__tab auth__tab--activo" data-auth-tab="login">Iniciar sesión</button>
        <button type="button" className="auth__tab" data-auth-tab="registro">Crear cuenta</button>
      </div>

      <form id="auth-form" className="auth__form" noValidate>
        <div className="auth__campo auth__campo--nombre" hidden>
          <label className="auth__label" htmlFor="auth-nombre">Nombre</label>
          <input id="auth-nombre" className="auth__input" type="text" placeholder="Tu nombre o el de tu marca" autoComplete="name" />
        </div>
        <div className="auth__campo">
          <label className="auth__label" htmlFor="auth-email">Email</label>
          <input id="auth-email" className="auth__input" type="email" placeholder="tu@email.com" autoComplete="email" required />
        </div>
        <div className="auth__campo">
          <label className="auth__label" htmlFor="auth-pass">Contraseña</label>
          <div className="auth__pass-wrap">
            <input id="auth-pass" className="auth__input" type="password" placeholder="Mínimo 6 caracteres" autoComplete="current-password" required minLength="6" />
            <button type="button" className="auth__ver-pass" data-auth-toggle-pass aria-label="Mostrar contraseña">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <button type="button" className="auth__olvido" id="auth-olvido">¿Olvidaste tu contraseña?</button>
        <p id="auth-error" className="auth__error" hidden></p>
        <p id="auth-mensaje" className="auth__mensaje" role="status" hidden></p>
        <button type="submit" className="auth__submit" id="auth-submit">
          <span className="auth__submit-texto">Iniciar sesión</span>
          <svg className="auth__spinner" viewBox="0 0 24 24" hidden><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="50 20"/></svg>
        </button>
      </form>
    </details>

    <p id="auth-error-google" className="auth__error" hidden></p>

    <p className="auth__pie">Tu cuenta guarda propuestas, clientes y configuración en la nube.</p>
    </div>

    <div className="auth__verificar" id="auth-verificar" hidden>
      <h2 className="auth__verificar-titulo">Verificá tu email</h2>
      <p className="auth__verificar-texto">Te mandamos un link a <strong id="auth-verificar-email"></strong>. Tocalo para activar tu cuenta y volvé acá. Si no lo ves, revisá la carpeta de spam.</p>
      <p id="auth-verificar-error" className="auth__error" hidden></p>
      <p id="auth-verificar-mensaje" className="auth__mensaje" role="status" hidden></p>
      <button type="button" className="auth__submit" id="auth-verificar-listo">Ya lo verifiqué</button>
      <div className="auth__verificar-acciones">
        <button type="button" className="auth__olvido" id="auth-verificar-reenviar">Reenviar email</button>
        <button type="button" className="auth__olvido" id="auth-verificar-salir">Usar otra cuenta</button>
      </div>
    </div>
  </div>
</div>
  );
}
