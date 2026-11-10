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

const texto = { type: 'string' };
const lista = items => ({ type: 'array', items });
const objeto = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });

// Esquema de la respuesta (structured outputs: todo requerido, sin propiedades extra).
export const esquemaIA = temas => objeto({
  titulo: texto,
  cliente: objeto({ nombre: texto, empresa: texto }),
  contexto: texto,
  objetivos: lista(texto),
  servicios: lista(objeto({
    nombre: texto,
    descripcion: texto,
    entregables: lista(texto),
    modalidad: { type: 'string', enum: Object.keys(MODALIDADES) },
    cantidad: { type: 'number' },
    precio: { type: 'number' },
    opcional: { type: 'boolean' }
  })),
  etapas: lista(objeto({ nombre: texto, duracion: texto, descripcion: texto })),
  moneda: { type: 'string', enum: MONEDAS_IA },
  pagos: lista(objeto({ concepto: texto, porcentaje: { type: 'number' } })),
  impuesto: { type: 'number' },
  validezDias: { type: 'integer' },
  condiciones: lista(texto),
  proximosPasos: lista(texto),
  tema: { type: 'string', enum: temas },
  avisos: lista(texto)
});

export const instruccionesIA = temas => `Sos el asistente de Dealit, una app argentina para armar propuestas comerciales que se mandan como link. Un freelancer, una agencia o un estudio te cuenta, muchas veces dictado por voz y desordenado, un trabajo que quiere cotizar. Armás la propuesta completa, lista para revisar y enviar.

Cómo escribir:
- Español rioplatense con voseo («vas a recibir», «aceptá»), cálido y profesional, sin exagerar ni prometer lo que no se dijo.
- Le hablás al cliente final, en nombre del dueño. Frases cortas, concretas, sin relleno de marketing.
- El título nombra el trabajo, no la empresa del dueño (ej.: «Reforma integral de baño»).
- Contexto: 1 o 2 párrafos sobre la situación del cliente y lo que necesita, usando solo lo que se contó.

Qué no inventar:
- Nombres de clientes, empresas, fechas o datos que no se dijeron: dejá el campo vacío ("").
- Si falta un precio, estimá uno razonable para el mercado del dueño y avisalo en «avisos».

Servicios y precios:
- Separá el trabajo en servicios claros, con descripción breve y entregables concretos.
- Usá los precios dictados tal cual. Si hay precios de referencia del dueño, respetá ese nivel.
- Modalidad: «unico» (precio fijo), «mensual» (abono), «hora» (cantidad = horas, precio = tarifa) o «incluido» (sin cargo, va en el total).
- Sumá de 1 a 3 servicios opcionales (opcional = true) que tengan sentido para este cliente y suban el ticket. Si el dueño dictó opcionales, usá esos.
- Moneda: ARS salvo que mencione dólares (USD) o euros (EUR). Impuesto: 0 salvo que lo mencione (en %).

Resto:
- Etapas solo si se habló de plazos o el trabajo tiene fases claras; si no, lista vacía.
- Pagos: los que se dictaron; si no, 50 % al aceptar y 50 % al entregar. Deben sumar 100.
- Validez: 15 días salvo que diga otra cosa.
- Condiciones: 3 a 5 líneas útiles para este rubro (cambios incluidos, qué no incluye, plazos). Próximos pasos: 2 o 3 líneas, la primera «Aceptar la propuesta desde este link».
- Tema visual, elegí uno que vaya con el rubro: ${temas.map(id => `${id} (${TEMAS[id].nombre})`).join(', ')}.
- «avisos»: lo que el dueño tiene que revisar antes de enviar (precios estimados, datos que faltan). Cortos, máximo 4.`;

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
let secuencia = 0;
const nuevoId = () => `ia${Date.now().toString(36)}${(secuencia++).toString(36)}`;

export const propuestaDesdeIA = (r, { temas = temasPermitidos(false) } = {}) => {
  const servicios = (r?.servicios || []).slice(0, 20).map(s => ({
    id: nuevoId(),
    nombre: corto(s.nombre, 200),
    descripcion: corto(s.descripcion, 1000),
    entregables: (s.entregables || []).map(e => corto(e, 200)).filter(Boolean).slice(0, 10).join('\n'),
    modalidad: MODALIDADES[s.modalidad] ? s.modalidad : 'unico',
    cantidad: numero(s.cantidad, 0, 100000, 1) || 1,
    precio: Math.round(numero(s.precio, 0, 1e10) * 100) / 100,
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

  const tema = temas.includes(r?.tema) ? r.tema : temas[0];
  const preset = TEMAS[tema];
  return {
    contenido: {
      cliente: { nombre: corto(r?.cliente?.nombre, 200), empresa: corto(r?.cliente?.empresa, 200), cargo: '' },
      propuesta: { titulo: corto(r?.titulo, 200), validez: Math.round(numero(r?.validezDias, 1, 365, 15)) },
      contexto: corto(r?.contexto, 3000),
      objetivos: (r?.objetivos || []).slice(0, 8).map(t => ({ id: nuevoId(), texto: corto(t, 300) })).filter(o => o.texto),
      servicios,
      etapas: (r?.etapas || []).slice(0, 10)
        .map(e => ({ id: nuevoId(), nombre: corto(e.nombre, 200), duracion: corto(e.duracion, 100), descripcion: corto(e.descripcion, 600) }))
        .filter(e => e.nombre),
      inversion: {
        moneda: MONEDAS_IA.includes(r?.moneda) ? r.moneda : 'ARS',
        descuento: 0,
        impuestoNombre: 'IVA',
        impuesto: numero(r?.impuesto, 0, 100),
        pagos
      },
      condiciones: (r?.condiciones || []).map(c => corto(c, 400)).filter(Boolean).slice(0, 8).join('\n'),
      proximosPasos: (r?.proximosPasos || []).map(c => corto(c, 300)).filter(Boolean).slice(0, 5).join('\n'),
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
