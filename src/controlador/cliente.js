// Vista del cliente: abre la propuesta o el portfolio que le compartieron, por link
// corto (/p/<id>, /portafolio/<id>, leído de la cuenta de quien lo mandó) o por link
// largo (#p=…, #f=…, con el contenido comprimido dentro del link).

import { $, esc } from '../lib/formato.js';
import { descomprimir } from '../link.js';
import {
  ctx,
  AteneaDB,
  PREFIJO,
  PREFIJO_PORTAFOLIO,
  RUTA_LINK,
  RUTA_PORTAFOLIO,
  normalizar,
  normalizarPf
} from './contexto.js';
import { renderDocumento, renderPortafolio } from './vista.js';
import { registrarVisita } from './aceptar.js';

const LINK_INCOMPLETO = 'El link llegó incompleto o se cortó al copiarlo. Pedile a quien te lo mandó que lo comparta de nuevo.';
const SIN_CONEXION = 'Hubo un problema al conectar. Revisá tu conexión y recargá la página.';

const errorCliente = (titulo, mensaje) => {
  $('#documento').innerHTML = `
    <div class="doc-error">
      <div>
        <h1>${esc(titulo)}</h1>
        <p>${esc(mensaje)}</p>
      </div>
    </div>`;
};

const entrarComoCliente = modo => {
  ctx.esCliente = true;
  ctx.modoEditor = modo;
  document.body.classList.add('modo-cliente');
};

const mostrarCliente = datos => {
  ctx.estado = normalizar(datos);
  const { estado } = ctx;
  const destinatario = estado.cliente.empresa.trim() || estado.cliente.nombre.trim();
  document.title = [estado.propuesta.titulo.trim() || 'Propuesta', destinatario ? `para ${destinatario}` : ''].filter(Boolean).join(' ');
  renderDocumento();
};

const mostrarClientePortafolio = datos => {
  ctx.modoEditor = 'portafolio';
  ctx.estadoPortafolio = normalizarPf(datos);
  const { portafolio, emisor } = ctx.estadoPortafolio;
  document.title = [portafolio.titulo.trim() || 'Portfolio', emisor.nombre.trim()].filter(Boolean).join(' · ');
  renderPortafolio();
};

// Link largo (#p=…): la propuesta viaja comprimida dentro del propio link.
const iniciarCliente = async () => {
  entrarComoCliente('propuesta');
  try {
    mostrarCliente(JSON.parse(await descomprimir(location.hash.slice(PREFIJO.length))));
  } catch {
    errorCliente('No pudimos abrir esta propuesta', LINK_INCOMPLETO);
  }
};

// Link corto (/p/<id>): la propuesta se lee de la cuenta de quien la mandó,
// siempre en su última versión, mientras el link esté activo.
const iniciarClienteCorto = async id => {
  entrarComoCliente('propuesta');
  if (!id) {
    errorCliente('No pudimos abrir esta propuesta', LINK_INCOMPLETO);
    return;
  }
  if (!AteneaDB) {
    errorCliente('No pudimos abrir esta propuesta', SIN_CONEXION);
    return;
  }
  try {
    const datos = await AteneaDB.proposals.obtenerPublica(id);
    if (datos) {
      ctx.compartida = { id, aceptacion: datos.aceptacion, marca: datos.marca === true };
      // Aceptada: se muestra la versión que se aceptó, con los opcionales elegidos.
      if (datos.aceptacion) ctx.seleccion = new Set((datos.aceptacion.opcionales || []).map(o => o.id));
      mostrarCliente(datos.aceptacion?.contenido || datos.payload);
      registrarVisita(id);
    } else errorCliente('Esta propuesta ya no está disponible', 'Puede que el link se haya desactivado. Pedile a quien te la mandó que te comparta uno nuevo.');
  } catch (e) {
    console.error('No se pudo abrir la propuesta compartida:', e);
    errorCliente('No pudimos abrir esta propuesta', SIN_CONEXION);
  }
};

const iniciarClientePortafolio = async () => {
  entrarComoCliente('portafolio');
  try {
    mostrarClientePortafolio(JSON.parse(await descomprimir(location.hash.slice(PREFIJO_PORTAFOLIO.length))));
  } catch {
    errorCliente('No pudimos abrir este portfolio', 'El link llegó incompleto o se cortó al copiarlo.');
  }
};

const iniciarClientePortafolioCorto = async id => {
  entrarComoCliente('portafolio');
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
    errorCliente('No pudimos abrir este portfolio', SIN_CONEXION);
  }
};

export const iniciarVistaCliente = tipo => {
  if (tipo === 'portafolio-corto') iniciarClientePortafolioCorto((location.pathname.match(RUTA_PORTAFOLIO) || [])[1]);
  else if (tipo === 'portafolio-largo') iniciarClientePortafolio();
  else if (tipo === 'propuesta-corto') iniciarClienteCorto((location.pathname.match(RUTA_LINK) || [])[1]);
  else iniciarCliente();
};
