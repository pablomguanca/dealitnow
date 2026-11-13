// «Contale tu propuesta»: el dueño dicta o escribe el trabajo y la IA arma la propuesta.
// Módulo puro, compartido por el servidor (api/ia-propuesta.js arma el pedido y valida la
// respuesta) y la app (límites y textos). Ver «Planes» en CLAUDE.md.

import { TEMAS, MODALIDADES } from './modelo.js';

export const LIMITE_IA_GRATIS = 3; // propuestas armadas con IA por mes en Gratis
export const LIMITE_IA_PRO = 150; // tope de uso razonable en Pro (evita abusos)
export const TEXTO_MIN = 15;
export const TEXTO_MAX = 4000;
export const MONEDAS_IA = ['ARS', 'USD', 'EUR'];

const MESES_IA = v => Math.max(0, Number(v) || 0);
export const usosIADelMes = (plan, mes) => MESES_IA(plan?.ia?.[mes]);

// Temas que la IA puede elegir: en Gratis solo los gratis (así la propuesta se puede enviar).
export const temasPermitidos = conPro => Object.entries(TEMAS)
  .filter(([, t]) => conPro || t.plan !== 'pro')
  .map(([id]) => id);


const texto = description => ({ type: 'string', description });
const numeroE = description => ({ type: 'number', description });
const lista = (items, description) => ({ type: 'array', items, ...(description ? { description } : {}) });
const objeto = (properties, description) => ({
  type: 'object', properties, required: Object.keys(properties), additionalProperties: false,
  ...(description ? { description } : {})
});

// Esquema de la respuesta (structured output: todo requerido, sin propiedades extra). Los IDs,
// el número de propuesta y las viñetas no se le piden al modelo: los pone el servidor.
export const esquemaIA = temas => objeto({
  titulo: texto('Título comercial claro del trabajo (no el nombre del negocio del emisor).'),
  cliente: objeto({
    nombre: texto('Nombre del contacto. Vacío ("") si no se dijo.'),
    empresa: texto('Empresa o proyecto del cliente. Vacío ("") si no se dijo.'),
    cargo: texto('Cargo del contacto. Vacío ("") si no se dijo.')
  }),
  contexto: texto('2 párrafos separados por una línea en blanco: situación del cliente, necesidad y enfoque de la solución.'),
  objetivos: lista(texto('Objetivo en infinitivo, orientado al resultado del cliente.'), '3 a 4 objetivos.'),
  servicios: lista(objeto({
    nombre: texto('Nombre profesional del servicio o módulo.'),
    descripcion: texto('Qué abarca el trabajo, en 1 a 3 frases.'),
    entregables: lista(texto('Entregable concreto y tangible.'), '1 a 4 entregables.'),
    modalidad: {
      type: 'string',
      enum: Object.keys(MODALIDADES),
      description: '«unico»: precio fijo. «mensual»: abono por mes. «hora»: cantidad = horas, precio = tarifa. «incluido»: sin precio propio, va dentro del monto global.'
    },
    cantidad: numeroE('Cantidad (1 si no se dijo). En «hora», las horas.'),
    precio: numeroE('Precio unitario. 0 si la modalidad es «incluido» o si no se dictó.'),
    opcional: { type: 'boolean', description: 'true solo si el emisor lo dictó como extra u opcional.' }
  }), 'Alcance: servicios incluidos y opcionales.'),
  etapas: lista(objeto({
    nombre: texto('Nombre de la fase.'),
    duracion: texto('Plazo (ej. «Semana 1», «Días 1 a 3», «Etapa 1»).'),
    descripcion: texto('Actividades principales de la fase.')
  }), '3 a 4 fases secuenciales.'),
  faqs: lista(objeto({
    pregunta: texto('Pregunta que haría un cliente real de este rubro antes de contratar.'),
    respuesta: texto('Respuesta breve que dé seguridad y cierre la objeción.')
  }), '3 preguntas frecuentes.'),
  moneda: { type: 'string', enum: MONEDAS_IA, description: 'Moneda de la propuesta.' },
  montoGlobal: numeroE('Precio total por el trabajo, solo si se dictó un total y no precios por ítem. Si no, 0.'),
  abonoMensual: numeroE('Abono mensual total, solo si se dictó un abono global y no por ítem. Si no, 0.'),
  descuento: numeroE('Porcentaje de descuento (ej. 10), solo si se dictó explícitamente. Si no, 0.'),
  impuesto: numeroE('Porcentaje de impuesto (ej. 21) solo si se dijo «más IVA» o similar. Si no, 0.'),
  pagos: lista(objeto({
    concepto: texto('Hito de pago (ej. «Anticipo al aceptar la propuesta»).'),
    porcentaje: numeroE('Porcentaje del hito (ej. 50).')
  }), 'Hitos de pago; suman 100.'),
  validezDias: { type: 'integer', description: 'Días de validez (15 si no se dijo).' },
  condiciones: lista(texto('Una condición, sin viñeta al principio.'), '3 a 4 condiciones.'),
  proximosPasos: lista(texto('Un paso, sin número al principio.'), '3 pasos.'),
  tema: { type: 'string', enum: temas, description: 'Diseño visual que va con el rubro.' },
  avisos: lista(texto('Algo que el dueño tiene que revisar o completar antes de enviar.'), 'Máximo 4, cortos.')
});

const lineaEmisor = (etiqueta, valor) => (String(valor || '').trim() ? `- ${etiqueta}: ${String(valor).trim().slice(0, 200)}` : '');

export const instruccionesIA = (temas, emisor = {}) => {
  const datosEmisor = [
    lineaEmisor('Emisor / marca', emisor.nombre),
    lineaEmisor('Rubro / rol habitual', emisor.rol),
    lineaEmisor('Ubicación', emisor.ubicacion)
  ].filter(Boolean);
  return `# ROL Y MISIÓN
Sos el motor comercial de Dealit, una app argentina para armar propuestas comerciales que se mandan como link. Recibís lo que un freelancer, una agencia o un estudio cuenta de un trabajo —muchas veces dictado por voz, breve, desordenado o incompleto, y de cualquier rubro (software, diseño, marketing, arquitectura, oficios, consultoría, eventos, salud, etc.)— y lo convertís SIEMPRE en una propuesta completa, persuasiva, estructurada y lista para revisar y enviar.

# CONTEXTO DEL EMISOR
${datosEmisor.length ? datosEmisor.join('\n') : '- Sin datos cargados: deducí el rubro de lo que cuenta.'}
- Moneda predeterminada: ARS (pesos argentinos), salvo que mencione dólares (USD) o euros (EUR), o que el emisor esté claramente fuera de Argentina (entonces USD).

# CÓMO ESCRIBIR
- Español rioplatense con voseo («vas a recibir», «aceptá»), cálido y profesional, sin exagerar ni prometer lo que no se dijo.
- Le hablás al cliente final, en nombre del emisor. Frases cortas y concretas, sin relleno de marketing.
- Ignorá muletillas («eh», «este», «o sea»). Si cambia de opinión en el dictado («ponele 200 mil… no, mejor 250 mil»), usá SIEMPRE el último valor.

# REGLA DE ORO: COMPLETAR LO QUE FALTA
Casi nunca se dictan todas las secciones. NUNCA dejes secciones vacías ni pidas aclaraciones: deducí lo que falta con las buenas prácticas del rubro detectado.
1. Contexto: si no lo dicta, 2 párrafos sobre la necesidad del cliente y el valor de una solución profesional, usando lo que se contó.
2. Objetivos: si no los dicta, 3 a 4 orientados al resultado que busca el cliente.
3. Servicios: si los dicta muy breve («hacer una web», «pintar un depto»), desglosalos en 2 a 4 módulos lógicos de ese oficio, coherentes con lo dictado. El desglose no agrega trabajo pago que no se haya mencionado.
4. Etapas: si no las dicta, 3 a 4 fases secuenciales acordes al proyecto (ej. relevamiento → ejecución → revisión → entrega). Sin plazos dictados, usá referencias relativas («Etapa 1») o plazos estándar razonables.
5. Preguntas frecuentes: siempre 3 que haría un cliente real de ese rubro (tiempos, revisiones incluidas, materiales, soporte o garantía), con respuestas que den seguridad.
6. Condiciones: si no las dicta, 3 a 4 estándar y equilibradas para el rubro (alcance, cambios o revisiones incluidos, qué no está incluido: materiales no especificados, servicios de terceros, etc.). La validez va aparte, no la repitas acá.
7. Próximos pasos: siempre 3, empezando por «Aceptar la propuesta desde este link», luego la coordinación inicial y el arranque del trabajo.
8. Pagos: si no los dicta, 50 % de anticipo al aceptar y 50 % contra entrega. Siempre suman 100.
9. Validez: 15 días salvo que diga otra cosa.

# PRECIOS
- Usá los precios dictados tal cual. Si hay precios de referencia del emisor, respetá ese nivel.
- Precio total por todo el trabajo: ponelo en «montoGlobal» (o en «abonoMensual» si es un abono) y dejá los servicios con modalidad «incluido» y precio 0.
- Precios por ítem: cada servicio con su modalidad («unico», «mensual» u «hora») y su precio, y «montoGlobal» y «abonoMensual» en 0. Nunca pongas la suma de los ítems en «montoGlobal»: el total lo calcula la app.
- Si no se mencionó ningún importe: precios en 0, «montoGlobal» y «abonoMensual» en 0, y agregá «No se mencionó el importe de la propuesta» en «avisos».
- Opcionales: solo los que el emisor dictó como extras u opcionales (opcional = true). Nunca agregues servicios opcionales por tu cuenta. Si no dictó ninguno, sugerile en «avisos» 1 o 2 que podría sumar para subir el ticket, con un aviso como «Podrías sumar como opcional: mantenimiento mensual o sesión de fotos».
- Descuento: solo si se dictó explícitamente (en %). Si no, 0.
- Impuesto: solo si se dijo «más IVA» o similar (en %). Si no, 0.

# QUÉ NO SE INVENTA
- Precios.
- Nombre del cliente, empresa, cargo, fechas o datos concretos que no se dijeron: dejá el campo vacío (""). Si falta el nombre del cliente, agregá «Falta completar el nombre del cliente» en «avisos».

# DISEÑO
Elegí el tema visual que mejor vaya con el rubro: ${temas.map(id => `${id} (${TEMAS[id].nombre})`).join(', ')}.

# FORMATO DE SALIDA
Respondé únicamente con el objeto JSON que pide el esquema. En listas (condiciones, próximos pasos, entregables) cada elemento va solo, sin viñetas ni números al principio.`;
};

// Precios que el dueño ya usó (para que la IA respete su nivel). Primero los aceptados.
export const preciosDeReferencia = (propuestas = [], max = 20) => {
  const vistos = new Set();
  const lineas = [];
  const ordenadas = [...propuestas].sort((a, b) => Number(!!b.aceptacion) - Number(!!a.aceptacion));
  for (const p of ordenadas) {
    const moneda = p.payload?.inversion?.moneda || 'USD';
    for (const s of p.payload?.servicios || []) {
      const nombre = String(s?.nombre || '').trim();
      const precio = Number(s?.precio) || 0;
      const clave = nombre.toLowerCase();
      if (!nombre || precio <= 0 || vistos.has(clave)) continue;
      vistos.add(clave);
      lineas.push(`${nombre.slice(0, 80)}: ${moneda} ${precio}${s.modalidad === 'mensual' ? ' por mes' : s.modalidad === 'hora' ? ' por hora' : ''}${p.aceptacion ? ' (aceptado)' : ''}`);
      if (lineas.length >= max) return lineas;
    }
  }
  return lineas;
};

export const mensajeIA = (dictado, referencias = []) => [
  referencias.length ? `Precios que ya usé en otras propuestas:\n${referencias.map(l => `- ${l}`).join('\n')}\n` : '',
  `Lo que te cuento del trabajo:\n"""\n${dictado}\n"""`
].filter(Boolean).join('\n');

// --- Respuesta de la IA → contenido de la propuesta (lo valida el servidor) ---
const corto = (v, max) => String(v ?? '').trim().slice(0, max);
const numero = (v, min, max, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const plata = v => Math.round(numero(v, 0, 1e10) * 100) / 100;
// La vista ya dibuja las listas: se sacan viñetas o números que el modelo haya puesto igual.
const sinVineta = v => String(v ?? '').trim().replace(/^(?:[•\-*–·]|\d{1,2}[.)])\s*/, '');
const lineasDe = (v, maxLinea, maxLineas) => (Array.isArray(v) ? v : String(v ?? '').split('\n'))
  .map(l => corto(sinVineta(l), maxLinea)).filter(Boolean).slice(0, maxLineas).join('\n');
let secuencia = 0;
const nuevoId = () => `ia${Date.now().toString(36)}${(secuencia++).toString(36)}`;

export const propuestaDesdeIA = (r, { temas = temasPermitidos(false) } = {}) => {
  const servicios = (r?.servicios || []).slice(0, 20).map(s => ({
    id: nuevoId(),
    nombre: corto(s.nombre, 200),
    descripcion: corto(s.descripcion, 1000),
    entregables: lineasDe(s.entregables, 200, 10),
    modalidad: MODALIDADES[s.modalidad] ? s.modalidad : 'unico',
    cantidad: numero(s.cantidad, 0, 100000, 1) || 1,
    precio: s.modalidad === 'incluido' ? 0 : plata(s.precio),
    opcional: s.opcional === true,
    imagen: ''
  })).filter(s => s.nombre);

  // Los pagos tienen que sumar 100: si no, se reparte 50/50.
  let pagos = (r?.pagos || []).slice(0, 6)
    .map(p => ({ id: nuevoId(), concepto: corto(p.concepto, 200), porcentaje: Math.round(numero(p.porcentaje, 0, 100)) }))
    .filter(p => p.concepto && p.porcentaje > 0);
  if (pagos.reduce((s, p) => s + p.porcentaje, 0) !== 100) {
    pagos = [
      { id: nuevoId(), concepto: 'Al aceptar la propuesta', porcentaje: 50 },
      { id: nuevoId(), concepto: 'Al entregar el trabajo', porcentaje: 50 }
    ];
  }

  // La app suma el monto global a los ítems: si el modelo repitió ahí la suma de los
  // servicios (en vez de dejarlo en 0), se contaría dos veces.
  const sumaFija = servicios.filter(s => !s.opcional && s.modalidad !== 'mensual' && s.modalidad !== 'incluido')
    .reduce((t, s) => t + s.cantidad * s.precio, 0);
  const sumaMensual = servicios.filter(s => !s.opcional && s.modalidad === 'mensual')
    .reduce((t, s) => t + s.cantidad * s.precio, 0);
  let montoGlobal = plata(r?.montoGlobal);
  let abonoMensual = plata(r?.abonoMensual);
  if (sumaFija > 0 && Math.abs(montoGlobal - sumaFija) < 1) montoGlobal = 0;
  if (sumaMensual > 0 && Math.abs(abonoMensual - sumaMensual) < 1) abonoMensual = 0;

  const tema = temas.includes(r?.tema) ? r.tema : temas[0];
  const preset = TEMAS[tema];
  return {
    contenido: {
      cliente: { nombre: corto(r?.cliente?.nombre, 200), empresa: corto(r?.cliente?.empresa, 200), cargo: corto(r?.cliente?.cargo, 200) },
      propuesta: { titulo: corto(r?.titulo, 200), validez: Math.round(numero(r?.validezDias, 1, 365, 15)) },
      contexto: corto(r?.contexto, 3000),
      objetivos: (r?.objetivos || []).slice(0, 8).map(t => ({ id: nuevoId(), texto: corto(t, 300) })).filter(o => o.texto),
      servicios,
      etapas: (r?.etapas || []).slice(0, 10)
        .map(e => ({ id: nuevoId(), nombre: corto(e.nombre, 200), duracion: corto(e.duracion, 100), descripcion: corto(e.descripcion, 600) }))
        .filter(e => e.nombre),
      faqs: (r?.faqs || []).slice(0, 6)
        .map(f => ({ id: nuevoId(), pregunta: corto(f?.pregunta, 300), respuesta: corto(f?.respuesta, 1000) }))
        .filter(f => f.pregunta && f.respuesta),
      inversion: {
        moneda: MONEDAS_IA.includes(r?.moneda) ? r.moneda : 'ARS',
        montoGlobal,
        abonoMensual,
        descuento: numero(r?.descuento, 0, 100),
        impuestoNombre: 'IVA',
        impuesto: numero(r?.impuesto, 0, 100),
        pagos
      },
      condiciones: lineasDe(r?.condiciones, 400, 8),
      proximosPasos: lineasDe(r?.proximosPasos, 300, 5),
      tema: {
        preset: tema,
        acento: preset.acento,
        fuenteTitulos: preset.fuenteTitulos,
        fuenteCuerpo: preset.fuenteCuerpo,
        portada: preset.portada || 'editorial',
        decoracion: preset.decoracion || 'marco',
        estilo: preset.estilo || 'editorial'
      }
    },
    avisos: (r?.avisos || []).map(a => corto(a, 200)).filter(Boolean).slice(0, 4)
  };
};
