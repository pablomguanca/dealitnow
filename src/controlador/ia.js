// «Contale tu propuesta» (dictado + IA). El dictado usa el reconocimiento de voz del
// navegador (gratis, no sale audio de la compu) y, en la app de Android, el del sistema
// (complemento Dictado de nativo.js, porque la ventana web de la app no trae el de Chrome); el texto va a /api/ia-propuesta, que arma
// la propuesta con la IA (Gemini). Acá se abre el diálogo, se dicta y se crea la propuesta.
// El mismo diálogo, en modo «editar», es «Editar con IA»: el dueño pide un cambio sobre la
// propuesta abierta, el servidor devuelve solo las secciones que cambian (src/ia-editar.js)
// y acá se muestran para elegir cuáles aplicar. Antes de aplicar se guarda una versión.

import { $, esc } from '../lib/formato.js';
import { LIMITE_IA_GRATIS, TEXTO_MIN, usosIADelMes } from '../ia.js';
import {
  LIMITE_EDICION_GRATIS, PEDIDO_MIN, SECCIONES_EDICION,
  aplicarCambios, contenidoParaEditar, detalleCambio, usosEdicionDelMes
} from '../ia-editar.js';
import { mesDe } from '../planes.js';
import { vacio } from '../modelo.js';
import { ctx, nube, normalizar } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarError, avisarExito } from './avisos.js';
import { llamarApi } from './api.js';
import { nuevaPropuesta } from './propuestas.js';
import { emisorDeCuenta } from './cuenta.js';
import { ofrecerPro, restriccionesActivas } from './plan.js';
import { abrirRegistro } from './sesion.js';
import { reemplazarEstado } from './formulario.js';
import { guardarAhora } from './guardado.js';
import { guardarVersion } from './versiones.js';
import { dictadoNativo, dictadoNativoDisponible, esAppNativa } from '../nativo.js';

const Reconocimiento = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

// Con qué se dicta: 'nativo' (app de Android con el complemento), 'web' (navegador) o null.
// En la app sin el complemento (instalada antes) el de la ventana web no anda: se escribe.
const motorDictado = () => {
  if (dictadoNativoDisponible()) return 'nativo';
  if (esAppNativa()) return null;
  return Reconocimiento ? 'web' : null;
};

const EJEMPLO = 'Propuesta para Café Molino, una cafetería de Palermo que abre su segundo local. Quieren renovar la marca: logo nuevo, paleta y tipografías, menú impreso y plantillas para Instagram. El logo con tres propuestas y dos rondas de cambios, 450.000 pesos. Menú y plantillas 280.000. Todo en tres semanas. Mitad para arrancar y mitad al entregar. Ofreceles también la señalética del local nuevo y un mes de contenido para redes.';

const EJEMPLO_EDICION = 'Bajá 10 % todos los precios, sumá como opcional un mes de mantenimiento a 80.000 pesos y pasá la validez a 30 días.';

// Textos del diálogo en cada modo: «crear» (armar una propuesta nueva) o «editar».
const TEXTOS = {
  crear: {
    marca: 'Nuevo en Dealit',
    titulo: 'Contale tu propuesta',
    bajada: 'Hablá como si se lo contaras a un colega: qué trabajo es, para quién, qué incluye, cuánto cobrás y en qué plazo. Armamos la propuesta completa y vos la revisás antes de enviarla.',
    etiqueta: 'Lo que contaste',
    ejemplo: 'Ej.: Reforma del baño de Javier Ruiz en Palermo. Demolición, cerámica nueva en piso y paredes, sanitarios y grifería. Unos 15 días. Mano de obra 1.200.000 pesos, materiales aparte. 50 % de seña. Ofrecele también cambiar el termotanque.',
    boton: 'Armar mi propuesta',
    voz: 'Tocá el micrófono y contá el trabajo',
    detalle: 'O escribilo abajo. Podés corregir el texto antes de armar la propuesta.'
  },
  editar: {
    marca: 'Editar con IA',
    titulo: '¿Qué querés cambiar?',
    bajada: 'Pedilo con tus palabras: «bajá 10 % los precios», «sumá una etapa de capacitación», «acortá el contexto». Te mostramos cada cambio antes de aplicarlo.',
    etiqueta: 'Lo que querés cambiar',
    ejemplo: 'Ej.: Sumá como opcional el mantenimiento mensual a 80.000 pesos y pasá la validez a 30 días.',
    boton: 'Ver los cambios',
    voz: 'Tocá el micrófono y pedí el cambio',
    detalle: 'O escribilo abajo. Antes de aplicar, revisás cada cambio.'
  }
};

const PASOS_EDICION = ['Leyendo tu propuesta…', 'Entendiendo lo que pediste…', 'Haciendo los cambios…', 'Revisando precios y pagos…', 'Últimos detalles…'];

let modo = 'crear';
const borradores = { crear: '', editar: '' };
// Lo que devolvió la IA al editar, mientras el dueño elige qué aplicar.
let propuestos = null;

const PASOS = ['Leyendo lo que contaste…', 'Separando servicios y precios…', 'Sumando opcionales que suben el ticket…', 'Escribiendo condiciones y pasos…', 'Eligiendo el diseño…', 'Últimos detalles…'];

let reconocimiento = null;
let escuchando = false;
let textoBase = '';
let inicioDictado = 0;
let reloj = null;
let generando = false;
let sesionNativa = null;

const pintarVoz = () => {
  const boton = $('#ia-microfono');
  if (!boton) return;
  boton.setAttribute('aria-pressed', String(escuchando));
  boton.classList.toggle('dialogo-ia__microfono--activo', escuchando);
  $('#ia-microfono-texto').textContent = escuchando ? 'Terminar de dictar' : 'Empezar a dictar';
  if (!motorDictado()) {
    boton.hidden = true;
    $('#ia-voz-titulo').textContent = 'Escribí el trabajo con tus palabras';
    $('#ia-voz-detalle').textContent = 'Este navegador no permite dictar. En el celular, usá el micrófono del teclado.';
    return;
  }
  if (escuchando) {
    const s = Math.floor((Date.now() - inicioDictado) / 1000);
    $('#ia-voz-titulo').textContent = `Te escucho… ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    $('#ia-voz-detalle').textContent = 'Contá con tus palabras. Tocá de nuevo el micrófono cuando termines.';
  } else {
    $('#ia-voz-titulo').textContent = $('#ia-texto').value.trim() ? 'Listo. Revisá el texto o seguí dictando' : TEXTOS[modo].voz;
    $('#ia-voz-detalle').textContent = TEXTOS[modo].detalle;
  }
};

const pintarContador = () => {
  const n = $('#ia-texto').value.trim().length;
  const minimo = modo === 'editar' ? PEDIDO_MIN : TEXTO_MIN;
  $('#ia-contador').textContent = n && n < minimo ? (modo === 'editar' ? 'Contá un poco más qué querés cambiar' : 'Contá un poco más del trabajo') : '';
};

const detenerDictado = () => {
  escuchando = false;
  clearInterval(reloj);
  try { reconocimiento?.stop(); } catch { }
  sesionNativa?.detener();
  sesionNativa = null;
  pintarVoz();
};

const arrancarReloj = () => {
  escuchando = true;
  inicioDictado = Date.now();
  clearInterval(reloj);
  reloj = setInterval(pintarVoz, 500);
  pintarVoz();
};

const ERRORES_DICTADO_NATIVO = {
  'sin-permiso': 'Para dictar, permití el micrófono para Dealit en los ajustes del celular. También podés escribirlo.',
  'sin-conexion': 'Para dictar hace falta conexión a internet. También podés escribirlo.',
  'no-disponible': 'Este celular no tiene reconocimiento de voz. Escribilo o usá el micrófono del teclado.'
};

// App de Android: cada frase que Android cierra se fija en el texto; lo que va diciendo se
// muestra al final mientras habla.
const empezarDictadoNativo = async () => {
  const campo = $('#ia-texto');
  textoBase = campo.value.trim() ? `${campo.value.trim()} ` : '';
  const mostrar = provisorio => {
    campo.value = `${textoBase}${provisorio}`.slice(0, 4000);
    pintarContador();
  };
  arrancarReloj();
  try {
    const sesion = await dictadoNativo({
      alParcial: mostrar,
      alFinal: texto => {
        mostrar(texto);
        textoBase = campo.value.trim() ? `${campo.value.trim()} ` : '';
      },
      alError: codigo => avisarError(ERRORES_DICTADO_NATIVO[codigo] || 'No pudimos seguir escuchando. Probá de nuevo o escribilo.'),
      alFin: () => {
        sesionNativa = null;
        if (escuchando) detenerDictado();
      }
    });
    // Si tocó «Terminar» mientras arrancaba, se corta enseguida.
    if (escuchando) sesionNativa = sesion;
    else sesion.detener();
  } catch (e) {
    escuchando = false;
    clearInterval(reloj);
    pintarVoz();
    avisarError(ERRORES_DICTADO_NATIVO[e?.code] || 'No pudimos usar el micrófono. Probá escribirlo.');
  }
};

const empezarDictado = () => {
  const motor = motorDictado();
  if (!motor || generando) return;
  if (motor === 'nativo') {
    empezarDictadoNativo();
    return;
  }
  reconocimiento = new Reconocimiento();
  reconocimiento.lang = 'es-AR';
  reconocimiento.continuous = true;
  reconocimiento.interimResults = true;
  const campo = $('#ia-texto');
  textoBase = campo.value.trim() ? `${campo.value.trim()} ` : '';
  // Cada resultado trae todo lo dicho en esta sesión: lo final se fija y lo provisorio se
  // muestra al final mientras habla.
  reconocimiento.onresult = ev => {
    let final = '';
    let provisorio = '';
    for (const r of ev.results) {
      if (r.isFinal) final += r[0].transcript;
      else provisorio += r[0].transcript;
    }
    campo.value = `${textoBase}${final}${provisorio}`.slice(0, 4000);
    pintarContador();
  };
  reconocimiento.onerror = ev => {
    if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
      avisarError('Para dictar, permití el uso del micrófono en tu navegador. También podés escribirlo.');
    } else if (ev.error === 'no-speech') {
      avisar('No escuchamos nada. Probá acercarte al micrófono.');
    }
    detenerDictado();
  };
  reconocimiento.onend = () => {
    // Algunos navegadores cortan solos después de un silencio: si seguía dictando, se reanuda.
    if (escuchando) {
      textoBase = campo.value.trim() ? `${campo.value.trim()} ` : '';
      try { reconocimiento.start(); } catch { detenerDictado(); }
    }
  };
  try {
    reconocimiento.start();
  } catch {
    avisarError('No pudimos usar el micrófono. Probá escribirlo.');
    return;
  }
  arrancarReloj();
};

// Cupo del mes: en Gratis se muestra cuántas quedan.
const pintarCupo = () => {
  const el = $('#ia-cupo');
  if (!el) return;
  if (!restriccionesActivas()) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  if (modo === 'editar') {
    const restan = Math.max(0, LIMITE_EDICION_GRATIS - usosEdicionDelMes(ctx.plan, mesDe()));
    el.textContent = restan
      ? `Te ${restan === 1 ? 'queda 1 edición' : `quedan ${restan} ediciones`} con IA este mes en el plan Gratis.`
      : 'Usaste tus ediciones con IA de este mes. Con Pro son ilimitadas.';
    return;
  }
  const quedan = Math.max(0, LIMITE_IA_GRATIS - usosIADelMes(ctx.plan, mesDe()));
  el.textContent = quedan
    ? `Te ${quedan === 1 ? 'queda 1 propuesta' : `quedan ${quedan} propuestas`} con IA este mes en el plan Gratis.`
    : 'Usaste tus propuestas con IA de este mes. Con Pro son ilimitadas.';
};

const mostrarProgreso = activo => {
  generando = activo;
  $('#ia-progreso').hidden = !activo;
  $('#ia-generar').disabled = activo;
  $('#ia-texto').readOnly = activo;
  $('#ia-microfono').disabled = activo;
};

const MENSAJES_ERROR = {
  'texto-corto': 'Contá un poco más del trabajo: qué incluye, para quién y cuánto cobrás.',
  'texto-largo': 'El texto es muy largo. Resumilo un poco (hasta 4.000 caracteres).',
  'ia-no-configurada': 'La IA todavía no está disponible. Probá más tarde.',
  'ia-ocupada': 'Hay mucha demanda en este momento. Probá de nuevo en un minuto.',
  'ia-rechazo': 'No pudimos armar esta propuesta. Revisá el texto y probá de nuevo.',
  'ia-incompleta': 'La propuesta quedó muy larga. Probá contándola más resumida.',
  'ia-sin-servicios': 'No encontramos servicios en lo que contaste. Contá qué vas a hacer y cuánto cobrás.',
  'limite-ia-pro': 'Llegaste al tope de propuestas con IA de este mes.',
  'pedido-corto': 'Contá un poco más qué querés cambiar.',
  'pedido-largo': 'El pedido es muy largo. Resumilo un poco (hasta 2.000 caracteres).',
  'propuesta-larga': 'La propuesta es muy larga para editarla con IA. Probá cambiándola a mano.',
  'limite-edicion-pro': 'Llegaste al tope de ediciones con IA de este mes.'
};

// --- Editar con IA ---
const cerrarDialogo = () => { if ($('#dialogo-ia').open) $('#dialogo-ia').close(); };
const enEditorDePropuesta = () => ctx.modoEditor === 'propuesta' && !!ctx.propuestaId;

const pintarBotonAplicar = () => {
  const n = document.querySelectorAll('#ia-cambios-lista input:checked').length;
  const boton = $('#ia-cambios-aplicar');
  boton.disabled = n === 0;
  boton.textContent = n === 1 ? 'Aplicar 1 cambio' : `Aplicar ${n} cambios`;
};

const mostrarCambios = r => {
  const actual = contenidoParaEditar(ctx.estado);
  const hay = r.resumen.length > 0;
  $('#ia-cambios-titulo').textContent = hay ? 'Revisá los cambios' : 'No hicimos cambios';
  $('#ia-cambios-respuesta').textContent = r.respuesta || (hay
    ? 'Elegí qué cambios aplicar a tu propuesta.'
    : 'No encontramos qué cambiar con ese pedido. Probá contarlo de otra forma.');
  $('#ia-cambios-lista').innerHTML = r.resumen.map(({ seccion, texto }) => {
    const detalle = detalleCambio(seccion, r.cambios[seccion], actual);
    return `
      <li class="ia-cambio">
        <label class="ia-cambio__etiqueta">
          <input type="checkbox" checked data-seccion="${esc(seccion)}" />
          <span class="ia-cambio__cuerpo">
            <strong class="ia-cambio__seccion">${esc(SECCIONES_EDICION[seccion])}</strong>
            <span class="ia-cambio__texto">${esc(texto)}</span>
            ${detalle.length ? `<span class="ia-cambio__detalle">${detalle.map(l => `<span>${esc(l)}</span>`).join('')}</span>` : ''}
          </span>
        </label>
      </li>`;
  }).join('');
  const avisos = $('#ia-cambios-avisos');
  avisos.innerHTML = r.avisos.map(a => `<li>${esc(a)}</li>`).join('');
  avisos.hidden = !r.avisos.length;
  $('#ia-cambios-nota').hidden = !hay;
  $('#ia-cambios-aplicar').hidden = !hay;
  if (hay) pintarBotonAplicar();
  $('#dialogo-ia-cambios').showModal();
};

const editarConIA = async texto => {
  if (!enEditorDePropuesta()) return;
  if (restriccionesActivas() && usosEdicionDelMes(ctx.plan, mesDe()) >= LIMITE_EDICION_GRATIS) {
    cerrarDialogo();
    ofrecerPro('ia-edicion');
    return;
  }
  const id = ctx.propuestaId;
  mostrarProgreso(true);
  let paso = 0;
  $('#ia-progreso-texto').textContent = PASOS_EDICION[0];
  const intervalo = setInterval(() => {
    paso = Math.min(PASOS_EDICION.length - 1, paso + 1);
    $('#ia-progreso-texto').textContent = PASOS_EDICION[paso];
  }, 3000);
  try {
    const r = await llamarApi('/api/ia-propuesta', { accion: 'editar', pedido: texto, propuesta: contenidoParaEditar(ctx.estado) });
    // Si mientras tanto cambió de propuesta, la respuesta ya no corresponde.
    if (ctx.propuestaId !== id || !enEditorDePropuesta()) return;
    propuestos = { id, cambios: r.cambios || {}, resumen: r.resumen || [], respuesta: r.respuesta || '', avisos: r.avisos || [] };
    cerrarDialogo();
    mostrarCambios(propuestos);
  } catch (e) {
    if (e.codigo === 'limite-edicion') {
      cerrarDialogo();
      ofrecerPro('ia-edicion');
    } else {
      avisarError(MENSAJES_ERROR[e.codigo] || (navigator.onLine
        ? 'No pudimos editar la propuesta. Probá de nuevo en unos segundos.'
        : 'Necesitás conexión a internet para editar con IA.'), 9000);
    }
  } finally {
    clearInterval(intervalo);
    mostrarProgreso(false);
    pintarCupo();
  }
};

const aplicarPropuestos = () => {
  const dialogo = $('#dialogo-ia-cambios');
  const secciones = [...document.querySelectorAll('#ia-cambios-lista input:checked')].map(c => c.dataset.seccion);
  if (!propuestos || propuestos.id !== ctx.propuestaId || !enEditorDePropuesta() || !secciones.length) {
    dialogo.close();
    return;
  }
  guardarVersion('antes-de-ia');
  reemplazarEstado(normalizar(aplicarCambios(ctx.estado, propuestos.cambios, secciones)));
  guardarAhora();
  propuestos = null;
  borradores.editar = '';
  if (modo === 'editar') $('#ia-texto').value = '';
  dialogo.close();
  avisarExito('Listo, aplicamos los cambios. Si algo no te convence, volvé atrás desde «Versiones anteriores» en el menú.', 7000);
};

const generar = async () => {
  if (generando) return;
  detenerDictado();
  const texto = $('#ia-texto').value.trim();
  if (modo === 'editar') {
    if (texto.length < PEDIDO_MIN) {
      avisar(MENSAJES_ERROR['pedido-corto']);
      $('#ia-texto').focus();
      return;
    }
    editarConIA(texto);
    return;
  }
  if (texto.length < TEXTO_MIN) {
    avisar(MENSAJES_ERROR['texto-corto']);
    $('#ia-texto').focus();
    return;
  }
  if (restriccionesActivas() && usosIADelMes(ctx.plan, mesDe()) >= LIMITE_IA_GRATIS) {
    $('#dialogo-ia').close();
    ofrecerPro('ia');
    return;
  }
  mostrarProgreso(true);
  let paso = 0;
  $('#ia-progreso-texto').textContent = PASOS[0];
  const intervalo = setInterval(() => {
    paso = Math.min(PASOS.length - 1, paso + 1);
    $('#ia-progreso-texto').textContent = PASOS[paso];
  }, 4000);
  try {
    const { contenido, avisos } = await llamarApi('/api/ia-propuesta', { texto });
    const base = vacio();
    const datos = {
      ...base,
      ...contenido,
      propuesta: { ...base.propuesta, ...contenido.propuesta },
      inversion: { ...base.inversion, ...contenido.inversion },
      tema: { ...base.tema, ...contenido.tema },
      emisor: emisorDeCuenta(base.emisor)
    };
    $('#ia-texto').value = '';
    $('#dialogo-ia').close();
    nuevaPropuesta(datos, { origen: 'ia' });
    avisarExito('¡Tu propuesta está lista! Revisá los precios y los datos antes de enviarla.', 7000);
    if (avisos?.length) setTimeout(() => avisar(`Para revisar: ${avisos.join(' · ')}`, 12000), 900);
  } catch (e) {
    if (e.codigo === 'limite-ia') {
      $('#dialogo-ia').close();
      ofrecerPro('ia');
    } else {
      avisarError(MENSAJES_ERROR[e.codigo] || (navigator.onLine
        ? 'No pudimos armar la propuesta. Probá de nuevo en unos segundos.'
        : 'Necesitás conexión a internet para armar la propuesta.'), 9000);
    }
  } finally {
    clearInterval(intervalo);
    mostrarProgreso(false);
    pintarCupo();
  }
};

const cambiarModo = nuevo => {
  if (nuevo === modo) return;
  borradores[modo] = $('#ia-texto').value;
  modo = nuevo;
  const t = TEXTOS[modo];
  $('#ia-texto').value = borradores[modo];
  $('#ia-marca-texto').textContent = t.marca;
  $('#ia-titulo').textContent = t.titulo;
  $('#ia-bajada').textContent = t.bajada;
  $('#ia-etiqueta').textContent = t.etiqueta;
  $('#ia-texto').placeholder = t.ejemplo;
  $('#ia-generar').textContent = t.boton;
};

export const abrirIA = (nuevoModo = 'crear') => {
  const dialogo = $('#dialogo-ia');
  if (!dialogo) return;
  cambiarModo(nuevoModo);
  pintarVoz();
  pintarCupo();
  pintarContador();
  if (!dialogo.open) dialogo.showModal();
  if (!motorDictado()) $('#ia-texto').focus();
};

export const instalarIA = () => {
  $('#ia-texto')?.addEventListener('input', () => {
    pintarContador();
    if (!escuchando) pintarVoz();
  });
  // Cerrar el diálogo (Escape incluido) corta el dictado; mientras genera, no se cierra.
  $('#dialogo-ia')?.addEventListener('cancel', ev => { if (generando) ev.preventDefault(); });
  $('#dialogo-ia')?.addEventListener('close', detenerDictado);
  $('#ia-cambios-lista')?.addEventListener('change', pintarBotonAplicar);
  registrarAcciones({
    'abrir-ia': () => {
      if (!nube()) abrirRegistro('ia');
      else abrirIA('crear');
    },
    'editar-con-ia': () => {
      if (!nube() || !enEditorDePropuesta()) return;
      abrirIA('editar');
    },
    'ia-cambios-aplicar': aplicarPropuestos,
    'ia-cambios-descartar': () => {
      propuestos = null;
      $('#dialogo-ia-cambios').close();
    },
    'ia-cambios-otro': () => {
      propuestos = null;
      $('#dialogo-ia-cambios').close();
      abrirIA('editar');
    },
    'ia-dictar': () => (escuchando ? detenerDictado() : empezarDictado()),
    'ia-ejemplo': () => {
      $('#ia-texto').value = modo === 'editar' ? EJEMPLO_EDICION : EJEMPLO;
      pintarContador();
      pintarVoz();
    },
    'ia-generar': generar,
    'ia-cerrar': () => { if (!generando) $('#dialogo-ia').close(); }
  });
};
