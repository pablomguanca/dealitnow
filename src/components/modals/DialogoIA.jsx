// «Contale tu propuesta»: dictado por voz (o texto) y la IA arma la propuesta.
// Lo maneja controlador/ia.js.

export function DialogoIA() {
  return (
    <dialog className="dialogo dialogo--ancho dialogo-ia" id="dialogo-ia" aria-labelledby="ia-titulo">
      <form method="dialog" id="ia-form">
        <p className="dialogo-ia__marca">
          <span className="insignia-ia">IA</span> Nuevo en Dealit
        </p>
        <h2 className="dialogo__titulo" id="ia-titulo">Contale tu propuesta</h2>
        <p className="dialogo__texto">Hablá como si se lo contaras a un colega: qué trabajo es, para quién, qué incluye, cuánto cobrás y en qué plazo. Armamos la propuesta completa y vos la revisás antes de enviarla.</p>

        <div className="dialogo-ia__dictado">
          <button type="button" className="dialogo-ia__microfono" id="ia-microfono" data-accion="ia-dictar" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" /></svg>
            <span className="visualmente-oculto" id="ia-microfono-texto">Empezar a dictar</span>
          </button>
          <div className="dialogo-ia__estado-voz">
            <strong id="ia-voz-titulo">Tocá el micrófono y contá el trabajo</strong>
            <span id="ia-voz-detalle">O escribilo abajo. Podés corregir el texto antes de armar la propuesta.</span>
          </div>
        </div>

        <label className="campo">
          <span className="campo__etiqueta">Lo que contaste</span>
          <textarea className="control dialogo-ia__texto" id="ia-texto" rows="6" maxLength="4000"
            placeholder="Ej.: Reforma del baño de Javier Ruiz en Palermo. Demolición, cerámica nueva en piso y paredes, sanitarios y grifería. Unos 15 días. Mano de obra 1.200.000 pesos, materiales aparte. 50 % de seña. Ofrecele también cambiar el termotanque."></textarea>
        </label>
        <div className="dialogo-ia__pie-texto">
          <button type="button" className="boton boton--texto boton--chico" data-accion="ia-ejemplo">Usar un ejemplo</button>
          <span id="ia-contador" aria-live="polite"></span>
        </div>

        <p className="dialogo-ia__cupo" id="ia-cupo" hidden></p>
        <div className="dialogo-ia__progreso" id="ia-progreso" role="status" aria-live="polite" hidden>
          <span className="dialogo-ia__spinner" aria-hidden="true"></span>
          <span id="ia-progreso-texto">Leyendo lo que contaste…</span>
        </div>

        <div className="dialogo__acciones">
          <button type="button" className="boton boton--texto" data-accion="ia-cerrar">Cancelar</button>
          <button type="button" className="boton boton--primario" id="ia-generar" data-accion="ia-generar">Armar mi propuesta</button>
        </div>
      </form>
    </dialog>
  );
}
