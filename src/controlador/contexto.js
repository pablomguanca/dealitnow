// Estado compartido del controlador de Dealit y utilidades que usan todos sus módulos.
// Cada módulo de src/controlador/ lee y escribe acá lo que comparte con los demás;
// lo que solo usa un módulo queda dentro de ese módulo.

import {
  vacio,
  vacioPortafolio,
  normalizarPropuesta,
  normalizarPortafolio,
  calcularTotales
} from '../modelo.js';
import {
  digitosWhatsApp as obtenerDigitosWhatsApp,
  armarEnlaceWhatsApp,
  armarEnlaceEmail
} from '../lib/render.js';

// La base la elige cada punto de entrada: la app del dueño usa Firebase completo
// (src/firebase.js) y la vista del cliente solo lectura pública (src/firebase-publico.js).
export let AteneaDB = null;
export let AteneaDBError = null;
export const usarBase = (db, error = null) => {
  AteneaDB = db;
  AteneaDBError = error;
};

export const CLAVE = 'generador-propuestas-v1';
export const CLAVE_PORTAFOLIOS = 'generador-portafolios-v1';
export { PREFIJO, PREFIJO_PORTAFOLIO, RUTA_LINK, RUTA_PORTAFOLIO } from '../lib/links-cliente.js';

export const ctx = {
  estado: vacio(),
  estadoPortafolio: vacioPortafolio(),
  modoEditor: 'propuesta', // 'propuesta' | 'portafolio'
  propuestaId: null,
  portafolioId: null,
  propuestas: [],
  portafolios: [],
  portafoliosCargando: false,
  portafoliosError: false,
  seleccion: new Set(),
  esCliente: false,
  // Link corto abierto por el cliente: { id, aceptacion }. aceptacion es null hasta que acepta.
  compartida: null,
  vista: 'escritorio',
  imprimiendo: false,
  perfil: null,

  // Guardado
  editando: false,
  temporizadorGuardado: null,
  escriturasPendientes: 0,
  ultimaEscritura: Promise.resolve(true),
  errorGuardado: '',
  avisoError: false,
  cerrandoSesion: false,
  renderPendiente: false,
  animacionInicialLista: false,

  // Sin sesión: editor de prueba que guarda en este navegador.
  invitado: false,
  invitadoEdito: false // si no cambió nada, el ejemplo no se guarda en su cuenta
};

export const docActivo = () => (ctx.modoEditor === 'portafolio' ? ctx.estadoPortafolio : ctx.estado);
export const aceptada = () => !!ctx.compartida?.aceptacion;
export const nube = () => (AteneaDB && AteneaDB.auth.getUser() ? AteneaDB : null);

export const esLogoValido = logo => /^data:image\//.test(logo)
  || (!!AteneaDB?.logos && logo.startsWith(AteneaDB.logos.prefijoURL));

export const normalizar = datos => normalizarPropuesta(datos, { logoValido: esLogoValido });
export const normalizarPf = datos => normalizarPortafolio(datos, { logoValido: esLogoValido });

export const calcular = (e = ctx.estado, sumados = ctx.seleccion) => calcularTotales(e, sumados);
export const digitosWhatsApp = (em = docActivo().emisor) => obtenerDigitosWhatsApp(em);
export const enlaceWhatsApp = (mensaje, em = docActivo().emisor) => armarEnlaceWhatsApp(mensaje, em);
export const enlaceEmail = (asunto, mensaje, em = docActivo().emisor) => armarEnlaceEmail(asunto, mensaje, em);
export const nombreEmisor = (em = docActivo().emisor) => (em?.nombre || '').trim();
export const tituloPropuesta = () => ctx.estado.propuesta.titulo.trim() || 'la propuesta';
export const tituloPortafolio = () => ctx.estadoPortafolio.portafolio.titulo.trim() || ctx.estadoPortafolio.portafolio.nombreInterno.trim() || 'tu portfolio';
