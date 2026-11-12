// Bienvenida para quien abre Dealit por primera vez sin cuenta (controlador/bienvenida.js):
// qué es Dealit, «¿A qué te dedicás?» para arrancar con una propuesta de su rubro, y entrar.
// Pensada para entrar entera en la pantalla del celular, sin scroll. En la compu es una
// tarjeta dividida: qué es Dealit a la izquierda, y elegir el rubro y entrar a la derecha.

export function Bienvenida() {
  return (
    <section className="bienvenida" id="bienvenida" aria-labelledby="bienvenida-titulo" hidden>
      <div className="bienvenida__contenido">
        {/* En el celular las dos mitades no cuentan (display: contents) y todo va en una columna. */}
        <div className="bienvenida__lado">
          <header className="bienvenida__cabecera">
            <img className="bienvenida__logo" src="/iconos/icono-192.png" alt="" width="44" height="44" />
            <span className="bienvenida__marca">Dealit</span>
          </header>

          <div className="bienvenida__presentacion">
            <h1 className="bienvenida__titulo" id="bienvenida-titulo">Propuestas que tus clientes aceptan desde el celular</h1>
            <ul className="bienvenida__beneficios">
              <li>
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="6" y="2" width="4" height="7.5" rx="2" /><path d="M3.8 7.5a4.2 4.2 0 0 0 8.4 0M8 11.7V14" /></svg>
                <span><strong>Armala en minutos</strong> o dictásela a la IA.</span>
              </li>
              <li>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.8 9.2a3 3 0 0 0 4.3 0l2-2a3 3 0 0 0-4.3-4.3l-.9.9M9.2 6.8a3 3 0 0 0-4.3 0l-2 2a3 3 0 0 0 4.3 4.3l.9-.9" /></svg>
                <span><strong>Compartila como link</strong> y la aceptan online.</span>
              </li>
              <li>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6.5" /></svg>
                <span><strong>Enterate al instante</strong> cuando dicen que sí.</span>
              </li>
            </ul>
          </div>

          <p className="bienvenida__pie">Propuestas comerciales como link</p>
        </div>

        <div className="bienvenida__panel">
          <div className="bienvenida__eleccion">
            <h2 className="bienvenida__pregunta">¿A qué te dedicás?</h2>
            <p className="bienvenida__ayuda">Arrancá con un ejemplo de tu rubro y cambialo por lo tuyo.</p>
            <div className="bienvenida__rubros" id="bienvenida-rubros" role="group" aria-label="Rubros"></div>
          </div>

          <div className="bienvenida__acciones">
            <button type="button" className="boton boton--primario" data-accion="registrarse">Crear cuenta gratis</button>
            <button type="button" className="boton boton--secundario" data-accion="ingresar">Ya tengo cuenta</button>
          </div>
        </div>
      </div>
    </section>
  );
}
