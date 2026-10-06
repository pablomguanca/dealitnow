// Modelo de una propuesta: temas, valores por defecto, normalización y totales.

import {
  numero,
  texto
} from './lib/formato.js';

export const MODALIDADES = {
  unico: { cantidad: 'Cantidad', precio: 'Precio' },
  mensual: { cantidad: 'Cantidad', precio: 'Precio por mes' },
  hora: { cantidad: 'Horas', precio: 'Tarifa por hora' }
};

export const FUENTES_TITULOS = [
  'Bebas Neue', 'Playfair Display', 'Poppins', 'Oswald', 'Raleway',
  'Inter', 'DM Sans', 'Space Grotesk', 'Outfit', 'Sora', 'Archivo Black'
];
export const FUENTES_CUERPO = [
  'Montserrat', 'Inter', 'Open Sans', 'Lato', 'Source Sans 3',
  'DM Sans', 'Nunito', 'Work Sans', 'Rubik', 'IBM Plex Sans'
];

export const TEMAS = {
  'elegante-oscuro': {
    nombre: 'Elegante oscuro', acento: '#C9A84C', modo: 'oscuro',
    fondo: '#06060A', fondo2: '#0E0E18', superficie: '#1A1A2E', superficieBorde: '#2A2A44',
    texto: '#F0EBE0', textoApagado: '#9E9688', textoTenue: '#5F5B66',
    fuenteTitulos: 'Bebas Neue', fuenteCuerpo: 'Montserrat'
  },
  'corporativo': {
    nombre: 'Corporativo', acento: '#2563EB', modo: 'claro',
    fondo: '#FFFFFF', fondo2: '#F8FAFC', superficie: '#E2E8F0', superficieBorde: '#CBD5E1',
    texto: '#0F172A', textoApagado: '#64748B', textoTenue: '#94A3B8',
    fuenteTitulos: 'Inter', fuenteCuerpo: 'Inter'
  },
  'moderno': {
    nombre: 'Moderno', acento: '#8B5CF6', modo: 'oscuro',
    fondo: '#0F172A', fondo2: '#1E293B', superficie: '#334155', superficieBorde: '#475569',
    texto: '#E2E8F0', textoApagado: '#94A3B8', textoTenue: '#64748B',
    fuenteTitulos: 'Space Grotesk', fuenteCuerpo: 'Inter'
  },
  'calido': {
    nombre: 'Cálido', acento: '#B45309', modo: 'claro',
    fondo: '#FFFBEB', fondo2: '#FEF3C7', superficie: '#F3E8D0', superficieBorde: '#E5D5B5',
    texto: '#292524', textoApagado: '#78716C', textoTenue: '#A8A29E',
    fuenteTitulos: 'Playfair Display', fuenteCuerpo: 'Lato'
  },
  'minimalista': {
    nombre: 'Minimalista', acento: '#18181B', modo: 'claro',
    fondo: '#FAFAFA', fondo2: '#F5F5F5', superficie: '#E5E5E5', superficieBorde: '#D4D4D4',
    texto: '#171717', textoApagado: '#737373', textoTenue: '#A3A3A3',
    fuenteTitulos: 'DM Sans', fuenteCuerpo: 'DM Sans'
  }
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const hoyISO = () => {
  const d = new Date();
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

export const LISTAS = {
  objetivos: { ruta: 'objetivos', nombre: 'objetivo', nuevo: () => ({ id: uid(), texto: '' }) },
  servicios: { ruta: 'servicios', nombre: 'servicio', nuevo: () => ({ id: uid(), nombre: '', modalidad: 'unico', cantidad: 1, precio: 0, descripcion: '', entregables: '', opcional: false }) },
  etapas: { ruta: 'etapas', nombre: 'etapa', nuevo: () => ({ id: uid(), nombre: '', duracion: '', descripcion: '' }) },
  pagos: { ruta: 'inversion.pagos', nombre: 'pago', nuevo: () => ({ id: uid(), concepto: '', porcentaje: 0 }) }
};

export const vacio = () => ({
  emisor: { nombre: '', rol: '', email: '', telefono: '', web: '', presentacion: '', logo: '' },
  cliente: { nombre: '', empresa: '', cargo: '' },
  propuesta: { titulo: '', numero: '', fecha: hoyISO(), validez: 15 },
  contexto: '',
  objetivos: [],
  servicios: [],
  etapas: [],
  inversion: { moneda: 'USD', descuento: 0, impuestoNombre: 'IVA', impuesto: 0, pagos: [] },
  condiciones: '',
  proximosPasos: '',
  opciones: { firmas: true, credito: true },
  tema: { preset: 'elegante-oscuro', acento: '#C9A84C', fuenteTitulos: 'Bebas Neue', fuenteCuerpo: 'Montserrat' }
});

export const ejemplo = () => ({
  emisor: {
    nombre: 'Martina Ríos',
    rol: 'Diseño de marca y desarrollo web',
    email: 'hola@martinarios.com',
    telefono: '+54 9 11 5555-0142',
    web: 'martinarios.com',
    presentacion: 'Hace seis años diseño marcas y tiendas online para negocios independientes. Trabajo con pocos clientes a la vez para poder seguir cada proyecto de cerca, desde la primera reunión hasta el día del lanzamiento.',
    logo: ''
  },
  cliente: { nombre: 'Gastón Peralta', empresa: 'Almacén Botánico', cargo: 'Fundador' },
  propuesta: { titulo: 'Nueva identidad y tienda online', numero: 'P-2026-014', fecha: hoyISO(), validez: 15 },
  contexto: 'Almacén Botánico vende plantas, macetas y accesorios desde hace tres años en su local de Palermo. Casi todas las ventas pasan por el mostrador, y los pedidos que llegan por Instagram se toman a mano, por mensaje directo.\n\nLa marca se armó rápido al abrir y hoy no acompaña el crecimiento: el logo no se lee en tamaños chicos y cada pieza de comunicación se ve distinta.',
  objetivos: [
    { id: uid(), texto: 'Tener una identidad coherente en el local, las redes y el packaging.' },
    { id: uid(), texto: 'Vender online con stock, pagos y envíos resueltos, sin tomar pedidos a mano.' },
    { id: uid(), texto: 'Lanzar la tienda antes de las fiestas de fin de año.' }
  ],
  servicios: [
    { id: uid(), nombre: 'Diagnóstico y estrategia de marca', modalidad: 'unico', cantidad: 1, precio: 450, descripcion: 'Una sesión de trabajo juntos y un análisis de tu competencia y tus clientes para definir cómo tiene que verse y hablar la marca.', entregables: 'Documento de estrategia\nMapa de competidores\nTono de voz y mensajes clave', opcional: false },
    { id: uid(), nombre: 'Identidad visual', modalidad: 'unico', cantidad: 1, precio: 1200, descripcion: 'Un sistema visual pensado para funcionar igual de bien en el cartel del local, en Instagram y en la etiqueta de una maceta.', entregables: 'Logo y versiones reducidas\nPaleta de colores y tipografías\nPlantillas para redes sociales\nManual de marca en PDF', opcional: false },
    { id: uid(), nombre: 'Tienda online', modalidad: 'unico', cantidad: 1, precio: 2400, descripcion: 'Tienda con catálogo, carrito, pagos con tarjeta y transferencia, y envíos configurados. Queda lista para que cargues productos sin ayuda.', entregables: 'Diseño y desarrollo de la tienda\nCarga inicial de hasta 60 productos\nConfiguración de pagos y envíos\nCapacitación de una hora', opcional: false },
    { id: uid(), nombre: 'Fotografía de producto', modalidad: 'hora', cantidad: 8, precio: 45, descripcion: 'Sesión en el local, con fondo neutro y luz controlada, para el catálogo de la tienda.', entregables: 'Fotos editadas en alta resolución\nVersiones recortadas para la tienda', opcional: false },
    { id: uid(), nombre: 'Mantenimiento y contenido', modalidad: 'mensual', cantidad: 1, precio: 380, descripcion: 'Actualizaciones de la tienda, soporte y publicaciones mensuales para redes con la nueva identidad.', entregables: 'Soporte por mail y WhatsApp\nOcho piezas para redes por mes\nReporte mensual de ventas y visitas', opcional: false },
    { id: uid(), nombre: 'Campaña de lanzamiento', modalidad: 'unico', cantidad: 1, precio: 650, descripcion: 'Anuncios en Instagram durante las dos primeras semanas de la tienda para llevar visitas desde el primer día. La inversión en anuncios se paga aparte, directo a la plataforma.', entregables: 'Estrategia y piezas de la campaña\nConfiguración y seguimiento de anuncios\nInforme de resultados', opcional: true },
    { id: uid(), nombre: 'Packaging de marca', modalidad: 'unico', cantidad: 1, precio: 520, descripcion: 'Diseño de bolsas, etiquetas y tarjetas de agradecimiento con la nueva identidad, listos para imprenta.', entregables: 'Tres piezas de packaging\nArchivos listos para imprimir', opcional: true }
  ],
  etapas: [
    { id: uid(), nombre: 'Descubrimiento', duracion: '1 semana', descripcion: 'Reunión inicial, análisis de la competencia y definición de la estrategia.' },
    { id: uid(), nombre: 'Identidad visual', duracion: '3 semanas', descripcion: 'Primera propuesta, dos rondas de ajustes y entrega del manual de marca.' },
    { id: uid(), nombre: 'Tienda online', duracion: '4 semanas', descripcion: 'Diseño, desarrollo, sesión de fotos y carga de productos.' },
    { id: uid(), nombre: 'Lanzamiento', duracion: '1 semana', descripcion: 'Pruebas finales, publicación de la tienda y capacitación.' }
  ],
  inversion: {
    moneda: 'USD',
    descuento: 0,
    impuestoNombre: 'IVA',
    impuesto: 0,
    pagos: [
      { id: uid(), concepto: 'Al aceptar la propuesta', porcentaje: 40 },
      { id: uid(), concepto: 'Al entregar la identidad visual', porcentaje: 30 },
      { id: uid(), concepto: 'Al publicar la tienda', porcentaje: 30 }
    ]
  },
  condiciones: 'Cada entrega incluye dos rondas de cambios. Las rondas adicionales se cotizan aparte.\nLos plazos corren desde el primer pago y la recepción de los materiales necesarios: textos, fotos y accesos.\nEl dominio, el hosting y la plataforma de la tienda quedan a nombre del cliente y se abonan por separado.\nEl servicio mensual se contrata por un mínimo de tres meses y se cancela con 30 días de aviso.\nCon el pago completo, todos los archivos finales pasan a ser del cliente.',
  proximosPasos: 'Aceptar la propuesta desde este link.\nAbonar el primer pago para reservar la fecha de inicio.\nAgendar la reunión de descubrimiento de la primera semana.',
  opciones: { firmas: true, credito: true },
  tema: { preset: 'elegante-oscuro', acento: '#C9A84C', fuenteTitulos: 'Bebas Neue', fuenteCuerpo: 'Montserrat' }
});

export const normalizarPropuesta = (datos, { logoValido = logo => /^data:image\//.test(logo) } = {}) => {
  const base = vacio();
  const d = datos && typeof datos === 'object' ? datos : {};
  const lista = (arr, nuevo) => (Array.isArray(arr) ? arr.filter(x => x && typeof x === 'object').map(x => ({ ...nuevo(), ...x, id: x.id || uid() })) : []);
  const limpiar = (obj, molde) => Object.fromEntries(Object.entries(molde).map(([k, v]) => [k, typeof v === 'string' ? texto(obj?.[k] ?? v) : (obj?.[k] ?? v)]));
  const n = {
    emisor: limpiar(d.emisor, base.emisor),
    cliente: limpiar(d.cliente, base.cliente),
    propuesta: limpiar(d.propuesta, base.propuesta),
    contexto: texto(d.contexto),
    objetivos: lista(d.objetivos, LISTAS.objetivos.nuevo),
    servicios: lista(d.servicios, LISTAS.servicios.nuevo),
    etapas: lista(d.etapas, LISTAS.etapas.nuevo),
    inversion: { ...limpiar(d.inversion, base.inversion), pagos: lista(d.inversion?.pagos, LISTAS.pagos.nuevo) },
    condiciones: texto(d.condiciones),
    proximosPasos: texto(d.proximosPasos),
    opciones: { ...base.opciones, ...(d.opciones || {}) },
    tema: { ...base.tema, ...(d.tema && typeof d.tema === 'object' ? d.tema : {}) }
  };
  if (!TEMAS[n.tema.preset]) n.tema.preset = 'elegante-oscuro';
  n.servicios.forEach(s => {
    ['nombre', 'descripcion', 'entregables'].forEach(k => { s[k] = texto(s[k]); });
    if (!MODALIDADES[s.modalidad]) s.modalidad = 'unico';
  });
  n.objetivos.forEach(o => { o.texto = texto(o.texto); });
  n.etapas.forEach(e => ['nombre', 'duracion', 'descripcion'].forEach(k => { e[k] = texto(e[k]); }));
  n.inversion.pagos.forEach(p => { p.concepto = texto(p.concepto); });
  if (!logoValido(n.emisor.logo)) n.emisor.logo = '';
  return n;
};

export const totalServicio = s => numero(s.cantidad) * numero(s.precio);

export const calcularTotales = (e, sumados = new Set()) => {
  let inicial = 0;
  let mensual = 0;
  e.servicios.forEach(s => {
    if (s.opcional && !sumados.has(s.id)) return;
    if (s.modalidad === 'mensual') mensual += totalServicio(s);
    else inicial += totalServicio(s);
  });
  const descuento = Math.min(Math.max(numero(e.inversion.descuento), 0), 100) / 100;
  const impuesto = Math.max(numero(e.inversion.impuesto), 0) / 100;
  const bloque = base => {
    const desc = base * descuento;
    const neto = base - desc;
    const imp = neto * impuesto;
    return { base, desc, imp, total: neto + imp };
  };
  return { inicial: bloque(inicial), mensual: bloque(mensual), descuento, impuesto };
};
