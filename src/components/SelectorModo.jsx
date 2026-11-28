// Apariencia de la app del dueño: Claro, Oscuro o Automático (como el dispositivo).
// Lo usan el menú (compacto, solo íconos) y Mi cuenta; lo maneja controlador/navegacion.js.

const OPCIONES = [
  ['claro', 'Claro', 'Modo claro', <svg key="i" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.75" /><path d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.6 3.6l1.05 1.05M11.35 11.35l1.05 1.05M3.6 12.4l1.05-1.05M11.35 4.65l1.05-1.05" /></svg>],
  ['oscuro', 'Oscuro', 'Modo oscuro', <svg key="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 9.6A5.5 5.5 0 0 1 6.4 3a5.5 5.5 0 1 0 6.6 6.6z" /></svg>],
  ['auto', 'Automático', 'Automático: igual que tu dispositivo', <svg key="i" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="8" rx="1.25" /><path d="M6 13.5h4M8 11v2.5" /></svg>]
];

export function SelectorModo({ compacto = false }) {
  return (
    <div className={`selector-modo${compacto ? ' selector-modo--compacto' : ''}`} role="radiogroup" aria-label="Apariencia">
      {OPCIONES.map(([modo, texto, titulo, icono]) => (
        <button
          key={modo}
          type="button"
          className="selector-modo__opcion"
          role="radio"
          aria-checked="false"
          data-accion="modo-app"
          data-modo={modo}
          title={titulo}
          aria-label={compacto ? titulo : undefined}
        >
          {icono}
          <span className="selector-modo__texto">{texto}</span>
        </button>
      ))}
    </div>
  );
}
