// «Contale tu propuesta» (dictado + IA). El dictado usa el reconocimiento de voz del
// navegador (gratis, no sale audio de la compu) y, en la app de Android, el del sistema
// (complemento Dictado de nativo.js, porque la ventana web de la app no trae el de Chrome); el texto va a /api/ia-propuesta, que arma
// la propuesta con la IA (Gemini). Acá se abre el diálogo, se dicta y se crea la propuesta.

import { $ } from '../lib/formato.js';
import { LIMITE_IA_GRATIS, TEXTO_MIN, usosIADelMes } from '../ia.js';
import { mesDe } from '../planes.js';
import { vacio } from '../modelo.js';
import { ctx, nube } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { avisar, avisarError, avisarExito } from './avisos.js';
import { llamarApi } from './api.js';
import { nuevaPropuesta } from './propuestas.js';
import { emisorDeCuenta } from './cuenta.js';
import { ofrecerPro, restriccionesActivas } from './plan.js';
import { abrirRegistro } from './sesion.js';
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
    $('#ia-voz-titulo').textContent = $('#ia-texto').value.trim() ? 'Listo. Revisá el texto o seguí dictando' : 'Tocá el micrófono y contá el trabajo';
    $('#ia-voz-detalle').textContent = 'O escribilo abajo. Podés corregir el texto antes de armar la propuesta.';
  }
};

const pintarContador = () => {
  const n = $('#ia-texto').value.trim().length;
  $('#ia-contador').textContent = n && n < TEXTO_MIN ? 'Contá un poco más del trabajo' : '';
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
  const quedan = Math.max(0, LIMITE_IA_GRATIS - usosIADelMes(ctx.plan, mesDe()));
  el.hidden = false;
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
  'limite-ia-pro': 'Llegaste al tope de propuestas con IA de este mes.'
};

const generar = async () => {
  if (generando) return;
  detenerDictado();
  const texto = $('#ia-texto').value.trim();
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
    nuevaPropuesta(datos);
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

export const abrirIA = () => {
  const dialogo = $('#dialogo-ia');
  if (!dialogo) return;
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
  registrarAcciones({
    'abrir-ia': () => {
      if (!nube()) abrirRegistro('ia');
      else abrirIA();
    },
    'ia-dictar': () => (escuchando ? detenerDictado() : empezarDictado()),
    'ia-ejemplo': () => {
      $('#ia-texto').value = EJEMPLO;
      pintarContador();
      pintarVoz();
    },
    'ia-generar': generar,
    'ia-cerrar': () => { if (!generando) $('#dialogo-ia').close(); }
  });
};
