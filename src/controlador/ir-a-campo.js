// Llevar el editor a un campo: abre el paso plegado que lo contiene, lo trae a la vista
// dentro del editor y lo resalta un momento. Lo usan el deshacer (para mostrar qué cambió)
// y tocar el documento (para editar lo que se tocó).

const reducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const esEscritura = el => el.matches('textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="file"])');

// Desplaza solo el cuerpo del editor (no la página ni el documento), como la barra de
// secciones de la hoja. Si el campo ya se ve entero, no se mueve.
const traerALaVista = el => {
  const cuerpo = el.closest('#editor-cuerpo');
  if (!cuerpo) {
    el.scrollIntoView({ block: 'nearest', behavior: reducido() ? 'auto' : 'smooth' });
    return;
  }
  const r = el.getBoundingClientRect();
  const c = cuerpo.getBoundingClientRect();
  const margen = 24;
  if (r.top >= c.top + margen && r.bottom <= c.bottom - margen) return;
  const destino = cuerpo.scrollTop + (r.top - c.top) - margen * 2;
  cuerpo.scrollTo({ top: Math.max(0, destino), behavior: reducido() ? 'auto' : 'smooth' });
};

// lugar: selector del campo dentro de #editor-cuerpo. Con enfocar, enfoca el campo también
// en pantallas táctiles (abre el teclado): solo cuando la persona pidió editarlo.
export const mostrarLugar = (lugar, { enfocar = false } = {}) => {
  let el = null;
  // Los pasos de la propuesta y del portfolio comparten el editor (el que no se usa queda
  // con hidden) y algunos se llaman igual («Galería»): se elige el que está a la vista.
  try {
    const todos = lugar ? [...document.querySelectorAll(`#editor-cuerpo ${lugar}`)] : [];
    el = todos.find(x => !x.closest('[hidden]')) || todos[0] || null;
  } catch { }
  if (!el) return null;
  // Si el campo quedó dentro de un paso plegado, se abre.
  for (let d = el.closest('details:not([open])'); d; d = d.parentElement?.closest('details:not([open])')) d.open = true;
  if (!el.getClientRects().length) return null;
  traerALaVista(el);
  // Un ítem de lista o un paso: se enfoca su primer campo para escribir.
  const campo = el.matches('input, textarea, select') ? el
    : enfocar ? el.querySelector('input:not([type="file"]):not([hidden]), textarea, select') : null;
  if (campo && (enfocar || !matchMedia('(pointer: coarse)').matches)) {
    campo.focus({ preventScroll: true });
    if (esEscritura(campo) && typeof campo.setSelectionRange === 'function') {
      try { campo.setSelectionRange(campo.value.length, campo.value.length); } catch { }
    }
  }
  const resaltado = el.closest('.campo, .item') || el;
  resaltado.classList.remove('historial-destello');
  void resaltado.offsetWidth; // reinicia la animación si se pide dos veces seguidas
  resaltado.classList.add('historial-destello');
  setTimeout(() => resaltado.classList.remove('historial-destello'), 1400);
  return el;
};
