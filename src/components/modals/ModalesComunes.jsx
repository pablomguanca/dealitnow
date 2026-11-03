// Diálogos y avisos que usan la vista del cliente y la app del dueño: aceptar la
// propuesta, avisos flotantes (toasts), confirmaciones y visor de imágenes.

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Toaster } from 'react-hot-toast';
import { suscribirDialogo, dialogoActual } from '../../controlador/avisos.js';

export function DialogoAceptar() {
  return (
    <dialog className="dialogo" id="dialogo-aceptar" aria-labelledby="aceptar-titulo">
      <form method="dialog">
        <h2 className="dialogo__titulo" id="aceptar-titulo">Confirmar la propuesta</h2>
        <dl className="dialogo__resumen" id="aceptar-resumen"></dl>
        <p className="dialogo__texto" id="aceptar-texto"></p>
        <div className="aceptar__formulario" id="aceptar-formulario" hidden>
          <label className="campo">
            <span className="campo__etiqueta">Tu nombre completo</span>
            <input className="control" id="aceptar-nombre" type="text" autoComplete="name" maxLength="120" />
          </label>
          <label className="casilla">
            <input type="checkbox" id="aceptar-conformidad" />
            <span>Acepto la propuesta y sus condiciones.</span>
          </label>
          <p className="auth__error" id="aceptar-error" role="alert" hidden></p>
        </div>
        <div className="dialogo__acciones dialogo__acciones--apiladas">
          <button type="button" className="boton boton--primario boton--grande" id="aceptar-confirmar" hidden disabled>Aceptar propuesta</button>
          <a className="boton boton--primario boton--grande" id="aceptar-whatsapp" target="_blank" rel="noopener" hidden>Confirmar por WhatsApp</a>
          <a className="boton boton--secundario boton--grande" id="aceptar-email" hidden>Confirmar por email</a>
          <button type="button" className="boton boton--secundario boton--grande" data-accion="copiar-aceptacion" id="aceptar-copiar" hidden>Copiar mensaje de confirmación</button>
          <button className="boton boton--texto" value="cancelar" id="aceptar-cerrar">Volver a la propuesta</button>
        </div>
      </form>
    </dialog>
  );
}

// Avisos flotantes: no bloquean la pantalla y se van solos. Los colores salen de las
// variables de la app, así siguen al modo claro u oscuro.
export function Aviso() {
  return (
    <Toaster
      position="bottom-center"
      containerClassName="avisos"
      gutter={10}
      toastOptions={{
        className: 'aviso',
        style: {
          maxWidth: 'min(30rem, calc(100vw - 2rem))',
          padding: '0.7rem 0.95rem',
          border: '1px solid var(--superficie-borde)',
          borderRadius: 'var(--radio-m)',
          background: 'var(--superficie)',
          color: 'var(--marfil)',
          boxShadow: 'var(--sombra-menu)',
          fontSize: '0.88rem'
        },
        success: { iconTheme: { primary: 'var(--dorado)', secondary: 'var(--superficie)' } },
        error: { iconTheme: { primary: 'var(--peligro)', secondary: 'var(--superficie)' } }
      }}
    />
  );
}

const CLASES_OPCION = {
  primario: 'boton boton--primario',
  secundario: 'boton boton--secundario',
  texto: 'boton boton--texto',
  peligro: 'boton boton--primario boton--destructivo'
};

// Diálogo de confirmación o elección (ver elegir() y confirmar() en controlador/avisos.js).
export function DialogoConfirmacion() {
  const solicitud = useSyncExternalStore(suscribirDialogo, dialogoActual);
  const ref = useRef(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (solicitud && !dialogo.open) {
      dialogo.showModal();
      dialogo.querySelector('[data-enfocar]')?.focus();
    }
    if (!solicitud && dialogo.open) dialogo.close();
  }, [solicitud]);

  // Esc cierra sin elegir.
  const alCancelar = ev => {
    ev.preventDefault();
    solicitud?.responder(null);
  };

  const opciones = solicitud?.opciones || [];
  // Con una acción destructiva el foco arranca en la opción segura.
  const hayPeligro = opciones.some(o => o.estilo === 'peligro');
  const enfocada = Math.max(0, opciones.findIndex(o => (hayPeligro ? o.estilo !== 'peligro' : o.estilo === 'primario')));

  return (
    <dialog className="dialogo dialogo--confirmacion" ref={ref} onCancel={alCancelar} aria-labelledby="confirmacion-titulo">
      {solicitud && (
        <div className="dialogo__cuerpo">
          <h2 className="dialogo__titulo" id="confirmacion-titulo">{solicitud.titulo}</h2>
          {solicitud.texto && <p className="dialogo__texto">{solicitud.texto}</p>}
          <div className={`dialogo__acciones${opciones.length > 2 ? ' dialogo__acciones--apiladas' : ''}`}>
            {opciones.map((opcion, i) => (
              <button
                key={`${opcion.valor}-${i}`}
                type="button"
                className={CLASES_OPCION[opcion.estilo] || CLASES_OPCION.secundario}
                data-enfocar={i === enfocada ? '' : undefined}
                onClick={() => solicitud.responder(opcion.valor)}
              >
                {opcion.texto}
              </button>
            ))}
          </div>
        </div>
      )}
    </dialog>
  );
}

export function VisorLightbox() {
  return (
    <dialog className="lightbox" id="dialogo-lightbox" aria-label="Visor de imagen a pantalla completa">
      <div className="lightbox__barra">
        <span className="lightbox__contador" id="lightbox-contador"></span>
        <button type="button" className="icono-boton lightbox__cerrar" data-accion="lightbox-cerrar" aria-label="Cerrar visor">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>
        </button>
      </div>
      <div className="lightbox__escenario" data-accion="lightbox-fondo">
        <button type="button" className="icono-boton lightbox__nav lightbox__nav--ant" id="lightbox-ant" data-accion="lightbox-ant" aria-label="Foto anterior">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5"/></svg>
        </button>
        <figure className="lightbox__figura">
          <img className="lightbox__img" id="lightbox-img" alt="" />
          <figcaption className="lightbox__epigrafe" id="lightbox-epigrafe" hidden></figcaption>
        </figure>
        <button type="button" className="icono-boton lightbox__nav lightbox__nav--sig" id="lightbox-sig" data-accion="lightbox-sig" aria-label="Foto siguiente">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5"/></svg>
        </button>
      </div>
    </dialog>
  );
}
