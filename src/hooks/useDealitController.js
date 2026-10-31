// Hook principal de React que inicializa y coordina el controlador reactivo de Dealit,
// la sincronización con Firebase (Auth, Firestore y Storage) y la vista previa en vivo.

import { useEffect, useRef } from 'react';
import { AteneaDB, AteneaDBError } from '../firebase.js';
import {
  $,
  $$,
  obtener,
  asignar,
  numero,
  texto,
  esc,
  dinero,
  cantidadTexto,
  fechaLarga
} from '../lib/formato.js';
import {
  MODALIDADES,
  DECORACIONES,
  PORTADAS,
  ESTILOS_BLOQUES,
  TEMAS,
  PLANTILLAS,
  PLANTILLAS_PORTAFOLIO,
  LISTAS,
  LISTAS_PORTAFOLIO,
  uid,
  vacio,
  vacioPortafolio,
  ejemplo,
  ejemploPortafolio,
  normalizarPropuesta,
  normalizarPortafolio,
  resumenPortafolio,
  totalServicio,
  calcularTotales
} from '../modelo.js';
import {
  comprimir,
  descomprimir
} from '../link.js';
import { MENSAJES_ACEPTACION, NOMBRE_MIN, limpiarNombre } from '../aceptacion.js';
import { decoracionPortadaSVG } from '../lib/decoraciones.js';
import { resolverColoresTema, aplicarTema, aplicarEscalasTema } from '../lib/tema.js';
import {
  LOGO_MAX_ARCHIVO,
  FOTO_MAX_ARCHIVO,
  LOGO_MAX_LINK,
  reducirLogo,
  logoParaSubir,
  procesarImagenProyecto,
  limpiarImgLink
} from '../lib/imagenes.js';
import {
  abrirLightboxDesdeNodo,
  moverLightbox,
  cerrarLightbox,
  estaAbiertoLightbox
} from '../lib/lightbox.js';
import {
  servicioConContenido,
  proyectoConContenido,
  digitosWhatsApp as obtenerDigitosWhatsApp,
  armarEnlaceWhatsApp,
  armarEnlaceEmail,
  fechaDeAceptacion,
  observarElementos,
  generarPortafolioHTML,
  generarPropuestaHTML
} from '../lib/render.js';
import {
  fechaDe,
  sinAcentos,
  propuestaHTML,
  filtrosHTML,
  metricasHTML,
  portafolioItemHTML
} from '../lib/paneles.js';


let controladorIniciado = false;
let navegarReactRouter = null;

export const registrarNavegadorReact = fn => {
  navegarReactRouter = fn;
};

const irRuta = (ruta, { reemplazar = false } = {}) => {
  if (typeof navegarReactRouter === 'function') {
    try {
      navegarReactRouter(ruta, { replace: reemplazar });
      return;
    } catch {}
  }
  try {
    if (reemplazar) history.replaceState(null, '', ruta);
    else history.pushState(null, '', ruta);
  } catch {}
};

export const inicializarControladorDealit = () => {
  if (controladorIniciado) return;
  controladorIniciado = true;
  const CLAVE = 'generador-propuestas-v1';
  const CLAVE_PORTAFOLIOS = 'generador-portafolios-v1';
  const PREFIJO = '#p=';
  const PREFIJO_PORTAFOLIO = '#f=';
  const RUTA_LINK = /^\/p\/([A-Za-z0-9]{20})\/?$/; // IDs de Firestore: 20 caracteres
  const RUTA_PORTAFOLIO = /^\/portafolio\/([A-Za-z0-9]{20})\/?$/;

  const normalizar = datos => normalizarPropuesta(datos, { logoValido: esLogoValido });
  const normalizarPf = datos => normalizarPortafolio(datos, { logoValido: esLogoValido });

  const leerLocal = clave => {
    try {
      const crudo = sessionStorage.getItem(clave);
      return crudo ? normalizar(JSON.parse(crudo)) : null;
    } catch {
      return null;
    }
  };

  // Sin cuenta, el borrador de prueba vive solo en la pestaña actual (sessionStorage).
  const cargarGuardado = () => leerLocal(CLAVE);

  let estado = vacio();
  let estadoPortafolio = vacioPortafolio();
  let modoEditor = 'propuesta'; // 'propuesta' | 'portafolio'
  const docActivo = () => (modoEditor === 'portafolio' ? estadoPortafolio : estado);
  let portafolioId = null;
  let portafolios = [];
  let portafoliosCargando = false;
  let portafoliosError = false;
  let dejarDeEscucharPortafolios = null;
  let seleccion = new Set();
  let esCliente = false;
  // Link corto abierto por el cliente: { id, aceptacion }. aceptacion es null hasta que acepta.
  let compartida = null;
  const aceptada = () => !!compartida?.aceptacion;
  let vista = 'escritorio';
  let imprimiendo = false;

  const calcular = (e = estado, sumados = seleccion) => calcularTotales(e, sumados);
  const digitosWhatsApp = (em = docActivo().emisor) => obtenerDigitosWhatsApp(em);
  const enlaceWhatsApp = (mensaje, em = docActivo().emisor) => armarEnlaceWhatsApp(mensaje, em);
  const enlaceEmail = (asunto, mensaje, em = docActivo().emisor) => armarEnlaceEmail(asunto, mensaje, em);
  const nombreEmisor = (em = docActivo().emisor) => (em?.nombre || '').trim();
  const tituloPropuesta = () => estado.propuesta.titulo.trim() || 'la propuesta';
  const tituloPortafolio = () => estadoPortafolio.portafolio.titulo.trim() || estadoPortafolio.portafolio.nombreInterno.trim() || 'tu portfolio';

  const elAviso = $('#aviso');
  let temporizadorAviso;
  const avisar = (mensaje, ms = 4200) => {
    elAviso.textContent = mensaje;
    elAviso.classList.add('aviso--visible');
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => elAviso.classList.remove('aviso--visible'), ms);
  };

  // Guardado en la cuenta: cada propuesta es un documento en Firestore (proposals/{id}).
  // Sin cuenta (Firebase no disponible), la propuesta queda en este navegador.
  const GUARDADO_ESPERA = 800;
  const PAYLOAD_MAX = 900000; // Firestore admite hasta 1 MiB por documento
  const AVISO_PESADA = 'La propuesta es demasiado pesada para guardarse (probá con un logo más liviano). Usá «Guardar borrador» para no perder los cambios.';
  const elEstado = $('#estado-guardado');
  let propuestaId = null;
  let editando = false;
  let temporizadorGuardado = null;
  let escriturasPendientes = 0;
  let ultimaEscritura = Promise.resolve(true);
  let errorGuardado = '';
  let avisoError = false;

  const nube = () => (AteneaDB && AteneaDB.auth.getUser() ? AteneaDB : null);

  const mostrarEstadoGuardado = () => {
    if (!elEstado || esCliente) return;
    if (errorGuardado) elEstado.textContent = errorGuardado;
    else if (!nube()) elEstado.textContent = 'Los cambios se guardan en este navegador.';
    else if (escriturasPendientes && !navigator.onLine) elEstado.textContent = 'Sin conexión: los cambios se suben a tu cuenta cuando vuelva.';
    else if (temporizadorGuardado || escriturasPendientes) elEstado.textContent = 'Guardando…';
    else elEstado.textContent = 'Cambios guardados en tu cuenta.';
  };
  window.addEventListener('online', mostrarEstadoGuardado);
  window.addEventListener('offline', mostrarEstadoGuardado);

  const fallarGuardado = mensaje => {
    errorGuardado = mensaje;
    if (!avisoError) {
      avisoError = true;
      avisar(mensaje, 7000);
    }
  };

  // Resumen que se guarda junto al contenido para poder listar sin abrir cada propuesta.
  // Devuelve null si la propuesta no entra en un documento de Firestore.
  const datosParaGuardar = e => {
    const payload = JSON.stringify(e);
    if (payload.length > PAYLOAD_MAX) return null;
    return {
      title: e.propuesta.titulo.trim(),
      clientName: e.cliente.empresa.trim() || e.cliente.nombre.trim(),
      amount: calcular(e, new Set()).inicial.total || calcular(e, new Set()).mensual.total, // sin opcionales
      theme: e.tema.preset,
      payload: JSON.parse(payload)
    };
  };


  const datosPortafolioParaGuardar = pf => {
    const payload = JSON.stringify(pf);
    if (payload.length > PAYLOAD_MAX) return null;
    const proyectosValidos = (pf.proyectos || []).filter(p => p.titulo.trim() || p.descripcion.trim() || p.imagen);
    return {
      title: pf.portafolio.nombreInterno.trim() || pf.portafolio.titulo.trim() || 'Portfolio sin título',
      subtitle: pf.portafolio.subtitulo.trim() || pf.emisor.rol.trim(),
      projectCount: proyectosValidos.length,
      theme: pf.tema.preset,
      payload: JSON.parse(payload)
    };
  };

  const cargarPortafoliosLocales = () => {
    try {
      const crudo = sessionStorage.getItem(CLAVE_PORTAFOLIOS);
      if (crudo) {
        const arr = JSON.parse(crudo);
        if (Array.isArray(arr)) {
          return arr.map(item => {
            const payload = normalizarPf(item.payload || item);
            const meta = datosPortafolioParaGuardar(payload) || { title: 'Portfolio', subtitle: '', projectCount: 0, theme: 'elegante-oscuro', payload };
            return {
              id: item.id || uid(),
              ...meta,
              publico: !!item.publico,
              updatedAt: item.updatedAt || new Date().toISOString()
            };
          });
        }
      }
    } catch {}
    return [];
  };

  const guardarPortafoliosLocales = () => {
    if (cerrandoSesion || (AteneaDB && !invitado)) return;
    try {
      sessionStorage.setItem(CLAVE_PORTAFOLIOS, JSON.stringify(portafolios));
      errorGuardado = '';
    } catch {
      fallarGuardado('No se pudo guardar el portfolio en este navegador. Usá «Guardar borrador» para no perder los cambios.');
    }
    mostrarEstadoGuardado();
  };

  // Todas las escrituras pasan por acá: así el estado de guardado y el cierre de
  // sesión saben si queda algo por llegar al servidor.
  const registrarEscritura = (promesa, mensajeError) => {
    escriturasPendientes++;
    mostrarEstadoGuardado();
    const resultado = promesa
      .then(() => {
        errorGuardado = '';
        avisoError = false;
        return true;
      })
      .catch(e => {
        console.error(mensajeError, e);
        fallarGuardado(mensajeError);
        return false;
      })
      .finally(() => {
        escriturasPendientes--;
        mostrarEstadoGuardado();
      });
    ultimaEscritura = resultado;
    return resultado;
  };

  const guardarLocal = () => {
    if (cerrandoSesion || (AteneaDB && !invitado)) return;
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(estado));
      errorGuardado = '';
    } catch {
      fallarGuardado('No se pudo guardar en este navegador. Usá «Guardar borrador» para no perder los cambios.');
    }
    mostrarEstadoGuardado();
  };

  let cerrandoSesion = false;

  const limpiarAlmacenamientoLocal = () => {
    try {
      localStorage.removeItem(CLAVE);
      localStorage.removeItem(CLAVE_PORTAFOLIOS);
      Object.keys(localStorage)
        .filter(k => k.startsWith(`${CLAVE}:borrador:`))
        .forEach(k => localStorage.removeItem(k));
      sessionStorage.removeItem(CLAVE);
      sessionStorage.removeItem(CLAVE_PORTAFOLIOS);
      sessionStorage.removeItem(`${CLAVE}:continuar`);
    } catch {}
  };

  const sincronizarPortafolioEnPropuesta = () => {
    const pfId = estado.opciones?.portafolioId || '';
    if (!pfId) {
      if (estado.opciones) delete estado.opciones.portafolio;
      return;
    }
    const pfDoc = portafolios.find(x => x.id === pfId);
    if (pfDoc) {
      estado.opciones.portafolio = resumenPortafolio(pfDoc.payload, pfDoc.id, pfDoc.publico);
    } else if (!portafoliosCargando) {
      estado.opciones.portafolioId = '';
      if (estado.opciones) delete estado.opciones.portafolio;
    }
  };

  const guardarAhora = () => {
    clearTimeout(temporizadorGuardado);
    temporizadorGuardado = null;
    if (!editando || cerrandoSesion) return;
    const db = nube();
    if (modoEditor === 'portafolio') {
      const datosPf = datosPortafolioParaGuardar(estadoPortafolio);
      if (!datosPf) {
        fallarGuardado(AVISO_PESADA);
        mostrarEstadoGuardado();
        return;
      }
      if (portafolioId) {
        const idx = portafolios.findIndex(x => x.id === portafolioId);
        const actualizado = {
          ...(idx >= 0 ? portafolios[idx] : { id: portafolioId, publico: false }),
          ...datosPf,
          updatedAt: new Date().toISOString()
        };
        if (idx >= 0) portafolios[idx] = actualizado;
        else portafolios.unshift(actualizado);
      }
      if (!db || !AteneaDB?.portfolios) {
        guardarPortafoliosLocales();
        actualizarSelectorPortafolio();
        return;
      }
      if (!portafolioId) return;
      return registrarEscritura(
        db.portfolios.actualizar(portafolioId, datosPf),
        'No se pudieron guardar los últimos cambios del portfolio en tu cuenta.'
      );
    }
    sincronizarPortafolioEnPropuesta();
    if (!db) return guardarLocal();
    if (!propuestaId) return;
    const datos = datosParaGuardar(estado);
    if (!datos) {
      fallarGuardado(AVISO_PESADA);
      mostrarEstadoGuardado();
      return;
    }
    return registrarEscritura(
      db.proposals.actualizar(propuestaId, datos),
      'No se pudieron guardar los últimos cambios en tu cuenta. Usá «Guardar borrador» para no perderlos.'
    );
  };

  const guardarLuego = () => {
    if (esCliente || !editando) return;
    clearTimeout(temporizadorGuardado);
    temporizadorGuardado = setTimeout(guardarAhora, nube() ? GUARDADO_ESPERA : 400);
    mostrarEstadoGuardado();
  };

  // Si la pestaña se oculta o se cierra, no esperar al temporizador ni al próximo
  // cuadro de animación (en pestañas ocultas no llega nunca).
  const hayCambiosSinEnviar = () => editando && !esCliente && (temporizadorGuardado || renderPendiente);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && hayCambiosSinEnviar()) guardarAhora();
  });
  window.addEventListener('beforeunload', ev => {
    if (hayCambiosSinEnviar()) guardarAhora();
    if (escriturasPendientes && navigator.onLine) {
      ev.preventDefault();
      ev.returnValue = '';
    }
  });

  // Crea una propuesta en la cuenta. El ID sale del cliente, así se puede abrir
  // y seguir editando sin esperar al servidor (y sin conexión).
  const crearEnCuenta = e => {
    const datos = datosParaGuardar(e);
    if (!datos) {
      avisar(AVISO_PESADA, 7000);
      return null;
    }
    const id = AteneaDB.proposals.nuevoId();
    const listo = registrarEscritura(AteneaDB.proposals.crear(datos, id), 'No se pudo crear la propuesta en tu cuenta.');
    return { id, listo };
  };

  // Migración única: lo que la versión anterior guardaba en el navegador pasa a la
  // cuenta, y se borra del navegador recién cuando el servidor confirmó la copia.
  // Devuelve { id, contenido } de la propuesta creada, o null si no había nada que migrar.
  const migrarLocal = () => {
    let continuar = null;
    try { continuar = sessionStorage.getItem(`${CLAVE}:continuar`); } catch {}
    const contenido = continuar ? cargarGuardado() : null;
    try {
      localStorage.removeItem(CLAVE);
      localStorage.removeItem(CLAVE_PORTAFOLIOS);
      sessionStorage.removeItem(CLAVE);
      sessionStorage.removeItem(CLAVE_PORTAFOLIOS);
    } catch {}
    if (!contenido) return null;
    const creada = crearEnCuenta(contenido);
    if (!creada) return null;
    avisar('Guardamos en tu cuenta la propuesta que armaste.', 6000);
    return { id: creada.id, contenido };
  };

  const plantillaControles = $('#tpl-controles');

  const actualizarImagenGenericaItem = (nodo, urlImg, prefijo, textoSubir = 'Subir foto', textoCambiar = 'Cambiar foto') => {
    const img = $(`[${prefijo}-vista]`, nodo);
    const btnQuitar = $(`[${prefijo}-quitar]`, nodo);
    const txt = $(`[${prefijo}-texto]`, nodo);
    const tiene = !!urlImg;
    if (img) {
      img.hidden = !tiene;
      if (tiene) img.src = urlImg;
      else img.removeAttribute('src');
    }
    if (btnQuitar) btnQuitar.hidden = !tiene;
    if (txt) txt.textContent = tiene ? textoCambiar : textoSubir;
  };

  const actualizarItemServicio = (nodo, s) => {
    const modo = MODALIDADES[s.modalidad] || MODALIDADES.unico;
    const esIncluido = s.modalidad === 'incluido';
    const wrapCant = $('[data-campo-cantidad]', nodo);
    const wrapPrecio = $('[data-campo-precio]', nodo);
    if (wrapCant) wrapCant.hidden = esIncluido;
    if (wrapPrecio) wrapPrecio.hidden = esIncluido;
    $('[data-etiqueta-cantidad]', nodo).textContent = modo.cantidad;
    $('[data-etiqueta-precio]', nodo).textContent = modo.precio;
    const sufijo = s.modalidad === 'mensual' ? ' por mes' : '';
    const subEl = $('[data-subtotal]', nodo);
    if (subEl) {
      subEl.textContent = esIncluido
        ? 'Incluido en el fee / inversión general'
        : (totalServicio(s) > 0 ? dinero(totalServicio(s), estado.inversion.moneda) + sufijo : 'Sin precio individual (incluido)');
    }
    nodo.classList.toggle('item--opcional', !!s.opcional);
    actualizarImagenGenericaItem(nodo, s.imagen, 'data-srv-img');
  };

  const renderLista = nombre => {
    const conf = LISTAS[nombre];
    const contenedor = $(`.lista[data-lista="${nombre}"]`);
    const plantilla = $(`#tpl-${nombre}`);
    const arr = obtener(estado, conf.ruta);
    const nodos = arr.map((item, i) => {
      const nodo = plantilla.content.firstElementChild.cloneNode(true);
      nodo.dataset.indice = i;
      $$('[data-item]', nodo).forEach(el => {
        const v = item[el.dataset.item];
        if (el.type === 'checkbox') el.checked = !!v;
        else el.value = v ?? '';
      });
      const orden = $('[data-orden]', nodo);
      if (orden) orden.textContent = i + 1;
      const controles = $('[data-controles]', nodo);
      controles.append(plantillaControles.content.cloneNode(true));
      const [subir, bajar, quitar] = controles.children;
      subir.disabled = i === 0;
      bajar.disabled = i === arr.length - 1;
      subir.setAttribute('aria-label', `Subir ${conf.nombre} ${i + 1}`);
      bajar.setAttribute('aria-label', `Bajar ${conf.nombre} ${i + 1}`);
      quitar.setAttribute('aria-label', `Quitar ${conf.nombre} ${i + 1}`);
      if (nombre === 'servicios') actualizarItemServicio(nodo, item);
      if (nombre === 'galeria') actualizarImagenGenericaItem(nodo, item.imagen, 'data-gal-img');
      if (nombre === 'testimonios') actualizarImagenGenericaItem(nodo, item.avatar, 'data-test-img');
      return nodo;
    });
    contenedor.replaceChildren(...nodos);
  };

  const renderListas = () => Object.keys(LISTAS).forEach(renderLista);

  const actualizarSubtotales = () => {
    $$('.lista[data-lista="servicios"] > .item').forEach(nodo => {
      const s = estado.servicios[Number(nodo.dataset.indice)];
      if (s) actualizarItemServicio(nodo, s);
    });
  };

  const actualizarAvisoPagos = () => {
    const el = $('#aviso-pagos');
    const pagos = estado.inversion.pagos;
    const suma = Math.round(pagos.reduce((t, p) => t + numero(p.porcentaje), 0) * 100) / 100;
    el.hidden = !pagos.length || suma === 100;
    if (!el.hidden) el.textContent = `Los porcentajes suman ${cantidadTexto(suma)}%. Ajustalos para que lleguen a 100%.`;
  };

  const actualizarLogo = () => {
    const actual = docActivo();
    const logo = actual.emisor.logo;
    const vistaLogo = $('#logo-vista');
    if (vistaLogo) {
      vistaLogo.hidden = !logo;
      if (logo) vistaLogo.src = logo;
      else vistaLogo.removeAttribute('src');
    }
    if ($('#logo-quitar')) $('#logo-quitar').hidden = !logo;
    if ($('#logo-texto')) $('#logo-texto').textContent = logo ? 'Cambiar logo' : 'Subir logo';

    const foto = actual.emisor.foto || '';
    const vistaFoto = $('#foto-emisor-vista');
    if (vistaFoto) {
      vistaFoto.hidden = !foto;
      if (foto) vistaFoto.src = foto;
      else vistaFoto.removeAttribute('src');
    }
    if ($('#foto-emisor-quitar')) $('#foto-emisor-quitar').hidden = !foto;
    if ($('#foto-emisor-texto')) $('#foto-emisor-texto').textContent = foto ? 'Cambiar foto' : 'Subir foto';

    // Foto de portada Hero (Propuesta)
    const imgPortProp = estado.propuesta?.imagenPortada || '';
    const vistaPortProp = $('#portada-prop-vista');
    if (vistaPortProp) {
      vistaPortProp.hidden = !imgPortProp;
      if (imgPortProp) vistaPortProp.src = imgPortProp;
      else vistaPortProp.removeAttribute('src');
    }
    if ($('#portada-prop-quitar')) $('#portada-prop-quitar').hidden = !imgPortProp;
    if ($('#portada-prop-texto')) $('#portada-prop-texto').textContent = imgPortProp ? 'Cambiar foto de portada' : 'Subir foto de portada';
    if ($('#portada-prop-opacidad-wrap')) $('#portada-prop-opacidad-wrap').hidden = !imgPortProp;
    if ($('#portada-prop-opacidad-val')) $('#portada-prop-opacidad-val').textContent = `${estado.propuesta?.opacidadPortada ?? 35}%`;

    // Foto de portada Hero (Portfolio)
    const imgPortPf = estadoPortafolio.portafolio?.imagenPortada || '';
    const vistaPortPf = $('#portada-pf-vista');
    if (vistaPortPf) {
      vistaPortPf.hidden = !imgPortPf;
      if (imgPortPf) vistaPortPf.src = imgPortPf;
      else vistaPortPf.removeAttribute('src');
    }
    if ($('#portada-pf-quitar')) $('#portada-pf-quitar').hidden = !imgPortPf;
    if ($('#portada-pf-texto')) $('#portada-pf-texto').textContent = imgPortPf ? 'Cambiar foto de portada' : 'Subir foto de portada';
    if ($('#portada-pf-opacidad-wrap')) $('#portada-pf-opacidad-wrap').hidden = !imgPortPf;
    if ($('#portada-pf-opacidad-val')) $('#portada-pf-opacidad-val').textContent = `${estadoPortafolio.portafolio?.opacidadPortada ?? 35}%`;
  };

  const actualizarSelectorPortafolio = () => {
    const sel = $('#propuesta-portafolio-select');
    if (!sel) return;
    const valorActual = estado.opciones?.portafolioId || '';
    const opcionesHTML = [
      '<option value="">No incluir portfolio en esta propuesta</option>',
      ...portafolios.map(pf => {
        const nombre = texto(pf.title).trim() || 'Portfolio sin título';
        const cant = Number(pf.projectCount) || (pf.payload?.proyectos?.length || 0);
        const detalle = cant === 1 ? '1 proyecto' : `${cant} proyectos`;
        return `<option value="${esc(pf.id)}">${esc(nombre)} (${detalle})</option>`;
      })
    ];
    const existe = portafolios.some(pf => pf.id === valorActual);
    if (valorActual && !existe && !portafoliosCargando) {
      estado.opciones.portafolioId = '';
      delete estado.opciones.portafolio;
    }
    sel.innerHTML = opcionesHTML.join('');
    sel.value = existe ? valorActual : '';
  };

  const actualizarImagenProyectoItem = (nodo, item) => {
    actualizarImagenGenericaItem(nodo, item.imagen, 'data-pf-img', 'Subir portada', 'Cambiar portada');
    const galLista = $('[data-pf-galeria-lista]', nodo);
    if (galLista) {
      const fotos = Array.isArray(item.galeria) ? item.galeria : [];
      galLista.innerHTML = fotos.map((src, idxFoto) => `
        <div class="proyecto-galeria-mini__item">
          <img src="${esc(src)}" alt="Foto ${idxFoto + 1}">
          <button type="button" class="proyecto-galeria-mini__quitar" data-accion="quitar-foto-galeria-proyecto" data-foto-idx="${idxFoto}" aria-label="Quitar foto ${idxFoto + 1}">×</button>
        </div>`).join('');
    }
  };

  const renderListaPortafolio = nombre => {
    const conf = LISTAS_PORTAFOLIO[nombre];
    const contenedor = $(`.lista[data-lista-pf="${nombre}"]`);
    const plantilla = $(`#tpl-${nombre}`);
    if (!conf || !contenedor || !plantilla) return;
    const arr = obtener(estadoPortafolio, conf.ruta);
    const nodos = arr.map((item, i) => {
      const nodo = plantilla.content.firstElementChild.cloneNode(true);
      nodo.dataset.indicePf = i;
      $$('[data-item-pf]', nodo).forEach(el => {
        const v = item[el.dataset.itemPf];
        if (el.type === 'checkbox') el.checked = !!v;
        else el.value = v ?? '';
      });
      const orden = $('[data-orden]', nodo);
      if (orden) orden.textContent = i + 1;
      const controles = $('[data-controles]', nodo);
      controles.append(plantillaControles.content.cloneNode(true));
      const [subir, bajar, quitar] = controles.children;
      subir.disabled = i === 0;
      bajar.disabled = i === arr.length - 1;
      subir.setAttribute('aria-label', `Subir ${conf.nombre} ${i + 1}`);
      bajar.setAttribute('aria-label', `Bajar ${conf.nombre} ${i + 1}`);
      quitar.setAttribute('aria-label', `Quitar ${conf.nombre} ${i + 1}`);
      if (nombre === 'proyectos') actualizarImagenProyectoItem(nodo, item);
      if (nombre === 'galeria') actualizarImagenGenericaItem(nodo, item.imagen, 'data-gal-img');
      if (nombre === 'serviciosWeb') actualizarImagenGenericaItem(nodo, item.imagen, 'data-sweb-img');
      if (nombre === 'testimonios') actualizarImagenGenericaItem(nodo, item.avatar, 'data-test-img');
      return nodo;
    });
    contenedor.replaceChildren(...nodos);
  };

  const renderListasPortafolio = () => Object.keys(LISTAS_PORTAFOLIO).forEach(renderListaPortafolio);

  const sincronizarModoEditorUI = () => {
    const esPf = modoEditor === 'portafolio';
    const pasosProp = $('#pasos-propuesta');
    const pasosPf = $('#pasos-portafolio');
    const wrapTplProp = $('#plantillas-propuesta-wrap');
    const wrapTplPf = $('#plantillas-portafolio-wrap');
    const campoVincularPf = $('#campo-vincular-portafolio');
    const subtituloBarra = $('#barra-subtitulo');
    const tituloEditor = $('#editor-titulo');
    const bajadaEditor = $('#editor-bajada');
    const volverLink = $('#editor-volver');
    const volverTexto = $('#editor-volver-texto');
    const btnOtraSeccion = $('#editor-ir-otra-seccion');
    const grupoActual = $('#menu-grupo-actual');

    if (pasosProp) pasosProp.hidden = esPf;
    if (pasosPf) pasosPf.hidden = !esPf;
    if (wrapTplProp) wrapTplProp.hidden = esPf;
    if (wrapTplPf) wrapTplPf.hidden = !esPf;
    if (campoVincularPf) campoVincularPf.hidden = esPf;
    if (subtituloBarra) subtituloBarra.textContent = esPf ? 'Armá tu portfolio' : 'Generá tu propuesta';
    if (tituloEditor) tituloEditor.textContent = esPf ? 'Armá tu portfolio' : 'Armá tu propuesta';
    if (bajadaEditor) {
      bajadaEditor.textContent = esPf
        ? 'Creá un portfolio a medida para cada rubro o tipo de cliente. Podés compartirlo como link propio o sumarlo a tus propuestas.'
        : 'Elegí una plantilla, escribí tus datos y mandala como link interactivo: el diseño se arma solo.';
    }
    if (volverLink) {
      volverLink.dataset.accion = esPf ? 'ir-portafolios' : 'ir-panel';
      volverLink.href = esPf ? '/portafolios' : '/';
    }
    if (volverTexto) volverTexto.textContent = esPf ? 'Mis portfolios' : 'Mis propuestas';
    if (btnOtraSeccion) {
      btnOtraSeccion.dataset.accion = esPf ? 'ir-panel' : 'ir-portafolios';
      btnOtraSeccion.textContent = esPf ? 'Ir a Mis propuestas →' : 'Ir a Mis portfolios →';
    }
    if (grupoActual) grupoActual.textContent = esPf ? 'Portfolio actual' : 'Propuesta actual';
  };

  const llenarFormulario = () => {
    sincronizarModoEditorUI();
    if (modoEditor === 'portafolio') {
      $$('[data-campo^="emisor."]').forEach(el => {
        const v = obtener(estadoPortafolio, el.dataset.campo);
        el.value = v ?? '';
      });
      $$('[data-campo-pf]').forEach(el => {
        const v = obtener(estadoPortafolio, el.dataset.campoPf);
        if (el.type === 'checkbox') el.checked = !!v;
        else el.value = v ?? '';
      });
      actualizarLogo();
      renderListasPortafolio();
      llenarTemaEditor();
      return;
    }
    actualizarSelectorPortafolio();
    $$('[data-campo]').forEach(el => {
      const v = obtener(estado, el.dataset.campo);
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = v ?? '';
    });
    actualizarLogo();
    renderListas();
    llenarTemaEditor();
  };

  let animacionInicialLista = false;

  const renderPortafolio = () => {
    const web = !imprimiendo && (esCliente || vista !== 'pdf');
    const doc = $('#documento');
    doc.classList.toggle('doc--web', web);
    aplicarTema(doc, estadoPortafolio.tema);
    const tipoDecoracion = doc.dataset.decoracion || 'marco';
    const tipoPortada = doc.dataset.portada || 'editorial';

    if (animacionInicialLista) doc.classList.add('doc--estatico');
    doc.innerHTML = generarPortafolioHTML(estadoPortafolio, { web, tipoDecoracion, tipoPortada });
    if (web) observarElementos(doc, esCliente);
    if (!animacionInicialLista && web) {
      animacionInicialLista = true;
      setTimeout(() => doc.classList.add('doc--estatico'), 1400);
    }
  };

  const renderDocumento = () => {
    if (modoEditor === 'portafolio') return renderPortafolio();
    const web = !imprimiendo && (esCliente || vista !== 'pdf');
    const doc = $('#documento');
    doc.classList.toggle('doc--web', web);
    aplicarTema(doc, estado.tema);
    const tipoDecoracion = doc.dataset.decoracion || 'marco';
    const tipoPortada = doc.dataset.portada || 'editorial';

    sincronizarPortafolioEnPropuesta();
    if (animacionInicialLista) doc.classList.add('doc--estatico');
    doc.innerHTML = generarPropuestaHTML(estado, {
      web,
      seleccion,
      compartida,
      tipoDecoracion,
      tipoPortada
    });
    if (web) observarElementos(doc, esCliente);
    if (!animacionInicialLista && web) {
      animacionInicialLista = true;
      setTimeout(() => doc.classList.add('doc--estatico'), 1400);
    }
  };

  // Actualiza colores, tipografías, decoración SVG, portada y estilo de bloques en vivo
  // sin reconstruir todo el documento ni reiniciar las animaciones de entrada.
  const actualizarTemaEnVivo = () => {
    if (invitado) invitadoEdito = true;
    const doc = $('#documento');
    if (!doc || !doc.querySelector('.portada')) {
      actualizar();
      return;
    }
    doc.classList.add('doc--estatico');
    animacionInicialLista = true;
    observarElementos(doc, esCliente);
    const actual = docActivo();
    aplicarTema(doc, actual.tema);
    const col = resolverColoresTema(actual.tema);
    const tipoDecoracion = doc.dataset.decoracion || 'marco';
    const tipoPortada = doc.dataset.portada || 'editorial';
    const seccionPortada = doc.querySelector('.portada');
    if (seccionPortada) {
      seccionPortada.className = `portada portada--${tipoPortada}`;
      const deco = seccionPortada.querySelector('.portada__decoracion');
      if (deco) {
        deco.style.color = col.colorSvg;
        deco.innerHTML = decoracionPortadaSVG(tipoDecoracion, col.opacidadSvg, col.colorSvg);
      }
      const existenteAgua = seccionPortada.querySelector('.portada__marca-agua');
      const numTexto = modoEditor === 'portafolio'
        ? String((estadoPortafolio.proyectos || []).filter(proyectoConContenido).length || '01').padStart(2, '0')
        : estado.propuesta.numero.trim();
      if (tipoPortada === 'impacto' && numTexto) {
        if (existenteAgua) {
          existenteAgua.textContent = numTexto;
        } else {
          const span = document.createElement('span');
          span.className = 'portada__marca-agua';
          span.setAttribute('aria-hidden', 'true');
          span.textContent = numTexto;
          seccionPortada.insertBefore(span, seccionPortada.querySelector('.portada__superior'));
        }
      } else if (existenteAgua) {
        existenteAgua.remove();
      }
    }
    guardarLuego();
  };

  let renderPendiente = false;
  // Se llama en cada cambio que hace quien edita (no en la carga inicial).
  const actualizar = () => {
    if (invitado) invitadoEdito = true;
    if (renderPendiente) return;
    renderPendiente = true;
    requestAnimationFrame(() => {
      renderPendiente = false;
      renderDocumento();
      actualizarSubtotales();
      actualizarAvisoPagos();
      guardarLuego();
    });
  };

  const leerValor = el => {
    if (el.type === 'checkbox') return el.checked;
    if (el.dataset.tipo === 'numero') return numero(el.value);
    return el.value;
  };

  const alEditar = ev => {
    const el = ev.target;
    if (modoEditor === 'portafolio') {
      if (el.dataset.campo && el.dataset.campo.startsWith('emisor.')) {
        asignar(estadoPortafolio, el.dataset.campo, leerValor(el));
        actualizar();
        return;
      }
      if (el.dataset.campoPf) {
        asignar(estadoPortafolio, el.dataset.campoPf, leerValor(el));
        if (el.dataset.campoPf === 'portafolio.opacidadPortada') actualizarLogo();
        actualizar();
        return;
      }
      if (el.dataset.itemPf) {
        const nodo = el.closest('[data-indice-pf]');
        const lista = el.closest('.lista');
        if (!nodo || !lista) return;
        const conf = LISTAS_PORTAFOLIO[lista.dataset.listaPf];
        if (!conf) return;
        const item = obtener(estadoPortafolio, conf.ruta)[Number(nodo.dataset.indicePf)];
        if (!item) return;
        item[el.dataset.itemPf] = leerValor(el);
        actualizar();
        return;
      }
    }
    if (el.dataset.campo) {
      asignar(estado, el.dataset.campo, leerValor(el));
      if (el.dataset.campo === 'opciones.portafolioId') sincronizarPortafolioEnPropuesta();
      if (el.dataset.campo === 'propuesta.opacidadPortada') actualizarLogo();
      actualizar();
      return;
    }
    if (el.dataset.item) {
      const nodo = el.closest('[data-indice]');
      const lista = el.closest('.lista');
      if (!nodo || !lista) return;
      const item = obtener(estado, LISTAS[lista.dataset.lista].ruta)[Number(nodo.dataset.indice)];
      if (!item) return;
      item[el.dataset.item] = leerValor(el);
      if (el.dataset.item === 'opcional' && !el.checked) seleccion.delete(item.id);
      actualizar();
    }
  };

  const formulario = $('#formulario');
  formulario.addEventListener('input', alEditar);
  formulario.addEventListener('change', alEditar);
  formulario.addEventListener('submit', ev => ev.preventDefault());

  const llenarTemaEditor = () => {
    const t = docActivo().tema;
    const preset = TEMAS[t.preset] || TEMAS['elegante-oscuro'];
    const col = resolverColoresTema(t);
    $$('.tema-card').forEach(el => el.classList.toggle('tema-card--activo', el.dataset.tema === t.preset));
    const decoracionActiva = DECORACIONES[t.decoracion] ? t.decoracion : (preset.decoracion || 'marco');
    const portadaActiva = PORTADAS[t.portada] ? t.portada : (preset.portada || 'editorial');
    const estiloActivo = ESTILOS_BLOQUES[t.estilo] ? t.estilo : (preset.estilo || 'editorial');
    $$('[data-decoracion]').forEach(el => el.classList.toggle('opcion-visual--activa', el.dataset.decoracion === decoracionActiva));
    $$('[data-portada]').forEach(el => el.classList.toggle('opcion-visual--activa', el.dataset.portada === portadaActiva));
    $$('[data-estilo]').forEach(el => el.classList.toggle('opcion-visual--activa', el.dataset.estilo === estiloActivo));
    const acento = $('#tema-acento');
    const colorTexto = $('#tema-color-texto');
    const colorPortada = $('#tema-color-portada');
    const colorFondo = $('#tema-color-fondo');
    const colorSvg = $('#tema-color-svg');
    const opacidadSvg = $('#tema-opacidad-svg');
    const opacidadValor = $('#tema-opacidad-valor');
    const escalaPortada = $('#tema-escala-portada');
    const escalaPortadaValor = $('#tema-escala-portada-valor');
    const escalaTitulos = $('#tema-escala-titulos');
    const escalaTitulosValor = $('#tema-escala-titulos-valor');
    const escalaTexto = $('#tema-escala-texto');
    const escalaTextoValor = $('#tema-escala-texto-valor');
    const espaciadoSecciones = $('#tema-espaciado-secciones');
    const espaciadoSeccionesValor = $('#tema-espaciado-secciones-valor');
    const espaciadoInterno = $('#tema-espaciado-interno');
    const espaciadoInternoValor = $('#tema-espaciado-interno-valor');
    const btnReset = $('#tema-restablecer-colores');
    const ft = $('#tema-fuente-titulos');
    const fc = $('#tema-fuente-cuerpo');
    if (acento) acento.value = col.acento;
    if (colorTexto) colorTexto.value = col.cuerpoTexto;
    if (colorPortada) colorPortada.value = col.portadaBg;
    if (colorFondo) colorFondo.value = col.fondoBase;
    if (colorSvg) colorSvg.value = col.colorSvg;
    if (opacidadSvg) opacidadSvg.value = String(col.opacidadSvg);
    if (opacidadValor) opacidadValor.textContent = `${col.opacidadSvg}%`;
    if (escalaPortada) escalaPortada.value = String(col.escalaTituloPortada);
    if (escalaPortadaValor) escalaPortadaValor.textContent = `${col.escalaTituloPortada}%`;
    if (escalaTitulos) escalaTitulos.value = String(col.escalaTitulos);
    if (escalaTitulosValor) escalaTitulosValor.textContent = `${col.escalaTitulos}%`;
    if (escalaTexto) escalaTexto.value = String(col.escalaTexto);
    if (escalaTextoValor) escalaTextoValor.textContent = `${col.escalaTexto}%`;
    if (espaciadoSecciones) espaciadoSecciones.value = String(col.espaciadoSecciones);
    if (espaciadoSeccionesValor) espaciadoSeccionesValor.textContent = `${col.espaciadoSecciones}%`;
    if (espaciadoInterno) espaciadoInterno.value = String(col.espaciadoInterno);
    if (espaciadoInternoValor) espaciadoInternoValor.textContent = `${col.espaciadoInterno}%`;
    if (btnReset) {
      const cambiado = (t.acento && t.acento.toLowerCase() !== preset.acento.toLowerCase())
        || !!t.colorTexto
        || !!t.colorPortada
        || !!t.colorFondo
        || !!t.colorSvg
        || (t.opacidadSvg !== undefined && Number(t.opacidadSvg) !== 100)
        || (t.escalaTituloPortada !== undefined && Number(t.escalaTituloPortada) !== 100)
        || (t.escalaTitulos !== undefined && Number(t.escalaTitulos) !== 100)
        || (t.escalaTexto !== undefined && Number(t.escalaTexto) !== 100)
        || (t.espaciadoSecciones !== undefined && Number(t.espaciadoSecciones) !== 100)
        || (t.espaciadoInterno !== undefined && Number(t.espaciadoInterno) !== 100);
      btnReset.hidden = !cambiado;
    }
    if (ft) ft.value = t.fuenteTitulos || preset.fuenteTitulos || 'Bebas Neue';
    if (fc) fc.value = t.fuenteCuerpo || preset.fuenteCuerpo || 'Montserrat';
  };

  const contenedorTemas = $('#temas-grid');
  if (contenedorTemas) {
    contenedorTemas.addEventListener('click', ev => {
      const card = ev.target.closest('.tema-card');
      if (!card) return;
      const id = card.dataset.tema;
      const preset = TEMAS[id];
      if (!preset) return;
      const t = docActivo().tema;
      t.preset = id;
      t.acento = preset.acento;
      t.colorTexto = '';
      t.colorPortada = '';
      t.colorFondo = '';
      t.colorSvg = '';
      t.opacidadSvg = 100;
      t.fuenteTitulos = preset.fuenteTitulos;
      t.fuenteCuerpo = preset.fuenteCuerpo;
      t.portada = preset.portada || 'editorial';
      t.decoracion = preset.decoracion || 'marco';
      t.estilo = preset.estilo || 'editorial';
      llenarTemaEditor();
      actualizarTemaEnVivo();
    });
  }

  const contenedorDecoraciones = $('#decoraciones-grid');
  if (contenedorDecoraciones) {
    contenedorDecoraciones.addEventListener('click', ev => {
      const btn = ev.target.closest('[data-decoracion]');
      if (!btn || !DECORACIONES[btn.dataset.decoracion]) return;
      docActivo().tema.decoracion = btn.dataset.decoracion;
      llenarTemaEditor();
      actualizarTemaEnVivo();
    });
  }

  const contenedorPortadas = $('#portadas-grid');
  if (contenedorPortadas) {
    contenedorPortadas.addEventListener('click', ev => {
      const btn = ev.target.closest('[data-portada]');
      if (!btn || !PORTADAS[btn.dataset.portada]) return;
      docActivo().tema.portada = btn.dataset.portada;
      llenarTemaEditor();
      actualizarTemaEnVivo();
    });
  }

  const contenedorEstilos = $('#estilos-grid');
  if (contenedorEstilos) {
    contenedorEstilos.addEventListener('click', ev => {
      const btn = ev.target.closest('[data-estilo]');
      if (!btn || !ESTILOS_BLOQUES[btn.dataset.estilo]) return;
      docActivo().tema.estilo = btn.dataset.estilo;
      llenarTemaEditor();
      actualizarTemaEnVivo();
    });
  }

  let plantillaPendiente = null;
  const dialogoPlantilla = $('#dialogo-plantilla');
  const aplicarPlantillaRubro = (id, soloDiseno = false) => {
    const tpl = PLANTILLAS[id];
    if (!tpl) return;
    const generada = normalizar(tpl.crear());
    if (soloDiseno) {
      estado.tema = { ...generada.tema };
      llenarTemaEditor();
      actualizarTemaEnVivo();
      avisar(`Diseño de «${tpl.nombre}» aplicado a tu propuesta.`);
    } else {
      // Si ya tenía sus propios datos de emisor guardados en Mi cuenta, los conserva
      if (perfil?.emisor && Object.values(perfil.emisor).some(Boolean)) {
        generada.emisor = { ...generada.emisor, ...perfil.emisor };
      }
      reemplazarEstado(generada);
      avisar(`Plantilla «${tpl.nombre}» cargada. Editá lo que quieras.`);
    }
    $$('.plantilla-chip').forEach(c => c.classList.toggle('plantilla-chip--activa', c.dataset.plantilla === id));
  };

  const contenedorPlantillas = $('#plantillas-grid');
  if (contenedorPlantillas) {
    contenedorPlantillas.addEventListener('click', ev => {
      const chip = ev.target.closest('[data-plantilla]');
      if (!chip) return;
      const id = chip.dataset.plantilla;
      const tpl = PLANTILLAS[id];
      if (!tpl) return;
      const tieneTextoPropio = estado.propuesta.titulo.trim() || estado.servicios.some(servicioConContenido);
      if (tieneTextoPropio && dialogoPlantilla && typeof dialogoPlantilla.showModal === 'function') {
        plantillaPendiente = id;
        $('#plantilla-modal-titulo').textContent = `Plantilla: ${tpl.nombre}`;
        $('#plantilla-modal-texto').textContent = `¿Querés cargar los textos y servicios de ejemplo de «${tpl.nombre}» o aplicar únicamente su diseño visual (tema, decoración y disposición) conservando lo que ya escribiste?`;
        dialogoPlantilla.showModal();
      } else {
        aplicarPlantillaRubro(id, false);
      }
    });
  }

  $('#plantilla-solo-diseno')?.addEventListener('click', () => {
    if (plantillaPendiente) aplicarPlantillaRubro(plantillaPendiente, true);
    plantillaPendiente = null;
    dialogoPlantilla?.close();
  });

  $('#plantilla-completa')?.addEventListener('click', () => {
    if (plantillaPendiente) aplicarPlantillaRubro(plantillaPendiente, false);
    plantillaPendiente = null;
    dialogoPlantilla?.close();
  });

  const actualizarVisibilidadResetTema = () => {
    const btnReset = $('#tema-restablecer-colores');
    if (!btnReset) return;
    const t = docActivo().tema;
    const preset = TEMAS[t.preset] || TEMAS['elegante-oscuro'];
    const cambiado = (t.acento && t.acento.toLowerCase() !== preset.acento.toLowerCase())
      || !!t.colorTexto
      || !!t.colorPortada
      || !!t.colorFondo
      || !!t.colorSvg
      || (t.opacidadSvg !== undefined && Number(t.opacidadSvg) !== 100)
      || (t.escalaTituloPortada !== undefined && Number(t.escalaTituloPortada) !== 100)
      || (t.escalaTitulos !== undefined && Number(t.escalaTitulos) !== 100)
      || (t.escalaTexto !== undefined && Number(t.escalaTexto) !== 100)
      || (t.espaciadoSecciones !== undefined && Number(t.espaciadoSecciones) !== 100)
      || (t.espaciadoInterno !== undefined && Number(t.espaciadoInterno) !== 100);
    btnReset.hidden = !cambiado;
  };

  const temaAcento = $('#tema-acento');
  if (temaAcento) {
    temaAcento.addEventListener('input', ev => {
      docActivo().tema.acento = ev.target.value;
      actualizarVisibilidadResetTema();
      actualizarTemaEnVivo();
    });
  }

  const temaColorTexto = $('#tema-color-texto');
  if (temaColorTexto) {
    temaColorTexto.addEventListener('input', ev => {
      docActivo().tema.colorTexto = ev.target.value;
      actualizarVisibilidadResetTema();
      actualizarTemaEnVivo();
    });
  }

  const temaColorPortada = $('#tema-color-portada');
  if (temaColorPortada) {
    temaColorPortada.addEventListener('input', ev => {
      docActivo().tema.colorPortada = ev.target.value;
      actualizarVisibilidadResetTema();
      actualizarTemaEnVivo();
    });
  }

  const temaColorFondo = $('#tema-color-fondo');
  if (temaColorFondo) {
    temaColorFondo.addEventListener('input', ev => {
      docActivo().tema.colorFondo = ev.target.value;
      actualizarVisibilidadResetTema();
      actualizarTemaEnVivo();
    });
  }

  const temaColorSvg = $('#tema-color-svg');
  if (temaColorSvg) {
    temaColorSvg.addEventListener('input', ev => {
      docActivo().tema.colorSvg = ev.target.value;
      actualizarVisibilidadResetTema();
      actualizarTemaEnVivo();
    });
  }

  const temaOpacidadSvg = $('#tema-opacidad-svg');
  if (temaOpacidadSvg) {
    temaOpacidadSvg.addEventListener('input', ev => {
      const valor = Number(ev.target.value);
      docActivo().tema.opacidadSvg = valor;
      const opacidadValor = $('#tema-opacidad-valor');
      if (opacidadValor) opacidadValor.textContent = `${valor}%`;
      actualizarVisibilidadResetTema();
      actualizarTemaEnVivo();
    });
  }

  const vincularRangoTema = (selector, selectorValor, propiedad) => {
    const el = $(selector);
    if (!el) return;
    el.addEventListener('input', ev => {
      if (invitado) invitadoEdito = true;
      const valor = Number(ev.target.value);
      const actual = docActivo();
      actual.tema[propiedad] = valor;
      const salida = $(selectorValor);
      if (salida) salida.textContent = `${valor}%`;
      const doc = $('#documento');
      if (doc) {
        doc.classList.add('doc--estatico');
        animacionInicialLista = true;
        aplicarEscalasTema(doc, actual.tema);
      }
      actualizarVisibilidadResetTema();
      guardarLuego();
    });
  };
  vincularRangoTema('#tema-escala-portada', '#tema-escala-portada-valor', 'escalaTituloPortada');
  vincularRangoTema('#tema-escala-titulos', '#tema-escala-titulos-valor', 'escalaTitulos');
  vincularRangoTema('#tema-escala-texto', '#tema-escala-texto-valor', 'escalaTexto');
  vincularRangoTema('#tema-espaciado-secciones', '#tema-espaciado-secciones-valor', 'espaciadoSecciones');
  vincularRangoTema('#tema-espaciado-interno', '#tema-espaciado-interno-valor', 'espaciadoInterno');

  const temaRestablecerColores = $('#tema-restablecer-colores');
  if (temaRestablecerColores) {
    temaRestablecerColores.addEventListener('click', () => {
      const t = docActivo().tema;
      const preset = TEMAS[t.preset] || TEMAS['elegante-oscuro'];
      t.acento = preset.acento;
      t.colorTexto = '';
      t.colorPortada = '';
      t.colorFondo = '';
      t.colorSvg = '';
      t.opacidadSvg = 100;
      t.escalaTituloPortada = 100;
      t.escalaTitulos = 100;
      t.escalaTexto = 100;
      t.espaciadoSecciones = 100;
      t.espaciadoInterno = 100;
      llenarTemaEditor();
      actualizarTemaEnVivo();
      avisar('Colores, tamaños de tipografía y espaciados restablecidos al tema original.');
    });
  }

  const temaFT = $('#tema-fuente-titulos');
  if (temaFT) {
    temaFT.addEventListener('change', ev => {
      docActivo().tema.fuenteTitulos = ev.target.value;
      actualizarTemaEnVivo();
    });
  }

  const temaFC = $('#tema-fuente-cuerpo');
  if (temaFC) {
    temaFC.addEventListener('change', ev => {
      docActivo().tema.fuenteCuerpo = ev.target.value;
      actualizarTemaEnVivo();
    });
  }

  const aplicarPlantillaPortafolio = (id, soloDiseno = false) => {
    const tpl = PLANTILLAS_PORTAFOLIO[id];
    if (!tpl) return;
    const generada = normalizarPf(tpl.crear());
    if (soloDiseno) {
      estadoPortafolio.tema = { ...generada.tema };
      llenarTemaEditor();
      actualizarTemaEnVivo();
      avisar(`Diseño de «${tpl.nombre}» aplicado a tu portfolio.`);
    } else {
      if (perfil?.emisor && Object.values(perfil.emisor).some(Boolean)) {
        generada.emisor = { ...generada.emisor, ...perfil.emisor };
      }
      estadoPortafolio = generada;
      llenarFormulario();
      actualizar();
      avisar(`Plantilla de portfolio «${tpl.nombre}» cargada.`);
    }
    $$('[data-plantilla-portafolio]').forEach(c => c.classList.toggle('plantilla-chip--activa', c.dataset.plantillaPortafolio === id));
  };

  const contenedorPlantillasPf = $('#plantillas-portafolio-grid');
  if (contenedorPlantillasPf) {
    contenedorPlantillasPf.addEventListener('click', ev => {
      const chip = ev.target.closest('[data-plantilla-portafolio]');
      if (!chip) return;
      const id = chip.dataset.plantillaPortafolio;
      if (!PLANTILLAS_PORTAFOLIO[id]) return;
      aplicarPlantillaPortafolio(id, false);
    });
  }

  const dialogo = $('#dialogo');
  const confirmar = ({ titulo, texto: cuerpo, aceptar }) => {
    if (typeof dialogo.showModal !== 'function') return Promise.resolve(true);
    $('#dialogo-titulo').textContent = titulo;
    $('#dialogo-texto').textContent = cuerpo;
    $('#dialogo-confirmar').textContent = aceptar;
    dialogo.returnValue = '';
    dialogo.showModal();
    return new Promise(res => dialogo.addEventListener('close', () => res(dialogo.returnValue === 'aceptar'), { once: true }));
  };

  const reemplazarEstado = nuevo => {
    estado = nuevo;
    seleccion = new Set();
    llenarFormulario();
    actualizar();
  };

  const nombreArchivo = () => {
    const base = modoEditor === 'portafolio'
      ? [estadoPortafolio.portafolio.nombreInterno || estadoPortafolio.portafolio.titulo, estadoPortafolio.emisor.nombre].map(x => texto(x).trim()).filter(Boolean).join(' ')
      : [estado.propuesta.numero, estado.cliente.empresa || estado.cliente.nombre].map(x => texto(x).trim()).filter(Boolean).join(' ');
    return (base || (modoEditor === 'portafolio' ? 'portfolio' : 'propuesta')).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
  };

  const guardarBorrador = () => {
    const actual = docActivo();
    const payload = modoEditor === 'portafolio' ? { tipo: 'portafolio', version: 1, ...actual } : { version: 1, ...actual };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `${nombreArchivo()}.json`;
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    avisar('Borrador guardado. Abrilo cuando quieras con «Abrir borrador».');
  };

  const campoBorrador = $('#campo-borrador');
  campoBorrador.addEventListener('change', () => {
    const archivo = campoBorrador.files[0];
    campoBorrador.value = '';
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      try {
        const crudo = JSON.parse(lector.result);
        if (crudo && (crudo.tipo === 'portafolio' || crudo.portafolio)) {
          nuevoPortafolio(normalizarPf(crudo));
          avisar('Portfolio abierto desde archivo.');
          return;
        }
        const abierto = normalizar(crudo);
        if (nube()) {
          // Con cuenta, el borrador entra como propuesta nueva: no pisa ninguna existente.
          nuevaPropuesta(abierto);
          avisar('Borrador abierto como propuesta nueva.');
        } else {
          modoEditor = 'propuesta';
          reemplazarEstado(abierto);
          avisar('Borrador abierto.');
        }
      } catch {
        avisar('Ese archivo no es un borrador válido. Elegí un .json guardado desde este generador.');
      }
    };
    lector.onerror = () => avisar('No se pudo leer el archivo. Probá de nuevo.');
    lector.readAsText(archivo);
  });

  const esLogoValido = logo => /^data:image\//.test(logo)
    || (!!AteneaDB?.logos && logo.startsWith(AteneaDB.logos.prefijoURL));

  const subiendoLogo = estaSubiendo => {
    $('#logo-texto').textContent = estaSubiendo ? 'Subiendo logo…' : (docActivo().emisor.logo ? 'Cambiar logo' : 'Subir logo');
    campoLogo.disabled = estaSubiendo;
  };

  const campoLogo = $('#campo-logo');
  campoLogo.addEventListener('change', async () => {
    const archivo = campoLogo.files[0];
    campoLogo.value = '';
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      avisar('El logo tiene que ser una imagen PNG, JPG, SVG o WebP.');
      return;
    }
    if (archivo.size > LOGO_MAX_ARCHIVO) {
      avisar('El logo supera los 25 MB. Elegí un archivo más liviano.');
      return;
    }
    const db = nube();
    const id = propuestaId;
    let logo;
    subiendoLogo(true);
    try {
      if (db) {
        try {
          logo = await db.logos.subir(await logoParaSubir(archivo));
        } catch (e) {
          // Sin conexión o sin Storage: el logo queda dentro de la propuesta y
          // se sube solo la próxima vez que se abra.
          console.error('No se pudo subir el logo:', e);
          logo = await reducirLogo(archivo);
          avisar('No se pudo subir el logo a tu cuenta, así que quedó guardado dentro de la propuesta.', 6000);
        }
      } else {
        logo = await reducirLogo(archivo);
      }
    } catch {
      avisar('No se pudo leer la imagen. Probá con otra.');
    }
    if (logo && propuestaId === id) {
      docActivo().emisor.logo = logo;
      actualizarLogo();
      actualizar();
    }
    subiendoLogo(false);
  });

  // Logos guardados dentro de la propuesta (versiones anteriores o subidas fallidas)
  // se pasan a Storage al abrirla. Si falla, se reintenta la próxima vez.
  const migrarLogo = async () => {
    const id = propuestaId;
    const logo = estado.emisor.logo;
    if (!nube() || !id || !logo.startsWith('data:')) return;
    try {
      const blob = await (await fetch(logo)).blob();
      const url = await AteneaDB.logos.subir(/^image\/(png|jpeg|webp)$/.test(blob.type) ? blob : await logoParaSubir(blob));
      if (propuestaId !== id || estado.emisor.logo !== logo) return;
      estado.emisor.logo = url;
      actualizarLogo();
      actualizar();
    } catch (e) {
      console.warn('No se pudo pasar el logo a Storage:', e);
    }
  };


  const subirOComprimirFoto = async (archivo, dims = {}) => {
    if (!archivo || !archivo.type.startsWith('image/')) {
      avisar('Elegí una imagen en formato PNG, JPG o WebP.');
      return '';
    }
    if (archivo.size > FOTO_MAX_ARCHIVO) {
      avisar('La imagen supera los 50 MB. Probá con un archivo de hasta 50 MB.');
      return '';
    }
    const db = nube();
    if (db && db.logos) {
      try {
        return await db.logos.subir(await procesarImagenProyecto(archivo, true, dims));
      } catch {
        return procesarImagenProyecto(archivo, false, dims);
      }
    }
    return procesarImagenProyecto(archivo, false, dims);
  };

  // Foto de perfil / equipo en Paso 1
  const campoFotoEmisor = $('#campo-foto-emisor');
  if (campoFotoEmisor) {
    campoFotoEmisor.addEventListener('change', async () => {
      const archivo = campoFotoEmisor.files?.[0];
      campoFotoEmisor.value = '';
      if (!archivo) return;
      if ($('#foto-emisor-texto')) $('#foto-emisor-texto').textContent = 'Subiendo…';
      campoFotoEmisor.disabled = true;
      try {
        const url = await subirOComprimirFoto(archivo, { anchoMax: 480, altoMax: 480 });
        if (url) {
          docActivo().emisor.foto = url;
          actualizarLogo();
          actualizar();
        }
      } catch {
        avisar('No se pudo cargar la foto.');
      } finally {
        campoFotoEmisor.disabled = false;
        actualizarLogo();
      }
    });
  }

  // Foto de portada Hero (Propuesta)
  const campoPortadaProp = $('#campo-portada-prop');
  if (campoPortadaProp) {
    campoPortadaProp.addEventListener('change', async () => {
      const archivo = campoPortadaProp.files?.[0];
      campoPortadaProp.value = '';
      if (!archivo) return;
      if ($('#portada-prop-texto')) $('#portada-prop-texto').textContent = 'Subiendo…';
      campoPortadaProp.disabled = true;
      try {
        const url = await subirOComprimirFoto(archivo, { anchoMax: 1920, altoMax: 1080, calidad: 0.88 });
        if (url) {
          estado.propuesta.imagenPortada = url;
          actualizarLogo();
          actualizar();
        }
      } catch {
        avisar('No se pudo cargar la foto de portada.');
      } finally {
        campoPortadaProp.disabled = false;
        actualizarLogo();
      }
    });
  }

  // Foto de portada Hero (Portfolio)
  const campoPortadaPf = $('#campo-portada-pf');
  if (campoPortadaPf) {
    campoPortadaPf.addEventListener('change', async () => {
      const archivo = campoPortadaPf.files?.[0];
      campoPortadaPf.value = '';
      if (!archivo) return;
      if ($('#portada-pf-texto')) $('#portada-pf-texto').textContent = 'Subiendo…';
      campoPortadaPf.disabled = true;
      try {
        const url = await subirOComprimirFoto(archivo, { anchoMax: 1920, altoMax: 1080, calidad: 0.88 });
        if (url) {
          estadoPortafolio.portafolio.imagenPortada = url;
          actualizarLogo();
          actualizar();
        }
      } catch {
        avisar('No se pudo cargar la foto de portada.');
      } finally {
        campoPortadaPf.disabled = false;
        actualizarLogo();
      }
    });
  }

  // Subida de imágenes en listas (proyectos, galería múltiple por proyecto, galería libre, servicios, testimonios)
  formulario.addEventListener('change', async ev => {
    // 1) Portada principal de un proyecto
    const inputImg = ev.target.closest('[data-pf-img-input]');
    if (inputImg) {
      const archivo = inputImg.files?.[0];
      inputImg.value = '';
      if (!archivo) return;
      const nodo = inputImg.closest('[data-indice-pf]');
      if (!nodo) return;
      const idx = Number(nodo.dataset.indicePf);
      const proyecto = estadoPortafolio.proyectos[idx];
      if (!proyecto) return;
      const txt = $('[data-pf-img-texto]', nodo);
      if (txt) txt.textContent = 'Subiendo…';
      inputImg.disabled = true;
      try {
        const urlImg = await subirOComprimirFoto(archivo);
        if (urlImg && estadoPortafolio.proyectos[idx] === proyecto) {
          proyecto.imagen = urlImg;
          actualizarImagenProyectoItem(nodo, proyecto);
          actualizar();
        }
      } catch {
        avisar('No se pudo cargar la imagen. Probá con otra.');
      } finally {
        inputImg.disabled = false;
        if (estadoPortafolio.proyectos[idx] === proyecto) actualizarImagenProyectoItem(nodo, proyecto);
      }
      return;
    }

    // 2) Galería adicional de un proyecto (múltiples fotos)
    const inputGalProy = ev.target.closest('[data-pf-galeria-input]');
    if (inputGalProy) {
      const archivos = [...(inputGalProy.files || [])];
      inputGalProy.value = '';
      if (!archivos.length) return;
      const nodo = inputGalProy.closest('[data-indice-pf]');
      if (!nodo) return;
      const idx = Number(nodo.dataset.indicePf);
      const proyecto = estadoPortafolio.proyectos[idx];
      if (!proyecto) return;
      proyecto.galeria = Array.isArray(proyecto.galeria) ? proyecto.galeria : [];
      const cupo = Math.max(0, 8 - proyecto.galeria.length);
      if (!cupo) {
        avisar('Cada proyecto admite hasta 8 fotos adicionales.');
        return;
      }
      inputGalProy.disabled = true;
      try {
        for (const arch of archivos.slice(0, cupo)) {
          const u = await subirOComprimirFoto(arch);
          if (u) proyecto.galeria.push(u);
        }
        actualizarImagenProyectoItem(nodo, proyecto);
        actualizar();
      } finally {
        inputGalProy.disabled = false;
      }
      return;
    }

    // 3) Foto individual en Galería Libre (Propuesta o Portfolio)
    const inputGal = ev.target.closest('[data-gal-img-input]');
    if (inputGal) {
      const archivo = inputGal.files?.[0];
      inputGal.value = '';
      if (!archivo) return;
      const nodoPf = inputGal.closest('[data-indice-pf]');
      const nodoProp = inputGal.closest('[data-indice]');
      const esPf = !!nodoPf;
      const nodo = nodoPf || nodoProp;
      if (!nodo) return;
      const idx = Number(esPf ? nodo.dataset.indicePf : nodo.dataset.indice);
      const item = (esPf ? estadoPortafolio.galeria : estado.galeria)?.[idx];
      if (!item) return;
      const txt = $('[data-gal-img-texto]', nodo);
      if (txt) txt.textContent = 'Subiendo…';
      inputGal.disabled = true;
      try {
        const urlImg = await subirOComprimirFoto(archivo);
        if (urlImg) {
          item.imagen = urlImg;
          actualizarImagenGenericaItem(nodo, item.imagen, 'data-gal-img');
          actualizar();
        }
      } finally {
        inputGal.disabled = false;
        actualizarImagenGenericaItem(nodo, item.imagen, 'data-gal-img');
      }
      return;
    }

    // 4) Subida masiva de varias fotos a la Galería Libre
    const inputMultiGal = ev.target.closest('[data-galeria-multi]');
    if (inputMultiGal) {
      const archivos = [...(inputMultiGal.files || [])];
      inputMultiGal.value = '';
      if (!archivos.length) return;
      const esPf = inputMultiGal.dataset.galeriaMulti === 'portafolio';
      const destino = esPf ? estadoPortafolio : estado;
      const conf = esPf ? LISTAS_PORTAFOLIO.galeria : LISTAS.galeria;
      inputMultiGal.disabled = true;
      try {
        for (const arch of archivos.slice(0, 12)) {
          const u = await subirOComprimirFoto(arch);
          if (u) {
            const nuevoItem = conf.nuevo();
            nuevoItem.imagen = u;
            nuevoItem.proporcion = destino.opciones?.galeriaProporcion || 'panoramica';
            destino.galeria.push(nuevoItem);
          }
        }
        if (esPf) renderListaPortafolio('galeria');
        else renderLista('galeria');
        actualizar();
        avisar(`${archivos.length === 1 ? 'Foto agregada' : 'Fotos agregadas'} a la galería.`);
      } finally {
        inputMultiGal.disabled = false;
      }
      return;
    }

    // 5) Foto de un Servicio en Propuesta
    const inputSrv = ev.target.closest('[data-srv-img-input]');
    if (inputSrv) {
      const archivo = inputSrv.files?.[0];
      inputSrv.value = '';
      if (!archivo) return;
      const nodo = inputSrv.closest('[data-indice]');
      if (!nodo) return;
      const item = estado.servicios[Number(nodo.dataset.indice)];
      if (!item) return;
      const txt = $('[data-srv-img-texto]', nodo);
      if (txt) txt.textContent = 'Subiendo…';
      inputSrv.disabled = true;
      try {
        const u = await subirOComprimirFoto(archivo);
        if (u) {
          item.imagen = u;
          actualizarImagenGenericaItem(nodo, item.imagen, 'data-srv-img');
          actualizar();
        }
      } finally {
        inputSrv.disabled = false;
        actualizarImagenGenericaItem(nodo, item.imagen, 'data-srv-img');
      }
      return;
    }

    // 6) Foto de un Servicio Web en Portfolio
    const inputSweb = ev.target.closest('[data-sweb-img-input]');
    if (inputSweb) {
      const archivo = inputSweb.files?.[0];
      inputSweb.value = '';
      if (!archivo) return;
      const nodo = inputSweb.closest('[data-indice-pf]');
      if (!nodo) return;
      const item = estadoPortafolio.serviciosWeb[Number(nodo.dataset.indicePf)];
      if (!item) return;
      const txt = $('[data-sweb-img-texto]', nodo);
      if (txt) txt.textContent = 'Subiendo…';
      inputSweb.disabled = true;
      try {
        const u = await subirOComprimirFoto(archivo);
        if (u) {
          item.imagen = u;
          actualizarImagenGenericaItem(nodo, item.imagen, 'data-sweb-img');
          actualizar();
        }
      } finally {
        inputSweb.disabled = false;
        actualizarImagenGenericaItem(nodo, item.imagen, 'data-sweb-img');
      }
      return;
    }

    // 7) Avatar de un Testimonio
    const inputTest = ev.target.closest('[data-test-img-input]');
    if (inputTest) {
      const archivo = inputTest.files?.[0];
      inputTest.value = '';
      if (!archivo) return;
      const nodoPf = inputTest.closest('[data-indice-pf]');
      const nodoProp = inputTest.closest('[data-indice]');
      const esPf = !!nodoPf;
      const nodo = nodoPf || nodoProp;
      if (!nodo) return;
      const idx = Number(esPf ? nodo.dataset.indicePf : nodo.dataset.indice);
      const item = (esPf ? estadoPortafolio.testimonios : estado.testimonios)?.[idx];
      if (!item) return;
      const txt = $('[data-test-img-texto]', nodo);
      if (txt) txt.textContent = 'Subiendo…';
      inputTest.disabled = true;
      try {
        const u = await subirOComprimirFoto(archivo, { anchoMax: 320, altoMax: 320 });
        if (u) {
          item.avatar = u;
          actualizarImagenGenericaItem(nodo, item.avatar, 'data-test-img');
          actualizar();
        }
      } finally {
        inputTest.disabled = false;
        actualizarImagenGenericaItem(nodo, item.avatar, 'data-test-img');
      }
    }
  });

  const datosParaLink = () => {
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

  let linkActual = '';

  const linkCorto = id => `${location.origin}/p/${id}`;
  const linkCortoPortafolio = id => `${location.origin}/portafolio/${id}`;

  // Activa el link corto: la propuesta pasa a ser legible por quien tenga el link
  // y, si era un borrador, queda como enviada. Devuelve true si el servidor lo
  // confirmó, false si falló y null si todavía no hay respuesta (sin conexión).
  const activarLink = async () => {
    if (hayCambiosSinEnviar()) guardarAhora();
    const actual = propuestas.find(p => p.id === propuestaId);
    const cambios = { publico: true };
    if (!actual || !actual.status || actual.status === 'draft') cambios.status = 'sent';
    if (actual?.publico && !cambios.status) return true;
    const escritura = registrarEscritura(
      AteneaDB.proposals.actualizar(propuestaId, cambios),
      'No se pudo activar el link de la propuesta. Revisá tu conexión y probá de nuevo.'
    );
    return Promise.race([escritura, new Promise(res => setTimeout(() => res(null), 4000))]);
  };

  const abrirCompartirPortafolio = async () => {
    const tieneProyectos = estadoPortafolio.portafolio.titulo.trim() || estadoPortafolio.proyectos.some(proyectoConContenido);
    if (!tieneProyectos) {
      avisar('Cargá al menos el título y un proyecto antes de compartir tu portfolio.');
      return;
    }
    if (hayCambiosSinEnviar()) guardarAhora();
    const conCuenta = !!(nube() && AteneaDB?.portfolios && portafolioId && /^[A-Za-z0-9]{20}$/.test(portafolioId));
    const avisos = [];
    if (conCuenta) {
      const escritura = registrarEscritura(
        AteneaDB.portfolios.actualizar(portafolioId, { publico: true }),
        'No se pudo activar el link del portfolio.'
      );
      const activado = await Promise.race([escritura, new Promise(res => setTimeout(() => res(null), 4000))]);
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
        avisar('No se pudo generar el link del portfolio.');
        return;
      }
    }
    $('#compartir-titulo').textContent = 'Tu portfolio está listo para compartir';
    $('#enlace-propuesta').value = linkActual;
    $('#compartir-abrir').href = linkActual;
    const msg = `Hola! Te comparto mi portfolio «${tituloPortafolio()}» con una selección de proyectos y casos: ${linkActual}`;
    $('#compartir-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    $('#compartir-nativo').hidden = typeof navigator.share !== 'function';
    $('#compartir-desactivar').hidden = !conCuenta;
    $('#compartir-nota').textContent = conCuenta
      ? 'El link muestra siempre la última versión de este portfolio.'
      : 'Este link incluye tu portfolio comprimido listo para abrir.';
    const elAvisoCompartir = $('#compartir-aviso');
    elAvisoCompartir.hidden = !avisos.length;
    elAvisoCompartir.textContent = avisos.join(' ');
    $('#dialogo-compartir').showModal();
  };

  const abrirCompartir = async () => {
    if (modoEditor === 'portafolio') return abrirCompartirPortafolio();
    $('#compartir-titulo').textContent = 'Tu propuesta está lista para mandar';
    const tieneContenido = estado.propuesta.titulo.trim() || estado.servicios.some(servicioConContenido);
    if (!tieneContenido) {
      avisar('Cargá al menos el título y un servicio antes de compartir la propuesta.');
      return;
    }
    const conCuenta = !!(nube() && propuestaId);
    const avisos = [];
    if (conCuenta) {
      const activado = await activarLink();
      if (activado === false) return;
      if (activado === null) avisos.push('Estás sin conexión: el link empieza a funcionar en cuanto vuelva.');
      linkActual = linkCorto(propuestaId);
    } else {
      const { datos, logoOmitido } = datosParaLink();
      try {
        linkActual = `${location.origin}${location.pathname}${PREFIJO}${await comprimir(JSON.stringify(datos))}`;
      } catch {
        avisar('No se pudo generar el link. Probá de nuevo.');
        return;
      }
      if (location.protocol === 'file:') avisos.push('Estás usando el generador desde un archivo de tu compu, así que este link solo abre acá. Publicá el generador en una web (Vercel, Netlify, tu hosting) y el link le va a funcionar a cualquiera.');
      if (logoOmitido) avisos.push('Tu logo es demasiado pesado para viajar en el link, así que no se incluye. Probá con un SVG o un PNG más simple.');
    }
    $('#enlace-propuesta').value = linkActual;
    $('#compartir-abrir').href = linkActual;
    const saludo = estado.cliente.nombre.trim() ? `Hola ${estado.cliente.nombre.trim().split(' ')[0]}!` : 'Hola!';
    const mensaje = `${saludo} Te comparto la propuesta${estado.propuesta.titulo.trim() ? ` «${estado.propuesta.titulo.trim()}»` : ''}. Desde el link podés ver todo el detalle, sumar opcionales y aceptarla: ${linkActual}`;
    $('#compartir-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    $('#compartir-nativo').hidden = typeof navigator.share !== 'function';
    $('#compartir-desactivar').hidden = !conCuenta;
    $('#compartir-nota').textContent = conCuenta
      ? 'El link muestra siempre la última versión: si cambiás algo, tu cliente lo ve la próxima vez que lo abra.'
      : 'Cada link guarda la propuesta tal como está ahora. Si después cambiás algo, generá uno nuevo y mandá ese.';
    if (!digitosWhatsApp() && !estado.emisor.email.trim()) avisos.push('No cargaste WhatsApp ni email: tu cliente va a poder aceptar, pero solo copiando el mensaje de confirmación.');
    const elAvisoCompartir = $('#compartir-aviso');
    elAvisoCompartir.hidden = !avisos.length;
    elAvisoCompartir.textContent = avisos.join(' ');
    $('#dialogo-compartir').showModal();
  };

  const desactivarLink = async () => {
    const id = propuestaId;
    if (!id) return;
    const ok = await confirmar({
      titulo: '¿Desactivar el link?',
      texto: 'Quien tenga el link ya no va a poder ver la propuesta. Si más adelante la volvés a compartir, se reactiva el mismo link.',
      aceptar: 'Desactivar link'
    });
    if (!ok) return;
    $('#dialogo-compartir').close();
    const desactivado = await registrarEscritura(
      AteneaDB.proposals.actualizar(id, { publico: false }),
      'No se pudo desactivar el link. Revisá tu conexión y probá de nuevo.'
    );
    if (desactivado) avisar('Link desactivado.');
  };

  const copiar = async contenido => {
    try {
      await navigator.clipboard.writeText(contenido);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = contenido;
      area.setAttribute('readonly', '');
      area.className = 'visualmente-oculto';
      document.body.append(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    }
  };

  const mensajeAceptacion = (firma = estado.cliente.nombre.trim()) => {
    const c = calcular();
    const m = estado.inversion.moneda;
    const sumados = estado.servicios.filter(s => s.opcional && seleccion.has(s.id) && servicioConContenido(s)).map(s => s.nombre.trim());
    const emisor = nombreEmisor();
    const lineasMsg = [`Hola${emisor ? ` ${emisor.split(' ')[0]}` : ''}! Acepto la propuesta${estado.propuesta.numero.trim() ? ` ${estado.propuesta.numero.trim()}` : ''} «${tituloPropuesta()}».`];
    if (c.inicial.total > 0) lineasMsg.push(`${c.mensual.base > 0 ? 'Inversión inicial' : 'Inversión total'}: ${dinero(c.inicial.total, m)}`);
    if (c.mensual.total > 0) lineasMsg.push(`Servicio mensual: ${dinero(c.mensual.total, m)} por mes`);
    if (sumados.length) lineasMsg.push(`Sumé: ${sumados.join(', ')}.`);
    if (firma) lineasMsg.push(firma);
    return { texto: lineasMsg.join('\n'), c, sumados };
  };

  // Llama a una función de /api. Si hay sesión, se identifica (así no cuentan las visitas
  // propias ni se puede aceptar la propuesta de uno mismo).
  const llamarApi = async (ruta, cuerpo, { keepalive = false } = {}) => {
    const token = AteneaDB ? await AteneaDB.auth.tokenDeSesion().catch(() => null) : null;
    const respuesta = await fetch(ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(cuerpo),
      keepalive
    });
    if (!respuesta.ok) {
      const codigo = await respuesta.json().then(r => r.error).catch(() => null);
      throw Object.assign(new Error(codigo || `HTTP ${respuesta.status}`), { codigo, estado: respuesta.status });
    }
    return respuesta.status === 204 ? null : respuesta.json();
  };

  // Una visita cada media hora por navegador: recargar la página no suma visitas.
  const VISITA_INTERVALO = 30 * 60 * 1000;
  const registrarVisita = id => {
    const clave = `${CLAVE}:visto:${id}`;
    try {
      if (Date.now() - Number(localStorage.getItem(clave) || 0) < VISITA_INTERVALO) return;
      localStorage.setItem(clave, String(Date.now()));
    } catch {}
    llamarApi('/api/visto', { id }, { keepalive: true }).catch(e => console.warn('No se pudo registrar la visita:', e));
  };

  const dialogoAceptar = $('#dialogo-aceptar');
  const campoAceptarNombre = $('#aceptar-nombre');
  const casillaConformidad = $('#aceptar-conformidad');
  const botonConfirmarAceptacion = $('#aceptar-confirmar');
  const errorAceptacion = $('#aceptar-error');

  const llenarResumenAceptacion = () => {
    const { c, sumados } = mensajeAceptacion();
    const m = estado.inversion.moneda;
    const filas = [];
    if (c.inicial.total > 0) filas.push([c.mensual.base > 0 ? 'Inversión inicial' : 'Inversión total', dinero(c.inicial.total, m)]);
    if (c.mensual.total > 0) filas.push(['Servicio mensual', `${dinero(c.mensual.total, m)} por mes`]);
    if (sumados.length) filas.push(['Sumaste', sumados.join(', ')]);
    $('#aceptar-resumen').innerHTML = filas.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('');
    $('#aceptar-resumen').hidden = !filas.length;
  };

  // Configura los botones que abren WhatsApp o el email con el mensaje. Devuelve si hay alguno.
  const prepararMensajeria = (mensaje, { whatsapp, email }) => {
    const wa = enlaceWhatsApp(mensaje);
    const mail = enlaceEmail(`Acepto la propuesta ${estado.propuesta.numero.trim() || tituloPropuesta()}`.trim(), mensaje);
    const elWa = $('#aceptar-whatsapp');
    const elMail = $('#aceptar-email');
    elWa.hidden = !wa;
    elMail.hidden = !mail;
    if (wa) elWa.href = wa;
    if (mail) elMail.href = mail;
    elWa.textContent = whatsapp;
    elMail.textContent = email;
    return !!(wa || mail);
  };

  // 'mensaje': link largo, se confirma por WhatsApp o email. 'formulario': link corto,
  // se acepta con nombre y casilla. 'listo': aceptación registrada.
  const modoAceptar = modo => {
    $('#aceptar-formulario').hidden = modo !== 'formulario';
    botonConfirmarAceptacion.hidden = modo !== 'formulario';
    if (modo === 'formulario') ['#aceptar-whatsapp', '#aceptar-email', '#aceptar-copiar'].forEach(sel => { $(sel).hidden = true; });
    $('#aceptar-titulo').textContent = modo === 'listo' ? '¡Propuesta aceptada!' : 'Confirmar la propuesta';
    $('#aceptar-cerrar').textContent = modo === 'listo' ? 'Cerrar' : 'Volver a la propuesta';
  };

  const actualizarBotonAceptar = () => {
    botonConfirmarAceptacion.disabled = limpiarNombre(campoAceptarNombre.value).length < NOMBRE_MIN || !casillaConformidad.checked;
  };
  campoAceptarNombre.addEventListener('input', actualizarBotonAceptar);
  casillaConformidad.addEventListener('change', actualizarBotonAceptar);

  const abrirAceptar = () => {
    if (!esCliente) {
      avisar('Así lo ve tu cliente. En el link, este botón le permite aceptar la propuesta.');
      return;
    }
    if (aceptada()) return;
    llenarResumenAceptacion();
    const emisor = nombreEmisor();
    if (compartida) {
      modoAceptar('formulario');
      errorAceptacion.hidden = true;
      if (!campoAceptarNombre.value) campoAceptarNombre.value = estado.cliente.nombre.trim();
      casillaConformidad.checked = false;
      actualizarBotonAceptar();
      $('#aceptar-texto').textContent = `${emisor || 'Quien te mandó la propuesta'} va a ver tu aceptación al instante. Queda registrado tu nombre, la fecha y lo que elegiste.`;
    } else {
      modoAceptar('mensaje');
      const hay = prepararMensajeria(mensajeAceptacion().texto, { whatsapp: 'Confirmar por WhatsApp', email: 'Confirmar por email' });
      $('#aceptar-copiar').hidden = hay;
      $('#aceptar-texto').textContent = hay
        ? `Se abre un mensaje${emisor ? ` para ${emisor}` : ''} con este resumen, listo para enviar.`
        : `Copiá el mensaje y mandáselo${emisor ? ` a ${emisor}` : ''} por donde suelan hablar.`;
    }
    dialogoAceptar.showModal();
  };

  botonConfirmarAceptacion.addEventListener('click', async () => {
    const nombre = limpiarNombre(campoAceptarNombre.value);
    botonConfirmarAceptacion.disabled = true;
    botonConfirmarAceptacion.textContent = 'Aceptando…';
    errorAceptacion.hidden = true;
    try {
      const { aceptacion } = await llamarApi('/api/aceptar', { id: compartida.id, nombre, acepto: true, opcionales: [...seleccion] });
      compartida.aceptacion = aceptacion;
      renderDocumento();
      modoAceptar('listo');
      const emisor = nombreEmisor();
      const hay = prepararMensajeria(mensajeAceptacion(nombre).texto, { whatsapp: 'Avisar por WhatsApp', email: 'Avisar por email' });
      $('#aceptar-texto').textContent = `Listo, ${nombre.split(' ')[0]}. ${emisor || 'Quien te mandó la propuesta'} ya puede ver tu aceptación.${hay ? ' Si querés, avisale también por mensaje.' : ''}`;
    } catch (e) {
      console.error('No se pudo aceptar la propuesta:', e);
      errorAceptacion.textContent = MENSAJES_ACEPTACION[e.codigo] || 'No pudimos registrar tu aceptación. Revisá tu conexión y probá de nuevo.';
      errorAceptacion.hidden = false;
    } finally {
      botonConfirmarAceptacion.textContent = 'Aceptar propuesta';
      actualizarBotonAceptar();
    }
  });

  const app = $('#app');
  const cambiarPestana = previa => {
    app.classList.toggle('app--previa', previa);
    $$('.pestana').forEach(t => t.setAttribute('aria-selected', String((t.dataset.accion === 'ver-previa') === previa)));
  };

  const cambiarVista = nueva => {
    vista = nueva;
    const escenario = $('#escenario');
    ['escritorio', 'celular', 'pdf'].forEach(v => escenario.classList.toggle(`visor__escenario--${v}`, v === nueva));
    $$('.segmento').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.vista === nueva)));
    $('#visor-nota').textContent = nueva === 'pdf'
      ? 'Versión para imprimir. Los saltos de página se ajustan solos.'
      : 'Así ve tu cliente la propuesta cuando abre el link.';
    renderDocumento();
  };

  const botonMenu = $('[data-accion="menu"]');
  const panelMenu = $('#menu-panel');
  const veloMenu = $('#menu-velo');
  const abrirMenu = abrir => {
    if (!panelMenu || !botonMenu) return;
    panelMenu.hidden = !abrir;
    if (veloMenu) veloMenu.hidden = !abrir;
    botonMenu.setAttribute('aria-expanded', String(abrir));
    document.body.classList.toggle('menu-abierto', abrir);
  };


  document.addEventListener('click', ev => {
    if (!panelMenu.hidden && !ev.target.closest('#menu-panel') && !ev.target.closest('[data-accion="menu"]')) abrirMenu(false);
    const linkScroll = ev.target.closest('[data-scroll-interno]');
    if (linkScroll) {
      ev.preventDefault();
      const destinoId = (linkScroll.getAttribute('href') || '').replace(/^#/, '');
      const elDestino = destinoId ? document.getElementById(destinoId) : null;
      if (elDestino) elDestino.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const nodoLb = ev.target.closest('[data-lightbox-src]');
    if (nodoLb && !ev.target.closest('a[href]')) {
      ev.preventDefault();
      abrirLightboxDesdeNodo(nodoLb);
      return;
    }
    const enlaceCliente = ev.target.closest('[data-enlace-cliente]');
    if (enlaceCliente && !esCliente) {
      ev.preventDefault();
      avisar('Así lo ve tu cliente. En el link, este enlace le abre una conversación con vos.');
    }
  });

  document.addEventListener('keydown', ev => {
    if (estaAbiertoLightbox()) {
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); moverLightbox(-1); return; }
      if (ev.key === 'ArrowRight') { ev.preventDefault(); moverLightbox(1); return; }
    }
    if (ev.key === 'Escape' && !panelMenu.hidden) {
      abrirMenu(false);
      botonMenu.focus();
    }
  });

  window.addEventListener('beforeprint', () => {
    imprimiendo = true;
    renderDocumento();
  });

  window.addEventListener('afterprint', () => {
    imprimiendo = false;
    renderDocumento();
  });

  const descargarPDF = () => {
    const tituloOriginal = document.title;
    document.title = nombreArchivo();
    window.addEventListener('afterprint', () => { document.title = tituloOriginal; }, { once: true });
    avisar('Elegí «Guardar como PDF» como destino y desactivá «Encabezados y pies de página».', 7000);
    setTimeout(() => window.print(), 350);
  };

  const enfocarUltimo = nombre => {
    const ultimo = $(`.lista[data-lista="${nombre}"] > :last-child`);
    const campo = ultimo && $('input, textarea', ultimo);
    if (campo) campo.focus();
  };

  document.addEventListener('click', async ev => {
    const boton = ev.target.closest('[data-accion]');
    if (!boton) return;
    const accion = boton.dataset.accion;

    if (accion === 'menu') {
      abrirMenu(panelMenu.hidden);
      return;
    }
    if (accion === 'cerrar-menu') {
      abrirMenu(false);
      return;
    }
    if (boton.closest('#menu-panel')) abrirMenu(false);

    if (['subir', 'bajar', 'quitar'].includes(accion)) {
      const nodoPf = boton.closest('[data-indice-pf]');
      if (nodoPf) {
        const nombrePf = boton.closest('.lista').dataset.listaPf;
        const arrPf = obtener(estadoPortafolio, LISTAS_PORTAFOLIO[nombrePf].ruta);
        const i = Number(nodoPf.dataset.indicePf);
        const j = accion === 'subir' ? i - 1 : i + 1;
        if (accion === 'quitar') arrPf.splice(i, 1);
        else {
          if (j < 0 || j >= arrPf.length) return;
          [arrPf[i], arrPf[j]] = [arrPf[j], arrPf[i]];
        }
        renderListaPortafolio(nombrePf);
        actualizar();
        return;
      }
      const nodo = boton.closest('[data-indice]');
      const nombre = boton.closest('.lista').dataset.lista;
      const arr = obtener(estado, LISTAS[nombre].ruta);
      const i = Number(nodo.dataset.indice);
      const j = accion === 'subir' ? i - 1 : i + 1;
      if (accion === 'quitar') arr.splice(i, 1);
      else {
        if (j < 0 || j >= arr.length) return;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      renderLista(nombre);
      if (accion !== 'quitar') {
        const destino = $(`.lista[data-lista="${nombre}"] > [data-indice="${j}"] [data-accion="${accion}"]`);
        if (destino && !destino.disabled) destino.focus();
      }
      actualizar();
      return;
    }

    switch (accion) {
      case 'agregar': {
        const nombre = boton.dataset.lista;
        obtener(estado, LISTAS[nombre].ruta).push(LISTAS[nombre].nuevo());
        renderLista(nombre);
        enfocarUltimo(nombre);
        actualizar();
        break;
      }
      case 'sumar': {
        if (aceptada()) break;
        const id = boton.dataset.id;
        if (seleccion.has(id)) seleccion.delete(id);
        else seleccion.add(id);
        renderDocumento();
        const nuevo = $(`.servicio__sumar[data-id="${CSS.escape(id)}"]`);
        if (nuevo) nuevo.focus({ preventScroll: true });
        break;
      }
      case 'aceptar':
        abrirAceptar();
        break;
      case 'copiar-aceptacion':
        avisar(await copiar(mensajeAceptacion().texto) ? 'Mensaje copiado. Pegalo en tu chat o mail.' : 'No se pudo copiar. Probá de nuevo.');
        break;
      case 'compartir':
        if (invitado) abrirRegistro('compartir');
        else abrirCompartir();
        break;
      case 'registrarse':
        abrirRegistro('guardar');
        break;
      case 'ingresar':
        abrirRegistro('ingresar');
        break;
      case 'copiar-link':
        if (await copiar(linkActual)) {
          boton.textContent = 'Copiado';
          setTimeout(() => { boton.textContent = 'Copiar link'; }, 2000);
        } else {
          $('#enlace-propuesta').select();
          avisar('No se pudo copiar automáticamente. El link quedó seleccionado para que lo copies.');
        }
        break;
      case 'desactivar-link':
        desactivarLink();
        break;
      case 'copiar-link-propuesta':
        if (await copiar(linkCorto(boton.dataset.id))) avisar('Link copiado.');
        else avisar('No se pudo copiar el link. Abrí la propuesta y copialo desde «Compartir».');
        break;
      case 'compartir-nativo':
        try {
          await navigator.share({ title: estado.propuesta.titulo.trim() || 'Propuesta', url: linkActual });
        } catch {}
        break;
      case 'vista':
        cambiarVista(boton.dataset.vista);
        break;
      case 'agregar-pf': {
        const nombrePf = boton.dataset.listaPf;
        const confPf = LISTAS_PORTAFOLIO[nombrePf];
        if (!confPf) break;
        obtener(estadoPortafolio, confPf.ruta).push(confPf.nuevo());
        renderListaPortafolio(nombrePf);
        const ultimoPf = $(`.lista[data-lista-pf="${nombrePf}"] > :last-child input`);
        if (ultimoPf) ultimoPf.focus();
        actualizar();
        break;
      }
      case 'quitar-img-proyecto': {
        const nodoPf = boton.closest('[data-indice-pf]');
        if (!nodoPf) break;
        const itemPf = estadoPortafolio.proyectos[Number(nodoPf.dataset.indicePf)];
        if (!itemPf) break;
        itemPf.imagen = '';
        actualizarImagenProyectoItem(nodoPf, itemPf);
        actualizar();
        break;
      }
      case 'quitar-foto-galeria-proyecto': {
        const nodoPf = boton.closest('[data-indice-pf]');
        if (!nodoPf) break;
        const itemPf = estadoPortafolio.proyectos[Number(nodoPf.dataset.indicePf)];
        const idxFoto = Number(boton.dataset.fotoIdx);
        if (!itemPf || !Array.isArray(itemPf.galeria)) break;
        itemPf.galeria.splice(idxFoto, 1);
        actualizarImagenProyectoItem(nodoPf, itemPf);
        actualizar();
        break;
      }
      case 'quitar-img-galeria': {
        const nodoPf = boton.closest('[data-indice-pf]');
        const nodoProp = boton.closest('[data-indice]');
        const esPf = !!nodoPf;
        const nodo = nodoPf || nodoProp;
        if (!nodo) break;
        const item = (esPf ? estadoPortafolio.galeria : estado.galeria)?.[Number(esPf ? nodo.dataset.indicePf : nodo.dataset.indice)];
        if (!item) break;
        item.imagen = '';
        actualizarImagenGenericaItem(nodo, '', 'data-gal-img');
        actualizar();
        break;
      }
      case 'quitar-img-servicio': {
        const nodo = boton.closest('[data-indice]');
        if (!nodo) break;
        const item = estado.servicios[Number(nodo.dataset.indice)];
        if (!item) break;
        item.imagen = '';
        actualizarImagenGenericaItem(nodo, '', 'data-srv-img');
        actualizar();
        break;
      }
      case 'quitar-img-sweb': {
        const nodo = boton.closest('[data-indice-pf]');
        if (!nodo) break;
        const item = estadoPortafolio.serviciosWeb[Number(nodo.dataset.indicePf)];
        if (!item) break;
        item.imagen = '';
        actualizarImagenGenericaItem(nodo, '', 'data-sweb-img');
        actualizar();
        break;
      }
      case 'quitar-img-testimonio': {
        const nodoPf = boton.closest('[data-indice-pf]');
        const nodoProp = boton.closest('[data-indice]');
        const esPf = !!nodoPf;
        const nodo = nodoPf || nodoProp;
        if (!nodo) break;
        const item = (esPf ? estadoPortafolio.testimonios : estado.testimonios)?.[Number(esPf ? nodo.dataset.indicePf : nodo.dataset.indice)];
        if (!item) break;
        item.avatar = '';
        actualizarImagenGenericaItem(nodo, '', 'data-test-img');
        actualizar();
        break;
      }
      case 'quitar-foto-emisor':
        docActivo().emisor.foto = '';
        actualizarLogo();
        actualizar();
        break;
      case 'quitar-portada-prop':
        estado.propuesta.imagenPortada = '';
        actualizarLogo();
        actualizar();
        break;
      case 'quitar-portada-pf':
        estadoPortafolio.portafolio.imagenPortada = '';
        actualizarLogo();
        actualizar();
        break;
      case 'lightbox-cerrar':
        cerrarLightbox();
        break;
      case 'lightbox-fondo':
        if (ev.target === boton) cerrarLightbox();
        break;
      case 'lightbox-ant':
        moverLightbox(-1);
        break;
      case 'lightbox-sig':
        moverLightbox(1);
        break;
      case 'contacto-demo':
        avisar('En tu portfolio compartido, este botón abre WhatsApp o email directo para contratarte.');
        break;
      case 'quitar-logo':
        docActivo().emisor.logo = '';
        actualizarLogo();
        actualizar();
        break;
      case 'ir-panel':
        if (boton.tagName === 'A') {
          if (!clicComun(ev)) break;
          ev.preventDefault();
        }
        if (nube()) irAlPanel();
        else volverAEditorPropuestaInvitado();
        break;
      case 'ir-portafolios':
        if (boton.tagName === 'A') {
          if (!clicComun(ev)) break;
          ev.preventDefault();
        }
        irAPortafolios();
        break;
      case 'nuevo-portafolio':
        nuevoPortafolio();
        break;
      case 'nuevo-portafolio-ejemplo':
        nuevoPortafolio(ejemploPortafolio());
        break;
      case 'crear-pf-rubro': {
        const tpl = PLANTILLAS_PORTAFOLIO[boton.dataset.rubro];
        if (tpl) nuevoPortafolio(tpl.crear());
        break;
      }
      case 'abrir-portafolio':
        if (boton.tagName === 'A') {
          if (!clicComun(ev)) break;
          ev.preventDefault();
        }
        abrirPortafolio(boton.dataset.id);
        break;
      case 'duplicar-portafolio':
        duplicarPortafolio(boton.dataset.id);
        break;
      case 'borrar-portafolio':
        borrarPortafolio(boton.dataset.id);
        break;
      case 'copiar-link-portafolio':
        if (await copiar(linkCortoPortafolio(boton.dataset.id))) avisar('Link del portfolio copiado.');
        else avisar('No se pudo copiar el link.');
        break;
      case 'abrir-propuesta':
        if (!clicComun(ev)) break;
        ev.preventDefault();
        abrirPropuesta(boton.dataset.id);
        break;
      case 'ir-cuenta':
        if (!nube()) break;
        if (boton.tagName === 'A') {
          if (!clicComun(ev)) break;
          ev.preventDefault();
        }
        irACuenta();
        break;
      case 'filtrar':
        filtroEstado = boton.dataset.estado;
        renderPanel();
        $(`.filtro[data-estado="${CSS.escape(filtroEstado)}"]`)?.focus();
        break;
      case 'quitar-logo-cuenta':
        logoCuenta = '';
        cuentaEditada = true;
        pintarLogoCuenta();
        break;
      case 'quitar-foto-cuenta':
        fotoCuenta = '';
        cuentaEditada = true;
        pintarLogoCuenta();
        break;
      case 'cambiar-password':
        cambiarPassword();
        break;
      case 'nueva':
        if (nube()) nuevaPropuesta();
        else {
          volverAEditorPropuestaInvitado(vacio());
          avisar('Nueva propuesta en blanco lista.');
        }
        break;
      case 'nueva-ejemplo':
        if (nube()) nuevaPropuesta(ejemplo());
        break;
      case 'duplicar-propuesta':
        duplicarPropuesta(boton.dataset.id);
        break;
      case 'borrar-propuesta':
        borrarPropuesta(boton.dataset.id);
        break;
      case 'cerrar-sesion':
        cerrarSesion();
        break;
      case 'eliminar-cuenta':
        if (nube()) abrirEliminarCuenta();
        break;
      case 'reintentar-panel':
        escucharPropuestas();
        break;
      case 'guardar-borrador':
        if (invitado) abrirRegistro('guardar');
        else guardarBorrador();
        break;
      case 'abrir-borrador':
        campoBorrador.click();
        break;
      case 'pdf':
        if (invitado) abrirRegistro('pdf');
        else descargarPDF();
        break;
      case 'ver-editor':
        cambiarPestana(false);
        break;
      case 'ver-previa':
        cambiarPestana(true);
        break;
    }
  });

  // Panel «Mis propuestas». La lista se escucha en tiempo real toda la sesión:
  // refleja al instante lo que se edita, se duplica o se borra, también sin conexión.
  const elPanel = $('#panel');
  const elLista = $('#lista-propuestas');
  const elPanelEstado = $('#panel-estado');
  const elPanelVacio = $('#panel-vacio');
  const elPanelResumen = $('#panel-resumen');
  const elHerramientas = $('#panel-herramientas');
  const elMetricas = $('#panel-metricas');
  const elFiltros = $('#panel-filtros');
  const campoBuscar = $('#panel-buscar');
  const elCuenta = $('#cuenta');
  let propuestas = [];
  let panelCargando = true;
  let panelError = false;
  let dejarDeEscuchar = null;
  let filtroEstado = 'todas';

  const primerNombre = () => nombreVisible().split(' ')[0];

  const renderPanel = () => {
    if (elPanel.hidden) return;
    const filtro = sinAcentos(campoBuscar.value.trim());
    const visibles = propuestas
      .filter(p => filtroEstado === 'todas' || (p.status || 'draft') === filtroEstado)
      .filter(p => !filtro || sinAcentos(`${p.title} ${p.clientName}`).includes(filtro));
    const hay = propuestas.length > 0;

    $('#panel-saludo').textContent = primerNombre() ? `Hola, ${primerNombre()}` : 'Hola';
    elPanelResumen.textContent = hay ? `${propuestas.length} ${propuestas.length === 1 ? 'propuesta' : 'propuestas'}` : '';
    elMetricas.hidden = !hay;
    if (hay) elMetricas.innerHTML = metricasHTML(propuestas);
    elHerramientas.hidden = propuestas.length < 2;
    elFiltros.innerHTML = filtrosHTML(propuestas, filtroEstado);
    elPanelVacio.hidden = panelCargando || panelError || hay;

    if (panelError) {
      elPanelEstado.innerHTML = 'No pudimos cargar tus propuestas. Revisá tu conexión. <button type="button" class="boton boton--texto boton--chico" data-accion="reintentar-panel">Reintentar</button>';
    } else if (panelCargando) {
      elPanelEstado.textContent = 'Cargando tus propuestas…';
    } else if (filtro && !visibles.length) {
      elPanelEstado.textContent = `No hay propuestas que coincidan con «${campoBuscar.value.trim()}».`;
    } else if (hay && !visibles.length) {
      elPanelEstado.textContent = 'No hay propuestas en este estado.';
    } else {
      elPanelEstado.textContent = '';
    }
    elLista.innerHTML = visibles.map(propuestaHTML).join('');
  };

  campoBuscar.addEventListener('input', renderPanel);

  // Avisa en el momento cuando un cliente abre o acepta una propuesta. La primera
  // carga solo registra cómo estaba todo, sin avisar.
  let seguimientoAnterior = null;
  const avisarNovedades = docs => {
    const actual = new Map(docs.map(p => [p.id, { aceptada: !!p.aceptacion, vistas: Number(p.vistas) || 0 }]));
    if (seguimientoAnterior) {
      for (const p of docs) {
        const antes = seguimientoAnterior.get(p.id);
        if (!antes) continue;
        const titulo = texto(p.title).trim() || 'tu propuesta';
        if (p.aceptacion && !antes.aceptada) avisar(`🎉 ${texto(p.aceptacion.nombre)} aceptó «${titulo}».`, 8000);
        else if ((Number(p.vistas) || 0) > antes.vistas) avisar(`Tu cliente está viendo «${titulo}».`, 6000);
      }
    }
    seguimientoAnterior = actual;
  };

  const elAvisoAceptada = $('#editor-aceptada');
  // En el editor: si ya la aceptaron, el cliente sigue viendo la versión aceptada.
  const actualizarAvisoAceptada = () => {
    const a = propuestaId ? propuestas.find(p => p.id === propuestaId)?.aceptacion : null;
    elAvisoAceptada.hidden = !a;
    if (!a) return;
    const fecha = fechaDeAceptacion(a);
    elAvisoAceptada.textContent = `${texto(a.nombre)} aceptó esta propuesta${fecha ? ` el ${fechaLarga(fecha)}` : ''}. Tu cliente sigue viendo la versión que aceptó: los cambios que hagas acá no le llegan.`;
  };

  const escucharPropuestas = () => {
    if (dejarDeEscuchar) dejarDeEscuchar();
    panelCargando = true;
    panelError = false;
    renderPanel();
    dejarDeEscuchar = AteneaDB.proposals.escuchar(docs => {
      // Más recientes primero; las que tienen cambios sin confirmar traen fecha estimada.
      propuestas = docs.sort((a, b) => (fechaDe(b.updatedAt) || 0) - (fechaDe(a.updatedAt) || 0));
      panelCargando = false;
      panelError = false;
      avisarNovedades(docs);
      renderPanel();
      actualizarAvisoAceptada();
    }, () => {
      panelCargando = false;
      panelError = true;
      renderPanel();
    });
  };


  const elPortafolios = $('#portafolios');
  const elListaPortafolios = $('#lista-portafolios');
  const elPortafoliosEstado = $('#portafolios-estado');
  const elPortafoliosVacio = $('#portafolios-vacio');
  const elPortafoliosHerramientas = $('#portafolios-herramientas');
  const campoBuscarPortafolios = $('#portafolios-buscar');

  const renderPanelPortafolios = () => {
    if (!elPortafolios || elPortafolios.hidden) return;
    const filtro = sinAcentos(campoBuscarPortafolios?.value.trim() || '');
    const visibles = portafolios.filter(pf => !filtro || sinAcentos(`${pf.title} ${pf.subtitle}`).includes(filtro));
    const hay = portafolios.length > 0;

    if (elPortafoliosHerramientas) elPortafoliosHerramientas.hidden = !hay;
    if (elPortafoliosVacio) elPortafoliosVacio.hidden = portafoliosCargando || portafoliosError || hay;

    if (portafoliosError) {
      elPortafoliosEstado.textContent = 'No pudimos cargar tus portfolios. Revisá tu conexión.';
    } else if (portafoliosCargando) {
      elPortafoliosEstado.textContent = 'Cargando tus portfolios…';
    } else if (filtro && !visibles.length) {
      elPortafoliosEstado.textContent = `No hay portfolios que coincidan con «${campoBuscarPortafolios.value.trim()}».`;
    } else {
      elPortafoliosEstado.textContent = '';
    }
    if (elListaPortafolios) elListaPortafolios.innerHTML = visibles.map(pf => portafolioItemHTML(pf, { conNube: !!nube() })).join('');
  };

  campoBuscarPortafolios?.addEventListener('input', renderPanelPortafolios);

  const escucharPortafoliosNube = () => {
    if (!AteneaDB?.portfolios) return;
    if (dejarDeEscucharPortafolios) dejarDeEscucharPortafolios();
    portafolios = [];
    portafoliosCargando = true;
    portafoliosError = false;
    renderPanelPortafolios();
    dejarDeEscucharPortafolios = AteneaDB.portfolios.escuchar(docs => {
      portafolios = docs.sort((a, b) => (fechaDe(b.updatedAt) || 0) - (fechaDe(a.updatedAt) || 0));
      portafoliosCargando = false;
      portafoliosError = false;
      sincronizarPortafolioEnPropuesta();
      renderPanelPortafolios();
      actualizarSelectorPortafolio();
      if (editando && modoEditor === 'propuesta') renderDocumento();
    }, () => {
      portafolios = [];
      portafoliosCargando = false;
      portafoliosError = true;
      renderPanelPortafolios();
      actualizarSelectorPortafolio();
    });
  };

  const RUTA_EDITAR_PROPUESTA = /^\/propuesta\/([^/]+)\/?$/;
  const RUTA_EDITAR_PORTAFOLIO = /^\/editar-portafolio\/([^/]+)\/?$/;

  const idEnUrl = () => {
    const m = location.pathname.match(RUTA_EDITAR_PROPUESTA);
    if (m) return decodeURIComponent(m[1]);
    return new URLSearchParams(location.search).get('propuesta');
  };
  const idPortafolioEnUrl = () => {
    const m = location.pathname.match(RUTA_EDITAR_PORTAFOLIO);
    if (m) return decodeURIComponent(m[1]);
    return new URLSearchParams(location.search).get('portafolio');
  };
  const seccionEnUrl = () => {
    if (location.pathname === '/portafolios' || location.pathname === '/portafolios/') return 'portafolios';
    if (location.pathname === '/cuenta' || location.pathname === '/cuenta/') return 'cuenta';
    return new URLSearchParams(location.search).get('seccion');
  };

  // Vistas: 'panel' (Mis propuestas), 'portafolios' (Mis portfolios), 'cuenta' (Mi cuenta) y 'editor'.
  const TITULOS_VISTA = {
    panel: 'Mis propuestas | Dealit',
    portafolios: 'Mis portfolios | Dealit',
    cuenta: 'Mi cuenta | Dealit'
  };
  const mostrarVista = vista => {
    const inicio = vista !== 'editor';
    document.body.classList.toggle('vista-inicio', inicio);
    document.body.classList.toggle('vista-panel', vista === 'panel');
    document.body.classList.toggle('vista-portafolios', vista === 'portafolios');
    document.body.classList.toggle('vista-cuenta', vista === 'cuenta');
    elPanel.hidden = vista !== 'panel';
    if (elPortafolios) elPortafolios.hidden = vista !== 'portafolios';
    elCuenta.hidden = vista !== 'cuenta';
    app.hidden = inicio;
    $$('.barra__nav-link').forEach(a => {
      if (a.dataset.seccion === vista) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    abrirMenu(false);
    if (TITULOS_VISTA[vista]) document.title = TITULOS_VISTA[vista];
  };

  // Antes de cambiar de propuesta o de vista, lo pendiente se manda a la cuenta.
  const cerrarEdicion = () => {
    if (hayCambiosSinEnviar()) guardarAhora();
    editando = false;
    propuestaId = null;
    portafolioId = null;
  };

  const irAPortafolios = ({ historial = true } = {}) => {
    cerrarEdicion();
    if (!nube() && !portafolios.length) portafolios = cargarPortafoliosLocales();
    if (historial && location.pathname !== '/portafolios') {
      irRuta('/portafolios');
    }
    mostrarVista('portafolios');
    renderPanelPortafolios();
    if (elPortafolios) elPortafolios.scrollTop = 0;
  };

  const mostrarEditorPortafolio = (id, contenido, { historial = true } = {}) => {
    modoEditor = 'portafolio';
    portafolioId = id;
    propuestaId = null;
    estadoPortafolio = normalizarPf(contenido);
    errorGuardado = '';
    avisoError = false;
    if (historial) {
      irRuta(`/editar-portafolio/${encodeURIComponent(id)}`);
    }
    mostrarVista('editor');
    cambiarPestana(false);
    llenarFormulario();
    renderDocumento();
    document.title = `${estadoPortafolio.portafolio.nombreInterno.trim() || estadoPortafolio.portafolio.titulo.trim() || 'Portfolio'} | Dealit`;
    $('.editor').scrollTop = 0;
    editando = true;
    mostrarEstadoGuardado();
    elAvisoAceptada.hidden = true;
  };

  const crearPortafolioEnCuentaOLocal = pf => {
    const datos = datosPortafolioParaGuardar(pf);
    if (!datos) {
      avisar(AVISO_PESADA, 7000);
      return null;
    }
    if (nube() && AteneaDB?.portfolios) {
      const id = AteneaDB.portfolios.nuevoId();
      const listo = registrarEscritura(AteneaDB.portfolios.crear(datos, id), 'No se pudo crear el portfolio en tu cuenta.');
      return { id, listo };
    }
    if (!portafolios.length) portafolios = cargarPortafoliosLocales();
    const id = 'pf-' + uid();
    portafolios.unshift({ id, ...datos, publico: true, updatedAt: new Date().toISOString() });
    guardarPortafoliosLocales();
    return { id, listo: Promise.resolve(true) };
  };

  const nuevoPortafolio = base => {
    cerrarEdicion();
    const nuevo = normalizarPf(base || vacioPortafolio());
    if (!base) {
      const ultima = propuestas[0]?.payload ? normalizar(propuestas[0].payload).emisor : null;
      const guardados = { ...perfil?.emisor };
      if (!guardados.logo) delete guardados.logo;
      if (!guardados.foto) delete guardados.foto;
      if (ultima || perfil?.emisor) {
        nuevo.emisor = { ...nuevo.emisor, ...ultima, ...guardados };
      }
    }
    const creado = crearPortafolioEnCuentaOLocal(nuevo);
    if (creado) mostrarEditorPortafolio(creado.id, nuevo);
  };

  const abrirPortafolio = async (id, opciones) => {
    cerrarEdicion();
    if (!nube() && !portafolios.length) portafolios = cargarPortafoliosLocales();
    let doc = portafolios.find(x => x.id === id);
    if (!doc && nube() && AteneaDB?.portfolios) {
      doc = await AteneaDB.portfolios.obtener(id).catch(() => null);
    }
    if (!doc) {
      avisar('No encontramos ese portfolio.');
      irAPortafolios({ historial: false });
      return;
    }
    mostrarEditorPortafolio(id, normalizarPf(doc.payload), opciones);
  };

  const duplicarPortafolio = id => {
    const original = portafolios.find(x => x.id === id);
    if (!original) return;
    const copia = normalizarPf(original.payload);
    const baseNombre = copia.portafolio.nombreInterno.trim() || copia.portafolio.titulo.trim() || 'Portfolio';
    copia.portafolio.nombreInterno = `${baseNombre} (copia)`;
    if (crearPortafolioEnCuentaOLocal(copia)) {
      renderPanelPortafolios();
      avisar('Portfolio duplicado. Ahora podés adaptarlo para otro cliente o rubro.');
    }
  };

  const borrarPortafolio = async id => {
    const pf = portafolios.find(x => x.id === id);
    const titulo = texto(pf?.title).trim();
    const ok = await confirmar({
      titulo: '¿Borrar este portfolio?',
      texto: `Se borra ${titulo ? `«${titulo}»` : 'este portfolio'} y no se puede recuperar.`,
      aceptar: 'Borrar'
    });
    if (!ok) return;
    if (nube() && AteneaDB?.portfolios) {
      registrarEscritura(AteneaDB.portfolios.borrar(id), 'No se pudo borrar el portfolio.')
        .then(borrado => { if (borrado) avisar('Portfolio borrado.'); });
    } else {
      portafolios = portafolios.filter(x => x.id !== id);
      guardarPortafoliosLocales();
      renderPanelPortafolios();
      avisar('Portfolio borrado.');
    }
  };

  const volverAEditorPropuestaInvitado = nuevaBase => {
    cerrarEdicion();
    modoEditor = 'propuesta';
    if (nuevaBase) estado = normalizar(nuevaBase);
    mostrarVista('editor');
    cambiarPestana(false);
    llenarFormulario();
    renderDocumento();
    actualizarAvisoPagos();
    editando = true;
    mostrarEstadoGuardado();
  };

  const irAlPanel = ({ historial = true } = {}) => {
    cerrarEdicion();
    if (historial && (location.pathname !== '/' || location.search)) irRuta('/');
    mostrarVista('panel');
    renderPanel();
    elPanel.scrollTop = 0;
  };

  // Mi cuenta: perfil y datos del negocio que se usan en las propuestas nuevas.
  let perfil = null;
  let cuentaEditada = false;
  const campoCuentaNombre = $('#cuenta-nombre');
  const elCuentaEstado = $('#cuenta-estado');
  const botonGuardarCuenta = $('#cuenta-guardar');

  const nombreVisible = () => texto(perfil?.displayName || AteneaDB?.auth.getUser()?.displayName).trim();

  const cargarPerfil = async () => {
    try {
      perfil = await AteneaDB.perfil.obtener();
    } catch (e) {
      console.warn('No se pudo cargar el perfil:', e);
      perfil = perfil || {};
    }
    renderPanel();
    if (!elCuenta.hidden && !cuentaEditada) llenarCuenta();
  };

  const llenarCuenta = () => {
    const user = AteneaDB.auth.getUser();
    const conPassword = AteneaDB.auth.usaPassword();
    campoCuentaNombre.value = nombreVisible();
    $('#cuenta-email').textContent = user?.email || '';
    $('#cuenta-acceso').textContent = conPassword ? 'Con email y contraseña.' : 'Con tu cuenta de Google.';
    $('[data-accion="cambiar-password"]').hidden = !conPassword;
    // Si todavía no guardó los datos del negocio, se sugieren los de su última propuesta.
    const sugeridos = !perfil?.emisor && propuestas[0]?.payload;
    const emisor = perfil?.emisor || (sugeridos ? normalizar(propuestas[0].payload).emisor : {});
    $$('[data-emisor]').forEach(el => { el.value = texto(emisor[el.dataset.emisor]); });
    // Los logos y fotos viejos guardados como data: no van al perfil de Firestore: solo los de Storage.
    logoCuenta = esLogoValido(texto(emisor.logo)) && !texto(emisor.logo).startsWith('data:') ? texto(emisor.logo) : '';
    fotoCuenta = esLogoValido(texto(emisor.foto)) && !texto(emisor.foto).startsWith('data:') ? texto(emisor.foto) : '';
    pintarLogoCuenta();
    elCuentaEstado.textContent = sugeridos ? 'Completamos estos datos con los de tu última propuesta. Guardalos para usarlos siempre.' : '';
    cuentaEditada = false;
  };

  $('#cuenta-form').addEventListener('input', () => {
    cuentaEditada = true;
    elCuentaEstado.textContent = '';
  });

  $('#cuenta-form').addEventListener('submit', async ev => {
    ev.preventDefault();
    const displayName = campoCuentaNombre.value.trim();
    const emisor = { ...Object.fromEntries($$('[data-emisor]').map(el => [el.dataset.emisor, el.value.trim()])), logo: logoCuenta, foto: fotoCuenta };
    botonGuardarCuenta.disabled = true;
    botonGuardarCuenta.textContent = 'Guardando…';
    try {
      await AteneaDB.perfil.guardar({ displayName, emisor });
      perfil = { ...perfil, displayName, emisor };
      cuentaEditada = false;
      elCuentaEstado.textContent = 'Cambios guardados.';
      if (menuUsuario) menuUsuario.textContent = displayName || AteneaDB.auth.getUser()?.email || '';
    } catch (e) {
      console.error('No se pudo guardar el perfil:', e);
      elCuentaEstado.textContent = 'No se pudieron guardar los cambios. Revisá tu conexión y probá de nuevo.';
    } finally {
      botonGuardarCuenta.disabled = false;
      botonGuardarCuenta.textContent = 'Guardar cambios';
    }
  });

  // Logo y foto del negocio en Mi cuenta: se suben a Storage y se guardan con «Guardar cambios».
  let logoCuenta = '';
  let fotoCuenta = '';
  const campoLogoCuenta = $('#cuenta-logo');
  const campoFotoCuenta = $('#cuenta-foto');

  const pintarLogoCuenta = () => {
    const vista = $('#cuenta-logo-vista');
    if (vista) {
      vista.hidden = !logoCuenta;
      if (logoCuenta) vista.src = logoCuenta;
      else vista.removeAttribute('src');
    }
    if ($('#cuenta-logo-quitar')) $('#cuenta-logo-quitar').hidden = !logoCuenta;
    if ($('#cuenta-logo-texto')) $('#cuenta-logo-texto').textContent = logoCuenta ? 'Cambiar logo' : 'Subir logo';

    const vistaFoto = $('#cuenta-foto-vista');
    if (vistaFoto) {
      vistaFoto.hidden = !fotoCuenta;
      if (fotoCuenta) vistaFoto.src = fotoCuenta;
      else vistaFoto.removeAttribute('src');
    }
    if ($('#cuenta-foto-quitar')) $('#cuenta-foto-quitar').hidden = !fotoCuenta;
    if ($('#cuenta-foto-texto')) $('#cuenta-foto-texto').textContent = fotoCuenta ? 'Cambiar foto' : 'Subir foto';
  };

  campoLogoCuenta.addEventListener('change', async () => {
    const archivo = campoLogoCuenta.files[0];
    campoLogoCuenta.value = '';
    if (!archivo || !nube()) return;
    if (!archivo.type.startsWith('image/')) {
      avisar('El logo tiene que ser una imagen PNG, JPG, SVG o WebP.');
      return;
    }
    if (archivo.size > LOGO_MAX_ARCHIVO) {
      avisar('El logo pesa más de 5 MB. Usá una versión más liviana.');
      return;
    }
    $('#cuenta-logo-texto').textContent = 'Subiendo logo…';
    campoLogoCuenta.disabled = true;
    try {
      logoCuenta = await AteneaDB.logos.subir(await logoParaSubir(archivo));
      cuentaEditada = true;
      elCuentaEstado.textContent = 'Guardá los cambios para usar este logo en tus propuestas nuevas.';
    } catch (e) {
      console.error('No se pudo subir el logo:', e);
      avisar('No se pudo subir el logo. Revisá tu conexión y probá de nuevo.');
    } finally {
      campoLogoCuenta.disabled = false;
      pintarLogoCuenta();
    }
  });

  if (campoFotoCuenta) {
    campoFotoCuenta.addEventListener('change', async () => {
      const archivo = campoFotoCuenta.files?.[0];
      campoFotoCuenta.value = '';
      if (!archivo || !nube()) return;
      if (!archivo.type.startsWith('image/')) {
        avisar('La foto tiene que ser PNG, JPG o WebP.');
        return;
      }
      if (archivo.size > LOGO_MAX_ARCHIVO) {
        avisar('La foto pesa más de 5 MB. Usá una versión más liviana.');
        return;
      }
      $('#cuenta-foto-texto').textContent = 'Subiendo foto…';
      campoFotoCuenta.disabled = true;
      try {
        fotoCuenta = await AteneaDB.logos.subir(await procesarImagenProyecto(archivo, true, { anchoMax: 480, altoMax: 480 }));
        cuentaEditada = true;
        elCuentaEstado.textContent = 'Guardá los cambios para usar esta foto en tus propuestas y portfolios.';
      } catch (e) {
        console.error('No se pudo subir la foto:', e);
        avisar('No se pudo subir la foto. Revisá tu conexión y probá de nuevo.');
      } finally {
        campoFotoCuenta.disabled = false;
        pintarLogoCuenta();
      }
    });
  }

  // Avatar de la barra: la foto de Google, o la inicial si entró con email.
  const pintarAvatar = user => {
    const el = $('#barra-avatar');
    const inicial = texto(user.displayName || user.email).trim().charAt(0).toUpperCase();
    el.textContent = inicial;
    if (!/^https:\/\//.test(texto(user.photoURL))) return;
    const img = document.createElement('img');
    img.alt = '';
    img.referrerPolicy = 'no-referrer'; // Google rechaza las fotos pedidas con referer de otro sitio
    img.src = user.photoURL;
    img.addEventListener('error', () => { el.textContent = inicial; });
    el.replaceChildren(img);
  };

  const cambiarPassword = async () => {
    const email = AteneaDB.auth.getUser()?.email;
    try {
      await AteneaDB.auth.recuperarPassword(email);
      avisar(`Te mandamos un email a ${email} para crear una contraseña nueva.`, 6000);
    } catch (e) {
      console.error('No se pudo enviar el email de contraseña:', e);
      avisar('No se pudo enviar el email. Probá de nuevo en unos minutos.');
    }
  };

  const irACuenta = ({ historial = true } = {}) => {
    cerrarEdicion();
    if (historial && location.pathname !== '/cuenta') irRuta('/cuenta');
    mostrarVista('cuenta');
    if (!cuentaEditada) llenarCuenta();
    elCuenta.scrollTop = 0;
  };

  const mostrarEditor = (id, contenido, { historial = true } = {}) => {
    modoEditor = 'propuesta';
    portafolioId = null;
    propuestaId = id;
    estado = contenido;
    seleccion = new Set();
    errorGuardado = '';
    avisoError = false;
    if (historial) irRuta(`/propuesta/${encodeURIComponent(id)}`);
    mostrarVista('editor');
    cambiarPestana(false);
    llenarFormulario();
    renderDocumento();
    actualizarAvisoPagos();
    document.title = `${estado.propuesta.titulo.trim() || 'Propuesta sin título'} | Dealit`;
    $('.editor').scrollTop = 0;
    editando = true;
    mostrarEstadoGuardado();
    actualizarAvisoAceptada();
    migrarLogo();
  };

  const abrirPropuesta = async (id, opciones) => {
    cerrarEdicion();
    let doc = propuestas.find(p => p.id === id);
    if (!doc) doc = await AteneaDB.proposals.obtener(id).catch(e => {
      console.error('No se pudo abrir la propuesta:', e);
      return null;
    });
    if (!doc) {
      avisar('No encontramos esa propuesta. Puede que se haya borrado.');
      irRuta('/', { reemplazar: true });
      irAlPanel({ historial: false });
      return;
    }
    mostrarEditor(id, normalizar(doc.payload), opciones);
  };

  // Tus datos de contacto se repiten en cada propuesta: la nueva toma los de Mi cuenta y,
  // lo que falte (como el logo), de la última propuesta editada.
  const nuevaPropuesta = base => {
    cerrarEdicion();
    const nueva = base || vacio();
    if (!base) {
      const ultima = propuestas[0]?.payload ? normalizar(propuestas[0].payload).emisor : null;
      const guardados = { ...perfil?.emisor };
      if (!guardados.logo) delete guardados.logo; // sin logo en Mi cuenta, se usa el de la última
      if (ultima || perfil?.emisor) nueva.emisor = { ...nueva.emisor, ...ultima, ...guardados };
    }
    const creada = crearEnCuenta(nueva);
    if (creada) mostrarEditor(creada.id, nueva);
  };

  const duplicarPropuesta = id => {
    const original = propuestas.find(p => p.id === id);
    if (!original) return;
    const copia = normalizar(original.payload);
    copia.propuesta.titulo = `${copia.propuesta.titulo.trim() || 'Sin título'} (copia)`;
    if (crearEnCuenta(copia)) avisar('Propuesta duplicada.');
  };

  const borrarPropuesta = async id => {
    const p = propuestas.find(x => x.id === id);
    const titulo = texto(p?.title).trim();
    const ok = await confirmar({
      titulo: '¿Borrar la propuesta?',
      texto: `Se borra ${titulo ? `«${titulo}»` : 'esta propuesta'} de tu cuenta y no se puede recuperar.${p?.publico ? ' El link que compartiste deja de funcionar.' : ''}`,
      aceptar: 'Borrar'
    });
    if (!ok) return;
    registrarEscritura(AteneaDB.proposals.borrar(id), 'No se pudo borrar la propuesta.')
      .then(borrada => { if (borrada) avisar('Propuesta borrada.'); });
  };

  window.addEventListener('popstate', () => {
    if (esCliente) return;
    const idPf = idPortafolioEnUrl();
    if (idPf) {
      if (idPf !== portafolioId) abrirPortafolio(idPf, { historial: false });
      return;
    }
    if (seccionEnUrl() === 'portafolios') {
      irAPortafolios({ historial: false });
      return;
    }
    if (!nube()) {
      volverAEditorPropuestaInvitado();
      return;
    }
    const id = idEnUrl();
    if (id) {
      if (id !== propuestaId) abrirPropuesta(id, { historial: false });
    } else if (seccionEnUrl() === 'cuenta') irACuenta({ historial: false });
    else irAlPanel({ historial: false });
  });

  // Un clic común abre en esta pestaña; con Ctrl, Cmd o la rueda, el navegador abre una nueva.
  const clicComun = ev => ev.button === 0 && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey && !ev.altKey;

  const errorCliente = (titulo, mensaje) => {
    $('#documento').innerHTML = `
      <div class="doc-error">
        <div>
          <h1>${esc(titulo)}</h1>
          <p>${esc(mensaje)}</p>
        </div>
      </div>`;
  };

  const mostrarCliente = datos => {
    estado = normalizar(datos);
    const destinatario = estado.cliente.empresa.trim() || estado.cliente.nombre.trim();
    document.title = [estado.propuesta.titulo.trim() || 'Propuesta', destinatario ? `para ${destinatario}` : ''].filter(Boolean).join(' ');
    renderDocumento();
  };

  // Link largo (#p=…): la propuesta viaja comprimida dentro del propio link.
  const iniciarCliente = async () => {
    esCliente = true;
    document.body.classList.add('modo-cliente');
    try {
      mostrarCliente(JSON.parse(await descomprimir(location.hash.slice(PREFIJO.length))));
    } catch {
      errorCliente('No pudimos abrir esta propuesta', 'El link llegó incompleto o se cortó al copiarlo. Pedile a quien te lo mandó que lo comparta de nuevo.');
    }
  };

  // Link corto (/p/<id>): la propuesta se lee de la cuenta de quien la mandó,
  // siempre en su última versión, mientras el link esté activo.
  const iniciarClienteCorto = async id => {
    esCliente = true;
    document.body.classList.add('modo-cliente');
    if (!id) {
      errorCliente('No pudimos abrir esta propuesta', 'El link llegó incompleto o se cortó al copiarlo. Pedile a quien te lo mandó que lo comparta de nuevo.');
      return;
    }
    if (!AteneaDB) {
      errorCliente('No pudimos abrir esta propuesta', 'Hubo un problema al conectar. Revisá tu conexión y recargá la página.');
      return;
    }
    try {
      const datos = await AteneaDB.proposals.obtenerPublica(id);
      if (datos) {
        compartida = { id, aceptacion: datos.aceptacion };
        // Aceptada: se muestra la versión que se aceptó, con los opcionales elegidos.
        if (datos.aceptacion) seleccion = new Set((datos.aceptacion.opcionales || []).map(o => o.id));
        mostrarCliente(datos.aceptacion?.contenido || datos.payload);
        registrarVisita(id);
      } else errorCliente('Esta propuesta ya no está disponible', 'Puede que el link se haya desactivado. Pedile a quien te la mandó que te comparta uno nuevo.');
    } catch (e) {
      console.error('No se pudo abrir la propuesta compartida:', e);
      errorCliente('No pudimos abrir esta propuesta', 'Hubo un problema al conectar. Revisá tu conexión y recargá la página.');
    }
  };

  // Sin Firebase: un solo editor que guarda en el navegador, como antes de las cuentas.
  const iniciarSinCuenta = () => {
    document.body.classList.add('sin-cuenta');
    portafolios = cargarPortafoliosLocales();
    estado = cargarGuardado() || ejemplo();
    llenarFormulario();
    renderDocumento();
    actualizarAvisoPagos();
    editando = true;
    mostrarEstadoGuardado();
  };

  // Con cuenta: se entra al panel, o directo a la propuesta si la URL la indica.
  const iniciarConCuenta = async () => {
    const migrada = migrarLocal();
    escucharPropuestas();
    escucharPortafoliosNube();
    cargarPerfil();
    // Si se registró desde el editor sin cuenta, sigue donde estaba: con su propuesta
    // abierta y, si quería compartirla o bajar el PDF, haciendo eso.
    let continuar = null;
    try {
      continuar = sessionStorage.getItem(`${CLAVE}:continuar`);
      sessionStorage.removeItem(`${CLAVE}:continuar`);
    } catch {}
    const id = idEnUrl();
    if (migrada && continuar) {
      mostrarEditor(migrada.id, migrada.contenido, { historial: false });
      irRuta(`/propuesta/${encodeURIComponent(migrada.id)}`, { reemplazar: true });
      if (continuar === 'compartir') abrirCompartir();
      else if (continuar === 'pdf') descargarPDF();
    } else if (idPortafolioEnUrl()) await abrirPortafolio(idPortafolioEnUrl(), { historial: false });
    else if (id) await abrirPropuesta(id, { historial: false });
    else if (seccionEnUrl() === 'portafolios') irAPortafolios({ historial: false });
    else if (seccionEnUrl() === 'cuenta') irACuenta({ historial: false });
    else irAlPanel({ historial: false });
  };

  const authPantalla   = $('#auth-pantalla');
  const authForm       = $('#auth-form');
  const authGoogle     = $('#auth-google');
  const authErrorG     = $('#auth-error-google');
  const authError      = $('#auth-error');
  const authSubmit     = $('#auth-submit');
  const authSubmitText = authSubmit?.querySelector('.auth__submit-texto');
  const authSpinner    = authSubmit?.querySelector('.auth__spinner');
  const authNombre     = $('#auth-nombre');
  const authEmail      = $('#auth-email');
  const authPass       = $('#auth-pass');
  const menuUsuario    = $('#menu-usuario');
  const authOlvido     = $('#auth-olvido');
  const authMensaje    = $('#auth-mensaje');
  const elIngreso      = $('#auth-ingreso');
  const elVerificar    = $('#auth-verificar');
  const verificarError = $('#auth-verificar-error');
  const verificarMensaje = $('#auth-verificar-mensaje');
  let authModo = 'login';
  let entrar = () => {};

  // Sin sesión: editor de prueba que guarda en este navegador. Al registrarse, lo que
  // armó pasa a su cuenta (migrarLocal) y sigue con lo que quería hacer.
  let invitado = false;
  let invitadoIniciado = false;
  let invitadoEdito = false; // si no cambió nada, el ejemplo no se guarda en su cuenta
  let guardadoParaRegistro = false;

  const iniciarInvitado = () => {
    invitado = true;
    document.body.classList.add('invitado');
    document.body.classList.remove('auth-cargando', 'auth-activo');
    authPantalla.hidden = true;
    if (invitadoIniciado) return;
    invitadoIniciado = true;
    const pideIngresar = new URLSearchParams(location.search).has('ingresar');
    if (location.search) irRuta('/', { reemplazar: true });
    portafolios = cargarPortafoliosLocales();
    const guardada = cargarGuardado();
    invitadoEdito = !!guardada;
    estado = guardada || ejemplo();
    seleccion = new Set();
    llenarFormulario();
    renderDocumento();
    actualizarAvisoPagos();
    editando = true;
    mostrarEstadoGuardado();
    if (pideIngresar) abrirRegistro('ingresar');
  };

  // Con la sesión ya iniciada, guardarAhora apuntaría a la cuenta: lo pendiente del
  // visitante va al navegador, y de ahí migrarLocal lo pasa a su cuenta.
  const guardarCambiosDeInvitado = () => {
    if (!hayCambiosSinEnviar()) return;
    clearTimeout(temporizadorGuardado);
    temporizadorGuardado = null;
    guardarLocal();
  };

  const MOTIVOS_REGISTRO = {
    compartir: 'Creá tu cuenta gratis para compartir tu propuesta. Lo que armaste se guarda en tu cuenta.',
    pdf: 'Creá tu cuenta gratis para descargar tu propuesta en PDF. Lo que armaste se guarda en tu cuenta.',
    guardar: 'Creá tu cuenta gratis para guardar tus propuestas y abrirlas desde cualquier dispositivo.'
  };

  const abrirRegistro = motivo => {
    if (MOTIVOS_REGISTRO[motivo]) {
      // Se guarda ya, aunque no haya editado: es la propuesta que quiere compartir.
      if (invitado) {
        guardadoParaRegistro = !invitadoEdito;
        guardarLocal();
      }
      try { sessionStorage.setItem(`${CLAVE}:continuar`, motivo); } catch {}
    }
    const elMotivo = $('#auth-motivo');
    elMotivo.textContent = MOTIVOS_REGISTRO[motivo] || '';
    elMotivo.hidden = !MOTIVOS_REGISTRO[motivo];
    $('#auth-cerrar').hidden = !invitado;
    authPantalla.hidden = false;
    authGoogle.focus();
  };

  const cerrarRegistro = () => {
    if (!invitado) return;
    authPantalla.hidden = true;
    try {
      sessionStorage.removeItem(`${CLAVE}:continuar`);
      // Si solo se guardó para el registro y al final no se registró, no queda nada guardado.
      if (guardadoParaRegistro && !invitadoEdito) { localStorage.removeItem(CLAVE); sessionStorage.removeItem(CLAVE); }
    } catch {}
    guardadoParaRegistro = false;
  };
  $('#auth-cerrar').addEventListener('click', cerrarRegistro);
  $('.auth__fondo').addEventListener('click', cerrarRegistro);
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && !authPantalla.hidden) cerrarRegistro();
  });

  const mostrarMensaje = (el, texto) => {
    el.textContent = texto;
    el.hidden = false;
  };

  const mostrarErrorAuth = (el, msg) => {
    if (!el) return;
    const MENSAJES = {
      'auth/user-not-found':          'No hay cuenta con ese email.',
      'auth/wrong-password':          'Contraseña incorrecta.',
      'auth/invalid-credential':      'Email o contraseña incorrectos.',
      'auth/email-already-in-use':    'Ya existe una cuenta con ese email.',
      'auth/weak-password':           'La contraseña debe tener al menos 6 caracteres.',
      'auth/invalid-email':           'El email no es válido.',
      'auth/too-many-requests':       'Demasiados intentos. Esperá un momento.',
      'auth/popup-closed-by-user':    '',
      'auth/cancelled-popup-request': ''
    };
    const texto = MENSAJES[msg?.code] ?? MENSAJES[msg?.message] ?? (typeof msg === 'string' ? msg : 'Ocurrió un error. Intentá de nuevo.');
    if (!texto) { el.hidden = true; return; }
    el.textContent = texto;
    el.hidden = false;
  };

  const setAuthCargando = (cargando) => {
    if (authSubmit) authSubmit.disabled = cargando;
    if (authGoogle) authGoogle.disabled = cargando;
    if (authSubmitText) authSubmitText.textContent = cargando ? 'Cargando...' : (authModo === 'login' ? 'Iniciar sesión' : 'Crear cuenta');
    if (authSpinner) authSpinner.hidden = !cargando;
  };

  if (authPantalla && AteneaDB) {
    authPantalla.querySelectorAll('[data-auth-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        authModo = tab.dataset.authTab === 'registro' ? 'registro' : 'login';
        authPantalla.querySelectorAll('[data-auth-tab]').forEach(t => t.classList.toggle('auth__tab--activo', t === tab));
        const campoNombre = authPantalla.querySelector('.auth__campo--nombre');
        if (campoNombre) campoNombre.hidden = authModo === 'login';
        if (authSubmitText) authSubmitText.textContent = authModo === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
        if (authPass) authPass.autocomplete = authModo === 'login' ? 'current-password' : 'new-password';
        if (authError) authError.hidden = true;
        authOlvido.hidden = authModo !== 'login';
        authMensaje.hidden = true;
      });
    });

    authPantalla.querySelectorAll('[data-auth-toggle-pass]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!authPass) return;
        const show = authPass.type === 'password';
        authPass.type = show ? 'text' : 'password';
        btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
      });
    });

    authGoogle.addEventListener('click', async () => {
      setAuthCargando(true);
      if (authErrorG) authErrorG.hidden = true;
      try {
        await AteneaDB.auth.signInGoogle();
      } catch (e) {
        console.error('[APP] signInGoogle ERROR:', e.code, e.message);
        mostrarErrorAuth(authErrorG, e);
      } finally {
        setAuthCargando(false);
      }
    });

    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = authEmail?.value.trim();
      const pass  = authPass?.value;
      if (!email || !pass) return;
      setAuthCargando(true);
      if (authError) authError.hidden = true;
      try {
        if (authModo === 'registro') {
          await AteneaDB.auth.signUp(email, pass, authNombre?.value.trim());
        } else {
          await AteneaDB.auth.signIn(email, pass);
        }
      } catch (e) {
        mostrarErrorAuth(authError, e);
      } finally {
        setAuthCargando(false);
      }
    });

    // El mensaje es el mismo exista o no la cuenta, para no revelar qué emails están registrados.
    authOlvido.addEventListener('click', async () => {
      const email = authEmail.value.trim();
      authError.hidden = true;
      authMensaje.hidden = true;
      if (!email) {
        mostrarErrorAuth(authError, 'Escribí tu email arriba y volvé a tocar «¿Olvidaste tu contraseña?».');
        authEmail.focus();
        return;
      }
      authOlvido.disabled = true;
      try {
        await AteneaDB.auth.recuperarPassword(email);
        mostrarMensaje(authMensaje, `Si hay una cuenta con ${email}, te mandamos un link para crear una contraseña nueva.`);
      } catch (e) {
        if (e.code === 'auth/user-not-found') mostrarMensaje(authMensaje, `Si hay una cuenta con ${email}, te mandamos un link para crear una contraseña nueva.`);
        else mostrarErrorAuth(authError, e);
      } finally {
        authOlvido.disabled = false;
      }
    });

    $('#auth-verificar-listo').addEventListener('click', async ev => {
      const boton = ev.currentTarget;
      boton.disabled = true;
      verificarError.hidden = true;
      verificarMensaje.hidden = true;
      try {
        if (await AteneaDB.auth.comprobarVerificacion()) entrar(AteneaDB.auth.getUser());
        else mostrarErrorAuth(verificarError, 'Tu email todavía no figura como verificado. Tocá el link del email que te mandamos y probá de nuevo.');
      } catch (e) {
        mostrarErrorAuth(verificarError, e);
      } finally {
        boton.disabled = false;
      }
    });

    $('#auth-verificar-reenviar').addEventListener('click', async ev => {
      const boton = ev.currentTarget;
      boton.disabled = true;
      verificarError.hidden = true;
      try {
        await AteneaDB.auth.enviarVerificacion();
        mostrarMensaje(verificarMensaje, 'Te reenviamos el email. Puede tardar unos minutos en llegar.');
      } catch (e) {
        mostrarErrorAuth(verificarError, e.code === 'auth/too-many-requests'
          ? 'Ya te mandamos varios emails. Esperá unos minutos antes de pedir otro.'
          : e);
      } finally {
        boton.disabled = false;
      }
    });

    $('#auth-verificar-salir').addEventListener('click', async () => {
      await AteneaDB.auth.signOut();
      location.reload();
    });

    // Si verificó en otra pestaña (o en el celular), al volver entra solo.
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState !== 'visible' || elVerificar.hidden || !AteneaDB.auth.getUser()) return;
      try {
        if (await AteneaDB.auth.comprobarVerificacion()) entrar(AteneaDB.auth.getUser());
      } catch {}
    });
  }

  const dialogoEliminar = $('#dialogo-eliminar');
  const eliminarConfirmacion = $('#eliminar-confirmacion');
  const eliminarPass = $('#eliminar-pass');
  const eliminarBoton = $('#eliminar-confirmar');
  const eliminarError = $('#eliminar-error');

  const actualizarBotonEliminar = () => {
    eliminarBoton.disabled = eliminarConfirmacion.value.trim().toUpperCase() !== 'ELIMINAR'
      || (AteneaDB.auth.usaPassword() && !eliminarPass.value);
  };
  eliminarConfirmacion.addEventListener('input', actualizarBotonEliminar);
  eliminarPass.addEventListener('input', actualizarBotonEliminar);

  const abrirEliminarCuenta = () => {
    const conPassword = AteneaDB.auth.usaPassword();
    $('#eliminar-form').reset();
    $('#eliminar-campo-pass').hidden = !conPassword;
    $('#eliminar-ayuda-google').hidden = conPassword;
    eliminarError.hidden = true;
    eliminarBoton.textContent = 'Eliminar cuenta';
    actualizarBotonEliminar();
    dialogoEliminar.showModal();
    eliminarConfirmacion.focus();
  };

  eliminarBoton.addEventListener('click', async () => {
    eliminarBoton.disabled = true;
    eliminarBoton.textContent = 'Eliminando…';
    eliminarError.hidden = true;
    try {
      await AteneaDB.auth.eliminarCuenta(eliminarPass.value);
      try {
        Object.keys(localStorage).filter(k => k.startsWith(CLAVE)).forEach(k => localStorage.removeItem(k));
        sessionStorage.setItem(`${CLAVE}:cuenta-eliminada`, '1');
      } catch {}
      location.replace('/');
    } catch (e) {
      console.error('No se pudo eliminar la cuenta:', e);
      const MENSAJES = {
        'auth/wrong-password': 'La contraseña no es correcta.',
        'auth/invalid-credential': 'La contraseña no es correcta.',
        'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de confirmar. Probá de nuevo.',
        'auth/cancelled-popup-request': 'Cerraste la ventana de Google antes de confirmar. Probá de nuevo.',
        'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permitila y probá de nuevo.',
        'auth/user-mismatch': 'Elegiste otra cuenta de Google. Confirmá con la cuenta con la que iniciaste sesión.',
        'auth/too-many-requests': 'Demasiados intentos. Esperá un momento.'
      };
      eliminarError.textContent = MENSAJES[e.code] || 'No se pudo eliminar la cuenta. Revisá tu conexión y probá de nuevo.';
      eliminarError.hidden = false;
      eliminarBoton.textContent = 'Eliminar cuenta';
      actualizarBotonEliminar();
    }
  });

  const limpiarEstadoMemoria = () => {
    clearTimeout(temporizadorGuardado);
    temporizadorGuardado = null;
    renderPendiente = false;
    editando = false;
    invitado = false;
    invitadoIniciado = false;
    invitadoEdito = false;
    guardadoParaRegistro = false;
    if (dejarDeEscuchar) { dejarDeEscuchar(); dejarDeEscuchar = null; }
    if (dejarDeEscucharPortafolios) { dejarDeEscucharPortafolios(); dejarDeEscucharPortafolios = null; }
    propuestaId = null;
    portafolioId = null;
    propuestas = [];
    portafolios = [];
    perfil = null;
    logoCuenta = '';
    fotoCuenta = '';
    cuentaEditada = false;
    seguimientoAnterior = null;
    estado = vacio();
    estadoPortafolio = vacioPortafolio();
    seleccion = new Set();
    if ($('#documento')) $('#documento').innerHTML = '';
    if (elLista) elLista.innerHTML = '';
    if (elListaPortafolios) elListaPortafolios.innerHTML = '';
    if (menuUsuario) menuUsuario.textContent = '';
    if ($('#barra-avatar')) $('#barra-avatar').textContent = '';
  };

  const cerrarSesion = async () => {
    if (!AteneaDB) return;
    if (hayCambiosSinEnviar()) guardarAhora();
    // Cerrar sesión borra la caché local: antes hay que asegurar que todo llegó a la cuenta.
    const sincronizado = await Promise.race([
      ultimaEscritura.then(() => !escriturasPendientes),
      new Promise(res => setTimeout(() => res(false), 4000))
    ]);
    if (!sincronizado && nube() && !await confirmar({
      titulo: 'Hay cambios sin sincronizar',
      texto: 'Los últimos cambios todavía no llegaron a tu cuenta, probablemente por falta de conexión. Si cerrás sesión ahora, se pierden.',
      aceptar: 'Cerrar sesión igual'
    })) return;
    cerrandoSesion = true;
    limpiarEstadoMemoria();
    limpiarAlmacenamientoLocal();
    await AteneaDB.auth.signOut();
    location.replace('/');
  };


  const mostrarClientePortafolio = datos => {
    modoEditor = 'portafolio';
    estadoPortafolio = normalizarPf(datos);
    document.title = [estadoPortafolio.portafolio.titulo.trim() || 'Portfolio', estadoPortafolio.emisor.nombre.trim()].filter(Boolean).join(' · ');
    renderPortafolio();
  };

  const iniciarClientePortafolio = async () => {
    esCliente = true;
    modoEditor = 'portafolio';
    document.body.classList.add('modo-cliente');
    try {
      mostrarClientePortafolio(JSON.parse(await descomprimir(location.hash.slice(PREFIJO_PORTAFOLIO.length))));
    } catch {
      errorCliente('No pudimos abrir este portfolio', 'El link llegó incompleto o se cortó al copiarlo.');
    }
  };

  const iniciarClientePortafolioCorto = async id => {
    esCliente = true;
    modoEditor = 'portafolio';
    document.body.classList.add('modo-cliente');
    if (!id || !AteneaDB?.portfolios) {
      errorCliente('No pudimos abrir este portfolio', 'Revisá el link o tu conexión y recargá la página.');
      return;
    }
    try {
      const datos = await AteneaDB.portfolios.obtenerPublico(id);
      if (datos && datos.payload) {
        mostrarClientePortafolio(datos.payload);
      } else {
        errorCliente('Este portfolio ya no está disponible', 'Puede que el link se haya desactivado.');
      }
    } catch {
      errorCliente('No pudimos abrir este portfolio', 'Hubo un problema al conectar. Revisá tu conexión y recargá la página.');
    }
  };

  const esLinkCorto = location.pathname.startsWith('/p/');
  const esLinkPortafolioCorto = location.pathname.startsWith('/portafolio/');
  const esHashPortafolio = location.hash.startsWith(PREFIJO_PORTAFOLIO);
  const esClienteLink = location.hash.startsWith(PREFIJO) || esLinkCorto || esLinkPortafolioCorto || esHashPortafolio;

  if (!AteneaDB || esClienteLink) document.body.classList.remove('auth-cargando');

  if (esLinkPortafolioCorto) {
    iniciarClientePortafolioCorto((location.pathname.match(RUTA_PORTAFOLIO) || [])[1]);
  } else if (esHashPortafolio) {
    iniciarClientePortafolio();
  } else if (esLinkCorto) {
    iniciarClienteCorto((location.pathname.match(RUTA_LINK) || [])[1]);
  } else if (esClienteLink) {
    iniciarCliente();
  } else if (AteneaDB) {
    let editorIniciado = false;
    let ultimoUid = null;

    const mostrarAuth = () => {
      document.body.classList.remove('auth-cargando', 'invitado');
      if ($('#auth-cerrar')) $('#auth-cerrar').hidden = true;
      if ($('#auth-motivo')) $('#auth-motivo').hidden = true;
      authPantalla.hidden = false;
      document.body.classList.add('auth-activo');
    };

    // Cuentas con email y contraseña: hasta verificar el email no entran a la app
    // (las reglas de Firestore y Storage tampoco les permiten escribir).
    const mostrarVerificacion = user => {
      if (invitado) guardarCambiosDeInvitado();
      $('#auth-cerrar').hidden = true;
      $('#auth-verificar-email').textContent = user.email;
      elIngreso.hidden = true;
      elVerificar.hidden = false;
      mostrarAuth();
    };

    entrar = async user => {
      cerrandoSesion = false;
      elVerificar.hidden = true;
      elIngreso.hidden = false;
      authPantalla.hidden = true;
      document.body.classList.remove('auth-activo');
      if (invitado) {
        guardarCambiosDeInvitado();
        invitado = false;
        editando = false;
        document.body.classList.remove('invitado');
      }
      if (!editorIniciado || ultimoUid !== user.uid) {
        // Si había otra sesión abierta antes, limpiamos todo antes de iniciar la cuenta
        if (ultimoUid && ultimoUid !== user.uid) {
          limpiarEstadoMemoria();
          limpiarAlmacenamientoLocal();
        } else {
          limpiarEstadoMemoria();
        }
        editorIniciado = true;
        ultimoUid = user.uid;
        if (menuUsuario) menuUsuario.textContent = user.displayName || user.email;
        pintarAvatar(user);
        // El spinner sigue visible hasta saber qué mostrar, así no se ve un editor vacío.
        document.body.classList.add('auth-cargando');
        await iniciarConCuenta();
      } else {
        if (menuUsuario) menuUsuario.textContent = user.displayName || user.email;
        pintarAvatar(user);
      }
      document.body.classList.remove('auth-cargando');
    };

    AteneaDB.auth.onAuthChange(async user => {
      if (!user) {
        editorIniciado = false;
        ultimoUid = null;
        limpiarEstadoMemoria();
        limpiarAlmacenamientoLocal();
        // Sin sesión: la plataforma queda abierta en modo prueba (invitado) sin mostrar
        // jamás datos de sesiones anteriores. La cuenta se pide al compartir o guardar.
        iniciarInvitado();
        try {
          if (sessionStorage.getItem(`${CLAVE}:cuenta-eliminada`)) {
            sessionStorage.removeItem(`${CLAVE}:cuenta-eliminada`);
            avisar('Tu cuenta y todos tus datos se eliminaron.', 6000);
          }
        } catch {}
        return;
      }
      // Al volver desde el link del email, el usuario en memoria puede estar desactualizado.
      if (!user.emailVerified) {
        const verificado = await AteneaDB.auth.comprobarVerificacion().catch(() => false);
        if (!verificado) {
          mostrarVerificacion(user);
          return;
        }
      }
      entrar(user);
    });
  } else if (AteneaDBError) {
    authPantalla.hidden = false;
    document.body.classList.add('auth-activo');
    mostrarErrorAuth(authErrorG, AteneaDBError);
  } else {
    authPantalla.hidden = true;
    document.body.classList.remove('auth-activo');
    iniciarSinCuenta();
  }

  window.addEventListener('hashchange', () => {
    if (location.hash.startsWith(PREFIJO) || location.hash.startsWith(PREFIJO_PORTAFOLIO) || esCliente) location.reload();
  });
};

export function useDealitController(navigate) {
  const montadoRef = useRef(false);

  useEffect(() => {
    if (navigate) registrarNavegadorReact(navigate);
  }, [navigate]);

  useEffect(() => {
    if (montadoRef.current) return;
    montadoRef.current = true;
    inicializarControladorDealit();
  }, []);
}
