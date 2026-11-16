// Diálogos y avisos que usan la vista del cliente y la app del dueño: aceptar la
// propuesta, avisos flotantes (toasts), confirmaciones y visor de imágenes.

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Toaster } from 'react-hot-toast';
import { suscribirDialogo, dialogoActual } from '../../controlador/avisos.js';
import { IconoIA } from '../IconoIA.jsx';

export function DialogoAceptar() {
  return (
    <dialog className="dialogo" id="dialogo-aceptar" aria-labelledby="aceptar-titulo">
      <form method="dialog">
        <h2 className="dialogo__titulo" id="aceptar-titulo">Confirmar la propuesta</h2>
        <dl className="dialogo__resumen" id="aceptar-resumen"></dl>
        <p className="dialogo__texto" id="aceptar-texto"></p>
        {/* Al aceptar, con método de cobro «transferencia»: los datos para transferir. */}
        <div className="aceptar__cobro" id="aceptar-cobro" hidden></div>
        <div className="aceptar__formulario" id="aceptar-formulario" hidden>
          <label className="campo">
            <span className="campo__etiqueta">Tu nombre completo</span>
            <input className="control" id="aceptar-nombre" type="text" autoComplete="name" maxLength="120" />
          </label>
          {/* Solo si el dueño pidió la firma (opciones.firmaCliente). Ver controlador/firma.js. */}
          <div className="firma-pad" id="aceptar-firma" hidden>
            <div className="firma-pad__cabecera">
              <span className="campo__etiqueta">Tu firma</span>
              <button type="button" className="firma-pad__borrar" id="aceptar-firma-borrar" hidden>Borrar</button>
            </div>
            <div className="firma-pad__marco">
              <canvas className="firma-pad__lienzo" id="aceptar-firma-lienzo" role="img" aria-label="Recuadro para firmar con el dedo o el mouse"></canvas>
              <span className="firma-pad__guia" aria-hidden="true">Firmá acá</span>
            </div>
            <p className="firma-pad__ayuda">Firmá con el dedo (o con el mouse). Queda guardada con tu aceptación y en el PDF.</p>
          </div>
          <label className="casilla">
            <input type="checkbox" id="aceptar-conformidad" />
            <span id="aceptar-conformidad-texto">Acepto los términos, condiciones y el alcance detallado en esta propuesta.</span>
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

// «Pedir un cambio» y «No avanzo por ahora» desde el link (controlador/responder.js).
export function DialogoResponder() {
  return (
    <dialog className="dialogo" id="dialogo-responder" aria-labelledby="responder-titulo">
      <form method="dialog" id="responder-formulario">
        <h2 className="dialogo__titulo" id="responder-titulo">Pedir un cambio</h2>
        <p className="dialogo__texto" id="responder-texto"></p>
        <fieldset className="responder__motivos" id="responder-motivos" hidden>
          <legend className="campo__etiqueta">¿Por qué?</legend>
          <div className="responder__opciones" id="responder-opciones"></div>
        </fieldset>
        <label className="campo" id="responder-campo">
          <span className="campo__etiqueta" id="responder-etiqueta">¿Qué te gustaría cambiar?</span>
          <textarea className="control" id="responder-comentario" rows="4" maxLength="1000"></textarea>
        </label>
        <p className="auth__error" id="responder-error" role="alert" hidden></p>
        <div className="dialogo__acciones dialogo__acciones--apiladas">
          <button type="button" className="boton boton--primario boton--grande" id="responder-enviar" disabled>Enviar pedido</button>
          <button className="boton boton--texto" value="cancelar" id="responder-cerrar">Volver a la propuesta</button>
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

  const todas = solicitud?.opciones || [];
  // Las opciones con plan (Pro anual / mensual) van como tarjetas; el resto, como botones.
  const planes = todas.filter(o => o.plan);
  const opciones = todas.filter(o => !o.plan);
  // Con una acción destructiva el foco arranca en la opción segura.
  const hayPeligro = opciones.some(o => o.estilo === 'peligro');
  const enfocada = planes.length ? -1 : Math.max(0, opciones.findIndex(o => (hayPeligro ? o.estilo !== 'peligro' : o.estilo === 'primario')));

  return (
    <dialog className="dialogo dialogo--confirmacion" ref={ref} onCancel={alCancelar} aria-labelledby="confirmacion-titulo">
      {solicitud && (
        <div className="dialogo__cuerpo">
          <h2 className="dialogo__titulo" id="confirmacion-titulo">{solicitud.titulo}</h2>
          {solicitud.texto && <p className="dialogo__texto">{solicitud.texto}</p>}
          {planes.length > 0 && (
            <div className="planes-opciones" role="group" aria-label="Elegí cómo pagar Pro">
              {planes.map((opcion, i) => {
                const { nombre, precio, periodo, cinta, nota, destacado, accion } = opcion.plan;
                return (
                  <button
                    key={opcion.valor}
                    type="button"
                    className={`plan-opcion${destacado ? ' plan-opcion--destacada' : ''}`}
                    data-enfocar={i === 0 ? '' : undefined}
                    onClick={() => solicitud.responder(opcion.valor)}
                  >
                    {cinta && <span className="plan-opcion__cinta">{cinta}</span>}
                    <span className="plan-opcion__nombre">{nombre}</span>
                    <span className="plan-opcion__precio">
                      <strong>{precio}</strong> <small>{periodo}</small>
                    </span>
                    {nota && <span className="plan-opcion__nota">{nota}</span>}
                    <span className="plan-opcion__accion">
                      {accion}
                      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" /></svg>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <div className={`dialogo__acciones${opciones.length > 2 ? ' dialogo__acciones--apiladas' : ''}`}>
            {opciones.map((opcion, i) => (
              <button
                key={`${opcion.valor}-${i}`}
                type="button"
                className={`${CLASES_OPCION[opcion.estilo] || CLASES_OPCION.secundario}${opcion.icono === 'ia' ? ' boton--ia' : ''}`}
                data-enfocar={i === enfocada ? '' : undefined}
                onClick={() => solicitud.responder(opcion.valor)}
              >
                {opcion.texto}
                {opcion.icono === 'ia' && <IconoIA />}
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
