// Ícono de la IA de Dealit: tres destellos (uno grande y dos chicos), relleno con el color
// del texto. Va en todos los botones de «Armá tu propuesta con IA».

export function IconoIA({ className = '' }) {
  return (
    <svg className={`icono-ia ${className}`.trim()} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10 2.75c.42 0 .78.3.86.71.83 4.2 2.48 5.85 6.68 6.68a.88.88 0 0 1 0 1.72c-4.2.83-5.85 2.48-6.68 6.68a.88.88 0 0 1-1.72 0c-.83-4.2-2.48-5.85-6.68-6.68a.88.88 0 0 1 0-1.72c4.2-.83 5.85-2.48 6.68-6.68.08-.41.44-.71.86-.71Z" />
      <path d="M18.5 1.75c.3 0 .55.21.6.5.36 1.82 1.03 2.49 2.85 2.85a.61.61 0 0 1 0 1.2c-1.82.36-2.49 1.03-2.85 2.85a.61.61 0 0 1-1.2 0c-.36-1.82-1.03-2.49-2.85-2.85a.61.61 0 0 1 0-1.2c1.82-.36 2.49-1.03 2.85-2.85.05-.29.3-.5.6-.5Z" opacity="0.85" />
      <path d="M18 15.5c.24 0 .44.17.49.4.27 1.37.77 1.87 2.14 2.14a.5.5 0 0 1 0 .98c-1.37.27-1.87.77-2.14 2.14a.5.5 0 0 1-.98 0c-.27-1.37-.77-1.87-2.14-2.14a.5.5 0 0 1 0-.98c1.37-.27 1.87-.77 2.14-2.14.05-.23.25-.4.49-.4Z" opacity="0.7" />
    </svg>
  );
}
