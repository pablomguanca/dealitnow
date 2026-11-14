// Compartir: activa el link de la cuenta (siempre en el servidor, que aplica el plan),
// diálogo de compartir, desactivar el link y copiar al portapapeles. En Gratis el link
// muestra la versión que se mandó: compartir de nuevo la actualiza.

import { $ } from '../lib/formato.js';
import { copiar } from '../lib/portapapeles.js';
import { servicioConContenido, proyectoConContenido } from '../lib/render.js';
import {
  ctx,
  AteneaDB,
  nube,
  digitosWhatsApp,
  tituloPortafolio
} from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarExito, avisarError, confirmar, elegir } from './avisos.js';
import { hayCambiosSinEnviar, guardarAhora, registrarEscritura } from './guardado.js';
import { duplicarParaOtroCliente } from './propuestas.js';
import { abrirRegistro } from './sesion.js';
import { guardarVersion } from './versiones.js';
import { llamarApi } from './api.js';
import { ofrecerPro, restriccionesActivas, confirmarUltimoEnvio, enviosRestantes } from './plan.js';
import { usosPro } from '../planes.js';
import { esAppNativa, compartirNativo } from '../nativo.js';

let linkActual = '';

export const linkCorto = id => `${location.origin}/p/${id}`;
export const linkCortoPortafolio = id => `${location.origin}/portafolio/${id}`;

// Espera la confirmación del servidor hasta 4 segundos: true si la confirmó, false si
// falló y null si todavía no hay respuesta (sin conexión).
const conEspera = escritura => Promise.race([escritura, new Promise(res => setTimeout(() => res(null), 4000))]);

// En Gratis, la propuesta ya enviada tiene otro cliente: se ofrece duplicarla.
const ofrecerDuplicar = async () => {
  const id = ctx.propuestaId;
  const opcion = await elegir({
    titulo: 'Esta propuesta ya la mandaste a otro cliente',
    texto: 'Cambiaste el cliente de una propuesta que ya enviaste. Para mandársela a alguien más, duplicala: queda como una propuesta nueva (cuenta como un envío) y la original sigue igual para tu primer cliente.',
    opciones: [
      { valor: null, texto: 'Cancelar', estilo: 'texto' },
      { valor: 'duplicar', texto: 'Duplicar para el cliente nuevo', estilo: 'primario' }
    ]
  });
  if (opcion === 'duplicar') duplicarParaOtroCliente(id);
};

// Activa el link: la propuesta pasa a ser legible por quien tenga el link y, si era un
// borrador, queda como enviada. Si ya estaba activo, en Gratis se actualiza la versión que
// ve el cliente. El servidor (api/activar) aplica el plan. Antes se espera a que la
// propuesta y sus últimos cambios lleguen a la cuenta: el servidor lee lo guardado.
const activarLink = async () => {
  if (hayCambiosSinEnviar()) guardarAhora();
  const actual = ctx.propuestas.find(p => p.id === ctx.propuestaId);
  if (actual?.aceptacion) return true;
  if (restriccionesActivas() && !actual?.publico && !ctx.estado.cliente.nombre.trim() && !ctx.estado.cliente.empresa.trim()) {
    avisar('Antes de mandarla, completá el nombre de tu cliente o de su empresa (pestaña Cliente).');
    return false;
  }
  const usos = restriccionesActivas() ? usosPro(ctx.estado) : [];
  if (usos.length) {
    ofrecerPro('diseno', usos.map(u => u.nombre));
    return false;
  }
  // Una propuesta nueva gasta un envío del mes: se avisa antes del último.
  const restantes = actual?.enviadaEn ? null : enviosRestantes();
  if (restantes === 0) {
    ofrecerPro('limite');
    return false;
  }
  if (restantes === 1 && !await confirmarUltimoEnvio()) return false;
  await conEspera(ctx.ultimaEscritura);
  try {
    const { primeraVez, usados, limite, actualizada } = await llamarApi('/api/activar', { id: ctx.propuestaId });
    if (primeraVez) guardarVersion('enviada');
    return { primeraVez, congelado: !!limite, actualizada: !!actualizada, quedan: primeraVez && limite ? Math.max(0, limite - usados) : null };
  } catch (e) {
    if (e.codigo === 'limite-envios') ofrecerPro('limite');
    else if (e.codigo === 'otro-cliente') ofrecerDuplicar();
    else if (e.codigo === 'sin-cliente') avisar('Antes de mandarla, completá el nombre de tu cliente o de su empresa (pestaña Cliente).');
    else if (e.codigo === 'diseno-pro') ofrecerPro('diseno', usosPro(ctx.estado).map(u => u.nombre));
    else avisarError(navigator.onLine
      ? 'No se pudo activar el link. Probá de nuevo en unos segundos.'
      : 'Necesitás conexión a internet para activar el link.');
    return false;
  }
};

const mostrarDialogoCompartir = ({ titulo, mensaje, conCuenta, nota, avisos }) => {
  $('#compartir-titulo').textContent = titulo;
  $('#enlace-propuesta').value = linkActual;
  $('#compartir-abrir').href = linkActual;
  $('#compartir-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  $('#compartir-nativo').hidden = typeof navigator.share !== 'function' && !esAppNativa();
  $('#compartir-desactivar').hidden = !conCuenta;
  $('#compartir-nota').textContent = nota;
  const elAvisoCompartir = $('#compartir-aviso');
  elAvisoCompartir.hidden = !avisos.length;
  elAvisoCompartir.textContent = avisos.join(' ');
  $('#dialogo-compartir').showModal();
};

const abrirCompartirPortafolio = async () => {
  const { estadoPortafolio, portafolioId } = ctx;
  const tieneProyectos = estadoPortafolio.portafolio.titulo.trim() || estadoPortafolio.proyectos.some(proyectoConContenido);
  if (!tieneProyectos) {
    avisar('Cargá al menos el título y un proyecto antes de compartir tu portfolio.');
    return;
  }
  // Aviso rápido antes de ir al servidor, que es el que decide.
  const usos = restriccionesActivas() ? usosPro(estadoPortafolio, { esPortafolio: true }) : [];
  if (usos.length) {
    ofrecerPro('diseno', usos.map(u => u.nombre));
    return;
  }
  if (hayCambiosSinEnviar()) guardarAhora();
  const conCuenta = !!(nube() && AteneaDB?.portfolios && portafolioId && /^[A-Za-z0-9]{20}$/.test(portafolioId));
  if (!conCuenta) {
    avisar('Para compartir tu portfolio necesitás tu cuenta de Dealit.');
    return;
  }
  // El link lo activa el servidor (api/activar), que controla el diseño según el plan.
  await conEspera(ctx.ultimaEscritura);
  let congelado;
  try {
    const { limite } = await llamarApi('/api/activar', { id: portafolioId, tipo: 'portafolio' });
    congelado = !!limite;
  } catch (e) {
    if (e.codigo === 'diseno-pro') ofrecerPro('diseno', usosPro(estadoPortafolio, { esPortafolio: true }).map(u => u.nombre));
    else avisarError(navigator.onLine
      ? 'No se pudo activar el link del portfolio. Probá de nuevo en unos segundos.'
      : 'Necesitás conexión a internet para activar el link.');
    return;
  }
  linkActual = linkCortoPortafolio(portafolioId);
  mostrarDialogoCompartir({
    titulo: 'Tu portfolio está listo para compartir',
    mensaje: `Hola! Te comparto mi portfolio «${tituloPortafolio()}» con una selección de proyectos y casos: ${linkActual}`,
    conCuenta: true,
    nota: congelado
      ? 'Tu link muestra el portfolio tal como está ahora. Si después cambiás algo, tocá «Compartir» de nuevo para actualizarlo. Con Pro se actualiza solo.'
      : 'El link muestra siempre la última versión de este portfolio.',
    avisos: []
  });
};

export const abrirCompartir = async () => {
  if (ctx.modoEditor === 'portafolio') return abrirCompartirPortafolio();
  const { estado } = ctx;
  $('#compartir-titulo').textContent = 'Tu propuesta está lista para mandar';
  const tieneContenido = estado.propuesta.titulo.trim() || estado.servicios.some(servicioConContenido);
  if (!tieneContenido) {
    avisar('Cargá al menos el título y un servicio antes de compartir la propuesta.');
    return;
  }
  const conCuenta = !!(nube() && ctx.propuestaId);
  const avisos = [];
  let congelado;
  if (conCuenta) {
    const activado = await activarLink();
    if (!activado) return;
    linkActual = linkCorto(ctx.propuestaId);
    congelado = !!activado.congelado;
    if (congelado && activado.actualizada && !activado.primeraVez) avisos.push('Actualizamos el link con tus últimos cambios.');
    if (activado.quedan != null) {
      avisos.push(activado.quedan === 0
        ? 'Usaste tus envíos gratis de este mes. Las próximas propuestas nuevas se mandan con Pro o el mes que viene.'
        : `Te ${activado.quedan === 1 ? 'queda 1 envío gratis' : `quedan ${activado.quedan} envíos gratis`} este mes.`);
    }
  } else {
    avisar('Para mandar la propuesta necesitás tu cuenta de Dealit.');
    return;
  }
  const saludo = estado.cliente.nombre.trim() ? `Hola ${estado.cliente.nombre.trim().split(' ')[0]}!` : 'Hola!';
  if (!digitosWhatsApp() && !estado.emisor.email.trim()) avisos.push('No cargaste WhatsApp ni email: tu cliente va a poder aceptar, pero solo copiando el mensaje de confirmación.');
  mostrarDialogoCompartir({
    titulo: 'Tu propuesta está lista para mandar',
    mensaje: `${saludo} Te comparto la propuesta${estado.propuesta.titulo.trim() ? ` «${estado.propuesta.titulo.trim()}»` : ''}. Desde el link podés ver todo el detalle, sumar opcionales y aceptarla: ${linkActual}`,
    conCuenta,
    nota: congelado
      ? 'Tu cliente ve la propuesta tal como está ahora. Si después corregís algo, tocá «Compartir» de nuevo para actualizar el link. Con Pro se actualiza solo.'
      : 'El link muestra siempre la última versión: si cambiás algo, tu cliente lo ve la próxima vez que lo abra.',
    avisos
  });
};

const desactivarLink = async () => {
  const id = ctx.propuestaId;
  if (!id) return;
  const ok = await confirmar({
    titulo: '¿Desactivar el link?',
    texto: 'Quien tenga el link ya no va a poder ver la propuesta. Si más adelante la volvés a compartir, se reactiva el mismo link.',
    aceptar: 'Desactivar link',
    peligro: true
  });
  if (!ok) return;
  $('#dialogo-compartir').close();
  const desactivado = await registrarEscritura(
    AteneaDB.proposals.actualizar(id, { publico: false }),
    'No se pudo desactivar el link. Revisá tu conexión y probá de nuevo.'
  );
  if (desactivado) avisarExito('Link desactivado.');
};

export const instalarCompartir = () => {
  registrarAcciones({
    'compartir': () => {
      if (ctx.invitado) abrirRegistro('compartir');
      else abrirCompartir();
    },
    'copiar-link': async boton => {
      if (await copiar(linkActual)) {
        boton.textContent = 'Copiado';
        setTimeout(() => { boton.textContent = 'Copiar link'; }, 2000);
      } else {
        $('#enlace-propuesta').select();
        avisarError('No se pudo copiar automáticamente. El link quedó seleccionado para que lo copies.');
      }
    },
    'desactivar-link': () => desactivarLink(),
    'copiar-link-propuesta': async boton => {
      if (await copiar(linkCorto(boton.dataset.id))) avisarExito('Link copiado.');
      else avisarError('No se pudo copiar el link. Abrí la propuesta y copialo desde «Compartir».');
    },
    'copiar-link-portafolio': async boton => {
      if (await copiar(linkCortoPortafolio(boton.dataset.id))) avisarExito('Link del portfolio copiado.');
      else avisarError('No se pudo copiar el link.');
    },
    'compartir-nativo': async () => {
      const titulo = ctx.estado.propuesta.titulo.trim() || 'Propuesta';
      if (await compartirNativo({ titulo, url: linkActual })) return;
      try {
        await navigator.share({ title: ctx.estado.propuesta.titulo.trim() || 'Propuesta', url: linkActual });
      } catch { }
    }
  });
};
