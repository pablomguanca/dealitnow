// Avisos flotantes (toasts) y diálogos de confirmación propios de la app. Nunca se
// usan alert(), confirm() ni prompt() del navegador.

import toast from 'react-hot-toast';

export const avisar = (mensaje, ms = 4200) => toast(mensaje, { duration: ms });
export const avisarExito = (mensaje, ms = 4200) => toast.success(mensaje, { duration: ms });
export const avisarError = (mensaje, ms = 6500) => toast.error(mensaje, { duration: ms });
export const celebrar = (mensaje, ms = 9000) => toast(mensaje, { duration: ms, icon: '🎉', className: 'aviso aviso--celebracion' });

// Diálogo de elección: lo dibuja <DialogoConfirmacion /> (src/components/modals/).
// Acá solo vive la solicitud abierta y quién la escucha.
let solicitud = null;
const oyentes = new Set();
const emitir = () => oyentes.forEach(fn => fn());

export const suscribirDialogo = fn => {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
};
export const dialogoActual = () => solicitud;

// opciones: [{ valor, texto, estilo: 'primario' | 'secundario' | 'texto' | 'peligro' }].
// Resuelve con el valor elegido, o null si se cierra sin elegir (Esc o «Cancelar»).
export const elegir = ({ titulo, texto, opciones }) => new Promise(resolver => {
  solicitud?.responder(null);
  const propia = {
    titulo,
    texto,
    opciones,
    responder: valor => {
      if (solicitud === propia) solicitud = null;
      emitir();
      resolver(valor);
    }
  };
  solicitud = propia;
  emitir();
});

// Confirmación simple: resuelve true si se eligió la acción principal.
export const confirmar = async ({ titulo, texto, aceptar, peligro = false }) => (await elegir({
  titulo,
  texto,
  opciones: [
    { valor: null, texto: 'Cancelar', estilo: 'texto' },
    { valor: 'aceptar', texto: aceptar, estilo: peligro ? 'peligro' : 'primario' }
  ]
})) === 'aceptar';
