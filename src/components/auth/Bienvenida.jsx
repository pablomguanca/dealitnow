// Bienvenida para quien abre Dealit por primera vez sin cuenta (controlador/bienvenida.js):
// qué es Dealit, «¿A qué te dedicás?» para arrancar con una propuesta de su rubro, y entrar.

export function Bienvenida() {
  return (
    <section className="bienvenida" id="bienvenida" aria-labelledby="bienvenida-titulo" hidden>
      <div className="bienvenida__contenido">
        <img className="bienvenida__logo" src="/iconos/icono-192.png" alt="" width="72" height="72" />
        <p className="bienvenida__marca">Dealit</p>
        <h1 className="bienvenida__titulo" id="bienvenida-titulo">Propuestas que tus clientes aceptan desde el celular</h1>

        <ul className="bienvenida__beneficios">
          <li>
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="6" y="2" width="4" height="7.5" rx="2" /><path d="M3.8 7.5a4.2 4.2 0 0 0 8.4 0M8 11.7V14" /></svg>
            <span><strong>Armala en minutos.</strong> O contá el trabajo en un audio y la IA la arma por vos.</span>
          </li>
          <li>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.8 9.2a3 3 0 0 0 4.3 0l2-2a3 3 0 0 0-4.3-4.3l-.9.9M9.2 6.8a3 3 0 0 0-4.3 0l-2 2a3 3 0 0 0 4.3 4.3l.9-.9" /></svg>
            <span><strong>Compartila como link.</strong> Tu cliente la abre, suma opcionales y la acepta online.</span>
          </li>
          <li>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6.5" /></svg>
            <span><strong>Enterate al instante</strong> cuando la abre y cuando te dice que sí.</span>
          </li>
        </ul>

        <h2 className="bienvenida__pregunta">¿A qué te dedicás?</h2>
        <p className="bienvenida__ayuda">Arrancá con una propuesta de ejemplo de tu rubro y cambiala por la tuya.</p>
        <div className="bienvenida__rubros" id="bienvenida-rubros" role="group" aria-label="Rubros"></div>
        <button type="button" className="boton boton--texto bienvenida__blanco" data-accion="bienvenida-rubro" data-id="en-blanco">Prefiero empezar en blanco</button>

        <div className="bienvenida__acciones">
          <button type="button" className="boton boton--primario" data-accion="registrarse">Crear cuenta gratis</button>
          <button type="button" className="boton boton--secundario" data-accion="ingresar">Ya tengo cuenta</button>
        </div>
      </div>
    </section>
  );
}
