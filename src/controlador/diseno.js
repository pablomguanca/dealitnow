// Estudio de diseño del editor: plantillas por rubro, temas, decoración, portada,
// estilo de bloques, colores, tipografías y escalas.

import { $, $$ } from '../lib/formato.js';
import {
  DECORACIONES,
  PORTADAS,
  ESTILOS_BLOQUES,
  TEMAS,
  PLANTILLAS,
  PLANTILLAS_PORTAFOLIO,
  COMBINACIONES_FUENTES
} from '../modelo.js';
import { resolverColoresTema, aplicarEscalasTema, cargarFuente } from '../lib/tema.js';
import { servicioConContenido } from '../lib/render.js';
import { ctx, docActivo, nube, normalizar, normalizarPf } from './contexto.js';
import { avisar, avisarExito, elegir } from './avisos.js';
import { guardarLuego } from './guardado.js';
import { llenarFormulario, reemplazarEstado } from './formulario.js';
import { actualizar, actualizarTemaEnVivo, congelarAnimaciones } from './documento.js';
import { nuevaPropuesta, irAlPanel } from './propuestas.js';
import { abrirRegistro } from './sesion.js';
import { registrarAcciones } from './acciones.js';
import { disenoProPermitido } from './plan.js';

// Escalas y espaciados ajustables: [id del control, id del valor mostrado, propiedad del tema].
const ESCALAS = [
  ['#tema-escala-portada', '#tema-escala-portada-valor', 'escalaTituloPortada'],
  ['#tema-escala-titulos', '#tema-escala-titulos-valor', 'escalaTitulos'],
  ['#tema-escala-texto', '#tema-escala-texto-valor', 'escalaTexto'],
  ['#tema-espaciado-secciones', '#tema-espaciado-secciones-valor', 'espaciadoSecciones'],
  ['#tema-espaciado-interno', '#tema-espaciado-interno-valor', 'espaciadoInterno']
];

const CAMPOS_ESCALA = ['escalaLogo', 'escalaTituloPortada', 'escalaTitulos', 'escalaTexto', 'espaciadoSecciones', 'espaciadoInterno'];

// true si el tema tiene colores, intensidad o escalas distintos de los del preset.
const temaPersonalizado = t => {
  const preset = TEMAS[t.preset] || TEMAS['elegante-oscuro'];
  return (t.acento && t.acento.toLowerCase() !== preset.acento.toLowerCase())
    || !!t.colorTexto
    || !!t.colorPortada
    || !!t.colorFondo
    || !!t.colorSvg
    || (t.opacidadSvg !== undefined && Number(t.opacidadSvg) !== 100)
    || CAMPOS_ESCALA.some(k => t[k] !== undefined && Number(t[k]) !== 100);
};

const actualizarVisibilidadResetTema = () => {
  const btnReset = $('#tema-restablecer-colores');
  if (btnReset) btnReset.hidden = !temaPersonalizado(docActivo().tema);
};

const ponerValor = (selector, valor) => {
  const el = $(selector);
  if (el) el.value = valor;
};
const ponerTexto = (selector, valor) => {
  const el = $(selector);
  if (el) el.textContent = valor;
};

export const llenarTemaEditor = () => {
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
  ponerValor('#tema-acento', col.acento);
  ponerValor('#tema-color-texto', col.cuerpoTexto);
  ponerValor('#tema-color-portada', col.portadaBg);
  ponerValor('#tema-color-fondo', col.fondoBase);
  ponerValor('#tema-color-svg', col.colorSvg);
  ponerValor('#tema-opacidad-svg', String(col.opacidadSvg));
  ponerTexto('#tema-opacidad-valor', `${col.opacidadSvg}%`);
  ponerValor('#tema-escala-logo', String(col.escalaLogo));
  ponerTexto('#tema-escala-logo-valor', `${col.escalaLogo}%`);
  ponerValor('#logo-escala-input', String(col.escalaLogo));
  ponerTexto('#logo-escala-valor', `${col.escalaLogo}%`);
  ESCALAS.forEach(([selector, selectorValor, propiedad]) => {
    ponerValor(selector, String(col[propiedad]));
    ponerTexto(selectorValor, `${col[propiedad]}%`);
  });
  actualizarVisibilidadResetTema();
  ponerValor('#tema-fuente-titulos', t.fuenteTitulos || preset.fuenteTitulos || 'Bebas Neue');
  ponerValor('#tema-fuente-cuerpo', t.fuenteCuerpo || preset.fuenteCuerpo || 'Montserrat');
  marcarCombinacion(t.fuenteTitulos || preset.fuenteTitulos, t.fuenteCuerpo || preset.fuenteCuerpo);
};

// Las muestras de las combinaciones se ven en su tipografía: se cargan al abrir el editor.
let fuentesMuestraCargadas = false;
const marcarCombinacion = (titulos, cuerpo) => {
  if (!fuentesMuestraCargadas) {
    fuentesMuestraCargadas = true;
    COMBINACIONES_FUENTES.forEach(c => { cargarFuente(c.titulos); cargarFuente(c.cuerpo); });
  }
  $$('[data-combinacion]').forEach(el => {
    const c = COMBINACIONES_FUENTES.find(x => x.id === el.dataset.combinacion);
    el.classList.toggle('combinacion--activa', !!c && c.titulos === titulos && c.cuerpo === cuerpo);
  });
};

// Click en una grilla de opciones visuales (decoración, portada, estilo de bloques).
const vincularGrilla = (selectorGrilla, atributo, opciones, propiedad) => {
  $(selectorGrilla)?.addEventListener('click', ev => {
    const btn = ev.target.closest(`[data-${atributo}]`);
    const valor = btn?.dataset[atributo];
    if (!btn || !opciones[valor]) return;
    docActivo().tema[propiedad] = valor;
    llenarTemaEditor();
    actualizarTemaEnVivo();
  });
};

// Color o intensidad del tema: se aplica en vivo.
const vincularColor = (selector, propiedad, alCambiar) => {
  $(selector)?.addEventListener('input', ev => {
    docActivo().tema[propiedad] = alCambiar ? alCambiar(ev.target.value) : ev.target.value;
    actualizarVisibilidadResetTema();
    actualizarTemaEnVivo();
  });
};

const vincularRangoTema = (selector, selectorValor, propiedad) => {
  $(selector)?.addEventListener('input', ev => {
    if (ctx.invitado) ctx.invitadoEdito = true;
    const valor = Number(ev.target.value);
    const actual = docActivo();
    actual.tema[propiedad] = valor;
    ponerTexto(selectorValor, `${valor}%`);
    const doc = congelarAnimaciones();
    if (doc) aplicarEscalasTema(doc, actual.tema);
    actualizarVisibilidadResetTema();
    guardarLuego();
  });
};

// El tamaño del logo se ajusta desde el paso de datos y desde el estudio de diseño.
const sincronizarEscalaLogo = valor => {
  if (ctx.invitado) ctx.invitadoEdito = true;
  const num = Number(valor);
  const actual = docActivo();
  actual.tema.escalaLogo = num;
  ponerValor('#tema-escala-logo', String(num));
  ponerTexto('#tema-escala-logo-valor', `${num}%`);
  ponerValor('#logo-escala-input', String(num));
  ponerTexto('#logo-escala-valor', `${num}%`);
  const doc = congelarAnimaciones();
  if (doc) aplicarEscalasTema(doc, actual.tema);
  actualizarVisibilidadResetTema();
  guardarLuego();
};

const aplicarPlantillaRubro = (id, soloDiseno = false) => {
  const tpl = PLANTILLAS[id];
  if (!tpl) return;
  const generada = normalizar(tpl.crear());
  if (!soloDiseno) generada.plantilla = id;
  if (soloDiseno) {
    ctx.estado.tema = { ...generada.tema };
    llenarTemaEditor();
    actualizarTemaEnVivo();
    avisarExito(`Diseño de «${tpl.nombre}» aplicado a tu propuesta.`);
  } else {
    // La plantilla no toca los datos del negocio: se quedan los que ya tenía la propuesta.
    if (nube() || ctx.invitadoEdito) generada.emisor = { ...ctx.estado.emisor };
    const actualEnLista = ctx.propuestas.find(p => p.id === ctx.propuestaId);
    if (nube() && actualEnLista?.publico) {
      nuevaPropuesta(generada);
      avisar(`Se creó una propuesta nueva con «${tpl.nombre}» para no modificar el link que ya compartiste.`);
    } else {
      reemplazarEstado(generada);
      avisarExito(`Plantilla «${tpl.nombre}» cargada. Editá lo que quieras.`);
    }
  }
  $$('.plantilla-chip').forEach(c => c.classList.toggle('plantilla-chip--activa', c.dataset.plantilla === id));
};

const aplicarPlantillaPortafolio = (id, soloDiseno = false) => {
  const tpl = PLANTILLAS_PORTAFOLIO[id];
  if (!tpl) return;
  const generada = normalizarPf(tpl.crear());
  if (!soloDiseno) generada.plantilla = id;
  if (soloDiseno) {
    ctx.estadoPortafolio.tema = { ...generada.tema };
    llenarTemaEditor();
    actualizarTemaEnVivo();
    avisarExito(`Diseño de «${tpl.nombre}» aplicado a tu portfolio.`);
  } else {
    if (nube() || ctx.invitadoEdito) generada.emisor = { ...ctx.estadoPortafolio.emisor };
    ctx.estadoPortafolio = generada;
    llenarFormulario();
    actualizar();
    avisarExito(`Plantilla de portfolio «${tpl.nombre}» cargada.`);
  }
  $$('[data-plantilla-portafolio]').forEach(c => c.classList.toggle('plantilla-chip--activa', c.dataset.plantillaPortafolio === id));
};

// «Explorar más plantillas»: el catálogo completo está en la pestaña Plantillas del panel.
// Sin cuenta, se invita a crearla (el panel es de las cuentas).
const explorarPlantillas = () => {
  if (nube()) irAlPanel({ pestana: 'plantillas' });
  else abrirRegistro('plantillas');
};

export const instalarDiseno = () => {
  registrarAcciones({ 'explorar-plantillas': () => explorarPlantillas() });
  $('#temas-grid')?.addEventListener('click', async ev => {
    const card = ev.target.closest('.tema-card');
    if (!card) return;
    const id = card.dataset.tema;
    const preset = TEMAS[id];
    if (!preset) return;
    // En Gratis, un diseño PRO no se aplica: se ofrece Pro o elegir otro.
    if (preset.plan === 'pro' && !(await disenoProPermitido(preset.nombre))) return;
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

  vincularGrilla('#decoraciones-grid', 'decoracion', DECORACIONES, 'decoracion');
  vincularGrilla('#portadas-grid', 'portada', PORTADAS, 'portada');
  vincularGrilla('#estilos-grid', 'estilo', ESTILOS_BLOQUES, 'estilo');

  // Si ya escribió su propuesta, se pregunta si quiere la plantilla completa o solo su diseño.
  $('#plantillas-grid')?.addEventListener('click', async ev => {
    const chip = ev.target.closest('[data-plantilla]');
    if (!chip) return;
    const id = chip.dataset.plantilla;
    const tpl = PLANTILLAS[id];
    if (!tpl) return;
    if (tpl.plan === 'pro' && !(await disenoProPermitido(tpl.nombre))) return;
    const { estado } = ctx;
    const tieneTextoPropio = estado.propuesta.titulo.trim() || estado.servicios.some(servicioConContenido);
    if (!tieneTextoPropio) {
      aplicarPlantillaRubro(id, false);
      return;
    }
    const eleccion = await elegir({
      titulo: `Plantilla: ${tpl.nombre}`,
      texto: `¿Querés cargar los textos y servicios de ejemplo de «${tpl.nombre}» o aplicar solo su diseño (tema, decoración y disposición) y conservar lo que ya escribiste?`,
      opciones: [
        { valor: 'diseno', texto: 'Solo aplicar el diseño', estilo: 'primario' },
        { valor: 'completa', texto: 'Cargar texto y diseño', estilo: 'secundario' },
        { valor: null, texto: 'Cancelar', estilo: 'texto' }
      ]
    });
    if (eleccion) aplicarPlantillaRubro(id, eleccion === 'diseno');
  });

  $('#plantillas-portafolio-grid')?.addEventListener('click', async ev => {
    const chip = ev.target.closest('[data-plantilla-portafolio]');
    if (!chip) return;
    const id = chip.dataset.plantillaPortafolio;
    if (!PLANTILLAS_PORTAFOLIO[id]) return;
    if (PLANTILLAS_PORTAFOLIO[id].plan === 'pro' && !(await disenoProPermitido(PLANTILLAS_PORTAFOLIO[id].nombre))) return;
    aplicarPlantillaPortafolio(id, false);
  });

  vincularColor('#tema-acento', 'acento');
  vincularColor('#tema-color-texto', 'colorTexto');
  vincularColor('#tema-color-portada', 'colorPortada');
  vincularColor('#tema-color-fondo', 'colorFondo');
  vincularColor('#tema-color-svg', 'colorSvg');
  vincularColor('#tema-opacidad-svg', 'opacidadSvg', valor => {
    ponerTexto('#tema-opacidad-valor', `${valor}%`);
    return Number(valor);
  });

  $('#tema-escala-logo')?.addEventListener('input', ev => sincronizarEscalaLogo(ev.target.value));
  $('#logo-escala-input')?.addEventListener('input', ev => sincronizarEscalaLogo(ev.target.value));
  ESCALAS.forEach(([selector, selectorValor, propiedad]) => vincularRangoTema(selector, selectorValor, propiedad));

  $('#tema-restablecer-colores')?.addEventListener('click', () => {
    const t = docActivo().tema;
    const preset = TEMAS[t.preset] || TEMAS['elegante-oscuro'];
    t.acento = preset.acento;
    t.colorTexto = '';
    t.colorPortada = '';
    t.colorFondo = '';
    t.colorSvg = '';
    t.opacidadSvg = 100;
    CAMPOS_ESCALA.forEach(k => { t[k] = 100; });
    llenarTemaEditor();
    actualizarTemaEnVivo();
    avisarExito('Colores, tamaños de tipografía y espaciados restablecidos al tema original.');
  });

  $('#combinaciones-grid')?.addEventListener('click', ev => {
    const c = COMBINACIONES_FUENTES.find(x => x.id === ev.target.closest('[data-combinacion]')?.dataset.combinacion);
    if (!c) return;
    const t = docActivo().tema;
    t.fuenteTitulos = c.titulos;
    t.fuenteCuerpo = c.cuerpo;
    llenarTemaEditor();
    actualizarTemaEnVivo();
  });

  $('#tema-fuente-titulos')?.addEventListener('change', ev => {
    docActivo().tema.fuenteTitulos = ev.target.value;
    llenarTemaEditor();
    actualizarTemaEnVivo();
  });
  $('#tema-fuente-cuerpo')?.addEventListener('change', ev => {
    docActivo().tema.fuenteCuerpo = ev.target.value;
    llenarTemaEditor();
    actualizarTemaEnVivo();
  });
};
