// Compartir: activa el link corto de la cuenta (o arma el link largo sin cuenta),
// diálogo de compartir, desactivar el link y copiar al portapapeles.

import { $ } from '../lib/formato.js';
import { comprimir } from '../link.js';
import { copiar } from '../lib/portapapeles.js';
import { LOGO_MAX_LINK, limpiarImgLink } from '../lib/imagenes.js';
import { servicioConContenido, proyectoConContenido } from '../lib/render.js';
import {
  ctx,
  AteneaDB,
  PREFIJO,
  PREFIJO_PORTAFOLIO,
  nube,
  digitosWhatsApp,
  tituloPortafolio
} from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarExito, avisarError, confirmar } from './avisos.js';
import { hayCambiosSinEnviar, guardarAhora, registrarEscritura } from './guardado.js';
import { abrirRegistro } from './sesion.js';
import { guardarVersion } from './versiones.js';
import { llamarApi } from './api.js';
import { ofrecerPro, restriccionesActivas, confirmarUltimoEnvio, enviosRestantes } from './plan.js';
import { usosPro } from '../planes.js';

let linkActual = '';

export const linkCorto = id => `${location.origin}/p/${id}`;
export const linkCortoPortafolio = id => `${location.origin}/portafolio/${id}`;

const datosParaLink = () => {
  const { estado } = ctx;
  const sinId = arr => (arr || []).map(({ id, ...resto }) => resto);
  const logoEntra = estado.emisor.logo.length <= LOGO_MAX_LINK;
  return {
    logoOmitido: !!estado.emisor.logo && !logoEntra,
    datos: {
      v: 1,
      ...estado,
      emisor: {
        ...estado.emisor,
        logo: limpiarImgLink(estado.emisor.logo),
        foto: limpiarImgLink(estado.emisor.foto)
      },
      propuesta: {
        ...estado.propuesta,
        imagenPortada: limpiarImgLink(estado.propuesta.imagenPortada)
      },
      objetivos: sinId(estado.objetivos),
      servicios: sinId(estado.servicios).map(s => ({ ...s, imagen: limpiarImgLink(s.imagen) })),
      etapas: sinId(estado.etapas),
      galeria: sinId(estado.galeria).map(g => ({ ...g, imagen: limpiarImgLink(g.imagen) })).filter(g => g.imagen),
      testimonios: sinId(estado.testimonios).map(t => ({ ...t, avatar: limpiarImgLink(t.avatar) })),
      faqs: sinId(estado.faqs),
      inversion: { ...estado.inversion, pagos: sinId(estado.inversion.pagos) }
    }
  };
};

// Espera la confirmación del servidor hasta 4 segundos: true si la confirmó, false si
// falló y null si todavía no hay respuesta (sin conexión).
const conEspera = escritura => Promise.race([escritura, new Promise(res => setTimeout(() => res(null), 4000))]);

// Activa el link corto: la propuesta pasa a ser legible por quien tenga el link
// y, si era un borrador, queda como enviada.
// El servidor (api/activar) aplica el límite del plan. Antes se espera a que la propuesta
// y sus últimos cambios lleguen a la cuenta: el servidor lee lo guardado.
const activarLink = async () => {
  if (hayCambiosSinEnviar()) guardarAhora();
  const actual = ctx.propuestas.find(p => p.id === ctx.propuestaId);
  if (actual?.publico) return true;
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
    const { primeraVez, usados, limite } = await llamarApi('/api/activar', { id: ctx.propuestaId });
    if (primeraVez) guardarVersion('enviada');
    return { primeraVez, quedan: primeraVez && limite ? Math.max(0, limite - usados) : null };
  } catch (e) {
    if (e.codigo === 'limite-envios') ofrecerPro('limite');
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
  $('#compartir-nativo').hidden = typeof navigator.share !== 'function';
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
  // Los portfolios se activan desde el navegador: el control del diseño PRO es solo acá.
  const usos = restriccionesActivas() ? usosPro(estadoPortafolio, { esPortafolio: true }) : [];
  if (usos.length) {
    ofrecerPro('diseno', usos.map(u => u.nombre));
    return;
  }
  if (hayCambiosSinEnviar()) guardarAhora();
  const conCuenta = !!(nube() && AteneaDB?.portfolios && portafolioId && /^[A-Za-z0-9]{20}$/.test(portafolioId));
  const avisos = [];
  if (conCuenta) {
    const activado = await conEspera(registrarEscritura(
      AteneaDB.portfolios.actualizar(portafolioId, { publico: true }),
      'No se pudo activar el link del portfolio.'
    ));
    if (activado === false) return;
    if (activado === null) avisos.push('Estás sin conexión: el link empieza a funcionar en cuanto vuelva.');
    linkActual = linkCortoPortafolio(portafolioId);
  } else {
    const copia = JSON.parse(JSON.stringify(estadoPortafolio));
    copia.emisor.logo = limpiarImgLink(copia.emisor.logo);
    copia.emisor.foto = limpiarImgLink(copia.emisor.foto);
    copia.portafolio.imagenPortada = limpiarImgLink(copia.portafolio.imagenPortada);
    copia.proyectos.forEach(p => {
      p.imagen = limpiarImgLink(p.imagen);
      p.galeria = (p.galeria || []).map(limpiarImgLink).filter(Boolean);
    });
    copia.galeria = (copia.galeria || []).map(g => ({ ...g, imagen: limpiarImgLink(g.imagen) })).filter(g => g.imagen);
    copia.serviciosWeb = (copia.serviciosWeb || []).map(sw => ({ ...sw, imagen: limpiarImgLink(sw.imagen) }));
    copia.testimonios = (copia.testimonios || []).map(t => ({ ...t, avatar: limpiarImgLink(t.avatar) }));
    try {
      linkActual = `${location.origin}${location.pathname}${PREFIJO_PORTAFOLIO}${await comprimir(JSON.stringify(copia))}`;
    } catch {
      avisarError('No se pudo generar el link del portfolio.');
      return;
    }
  }
  mostrarDialogoCompartir({
    titulo: 'Tu portfolio está listo para compartir',
    mensaje: `Hola! Te comparto mi portfolio «${tituloPortafolio()}» con una selección de proyectos y casos: ${linkActual}`,
    conCuenta,
    nota: conCuenta
      ? 'El link muestra siempre la última versión de este portfolio.'
      : 'Este link incluye tu portfolio comprimido listo para abrir.',
    avisos
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
  if (conCuenta) {
    const activado = await activarLink();
    if (!activado) return;
    linkActual = linkCorto(ctx.propuestaId);
    if (activado.quedan != null) {
      avisos.push(activado.quedan === 0
        ? 'Usaste tus envíos gratis de este mes. Las próximas propuestas nuevas se mandan con Pro o el mes que viene.'
        : `Te ${activado.quedan === 1 ? 'queda 1 envío gratis' : `quedan ${activado.quedan} envíos gratis`} este mes.`);
    }
  } else {
    const { datos, logoOmitido } = datosParaLink();
    try {
      linkActual = `${location.origin}${location.pathname}${PREFIJO}${await comprimir(JSON.stringify(datos))}`;
    } catch {
      avisarError('No se pudo generar el link. Probá de nuevo.');
      return;
    }
    if (location.protocol === 'file:') avisos.push('Estás usando el generador desde un archivo de tu compu, así que este link solo abre acá. Publicá el generador en una web (Vercel, Netlify, tu hosting) y el link le va a funcionar a cualquiera.');
    if (logoOmitido) avisos.push('Tu logo es demasiado pesado para viajar en el link, así que no se incluye. Probá con un SVG o un PNG más simple.');
  }
  const saludo = estado.cliente.nombre.trim() ? `Hola ${estado.cliente.nombre.trim().split(' ')[0]}!` : 'Hola!';
  if (!digitosWhatsApp() && !estado.emisor.email.trim()) avisos.push('No cargaste WhatsApp ni email: tu cliente va a poder aceptar, pero solo copiando el mensaje de confirmación.');
  mostrarDialogoCompartir({
    titulo: 'Tu propuesta está lista para mandar',
    mensaje: `${saludo} Te comparto la propuesta${estado.propuesta.titulo.trim() ? ` «${estado.propuesta.titulo.trim()}»` : ''}. Desde el link podés ver todo el detalle, sumar opcionales y aceptarla: ${linkActual}`,
    conCuenta,
    nota: conCuenta
      ? 'El link muestra siempre la última versión: si cambiás algo, tu cliente lo ve la próxima vez que lo abra.'
      : 'Cada link guarda la propuesta tal como está ahora. Si después cambiás algo, generá uno nuevo y mandá ese.',
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
      try {
        await navigator.share({ title: ctx.estado.propuesta.titulo.trim() || 'Propuesta', url: linkActual });
      } catch { }
    }
  });
};
