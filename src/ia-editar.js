// «Editar con IA»: el dueño pide un cambio con sus palabras («bajá 10 % los precios», «sumá
// una etapa de capacitación») y la IA devuelve solo las secciones que cambian. El servidor
// (api/ia-propuesta.js con accion «editar») las valida y descarta las que quedaron igual; la
// app muestra cada cambio para que el dueño elija cuáles aplicar. Módulo puro, compartido por
// el servidor y la app. Ver «Planes» en CLAUDE.md.

import { MODALIDADES } from './modelo.js';
import { MONEDAS_IA, corto, lineasDe, nuevoId, numero, plata } from './ia.js';

export const LIMITE_EDICION_GRATIS = 5; // ediciones con IA por mes en Gratis
export const LIMITE_EDICION_PRO = 300; // tope de uso razonable en Pro (evita abusos)
export const PEDIDO_MIN = 8;
export const PEDIDO_MAX = 2000;
// La propuesta que se manda a la IA, ya compactada (sin fotos, logo ni datos del emisor).
export const PROPUESTA_MAX = 40000;

export const usosEdicionDelMes = (plan, mes) => Math.max(0, Number(plan?.iaEdicion?.[mes]) || 0);

// Secciones que la IA puede cambiar, en el orden del documento.
export const SECCIONES_EDICION = {
  titulo: 'Título',
  cliente: 'Cliente',
  contexto: 'Contexto',
  objetivos: 'Objetivos',
  servicios: 'Servicios y precios',
  etapas: 'Etapas',
  faqs: 'Preguntas frecuentes',
  inversion: 'Inversión',
  pagos: 'Forma de pago',
  validezDias: 'Validez',
  condiciones: 'Condiciones',
  proximosPasos: 'Próximos pasos'
};
const SECCIONES = Object.keys(SECCIONES_EDICION);

// --- Normalización: cada sección en la forma que lee y escribe la IA ---
const textoDe = v => (typeof v === 'string' ? v : v?.texto);
const lineas = (v, maxLinea, maxLineas) => {
  const t = lineasDe(Array.isArray(v) ? v.map(textoDe) : v, maxLinea, maxLineas);
  return t ? t.split('\n') : [];
};

const NORMALIZAR = {
  titulo: v => corto(v, 200),
  cliente: v => ({ nombre: corto(v?.nombre, 200), empresa: corto(v?.empresa, 200), cargo: corto(v?.cargo, 200) }),
  contexto: v => corto(v, 3000),
  objetivos: v => lineas(v, 300, 8),
  servicios: v => (Array.isArray(v) ? v : []).slice(0, 20).map(s => {
    const modalidad = MODALIDADES[s?.modalidad] ? s.modalidad : 'unico';
    return {
      id: corto(s?.id, 60),
      nombre: corto(s?.nombre, 200),
      descripcion: corto(s?.descripcion, 1000),
      entregables: lineas(s?.entregables, 200, 10),
      modalidad,
      cantidad: numero(s?.cantidad, 0, 100000, 1) || 1,
      precio: modalidad === 'incluido' ? 0 : plata(s?.precio),
      opcional: s?.opcional === true
    };
  }).filter(s => s.nombre),
  etapas: v => (Array.isArray(v) ? v : []).slice(0, 10)
    .map(e => ({ nombre: corto(e?.nombre, 200), duracion: corto(e?.duracion, 100), descripcion: corto(e?.descripcion, 600) }))
    .filter(e => e.nombre),
  faqs: v => (Array.isArray(v) ? v : []).slice(0, 6)
    .map(f => ({ pregunta: corto(f?.pregunta, 300), respuesta: corto(f?.respuesta, 1000) }))
    .filter(f => f.pregunta && f.respuesta),
  inversion: v => ({
    moneda: corto(v?.moneda, 5).toUpperCase(),
    montoGlobal: plata(v?.montoGlobal),
    abonoMensual: plata(v?.abonoMensual),
    descuento: numero(v?.descuento, 0, 100),
    impuesto: numero(v?.impuesto, 0, 100)
  }),
  pagos: v => (Array.isArray(v) ? v : []).slice(0, 6)
    .map(p => ({ concepto: corto(p?.concepto, 200), porcentaje: Math.round(numero(p?.porcentaje, 0, 100)) }))
    .filter(p => p.concepto && p.porcentaje > 0),
  validezDias: v => Math.round(numero(v, 1, 365, 15)),
  condiciones: v => lineas(v, 400, 8),
  proximosPasos: v => lineas(v, 300, 5)
};

// La propuesta abierta en el editor → lo que ve la IA (y contra lo que se compara su respuesta).
export const contenidoParaEditar = (e = {}) => {
  const inv = e.inversion || {};
  const crudo = {
    titulo: e.propuesta?.titulo ?? e.titulo,
    cliente: e.cliente,
    contexto: e.contexto,
    objetivos: e.objetivos,
    servicios: e.servicios,
    etapas: e.etapas,
    faqs: e.faqs,
    inversion: inv,
    pagos: e.pagos ?? inv.pagos,
    validezDias: e.propuesta?.validez ?? e.validezDias,
    condiciones: e.condiciones,
    proximosPasos: e.proximosPasos
  };
  return Object.fromEntries(SECCIONES.map(s => [s, NORMALIZAR[s](crudo[s])]));
};

// --- Pedido a la IA ---
const texto = description => ({ type: 'string', description });
const numeroE = description => ({ type: 'number', description });
const lista = (items, description) => ({ type: 'array', items, ...(description ? { description } : {}) });
const objeto = (properties, description) => ({
  type: 'object', properties, required: Object.keys(properties), additionalProperties: false,
  ...(description ? { description } : {})
});

// Las secciones de «cambios» son opcionales: la IA manda solo las que cambian.
export const esquemaEdicion = () => objeto({
  respuesta: texto('1 o 2 frases para el dueño, en voseo: qué cambiaste o, si no se pudo, por qué.'),
  resumen: lista(objeto({
    seccion: { type: 'string', enum: SECCIONES, description: 'Sección que cambiaste.' },
    texto: texto('Qué cambió en esa sección, en una frase corta.')
  }), 'Un elemento por cada sección que mandás en «cambios».'),
  cambios: {
    type: 'object',
    additionalProperties: false,
    description: 'SOLO las secciones que cambian, cada una completa. Omití las que quedan igual.',
    properties: {
      titulo: texto('Título nuevo.'),
      cliente: objeto({ nombre: texto('Nombre del contacto.'), empresa: texto('Empresa.'), cargo: texto('Cargo.') }),
      contexto: texto('Contexto nuevo completo: 2 párrafos separados por una línea en blanco.'),
      objetivos: lista(texto('Objetivo.'), 'Lista completa de objetivos.'),
      servicios: lista(objeto({
        id: texto('El id del servicio existente, tal cual. "" si es un servicio nuevo.'),
        nombre: texto('Nombre del servicio.'),
        descripcion: texto('Qué abarca, en 1 a 3 frases.'),
        entregables: lista(texto('Entregable.')),
        modalidad: { type: 'string', enum: Object.keys(MODALIDADES), description: '«unico», «mensual», «hora» o «incluido».' },
        cantidad: numeroE('Cantidad (en «hora», las horas).'),
        precio: numeroE('Precio unitario.'),
        opcional: { type: 'boolean', description: 'true si es un extra que el cliente puede sumar.' }
      }), 'Lista completa de servicios, incluidos los que no cambian (con su id).'),
      etapas: lista(objeto({ nombre: texto('Fase.'), duracion: texto('Plazo.'), descripcion: texto('Actividades.') }), 'Lista completa de etapas.'),
      faqs: lista(objeto({ pregunta: texto('Pregunta.'), respuesta: texto('Respuesta.') }), 'Lista completa de preguntas frecuentes.'),
      inversion: objeto({
        moneda: { type: 'string', enum: MONEDAS_IA },
        montoGlobal: numeroE('Precio total por todo el trabajo (0 si los precios van por ítem).'),
        abonoMensual: numeroE('Abono mensual global (0 si va por ítem).'),
        descuento: numeroE('Porcentaje de descuento.'),
        impuesto: numeroE('Porcentaje de impuesto.')
      }),
      pagos: lista(objeto({ concepto: texto('Hito de pago.'), porcentaje: numeroE('Porcentaje.') }), 'Hitos de pago completos; suman 100.'),
      validezDias: { type: 'integer', description: 'Días de validez.' },
      condiciones: lista(texto('Condición, sin viñeta.'), 'Lista completa de condiciones.'),
      proximosPasos: lista(texto('Paso, sin número.'), 'Lista completa de próximos pasos.')
    }
  },
  avisos: lista(texto('Algo que el dueño tiene que revisar o completar.'), 'Máximo 3, cortos. Vacío si no hace falta.')
});

const lineaEmisor = (etiqueta, valor) => (String(valor || '').trim() ? `- ${etiqueta}: ${String(valor).trim().slice(0, 200)}` : '');

export const instruccionesEdicion = (emisor = {}) => {
  const datos = [lineaEmisor('Emisor / marca', emisor.nombre), lineaEmisor('Rubro / rol habitual', emisor.rol)].filter(Boolean);
  return `# ROL
Sos el editor comercial de Dealit, una app argentina de propuestas comerciales que se mandan como link. Recibís una propuesta ya armada (en JSON) y un pedido del dueño, muchas veces dictado por voz. Hacés exactamente ese cambio y nada más.
${datos.length ? `\n# EMISOR\n${datos.join('\n')}\n` : ''}
# REGLAS
- Cambiá SOLO lo que pide el pedido. Todo lo demás queda igual, palabra por palabra.
- En «cambios» mandá únicamente las secciones que cambian, cada una COMPLETA: si cambia un servicio, mandá la lista entera de servicios, con los que no cambian copiados tal cual y con su mismo «id». Un servicio nuevo va con id "".
- Precios: no los toques salvo que el pedido lo pida o lo implique («bajá 10 %», «sumá mantenimiento a 50 mil», «pasalo a precio cerrado»). Nunca inventes un precio: un servicio nuevo sin precio dictado va con precio 0 y un aviso «Completá el precio de …».
- Si pide un porcentaje sobre los precios, aplicalo a cada precio y redondeá a un número prolijo (sin centavos).
- Monto total: si los precios van por ítem, «montoGlobal» queda en 0 (la app suma los ítems). No repitas ahí la suma.
- Pagos: siempre suman 100.
- Moneda: si pide cambiarla, no conviertas los precios salvo que dé el tipo de cambio; agregá un aviso para que los revise.
- No inventes datos del cliente, fechas ni datos concretos que no se dijeron.
- Escribí en español rioplatense con voseo, cálido y profesional, como el resto de la propuesta. Si pide mejorar o acortar un texto, mantené lo que dice y mejorá cómo lo dice.
- El diseño, los colores, el logo, las fotos, el video y los datos del emisor no se cambian desde acá. Si el pedido es sobre eso, o no se entiende, no mandes cambios y explicá en «respuesta» qué puede hacer desde el editor.
- En listas, cada elemento va solo, sin viñetas ni números al principio.

# FORMATO DE SALIDA
Respondé únicamente con el objeto JSON que pide el esquema.`;
};

export const mensajeEdicion = (pedido, actual) => `Propuesta actual (JSON):
${JSON.stringify(actual)}

Lo que quiero cambiar:
"""
${pedido}
"""`;

// --- Respuesta de la IA → cambios válidos (lo hace el servidor) ---
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sumaDe = (servicios, mensual) => servicios
  .filter(s => !s.opcional && s.modalidad !== 'incluido' && (s.modalidad === 'mensual') === mensual)
  .reduce((t, s) => t + s.cantidad * s.precio, 0);

export const cambiosDesdeIA = (r, actual) => {
  const cambios = {};
  const avisos = (Array.isArray(r?.avisos) ? r.avisos : []).map(a => corto(a, 200)).filter(Boolean).slice(0, 3);
  const pedidos = r?.cambios && typeof r.cambios === 'object' ? r.cambios : {};

  for (const seccion of SECCIONES) {
    if (pedidos[seccion] === undefined || pedidos[seccion] === null) continue;
    let valor = NORMALIZAR[seccion](pedidos[seccion]);

    if (seccion === 'servicios') {
      // Solo se conservan los ids que ya existían (y una sola vez): así se mantienen las fotos.
      const existentes = new Set(actual.servicios.map(s => s.id).filter(Boolean));
      const usados = new Set();
      valor = valor.map(s => {
        const id = existentes.has(s.id) && !usados.has(s.id) ? s.id : '';
        if (id) usados.add(id);
        return { ...s, id };
      });
      if (!valor.length && actual.servicios.length) {
        avisos.push('La IA dejó la propuesta sin servicios: no aplicamos ese cambio.');
        continue;
      }
    }
    if (seccion === 'pagos' && valor.reduce((t, p) => t + p.porcentaje, 0) !== 100) {
      avisos.push('Los pagos que propuso la IA no sumaban 100 %: los dejamos como estaban.');
      continue;
    }
    if (seccion === 'inversion' && !MONEDAS_IA.includes(valor.moneda)) valor.moneda = actual.inversion.moneda;
    if (!igual(valor, actual[seccion])) cambios[seccion] = valor;
  }

  // El monto global se suma a los ítems: si la IA repitió ahí la suma, se contaría dos veces.
  if (cambios.inversion) {
    const servicios = cambios.servicios || actual.servicios;
    const fija = sumaDe(servicios, false);
    const mensual = sumaDe(servicios, true);
    if (fija > 0 && Math.abs(cambios.inversion.montoGlobal - fija) < 1) cambios.inversion.montoGlobal = 0;
    if (mensual > 0 && Math.abs(cambios.inversion.abonoMensual - mensual) < 1) cambios.inversion.abonoMensual = 0;
    if (igual(cambios.inversion, actual.inversion)) delete cambios.inversion;
  }

  const textos = new Map();
  for (const item of Array.isArray(r?.resumen) ? r.resumen : []) {
    if (cambios[item?.seccion] !== undefined && !textos.has(item.seccion)) textos.set(item.seccion, corto(item.texto, 300));
  }
  const resumen = Object.keys(cambios).map(seccion => ({ seccion, texto: textos.get(seccion) || 'Actualizamos esta sección.' }));
  return { cambios, resumen, respuesta: corto(r?.respuesta, 400), avisos: avisos.slice(0, 4) };
};

// --- Detalle para la vista previa (la app) ---
const plataTexto = (n, moneda) => `${moneda === 'ARS' ? '$' : moneda} ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n)}`;
const precioTexto = (s, moneda) => (s.modalidad === 'incluido' ? 'incluido' : `${plataTexto(s.precio, moneda)}${s.modalidad === 'mensual' ? '/mes' : s.modalidad === 'hora' ? '/h' : ''}${s.cantidad !== 1 ? ` × ${s.cantidad}` : ''}`);
const recortar = (t, max = 140) => (t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t);

// Hasta 8 líneas que muestran qué cambia en la sección, para revisar antes de aplicar.
export const detalleCambio = (seccion, nuevo, actual) => {
  const moneda = actual.inversion?.moneda || 'ARS';
  const l = [];
  if (seccion === 'titulo') l.push(`«${recortar(nuevo, 80)}»`);
  else if (seccion === 'contexto') l.push(recortar(nuevo, 220));
  else if (seccion === 'validezDias') l.push(`${actual.validezDias} → ${nuevo} días`);
  else if (seccion === 'cliente') {
    for (const k of ['nombre', 'empresa', 'cargo']) if (nuevo[k] !== actual.cliente[k]) l.push(`${k[0].toUpperCase()}${k.slice(1)}: ${nuevo[k] || '(vacío)'}`);
  } else if (seccion === 'servicios') {
    const viejos = new Map(actual.servicios.map(s => [s.id, s]));
    for (const s of nuevo) {
      const antes = s.id && viejos.get(s.id);
      if (!antes) l.push(`Nuevo${s.opcional ? ' opcional' : ''}: «${recortar(s.nombre, 60)}» (${precioTexto(s, moneda)})`);
      else if (antes.precio !== s.precio || antes.cantidad !== s.cantidad || antes.modalidad !== s.modalidad) l.push(`«${recortar(s.nombre, 60)}»: ${precioTexto(antes, moneda)} → ${precioTexto(s, moneda)}`);
      else if (antes.opcional !== s.opcional) l.push(`«${recortar(s.nombre, 60)}»: ${s.opcional ? 'pasa a opcional' : 'pasa a incluido'}`);
      else if (!igual(antes, s)) l.push(`«${recortar(s.nombre, 60)}»: cambia el texto`);
    }
    const quedan = new Set(nuevo.map(s => s.id));
    for (const s of actual.servicios) if (!quedan.has(s.id)) l.push(`Se quita: «${recortar(s.nombre, 60)}»`);
  } else if (seccion === 'inversion') {
    const a = actual.inversion;
    if (nuevo.moneda !== a.moneda) l.push(`Moneda: ${a.moneda} → ${nuevo.moneda}`);
    if (nuevo.montoGlobal !== a.montoGlobal) l.push(`Precio total: ${plataTexto(a.montoGlobal, a.moneda)} → ${plataTexto(nuevo.montoGlobal, nuevo.moneda)}`);
    if (nuevo.abonoMensual !== a.abonoMensual) l.push(`Abono mensual: ${plataTexto(a.abonoMensual, a.moneda)} → ${plataTexto(nuevo.abonoMensual, nuevo.moneda)}`);
    if (nuevo.descuento !== a.descuento) l.push(`Descuento: ${a.descuento} % → ${nuevo.descuento} %`);
    if (nuevo.impuesto !== a.impuesto) l.push(`Impuesto: ${a.impuesto} % → ${nuevo.impuesto} %`);
  } else if (seccion === 'pagos') l.push(nuevo.map(p => `${p.porcentaje} % ${p.concepto}`).join(' · '));
  else if (seccion === 'etapas') nuevo.forEach(e => l.push(`${e.nombre}${e.duracion ? ` (${e.duracion})` : ''}`));
  else if (seccion === 'faqs') nuevo.forEach(f => l.push(recortar(f.pregunta, 100)));
  else nuevo.forEach(t => l.push(recortar(t, 120)));
  // Nada queda oculto sin avisar: si hay más líneas, se dice cuántas.
  return l.length > 8 ? [...l.slice(0, 7), `…y ${l.length - 7} más`] : l;
};

// --- Aplicar los cambios elegidos sobre la propuesta del editor (la app) ---
export const aplicarCambios = (estado, cambios, secciones = Object.keys(cambios)) => {
  const e = structuredClone(estado);
  const elegir = s => secciones.includes(s) && cambios[s] !== undefined;
  if (elegir('titulo')) e.propuesta.titulo = cambios.titulo;
  if (elegir('cliente')) e.cliente = { ...e.cliente, ...cambios.cliente };
  if (elegir('contexto')) e.contexto = cambios.contexto;
  if (elegir('objetivos')) e.objetivos = cambios.objetivos.map(t => ({ id: nuevoId(), texto: t }));
  if (elegir('servicios')) {
    const antes = new Map((e.servicios || []).map(s => [s.id, s]));
    e.servicios = cambios.servicios.map(({ id, entregables, ...s }) => ({
      imagen: '',
      ...(antes.get(id) || {}),
      ...s,
      id: (id && antes.has(id)) ? id : nuevoId(),
      entregables: entregables.join('\n')
    }));
  }
  if (elegir('etapas')) e.etapas = cambios.etapas.map(x => ({ id: nuevoId(), ...x }));
  if (elegir('faqs')) e.faqs = cambios.faqs.map(x => ({ id: nuevoId(), ...x }));
  if (elegir('inversion')) e.inversion = { ...e.inversion, ...cambios.inversion };
  if (elegir('pagos')) e.inversion = { ...e.inversion, pagos: cambios.pagos.map(p => ({ id: nuevoId(), ...p })) };
  if (elegir('validezDias')) e.propuesta.validez = cambios.validezDias;
  if (elegir('condiciones')) e.condiciones = cambios.condiciones.join('\n');
  if (elegir('proximosPasos')) e.proximosPasos = cambios.proximosPasos.join('\n');
  return e;
};
