// Guardado en la cuenta: cada propuesta es un documento en Firestore (proposals/{id}) y
// cada portfolio otro (portfolios/{id}). Sin cuenta, lo armado queda en esta pestaña.

import { $ } from '../lib/formato.js';
import { uid, resumenPortafolio } from '../modelo.js';
import {
  ctx,
  AteneaDB,
  CLAVE,
  CLAVE_PORTAFOLIOS,
  nube,
  normalizar,
  normalizarPf,
  calcular
} from './contexto.js';
import { avisarExito, avisarError } from './avisos.js';
import { actualizarSelectorPortafolio } from './formulario.js';

const GUARDADO_ESPERA = 800;
const PAYLOAD_MAX = 900000; // Firestore admite hasta 1 MiB por documento
export const AVISO_PESADA = 'La propuesta es demasiado pesada para guardarse. Probá con un logo o fotos más livianos.';

const leerLocal = clave => {
  try {
    const crudo = sessionStorage.getItem(clave);
    return crudo ? normalizar(JSON.parse(crudo)) : null;
  } catch {
    return null;
  }
};

// Sin cuenta, el borrador de prueba vive solo en la pestaña actual (sessionStorage).
export const cargarGuardado = () => leerLocal(CLAVE);

export const mostrarEstadoGuardado = () => {
  const elEstado = $('#estado-guardado');
  if (!elEstado || ctx.esCliente) return;
  if (ctx.errorGuardado) elEstado.textContent = ctx.errorGuardado;
  else if (!nube()) elEstado.textContent = 'Los cambios se guardan en este navegador.';
  else if (ctx.escriturasPendientes && !navigator.onLine) elEstado.textContent = 'Sin conexión: los cambios se suben a tu cuenta cuando vuelva.';
  else if (ctx.temporizadorGuardado || ctx.escriturasPendientes) elEstado.textContent = 'Guardando…';
  else elEstado.textContent = 'Cambios guardados en tu cuenta.';
};

const fallarGuardado = mensaje => {
  ctx.errorGuardado = mensaje;
  if (!ctx.avisoError) {
    ctx.avisoError = true;
    avisarError(mensaje, 7000);
  }
};

// Resumen que se guarda junto al contenido para poder listar sin abrir cada propuesta.
// Devuelve null si la propuesta no entra en un documento de Firestore.
export const datosParaGuardar = e => {
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

export const datosPortafolioParaGuardar = pf => {
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

export const cargarPortafoliosLocales = () => {
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
  } catch { }
  return [];
};

export const guardarPortafoliosLocales = () => {
  if (ctx.cerrandoSesion || (AteneaDB && !ctx.invitado)) return;
  try {
    sessionStorage.setItem(CLAVE_PORTAFOLIOS, JSON.stringify(ctx.portafolios));
    ctx.errorGuardado = '';
  } catch {
    fallarGuardado('No se pudo guardar el portfolio en este navegador. Creá tu cuenta gratis para no perder los cambios.');
  }
  mostrarEstadoGuardado();
};

// Todas las escrituras pasan por acá: así el estado de guardado y el cierre de
// sesión saben si queda algo por llegar al servidor.
export const registrarEscritura = (promesa, mensajeError) => {
  ctx.escriturasPendientes++;
  mostrarEstadoGuardado();
  const resultado = promesa
    .then(() => {
      ctx.errorGuardado = '';
      ctx.avisoError = false;
      return true;
    })
    .catch(e => {
      console.error(mensajeError, e);
      fallarGuardado(mensajeError);
      return false;
    })
    .finally(() => {
      ctx.escriturasPendientes--;
      mostrarEstadoGuardado();
    });
  ctx.ultimaEscritura = resultado;
  return resultado;
};

export const guardarLocal = () => {
  if (ctx.cerrandoSesion || (AteneaDB && !ctx.invitado)) return;
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(ctx.estado));
    ctx.errorGuardado = '';
  } catch {
    fallarGuardado('No se pudo guardar en este navegador. Creá tu cuenta gratis para no perder los cambios.');
  }
  mostrarEstadoGuardado();
};

export const limpiarAlmacenamientoLocal = () => {
  try {
    localStorage.removeItem(CLAVE);
    localStorage.removeItem(CLAVE_PORTAFOLIOS);
    Object.keys(localStorage)
      .filter(k => k.startsWith(`${CLAVE}:borrador:`))
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.removeItem(CLAVE);
    sessionStorage.removeItem(CLAVE_PORTAFOLIOS);
    sessionStorage.removeItem(`${CLAVE}:continuar`);
  } catch { }
};

export const sincronizarPortafolioEnPropuesta = () => {
  const { estado } = ctx;
  const pfId = estado.opciones?.portafolioId || '';
  if (!pfId) {
    if (estado.opciones) delete estado.opciones.portafolio;
    return;
  }
  const pfDoc = ctx.portafolios.find(x => x.id === pfId);
  if (pfDoc) {
    estado.opciones.portafolio = resumenPortafolio(pfDoc.payload, pfDoc.id, pfDoc.publico);
  } else if (!ctx.portafoliosCargando) {
    estado.opciones.portafolioId = '';
    if (estado.opciones) delete estado.opciones.portafolio;
  }
};

export const guardarAhora = () => {
  clearTimeout(ctx.temporizadorGuardado);
  ctx.temporizadorGuardado = null;
  if (!ctx.editando || ctx.cerrandoSesion) return;
  const db = nube();
  if (ctx.modoEditor === 'portafolio') {
    const datosPf = datosPortafolioParaGuardar(ctx.estadoPortafolio);
    if (!datosPf) {
      fallarGuardado(AVISO_PESADA);
      mostrarEstadoGuardado();
      return;
    }
    const { portafolioId, portafolios } = ctx;
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
  if (!ctx.propuestaId) return;
  const datos = datosParaGuardar(ctx.estado);
  if (!datos) {
    fallarGuardado(AVISO_PESADA);
    mostrarEstadoGuardado();
    return;
  }
  return registrarEscritura(
    db.proposals.actualizar(ctx.propuestaId, datos),
    'No se pudieron guardar los últimos cambios en tu cuenta. Revisá tu conexión y probá de nuevo.'
  );
};

export const guardarLuego = () => {
  if (ctx.esCliente || !ctx.editando) return;
  clearTimeout(ctx.temporizadorGuardado);
  ctx.temporizadorGuardado = setTimeout(guardarAhora, nube() ? GUARDADO_ESPERA : 400);
  mostrarEstadoGuardado();
};

// Si la pestaña se oculta o se cierra, no esperar al temporizador ni al próximo
// cuadro de animación (en pestañas ocultas no llega nunca).
export const hayCambiosSinEnviar = () => ctx.editando && !ctx.esCliente && (ctx.temporizadorGuardado || ctx.renderPendiente);

// Crea una propuesta en la cuenta. El ID sale del cliente, así se puede abrir
// y seguir editando sin esperar al servidor (y sin conexión).
export const crearEnCuenta = e => {
  const datos = datosParaGuardar(e);
  if (!datos) {
    avisarError(AVISO_PESADA, 7000);
    return null;
  }
  const id = AteneaDB.proposals.nuevoId();
  const listo = registrarEscritura(AteneaDB.proposals.crear(datos, id), 'No se pudo crear la propuesta en tu cuenta.');
  return { id, listo };
};

export const crearPortafolioEnCuentaOLocal = pf => {
  const datos = datosPortafolioParaGuardar(pf);
  if (!datos) {
    avisarError(AVISO_PESADA, 7000);
    return null;
  }
  if (nube() && AteneaDB?.portfolios) {
    const id = AteneaDB.portfolios.nuevoId();
    const listo = registrarEscritura(AteneaDB.portfolios.crear(datos, id), 'No se pudo crear el portfolio en tu cuenta.');
    return { id, listo };
  }
  if (!ctx.portafolios.length) ctx.portafolios = cargarPortafoliosLocales();
  const id = 'pf-' + uid();
  ctx.portafolios.unshift({ id, ...datos, publico: true, updatedAt: new Date().toISOString() });
  guardarPortafoliosLocales();
  return { id, listo: Promise.resolve(true) };
};

// Migración única: lo que la versión anterior guardaba en el navegador pasa a la
// cuenta, y se borra del navegador recién cuando el servidor confirmó la copia.
// Devuelve { id, contenido } de la propuesta creada, o null si no había nada que migrar.
export const migrarLocal = () => {
  let continuar = null;
  try { continuar = sessionStorage.getItem(`${CLAVE}:continuar`); } catch { }
  const contenido = continuar ? cargarGuardado() : null;
  try {
    localStorage.removeItem(CLAVE);
    localStorage.removeItem(CLAVE_PORTAFOLIOS);
    sessionStorage.removeItem(CLAVE);
    sessionStorage.removeItem(CLAVE_PORTAFOLIOS);
  } catch { }
  if (!contenido) return null;
  const creada = crearEnCuenta(contenido);
  if (!creada) return null;
  avisarExito('Guardamos en tu cuenta la propuesta que armaste.', 6000);
  return { id: creada.id, contenido };
};

export const instalarGuardado = () => {
  window.addEventListener('online', mostrarEstadoGuardado);
  window.addEventListener('offline', mostrarEstadoGuardado);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && hayCambiosSinEnviar()) guardarAhora();
  });
  window.addEventListener('beforeunload', ev => {
    if (hayCambiosSinEnviar()) guardarAhora();
    if (ctx.escriturasPendientes && navigator.onLine) {
      ev.preventDefault();
      ev.returnValue = '';
    }
  });
};
