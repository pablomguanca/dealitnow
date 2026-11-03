// Versiones guardadas: el dueño guarda una versión de la propuesta o el portfolio abierto y
// puede volver a cualquiera. También se guarda una sola al enviar la propuesta y antes de
// restaurar otra, así nunca se pierde nada. Reemplaza a los borradores en archivo .json:
// esos archivos viejos se pueden seguir abriendo desde Mi cuenta.

import { $, esc, texto } from '../lib/formato.js';
import { fechaDe, haceCuanto } from '../lib/paneles.js';
import { ctx, AteneaDB, docActivo, nube, normalizar, normalizarPf } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarExito, avisarError, confirmar } from './avisos.js';
import {
  AVISO_PESADA,
  datosParaGuardar,
  datosPortafolioParaGuardar,
  guardarAhora,
  hayCambiosSinEnviar,
  registrarEscritura
} from './guardado.js';
import { llenarFormulario, reemplazarEstado } from './formulario.js';
import { actualizar } from './documento.js';
import { nuevaPropuesta } from './propuestas.js';
import { nuevoPortafolio } from './portafolios.js';
import { abrirRegistro } from './sesion.js';

const MOTIVOS = {
  manual: 'Guardada por vos',
  enviada: 'Versión enviada al cliente',
  'antes-de-restaurar': 'Antes de restaurar otra versión'
};

let versiones = [];

const esPortafolio = () => ctx.modoEditor === 'portafolio';
const coleccion = () => (esPortafolio() ? 'portfolios' : 'proposals');
const idActual = () => (esPortafolio() ? ctx.portafolioId : ctx.propuestaId);

// Las versiones viven en la cuenta: hace falta sesión y que el documento esté guardado en ella.
const disponible = () => !!(nube() && AteneaDB?.versiones && idActual()
  && (!esPortafolio() || (AteneaDB.portfolios && /^[A-Za-z0-9]{20}$/.test(ctx.portafolioId))));

const fechaVersion = v => fechaDe(v.createdAt);
// «2 de noviembre, 19:51»
const fechaTexto = fecha => (fecha
  ? `${fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}, ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`
  : 'recién');

// Guarda una copia del documento abierto. Devuelve la escritura, o null si no se pudo.
export const guardarVersion = (motivo = 'manual') => {
  if (!disponible()) return null;
  if (hayCambiosSinEnviar()) guardarAhora();
  const actual = docActivo();
  const datos = esPortafolio() ? datosPortafolioParaGuardar(actual) : datosParaGuardar(actual);
  if (!datos) {
    avisarError(AVISO_PESADA, 7000);
    return null;
  }
  return registrarEscritura(
    AteneaDB.versiones.crear(coleccion(), idActual(), { payload: datos.payload, title: datos.title, motivo }),
    'No se pudo guardar la versión en tu cuenta.'
  );
};

const versionHTML = v => {
  const fecha = fechaVersion(v);
  const titulo = texto(v.title).trim() || 'Sin título';
  return `
    <li class="version">
      <div class="version__datos">
        <span class="version__motivo">${esc(MOTIVOS[v.motivo] || MOTIVOS.manual)}</span>
        <span class="version__fecha">${esc(fechaTexto(fecha))}${fecha ? ` · ${esc(haceCuanto(fecha))}` : ''}</span>
        <span class="version__titulo">${esc(titulo)}</span>
      </div>
      <button type="button" class="boton boton--secundario boton--chico" data-accion="restaurar-version" data-id="${esc(v.id)}">Restaurar</button>
    </li>`;
};

const abrirVersiones = async () => {
  if (!disponible()) {
    avisar('Las versiones se guardan en tu cuenta. Iniciá sesión para usarlas.');
    return;
  }
  const dialogo = $('#dialogo-versiones');
  const lista = $('#versiones-lista');
  const estado = $('#versiones-estado');
  $('#versiones-titulo').textContent = esPortafolio() ? 'Versiones del portfolio' : 'Versiones de la propuesta';
  lista.innerHTML = '';
  estado.textContent = 'Cargando versiones…';
  estado.hidden = false;
  dialogo.showModal();
  try {
    versiones = await AteneaDB.versiones.listar(coleccion(), idActual());
    lista.innerHTML = versiones.map(versionHTML).join('');
    estado.hidden = versiones.length > 0;
    estado.textContent = 'Todavía no guardaste versiones. Tocá «Guardar versión» para tener una copia a la que puedas volver cuando quieras.';
  } catch (e) {
    console.error('No se pudieron cargar las versiones:', e);
    estado.textContent = 'No pudimos cargar las versiones. Revisá tu conexión y probá de nuevo.';
  }
};

const restaurarVersion = async id => {
  const v = versiones.find(x => x.id === id);
  if (!v) return;
  const fecha = fechaTexto(fechaVersion(v));
  const conLink = !esPortafolio() && ctx.propuestas.find(p => p.id === ctx.propuestaId)?.publico;
  const ok = await confirmar({
    titulo: '¿Volver a esta versión?',
    texto: `Vas a recuperar la versión del ${fecha}. Antes guardamos lo que tenés ahora como otra versión, así podés volver si cambiás de idea.${conLink ? ' Tu cliente va a ver esta versión en el mismo link.' : ''}`,
    aceptar: 'Restaurar versión'
  });
  if (!ok) return;
  $('#dialogo-versiones').close();
  guardarVersion('antes-de-restaurar');
  if (esPortafolio()) {
    ctx.estadoPortafolio = normalizarPf(v.payload);
    llenarFormulario();
    actualizar();
  } else {
    const restaurada = normalizar(v.payload);
    // Una versión sin logo conserva el logo que ya tenía la propuesta.
    if (!restaurada.emisor.logo && ctx.estado.emisor.logo) restaurada.emisor.logo = ctx.estado.emisor.logo;
    reemplazarEstado(restaurada);
  }
  guardarAhora();
  avisarExito(`Listo, volviste a la versión del ${fecha}.`);
};

// Borradores en archivo (.json) de la versión anterior de Dealit: se abren como
// propuesta o portfolio nuevo en la cuenta.
const abrirArchivoViejo = archivo => {
  const lector = new FileReader();
  lector.onload = () => {
    let crudo;
    try {
      crudo = JSON.parse(lector.result);
    } catch {
      avisarError('Ese archivo no es un borrador de Dealit. Elegí un archivo .json que hayas guardado desde Dealit.');
      return;
    }
    if (crudo && (crudo.tipo === 'portafolio' || crudo.portafolio)) {
      nuevoPortafolio(normalizarPf(crudo), { conDatosDeCuenta: false });
      avisarExito('Abrimos el portfolio del archivo. Ya quedó guardado en tu cuenta.');
    } else {
      nuevaPropuesta(normalizar(crudo));
      avisarExito('Abrimos la propuesta del archivo. Ya quedó guardada en tu cuenta.');
    }
  };
  lector.onerror = () => avisarError('No se pudo leer el archivo. Probá de nuevo.');
  lector.readAsText(archivo);
};

export const instalarVersiones = () => {
  const campoArchivo = $('#campo-borrador');
  campoArchivo?.addEventListener('change', () => {
    const archivo = campoArchivo.files[0];
    campoArchivo.value = '';
    if (archivo) abrirArchivoViejo(archivo);
  });

  registrarAcciones({
    'guardar-version': async () => {
      if (ctx.invitado) {
        abrirRegistro('guardar');
        return;
      }
      if (!disponible()) {
        avisar('Las versiones se guardan en tu cuenta. Iniciá sesión para usarlas.');
        return;
      }
      if (guardarVersion('manual')) avisarExito('Versión guardada. La encontrás en «Versiones anteriores».');
    },
    'ver-versiones': () => abrirVersiones(),
    'restaurar-version': boton => restaurarVersion(boton.dataset.id),
    'abrir-archivo-viejo': () => campoArchivo?.click()
  });
};
