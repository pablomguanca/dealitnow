// Modelo de una propuesta: temas, decoraciones, disposiciones, plantillas por rubro, normalización y totales.

import {
  numero,
  texto
} from './lib/formato.js';

export const MODALIDADES = {
  unico: { cantidad: 'Cantidad', precio: 'Precio' },
  mensual: { cantidad: 'Cantidad', precio: 'Precio por mes' },
  hora: { cantidad: 'Horas', precio: 'Tarifa por hora' },
  incluido: { cantidad: 'Cantidad', precio: 'Incluido en el fee' }
};

export const FUENTES_TITULOS = [
  'Bebas Neue', 'Playfair Display', 'Poppins', 'Oswald', 'Raleway',
  'Inter', 'DM Sans', 'Space Grotesk', 'Outfit', 'Sora', 'Archivo Black'
];
export const FUENTES_CUERPO = [
  'Montserrat', 'Inter', 'Open Sans', 'Lato', 'Source Sans 3',
  'DM Sans', 'Nunito', 'Work Sans', 'Rubik', 'IBM Plex Sans'
];

export const DECORACIONES = {
  marco: { nombre: 'Marco de galería', desc: 'Doble filete áureo, rosetón editorial y esquineros' },
  organica: { nombre: 'Botánica orgánica', desc: 'Capas acuareladas, follaje fino y curvas fluidas' },
  geometrica: { nombre: 'Estudio Bauhaus', desc: 'Trama semitono, arcos concéntricos y marcas suizas' },
  aurora: { nombre: 'Aurora & Red Tech', desc: 'Nebulosas de luz, malla en perspectiva y constelación' },
  trama: { nombre: 'Plano & Compás CAD', desc: 'Grilla milimétrica con viñeta, compás áureo y cotas' },
  ondas: { nombre: 'Ondas armónicas', desc: 'Líneas guilloché fluidas, destello óptico y visor 4K' },
  ninguna: { nombre: 'Sin decoración', desc: 'Fondo limpio y despojado' }
};

export const PORTADAS = {
  editorial: { nombre: 'Clásica editorial', desc: 'Título monumental y pie a 4 columnas' },
  dividida: { nombre: 'Magazine dividida', desc: 'Columna lateral de acento y ficha de cliente' },
  insignia: { nombre: 'Centrada boutique', desc: 'Alineación central con cápsula y emblema' },
  impacto: { nombre: 'Banda de impacto', desc: 'Cabecera hero con numeración gigante' }
};

export const ESTILOS_BLOQUES = {
  editorial: { nombre: 'Editorial clásico', desc: 'Numeración lateral y líneas finas' },
  tarjetas: { nombre: 'Tarjetas elevadas', desc: 'Servicios y etapas en bloques con relieve' },
  bento: { nombre: 'Grilla Bento', desc: 'Módulos modernos con chips e insignias' },
  minimal: { nombre: 'Acento lateral', desc: 'Barras verticales de color y diseño limpio' }
};

export const PROPORCIONES_IMAGEN = {
  panoramica: { nombre: 'Panorámica (16:9)', ratio: '16 / 9.5' },
  cuadrada: { nombre: 'Cuadrada (1:1)', ratio: '1 / 1' },
  vertical: { nombre: 'Vertical (4:5)', ratio: '4 / 5' },
  natural: { nombre: 'Proporción original', ratio: 'auto' }
};

export const LAYOUTS_GALERIA = {
  grilla: { nombre: 'Grilla uniforme (2 columnas)' },
  bento: { nombre: 'Mosaico Bento (destaca la 1ª foto)' },
  editorial: { nombre: 'Editorial (1 columna grande)' },
  carrusel: { nombre: 'Tira deslizable horizontal' }
};

export const TEMAS = {
  'lienzo-blanco': {
    nombre: 'Lienzo en blanco', etiqueta: '100% Blanco', plan: 'gratis', acento: '#111827', modo: 'claro', portadaClara: true,
    fondo: '#FFFFFF', fondo2: '#F8FAFC', superficie: '#F1F5F9', superficieBorde: '#E2E8F0',
    texto: '#0F172A', textoApagado: '#475569', textoTenue: '#94A3B8',
    fuenteTitulos: 'Inter', fuenteCuerpo: 'Inter',
    portada: 'editorial', decoracion: 'ninguna', estilo: 'minimal'
  },
  'elegante-oscuro': {
    nombre: 'Elegante oscuro', etiqueta: 'Noir & Oro', plan: 'gratis', acento: '#C9A84C', modo: 'oscuro',
    fondo: '#06060A', fondo2: '#0E0E18', superficie: '#1A1A2E', superficieBorde: '#2A2A44',
    texto: '#F0EBE0', textoApagado: '#9E9688', textoTenue: '#5F5B66',
    fuenteTitulos: 'Bebas Neue', fuenteCuerpo: 'Montserrat',
    portada: 'editorial', decoracion: 'marco', estilo: 'editorial'
  },
  'corporativo': {
    nombre: 'Corporativo', etiqueta: 'Ejecutivo B2B', plan: 'gratis', acento: '#2563EB', modo: 'claro',
    fondo: '#FFFFFF', fondo2: '#F8FAFC', superficie: '#E2E8F0', superficieBorde: '#CBD5E1',
    texto: '#0F172A', textoApagado: '#64748B', textoTenue: '#94A3B8',
    fuenteTitulos: 'Inter', fuenteCuerpo: 'Inter',
    portada: 'dividida', decoracion: 'trama', estilo: 'tarjetas'
  },
  'moderno': {
    nombre: 'Moderno', etiqueta: 'Violeta Digital', plan: 'gratis', acento: '#8B5CF6', modo: 'oscuro',
    fondo: '#0F172A', fondo2: '#1E293B', superficie: '#334155', superficieBorde: '#475569',
    texto: '#E2E8F0', textoApagado: '#94A3B8', textoTenue: '#64748B',
    fuenteTitulos: 'Space Grotesk', fuenteCuerpo: 'Inter',
    portada: 'impacto', decoracion: 'aurora', estilo: 'bento'
  },
  'calido': {
    nombre: 'Cálido', etiqueta: 'Editorial Crema', plan: 'gratis', acento: '#B45309', modo: 'claro',
    fondo: '#FFFBEB', fondo2: '#FEF3C7', superficie: '#F3E8D0', superficieBorde: '#E5D5B5',
    texto: '#292524', textoApagado: '#78716C', textoTenue: '#A8A29E',
    fuenteTitulos: 'Playfair Display', fuenteCuerpo: 'Lato',
    portada: 'insignia', decoracion: 'organica', estilo: 'editorial'
  },
  'minimalista': {
    nombre: 'Minimalista', etiqueta: 'Puro & Limpio', plan: 'gratis', acento: '#18181B', modo: 'claro',
    fondo: '#FAFAFA', fondo2: '#F5F5F5', superficie: '#E5E5E5', superficieBorde: '#D4D4D4',
    texto: '#171717', textoApagado: '#737373', textoTenue: '#A3A3A3',
    fuenteTitulos: 'DM Sans', fuenteCuerpo: 'DM Sans',
    portada: 'editorial', decoracion: 'ninguna', estilo: 'minimal'
  },
  'botanico': {
    nombre: 'Botánico', etiqueta: 'Orgánico Natural', plan: 'pro', acento: '#15803D', modo: 'claro',
    fondo: '#F4F7F4', fondo2: '#E9F0E9', superficie: '#D6E4D6', superficieBorde: '#B8CEB8',
    texto: '#14261A', textoApagado: '#4A6350', textoTenue: '#7A9280',
    fuenteTitulos: 'Playfair Display', fuenteCuerpo: 'Work Sans',
    portada: 'insignia', decoracion: 'organica', estilo: 'tarjetas'
  },
  'aurora-tech': {
    nombre: 'Aurora Tech', etiqueta: 'SaaS & Futuro', plan: 'pro', acento: '#06B6D4', modo: 'oscuro',
    fondo: '#050914', fondo2: '#0B1326', superficie: '#16223B', superficieBorde: '#233559',
    texto: '#ECFEFF', textoApagado: '#94A3B8', textoTenue: '#64748B',
    fuenteTitulos: 'Sora', fuenteCuerpo: 'IBM Plex Sans',
    portada: 'impacto', decoracion: 'aurora', estilo: 'bento'
  },
  'editorial-studio': {
    nombre: 'Estudio Bold', etiqueta: 'Agencia & Bauhaus', plan: 'pro', acento: '#E11D48', modo: 'claro',
    fondo: '#FAF6F0', fondo2: '#F3ECE2', superficie: '#E6DDD0', superficieBorde: '#D5C7B4',
    texto: '#181311', textoApagado: '#6B5E55', textoTenue: '#9C8D82',
    fuenteTitulos: 'Archivo Black', fuenteCuerpo: 'Source Sans 3',
    portada: 'dividida', decoracion: 'geometrica', estilo: 'bento'
  },
  'arquitectura': {
    nombre: 'Arquitectura', etiqueta: 'Piedra & Obra', plan: 'pro', acento: '#9A3412', modo: 'claro',
    fondo: '#F5F4F0', fondo2: '#EAE8E1', superficie: '#DCD9CF', superficieBorde: '#C7C3B6',
    texto: '#1C1917', textoApagado: '#57534E', textoTenue: '#8A847C',
    fuenteTitulos: 'Oswald', fuenteCuerpo: 'Rubik',
    portada: 'dividida', decoracion: 'trama', estilo: 'minimal'
  },
  'oceano-dinamico': {
    nombre: 'Océano Vivo', etiqueta: 'Fluido & Creativo', plan: 'pro', acento: '#38BDF8', modo: 'oscuro',
    fondo: '#071324', fondo2: '#0C1E38', superficie: '#152C4F', superficieBorde: '#21406E',
    texto: '#F0F9FF', textoApagado: '#93B4D1', textoTenue: '#5B7C99',
    fuenteTitulos: 'Outfit', fuenteCuerpo: 'Nunito',
    portada: 'insignia', decoracion: 'ondas', estilo: 'tarjetas'
  }
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const hoyISO = () => {
  const d = new Date();
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

const rangoEntero = (valor, min, max, defecto = 100) => {
  if (valor === undefined || valor === null || valor === '') return defecto;
  const num = Number(valor);
  return Number.isFinite(num) ? Math.min(max, Math.max(min, Math.round(num))) : defecto;
};

export const LISTAS = {
  objetivos: { ruta: 'objetivos', nombre: 'objetivo', nuevo: () => ({ id: uid(), texto: '' }) },
  servicios: { ruta: 'servicios', nombre: 'servicio', nuevo: () => ({ id: uid(), nombre: '', modalidad: 'unico', cantidad: 1, precio: 0, descripcion: '', entregables: '', opcional: false, imagen: '' }) },
  etapas: { ruta: 'etapas', nombre: 'etapa', nuevo: () => ({ id: uid(), nombre: '', duracion: '', descripcion: '' }) },
  pagos: { ruta: 'inversion.pagos', nombre: 'pago', nuevo: () => ({ id: uid(), concepto: '', porcentaje: 0 }) },
  galeria: { ruta: 'galeria', nombre: 'foto', nuevo: () => ({ id: uid(), imagen: '', titulo: '', descripcion: '', proporcion: 'panoramica' }) },
  testimonios: { ruta: 'testimonios', nombre: 'testimonio', nuevo: () => ({ id: uid(), texto: '', autor: '', rol: '', avatar: '' }) },
  faqs: { ruta: 'faqs', nombre: 'pregunta', nuevo: () => ({ id: uid(), pregunta: '', respuesta: '' }) }
};

export const vacio = () => ({
  emisor: {
    nombre: '', rol: '', email: '', telefono: '', web: '', presentacion: '',
    logo: '', foto: '', ubicacion: '', instagram: '', linkedin: '', behance: '', github: ''
  },
  cliente: { nombre: '', empresa: '', cargo: '' },
  propuesta: { titulo: '', numero: '', fecha: hoyISO(), validez: 15, imagenPortada: '', opacidadPortada: 35 },
  contexto: '',
  objetivos: [],
  servicios: [],
  etapas: [],
  galeria: [],
  testimonios: [],
  faqs: [],
  inversion: { moneda: 'USD', abonoMensual: 0, montoGlobal: 0, descuento: 0, impuestoNombre: 'IVA', impuesto: 0, pagos: [] },
  condiciones: '',
  proximosPasos: '',
  opciones: {
    firmas: true,
    credito: true,
    barraNav: false,
    lightbox: true,
    galeriaTitulo: 'Galería visual y referencias',
    galeriaSubtitulo: '',
    galeriaLayout: 'bento',
    galeriaProporcion: 'panoramica'
  },
  tema: {
    preset: 'elegante-oscuro',
    acento: '#C9A84C',
    colorTexto: '',
    colorSvg: '',
    colorFondo: '',
    colorPortada: '',
    opacidadSvg: 100,
    fuenteTitulos: 'Bebas Neue',
    fuenteCuerpo: 'Montserrat',
    portada: 'editorial',
    decoracion: 'marco',
    estilo: 'editorial',
    escalaTituloPortada: 100,
    escalaTitulos: 100,
    escalaTexto: 100,
    espaciadoSecciones: 100,
    espaciadoInterno: 100
  }
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
  tema: {
    preset: 'elegante-oscuro',
    acento: '#C9A84C',
    colorTexto: '',
    colorSvg: '',
    colorFondo: '',
    colorPortada: '',
    opacidadSvg: 100,
    fuenteTitulos: 'Bebas Neue',
    fuenteCuerpo: 'Montserrat',
    portada: 'editorial',
    decoracion: 'marco',
    estilo: 'editorial',
    escalaTituloPortada: 100,
    escalaTitulos: 100,
    escalaTexto: 100,
    espaciadoSecciones: 100,
    espaciadoInterno: 100
  }
});

export const PLANTILLAS = {
  'en-blanco': {
    nombre: 'En blanco (desde cero)',
    rubro: 'Lienzo limpio',
    desc: 'Tema 100% blanco sin decoración ni textos precargados para armar todo a tu medida.',
    plan: 'gratis',
    crear: () => {
      const base = vacio();
      base.tema = {
        ...base.tema,
        preset: 'lienzo-blanco',
        acento: '#111827',
        fuenteTitulos: 'Inter',
        fuenteCuerpo: 'Inter',
        portada: 'editorial',
        decoracion: 'ninguna',
        estilo: 'minimal'
      };
      return base;
    }
  },
  'diseno-web': {
    nombre: 'Branding y Tienda Online',
    rubro: 'Diseño & Web',
    desc: 'Identidad visual, e-commerce, fotografía y mantenimiento mensual.',
    plan: 'gratis',
    crear: () => ejemplo()
  },
  'software-saas': {
    nombre: 'Desarrollo de App & Software',
    rubro: 'Software & Tech',
    desc: 'Plataforma a medida, panel operativo, integraciones API y soporte.',
    plan: 'pro',
    crear: () => ({
      emisor: {
        nombre: 'Nexo Digital Studio',
        rol: 'Desarrollo de productos digitales y automatización',
        email: 'proyectos@nexodigital.io',
        telefono: '+54 9 11 4488-9210',
        web: 'nexodigital.io',
        presentacion: 'Diseñamos y desarrollamos aplicaciones web y sistemas operativos a medida para empresas en crecimiento. Nos enfocamos en interfaces rápidas, arquitectura escalable y entregas quincenales funcionando en producción.',
        logo: ''
      },
      cliente: { nombre: 'Santiago Morales', empresa: 'Logística Sur S.A.', cargo: 'Director de Operaciones' },
      propuesta: { titulo: 'Portal de clientes y trazabilidad de envíos en tiempo real', numero: 'P-2026-089', fecha: hoyISO(), validez: 15 },
      contexto: 'Hoy el equipo de atención responde más de 180 consultas diarias por WhatsApp sobre el estado de los despachos, y la carga de remitos se concilia en planillas separadas al final del día.\n\nNecesitan un portal autogestionable donde cada cliente corporativo consulte sus envíos en vivo, descargue comprobantes y solicite retiros sin depender de soporte manual.',
      objetivos: [
        { id: uid(), texto: 'Reducir en un 70% las consultas operativas por WhatsApp durante el primer trimestre.' },
        { id: uid(), texto: 'Centralizar órdenes, estados de entrega y comprobantes firmados en un único panel web.' },
        { id: uid(), texto: 'Integrar notificaciones automáticas por WhatsApp y correo en cada hito del envío.' }
      ],
      servicios: [
        { id: uid(), nombre: 'Arquitectura UX/UI y prototipo interactivo', modalidad: 'unico', cantidad: 1, precio: 950, descripcion: 'Relevamiento de flujos operativos, diseño de pantallas para clientes y administradores, y prototipo navegable en Figma.', entregables: 'Mapa de flujos y perfiles de usuario\nSistema de diseño UI adaptable (móvil y escritorio)\nPrototipo interactivo validado', opcional: false },
        { id: uid(), nombre: 'Desarrollo de plataforma web y panel operativo', modalidad: 'unico', cantidad: 1, precio: 3200, descripcion: 'Construcción del portal de clientes, buscador de guías en tiempo real, carga de comprobantes y panel de administración.', entregables: 'Portal web para clientes con acceso seguro\nPanel de administración y gestión de despachos\nBase de datos en la nube con backups diarios\nDespliegue en servidor de producción con SSL', opcional: false },
        { id: uid(), nombre: 'Integración con API de WhatsApp y alertas automáticas', modalidad: 'unico', cantidad: 1, precio: 680, descripcion: 'Conexión oficial para enviar avisos automáticos cuando el pedido sale a reparto y cuando se entrega.', entregables: 'Configuración de plantillas de WhatsApp Business\nWebhooks de actualización de estado\nHistorial de envíos y lecturas', opcional: false },
        { id: uid(), nombre: 'Mantenimiento evolutivo, monitoreo y soporte', modalidad: 'mensual', cantidad: 1, precio: 420, descripcion: 'Monitoreo de servidores, actualizaciones de seguridad, soporte prioritario y hasta 8 horas mensuales de mejoras.', entregables: 'Monitoreo de disponibilidad 24/7\nSoporte técnico con respuesta en el día\n8 horas mensuales para nuevas funciones', opcional: false },
        { id: uid(), nombre: 'App móvil progresiva (PWA) para choferes', modalidad: 'unico', cantidad: 1, precio: 890, descripcion: 'Aplicación instalable en el celular de los repartidores para escanear códigos QR, capturar firma digital y subir foto de entrega.', entregables: 'App móvil instalable en Android e iOS\nEscaneo de código de barras / QR\nCarga de foto y geolocalización de entrega', opcional: true }
      ],
      etapas: [
        { id: uid(), nombre: 'Relevamiento y prototipo UX', duracion: '2 semanas', descripcion: 'Definición de requerimientos técnicos y validación de pantallas.' },
        { id: uid(), nombre: 'Desarrollo del núcleo y base de datos', duracion: '3 semanas', descripcion: 'Panel de administración, carga de envíos y autenticación.' },
        { id: uid(), nombre: 'Portal de clientes y alertas', duracion: '2 semanas', descripcion: 'Vista pública de seguimiento, notificaciones y pruebas de carga.' },
        { id: uid(), nombre: 'Puesta en marcha y capacitación', duracion: '1 semana', descripcion: 'Despliegue final, migración inicial de clientes y entrenamiento al equipo.' }
      ],
      inversion: {
        moneda: 'USD',
        descuento: 0,
        impuestoNombre: 'IVA',
        impuesto: 0,
        pagos: [
          { id: uid(), concepto: 'Al aprobar la propuesta y dar inicio', porcentaje: 40 },
          { id: uid(), concepto: 'Contra entrega del prototipo y entorno de pruebas', porcentaje: 30 },
          { id: uid(), concepto: 'En la puesta en producción final', porcentaje: 30 }
        ]
      },
      condiciones: 'El código fuente y la base de datos quedan a nombre del cliente una vez completado el pago.\nLos costos de consumo de servidor en la nube y mensajes de WhatsApp corren por cuenta del cliente.\nIncluye 30 días de garantía técnica sin cargo sobre todo el alcance entregado.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nCoordinar la reunión técnica de inicio para accesos y dominios.\nAbonar el anticipo para reservar el equipo de desarrollo.',
      opciones: { firmas: true, credito: true },
      tema: {
        preset: 'aurora-tech',
        acento: '#06B6D4',
        colorTexto: '',
        colorSvg: '',
        opacidadSvg: 100,
        fuenteTitulos: 'Sora',
        fuenteCuerpo: 'IBM Plex Sans',
        portada: 'impacto',
        decoracion: 'aurora',
        estilo: 'bento'
      }
    })
  },
  'marketing-redes': {
    nombre: 'Marketing Digital & Redes',
    rubro: 'Agencia & Redes',
    desc: 'Estrategia de contenido, producción de Reels, pauta en Meta/Google Ads.',
    plan: 'pro',
    crear: () => ({
      emisor: {
        nombre: 'Pulso Estudio Creativo',
        rol: 'Estrategia digital, creación de contenido y campañas de pago',
        email: 'hola@pulsoestudio.ar',
        telefono: '+54 9 11 6120-3344',
        web: 'pulsoestudio.ar',
        presentacion: 'Acompañamos a marcas gastronómicas, de moda y servicios a crecer en redes con contenido audiovisual que retiene la atención y campañas de anuncios enfocadas en retorno real.',
        logo: ''
      },
      cliente: { nombre: 'Camila Aguirre', empresa: 'Casa Brava Bistró', cargo: 'Socia Gerente' },
      propuesta: { titulo: 'Estrategia de contenidos, Reels y campañas de reservas', numero: 'P-2026-042', fecha: hoyISO(), validez: 10 },
      contexto: 'Casa Brava renovó su carta de noche y coctelería, pero su presencia en Instagram sigue mostrando platos de la temporada anterior y depende del boca en boca para llenar las mesas de miércoles a viernes.',
      objetivos: [
        { id: uid(), texto: 'Posicionar la nueva propuesta nocturna de coctelería y tapeo en el público de la zona.' },
        { id: uid(), texto: 'Generar un flujo constante de reservas directas por WhatsApp y link de reservas.' },
        { id: uid(), texto: 'Construir una estética audiovisual reconocible con producción mensual en el local.' }
      ],
      servicios: [
        { id: uid(), nombre: 'Estrategia creativa y manual de estilo para redes', modalidad: 'unico', cantidad: 1, precio: 420, descripcion: 'Definición de pilares de contenido, tono de comunicación, estética visual del feed y guiones base para video corto.', entregables: 'Pilares y calendario editorial\nGuía visual y plantillas editables\nOptimización completa de biografía y destacados', opcional: false },
        { id: uid(), nombre: 'Gestión mensual de redes y producción de Reels', modalidad: 'mensual', cantidad: 1, precio: 780, descripcion: 'Incluye una jornada mensual de grabación en el local, edición dinámica de Reels, diseño de carruseles y publicación.', entregables: '1 jornada de rodaje mensual (4 horas)\n8 Reels editados con subtítulos y color\n6 carruseles o posteos de alto impacto\nCalendario mensual y reporte de métricas', opcional: false },
        { id: uid(), nombre: 'Gestión de campañas en Meta Ads (Instagram & Facebook)', modalidad: 'mensual', cantidad: 1, precio: 350, descripcion: 'Segmentación por radio geográfico e intereses gastronómicos para llevar reservas todos los días. La pauta publicitaria se abona directo a Meta.', entregables: 'Estructura de campañas por objetivo\nTesteo A/B de anuncios en video\nOptimización semanal de presupuesto\nTablero de resultados en vivo', opcional: false },
        { id: uid(), nombre: 'Gestión de colaboraciones con creadores gastronómicos', modalidad: 'mensual', cantidad: 1, precio: 260, descripcion: 'Selección, invitación y coordinación de 4 micro-influencers mensuales afines a la marca para cobertura en el bistró.', entregables: 'Curaduría y contacto de perfiles\nCoordinación de visitas y entregables\nDerechos de uso de contenido (UGC) para anuncios', opcional: true }
      ],
      etapas: [
        { id: uid(), nombre: 'Estrategia y preproducción', duracion: 'Semana 1', descripcion: 'Definición de pilares, guiones de los primeros videos y armado de calendario.' },
        { id: uid(), nombre: 'Jornada de rodaje y edición', duracion: 'Semana 2', descripcion: 'Grabación en el local, fotografía de platos y edición de la primera tanda.' },
        { id: uid(), nombre: 'Lanzamiento y campañas activas', duracion: 'Semana 3 en adelante', descripcion: 'Publicación continua, activación de anuncios y optimización semanal.' }
      ],
      inversion: {
        moneda: 'USD',
        descuento: 0,
        impuestoNombre: 'IVA',
        impuesto: 0,
        pagos: [
          { id: uid(), concepto: 'Al confirmar el inicio (estrategia + mes 1)', porcentaje: 100 }
        ]
      },
      condiciones: 'Los servicios mensuales tienen una permanencia sugerida de 3 meses para consolidar resultados.\nEl presupuesto publicitario en Meta Ads se abona con tarjeta del cliente directamente en su cuenta publicitaria.\nLas jornadas de grabación se agendan con al menos 7 días de anticipación.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nFijar la fecha de la primera jornada de grabación en el local.\nCompartir accesos al Business Manager e Instagram.',
      opciones: { firmas: false, credito: true },
      tema: {
        preset: 'editorial-studio',
        acento: '#E11D48',
        colorTexto: '',
        colorSvg: '',
        opacidadSvg: 100,
        fuenteTitulos: 'Archivo Black',
        fuenteCuerpo: 'Source Sans 3',
        portada: 'dividida',
        decoracion: 'geometrica',
        estilo: 'tarjetas'
      }
    })
  },
  'arquitectura-interiorismo': {
    nombre: 'Arquitectura & Interiorismo',
    rubro: 'Arquitectura & Obra',
    desc: 'Anteproyecto, renders 3D, documentación ejecutiva y dirección de obra.',
    plan: 'pro',
    crear: () => ({
      emisor: {
        nombre: 'Estudio Sur Arquitectura',
        rol: 'Proyecto arquitectónico, interiorismo comercial y dirección de obra',
        email: 'estudio@surarquitectura.com',
        telefono: '+54 9 11 5012-7788',
        web: 'surarquitectura.com',
        presentacion: 'Proyectamos espacios comerciales y residenciales donde cada material, luminaria y circulación están pensados para durar. Acompañamos desde los primeros croquis hasta la entrega final de obra.',
        logo: ''
      },
      cliente: { nombre: 'Nicolás Ferreyra', empresa: 'Tostadores del Parque', cargo: 'Socio' },
      propuesta: { titulo: 'Proyecto de interiorismo y reforma integral de local comercial', numero: 'P-2026-031', fecha: hoyISO(), validez: 20 },
      contexto: 'El nuevo local de 110 m² en esquina cuenta con doble altura y gran entrada de luz natural, pero requiere redistribuir por completo la barra de despacho, el sector de tostado a la vista y el salón para 38 cubiertos.',
      objetivos: [
        { id: uid(), texto: 'Diseñar una barra protagónica que agilice el despacho de café para llevar y el servicio de salón.' },
        { id: uid(), texto: 'Contar con documentación técnica completa para licitar la obra con contratistas sin imprevistos.' },
        { id: uid(), texto: 'Ejecutar la reforma y el montaje de equipamiento en un plazo máximo de 8 semanas.' }
      ],
      servicios: [
        { id: uid(), nombre: 'Relevamiento y anteproyecto arquitectónico + Renders 3D', modalidad: 'unico', cantidad: 1, precio: 1450, descripcion: 'Medición exhaustiva en sitio, propuestas de zonificación, modelado 3D y selección de paleta de materiales e iluminación.', entregables: 'Planta de arquitectura y equipamiento amoblado\n6 renders fotorrealistas diurnos y nocturnos\nMuestrario físico de revestimientos, maderas y herrajes', opcional: false },
        { id: uid(), nombre: 'Proyecto ejecutivo y pliego de licitación', modalidad: 'unico', cantidad: 1, precio: 1850, descripcion: 'Planos técnicos detallados para que cada gremio cotice y construya con precisión milimétrica.', entregables: 'Planos de demolición, mampostería y solados\nInstalación eléctrica, iluminación y datos\nPlanos de carpintería y herrería a medida (barra y mobiliario)\nPlanilla de cómputo de materiales para licitar', opcional: false },
        { id: uid(), nombre: 'Dirección ejecutiva y coordinación de gremios en obra', modalidad: 'mensual', cantidad: 2, precio: 1100, descripcion: 'Visitas semanales a obra, control de calidad de ejecución, certificación de avances y coordinación de entregas de proveedores.', entregables: '2 a 3 visitas técnicas semanales a obra\nActas de avance y control de certificaciones\nCoordinación en sitio de gremios y mobiliario', opcional: false },
        { id: uid(), nombre: 'Diseño y gestión de cartelería exterior y fachada', modalidad: 'unico', cantidad: 1, precio: 540, descripcion: 'Desarrollo técnico de marquesina, corpóreos retroiluminados, toldos y gráfica en vidriera según normativa.', entregables: 'Planos constructivos de fachada y herrería\nEspecificación lumínica LED\nSeguimiento de fabricación y montaje', opcional: true }
      ],
      etapas: [
        { id: uid(), nombre: 'Anteproyecto e imagen 3D', duracion: '3 semanas', descripcion: 'Relevamiento, distribución funcional, renders y aprobación de materiales.' },
        { id: uid(), nombre: 'Documentación ejecutiva y presupuestos', duracion: '3 semanas', descripcion: 'Desarrollo de planos de detalle y comparativa de cotizaciones de gremios.' },
        { id: uid(), nombre: 'Obra civil, instalaciones y montaje', duracion: '8 semanas', descripcion: 'Seguimiento en obra hasta la habilitación e inauguración del local.' }
      ],
      inversion: {
        moneda: 'USD',
        descuento: 0,
        impuestoNombre: 'IVA',
        impuesto: 0,
        pagos: [
          { id: uid(), concepto: 'Al encomendar el anteproyecto', porcentaje: 35 },
          { id: uid(), concepto: 'Contra entrega de renders y aprobación de anteproyecto', porcentaje: 35 },
          { id: uid(), concepto: 'Contra entrega de la carpeta ejecutiva completa', porcentaje: 30 }
        ]
      },
      condiciones: 'Los honorarios corresponden al proyecto y dirección; la mano de obra, materiales y tasas municipales se contratan y abonan de forma directa a cada proveedor.\nLos honorarios de dirección de obra se abonan mensualmente durante los meses que dure la ejecución.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nCoordinar la visita de relevamiento técnico y medición láser en el local.\nAbonar el anticipo de inicio de anteproyecto.',
      opciones: { firmas: true, credito: true },
      tema: {
        preset: 'arquitectura',
        acento: '#9A3412',
        colorTexto: '',
        colorSvg: '',
        opacidadSvg: 100,
        fuenteTitulos: 'Oswald',
        fuenteCuerpo: 'Rubik',
        portada: 'dividida',
        decoracion: 'trama',
        estilo: 'minimal'
      }
    })
  },
  'consultoria-b2b': {
    nombre: 'Consultoría & Procesos B2B',
    rubro: 'Consultoría & Negocios',
    desc: 'Auditoría comercial, implementación de CRM y entrenamiento de equipo.',
    plan: 'gratis',
    crear: () => ({
      emisor: {
        nombre: 'Andes Consultora Comercial',
        rol: 'Estrategia B2B, procesos de venta e implementación de CRM',
        email: 'contacto@andesconsultora.com',
        telefono: '+54 9 11 3890-1122',
        web: 'andesconsultora.com',
        presentacion: 'Ayudamos a empresas B2B e industriales a profesionalizar su proceso comercial, ordenar su embudo de ventas en CRM y mejorar su tasa de cierre con indicadores claros para dirección.',
        logo: ''
      },
      cliente: { nombre: 'Hernán Quiroga', empresa: 'Grupo Industrial Delta', cargo: 'Gerente Comercial' },
      propuesta: { titulo: 'Estandarización del proceso comercial e implementación de CRM', numero: 'P-2026-055', fecha: hoyISO(), validez: 15 },
      contexto: 'El equipo comercial de 8 ejecutivos gestiona hoy sus cotizaciones por correo y notas personales. Dirección no cuenta con visibilidad en tiempo real sobre las oportunidades abiertas ni los motivos de pérdida, y el seguimiento poscotización depende de la memoria de cada vendedor.',
      objetivos: [
        { id: uid(), texto: 'Unificar el proceso comercial en etapas claras con criterios de avance medibles.' },
        { id: uid(), texto: 'Tener el 100% de las cotizaciones y seguimientos registrados en el CRM en menos de 45 días.' },
        { id: uid(), texto: 'Contar con un tablero gerencial en vivo de pronóstico de ventas, tasa de cierre y ciclo promedio.' }
      ],
      servicios: [
        { id: uid(), nombre: 'Diagnóstico comercial y diseño del playbook de ventas', modalidad: 'unico', cantidad: 1, precio: 1250, descripcion: 'Entrevistas con vendedores y gerencia, análisis de cotizaciones históricas y definición del nuevo proceso estándar.', entregables: 'Informe de diagnóstico y cuellos de botella\nMapa de etapas del embudo B2B\nPlaybook comercial con guiones y criterios de calificación', opcional: false },
        { id: uid(), nombre: 'Configuración y puesta en marcha de CRM', modalidad: 'unico', cantidad: 1, precio: 1600, descripcion: 'Parametrización de embudos, campos obligatorios, recordatorios automáticos y tableros para gerencia.', entregables: 'CRM configurado a medida del negocio\nAutomatizaciones de seguimiento por etapa\nMigración de cartera actual de clientes\n3 tableros de control gerencial', opcional: false },
        { id: uid(), nombre: 'Capacitación práctica del equipo comercial', modalidad: 'hora', cantidad: 12, precio: 75, descripcion: 'Talleres prácticos con los vendedores y sesiones de clínica de oportunidades reales.', entregables: '4 talleres grupales de 3 horas\nGuía rápida en video para futuros ingresos\nCertificación de uso del equipo', opcional: false },
        { id: uid(), nombre: 'Acompañamiento mensual de directorio y auditoría de embudo', modalidad: 'mensual', cantidad: 1, precio: 550, descripcion: 'Dos sesiones mensuales con gerencia comercial para revisar métricas, destrabar cuentas clave y ajustar objetivos.', entregables: 'Auditoría mensual de calidad de carga en CRM\n2 sesiones ejecutivas de comité comercial\nReporte de conversión por vendedor', opcional: true }
      ],
      etapas: [
        { id: uid(), nombre: 'Diagnóstico y diseño', duracion: '2 semanas', descripcion: 'Entrevistas individuales, análisis de datos y validación del nuevo proceso.' },
        { id: uid(), nombre: 'Implementación técnica', duracion: '2 semanas', descripcion: 'Configuración del CRM, automatizaciones, tableros y carga inicial.' },
        { id: uid(), nombre: 'Entrenamiento y adopción', duracion: '2 semanas', descripcion: 'Capacitación al equipo y acompañamiento en las primeras reuniones de pipeline.' }
      ],
      inversion: {
        moneda: 'USD',
        descuento: 0,
        impuestoNombre: 'IVA',
        impuesto: 0,
        pagos: [
          { id: uid(), concepto: 'Al aprobar la propuesta', porcentaje: 50 },
          { id: uid(), concepto: 'Al entregar el CRM configurado e iniciar capacitación', porcentaje: 50 }
        ]
      },
      condiciones: 'Las licencias del software CRM elegido se abonan directamente al proveedor a nombre del cliente.\nLas sesiones presenciales fuera de AMBA contemplan viáticos a convenir.\nToda la información comercial relevada se trata bajo estricto acuerdo de confidencialidad.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nAgendar las entrevistas iniciales con gerencia y referentes del equipo.\nDefinir la fecha de lanzamiento interno del nuevo proceso.',
      opciones: { firmas: true, credito: true },
      tema: {
        preset: 'corporativo',
        acento: '#2563EB',
        colorTexto: '',
        colorSvg: '',
        opacidadSvg: 100,
        fuenteTitulos: 'Inter',
        fuenteCuerpo: 'Inter',
        portada: 'dividida',
        decoracion: 'trama',
        estilo: 'tarjetas'
      }
    })
  },
  'audiovisual-eventos': {
    nombre: 'Producción Audiovisual & Campaña',
    rubro: 'Audiovisual & Foto',
    desc: 'Idea creativa, rodaje multicámara, posproducción de color y piezas por formato.',
    plan: 'pro',
    crear: () => ({
      emisor: {
        nombre: 'Faro Films & Contenido',
        rol: 'Producción audiovisual comercial y fotografía publicitaria',
        email: 'produccion@farofilms.tv',
        telefono: '+54 9 261 554-8890',
        web: 'farofilms.tv',
        presentacion: 'Producimos piezas audiovisuales y campañas fotográficas con estética cinematográfica para marcas que buscan destacarse tanto en presentaciones comerciales como en medios digitales.',
        logo: ''
      },
      cliente: { nombre: 'Julián Benítez', empresa: 'Bodega Los Sauces', cargo: 'Gerente de Marca' },
      propuesta: { titulo: 'Campaña audiovisual y fotográfica para nueva línea Reserva', numero: 'P-2026-073', fecha: hoyISO(), validez: 15 },
      contexto: 'Con el lanzamiento de la nueva añada Reserva en el mercado local y de exportación, la bodega necesita renovar su banco de imágenes y contar con una pieza audiovisual central que transmita el trabajo en viñedo y en cava.',
      objetivos: [
        { id: uid(), texto: 'Contar con una pieza hero de 60 segundos para ferias internacionales, web y presentaciones.' },
        { id: uid(), texto: 'Obtener adaptaciones verticales de alto impacto listas para pauta digital.' },
        { id: uid(), texto: 'Renovar el catálogo de fotografía de producto y estilo de vida de toda la línea.' }
      ],
      servicios: [
        { id: uid(), nombre: 'Idea creativa, guion técnico y scouting de locación', modalidad: 'unico', cantidad: 1, precio: 580, descripcion: 'Desarrollo de narrativa visual, storyboard, cronograma de rodaje en bodega y selección de puesta de luz.', entregables: 'Guion técnico y referencias visuales\nPlan de rodaje hora por hora\nVisita técnica previa a viñedo y cava', opcional: false },
        { id: uid(), nombre: 'Jornada de rodaje en locación (equipo cine 4K)', modalidad: 'unico', cantidad: 1, precio: 1850, descripcion: 'Jornada completa de grabación con cámara de cine digital, puesta de iluminación, sonido directo y dirección.', entregables: 'Equipo de dirección, cámara y gaffer\nÓpticas de cine y estabilizador electrónico\nBackup doble de material crudo en set', opcional: false },
        { id: uid(), nombre: 'Edición, corrección de color y diseño sonoro', modalidad: 'unico', cantidad: 1, precio: 1150, descripcion: 'Montaje narrativo, etalonaje de color profesional, música con licencia comercial y gráfica animada.', entregables: 'Pieza principal de 60 segundos en 4K\n4 cápsulas verticales (15 a 30 s) para Reels/Ads\nVersiones subtituladas en español e inglés', opcional: false },
        { id: uid(), nombre: 'Tomas aéreas con drone FPV e exteriores en cordillera', modalidad: 'unico', cantidad: 1, precio: 490, descripcion: 'Vuelos en amanecer y atardecer sobre los viñedos y recorrido continuo de exterior a cava.', entregables: 'Operador certificado y drone 4K/60fps\n8 clips aéreos etalonados adicionales para banco de marca', opcional: true },
        { id: uid(), nombre: 'Sesión de fotografía de botella y lifestyle en paralelo', modalidad: 'unico', cantidad: 1, precio: 720, descripcion: 'Fotógrafo dedicado durante la jornada para retratar descorche, maridaje y fotos de etiqueta en alta resolución.', entregables: '35 fotografías retocadas en alta resolución\n10 fotos de botella con recorte de fondo PNG', opcional: true }
      ],
      etapas: [
        { id: uid(), nombre: 'Preproducción y guion', duracion: '1 semana', descripcion: 'Aprobación de idea creativa, scouting y plan de rodaje.' },
        { id: uid(), nombre: 'Rodaje en bodega', duracion: '2 días', descripcion: 'Grabación en viñedo, sala de barricas y degustación.' },
        { id: uid(), nombre: 'Posproducción y entregas', duracion: '2 semanas', descripcion: 'Primer corte de edición, ronda de ajustes, color final y exportación de formatos.' }
      ],
      inversion: {
        moneda: 'USD',
        descuento: 0,
        impuestoNombre: 'IVA',
        impuesto: 0,
        pagos: [
          { id: uid(), concepto: 'Reserva de fechas de rodaje y preproducción', porcentaje: 50 },
          { id: uid(), concepto: 'Al finalizar la jornada de rodaje', porcentaje: 25 },
          { id: uid(), concepto: 'Contra entrega de los másters finales', porcentaje: 25 }
        ]
      },
      condiciones: 'Incluye licencias perpetuas de música para uso digital y comercial.\nEn caso de mal clima para tomas exteriores, se reprograma sin cargo con 48 horas de anticipación.\nIncluye dos instancias de revisión sobre el corte de edición antes del color final.',
      proximosPasos: 'Aceptar la propuesta eligiendo los adicionales deseados.\nConfirmar las dos fechas de rodaje de acuerdo al clima.\nAbonar el anticipo de reserva de equipo técnico.',
      opciones: { firmas: true, credito: true },
      tema: {
        preset: 'oceano-dinamico',
        acento: '#38BDF8',
        colorTexto: '',
        colorSvg: '',
        opacidadSvg: 100,
        fuenteTitulos: 'Outfit',
        fuenteCuerpo: 'Nunito',
        portada: 'insignia',
        decoracion: 'ondas',
        estilo: 'tarjetas'
      }
    })
  }
};

export const normalizarPropuesta = (datos, { logoValido = logo => /^data:image\//.test(logo) } = {}) => {
  const base = vacio();
  const d = datos && typeof datos === 'object' ? datos : {};
  const lista = (arr, nuevo) => (Array.isArray(arr) ? arr.filter(x => x && typeof x === 'object').map(x => ({ ...nuevo(), ...x, id: x.id || uid() })) : []);
  const limpiar = (obj, molde) => Object.fromEntries(Object.entries(molde).map(([k, v]) => [k, typeof v === 'string' ? texto(obj?.[k] ?? v) : (obj?.[k] ?? v)]));
  const temaEntrada = d.tema && typeof d.tema === 'object' ? d.tema : {};
  const presetValido = TEMAS[temaEntrada.preset] ? temaEntrada.preset : 'elegante-oscuro';
  const presetDef = TEMAS[presetValido];
  const esColorHex = c => /^#[0-9A-Fa-f]{6}$/.test(texto(c).trim());
  const opacidadValida = rangoEntero(temaEntrada.opacidadSvg, 0, 200, 100);
  const opPortadaValida = rangoEntero(d.propuesta?.opacidadPortada, 0, 90, 35);
  const n = {
    emisor: limpiar(d.emisor, base.emisor),
    cliente: limpiar(d.cliente, base.cliente),
    propuesta: {
      ...limpiar(d.propuesta, base.propuesta),
      opacidadPortada: opPortadaValida
    },
    contexto: texto(d.contexto),
    objetivos: lista(d.objetivos, LISTAS.objetivos.nuevo),
    servicios: lista(d.servicios, LISTAS.servicios.nuevo),
    etapas: lista(d.etapas, LISTAS.etapas.nuevo),
    galeria: lista(d.galeria, LISTAS.galeria.nuevo),
    testimonios: lista(d.testimonios, LISTAS.testimonios.nuevo),
    faqs: lista(d.faqs, LISTAS.faqs.nuevo),
    inversion: { ...limpiar(d.inversion, base.inversion), pagos: lista(d.inversion?.pagos, LISTAS.pagos.nuevo) },
    condiciones: texto(d.condiciones),
    proximosPasos: texto(d.proximosPasos),
    opciones: {
      ...base.opciones,
      ...(d.opciones || {}),
      firmas: d.opciones?.firmas !== undefined ? !!d.opciones.firmas : true,
      credito: d.opciones?.credito !== undefined ? !!d.opciones.credito : true,
      barraNav: d.opciones?.barraNav !== undefined ? !!d.opciones.barraNav : false,
      lightbox: d.opciones?.lightbox !== undefined ? !!d.opciones.lightbox : true,
      galeriaTitulo: texto(d.opciones?.galeriaTitulo ?? base.opciones.galeriaTitulo),
      galeriaSubtitulo: texto(d.opciones?.galeriaSubtitulo ?? base.opciones.galeriaSubtitulo),
      galeriaLayout: LAYOUTS_GALERIA[d.opciones?.galeriaLayout] ? d.opciones.galeriaLayout : 'bento',
      galeriaProporcion: PROPORCIONES_IMAGEN[d.opciones?.galeriaProporcion] ? d.opciones.galeriaProporcion : 'panoramica'
    },
    tema: {
      ...base.tema,
      ...temaEntrada,
      preset: presetValido,
      acento: esColorHex(temaEntrada.acento) ? texto(temaEntrada.acento).trim() : (presetDef.acento || base.tema.acento),
      colorTexto: esColorHex(temaEntrada.colorTexto) ? texto(temaEntrada.colorTexto).trim() : '',
      colorSvg: esColorHex(temaEntrada.colorSvg) ? texto(temaEntrada.colorSvg).trim() : '',
      colorFondo: esColorHex(temaEntrada.colorFondo) ? texto(temaEntrada.colorFondo).trim() : '',
      colorPortada: esColorHex(temaEntrada.colorPortada) ? texto(temaEntrada.colorPortada).trim() : '',
      opacidadSvg: opacidadValida,
      portada: PORTADAS[temaEntrada.portada] ? temaEntrada.portada : (presetDef.portada || 'editorial'),
      decoracion: DECORACIONES[temaEntrada.decoracion] ? temaEntrada.decoracion : (presetDef.decoracion || 'marco'),
      estilo: ESTILOS_BLOQUES[temaEntrada.estilo] ? temaEntrada.estilo : (presetDef.estilo || 'editorial'),
      escalaTituloPortada: rangoEntero(temaEntrada.escalaTituloPortada, 60, 150, 100),
      escalaTitulos: rangoEntero(temaEntrada.escalaTitulos, 70, 140, 100),
      escalaTexto: rangoEntero(temaEntrada.escalaTexto, 85, 125, 100),
      espaciadoSecciones: rangoEntero(temaEntrada.espaciadoSecciones, 40, 170, 100),
      espaciadoInterno: rangoEntero(temaEntrada.espaciadoInterno, 60, 150, 100)
    }
  };
  n.servicios.forEach(s => {
    ['nombre', 'descripcion', 'entregables'].forEach(k => { s[k] = texto(s[k]); });
    if (!MODALIDADES[s.modalidad]) s.modalidad = 'unico';
    s.imagen = logoValido(texto(s.imagen)) ? texto(s.imagen) : '';
  });
  n.objetivos.forEach(o => { o.texto = texto(o.texto); });
  n.etapas.forEach(e => ['nombre', 'duracion', 'descripcion'].forEach(k => { e[k] = texto(e[k]); }));
  n.galeria.forEach(g => {
    g.titulo = texto(g.titulo);
    g.descripcion = texto(g.descripcion);
    g.proporcion = PROPORCIONES_IMAGEN[g.proporcion] ? g.proporcion : 'panoramica';
    g.imagen = logoValido(texto(g.imagen)) ? texto(g.imagen) : '';
  });
  n.testimonios.forEach(t => {
    ['texto', 'autor', 'rol'].forEach(k => { t[k] = texto(t[k]); });
    t.avatar = logoValido(texto(t.avatar)) ? texto(t.avatar) : '';
  });
  n.faqs.forEach(f => {
    f.pregunta = texto(f.pregunta);
    f.respuesta = texto(f.respuesta);
  });
  n.inversion.pagos.forEach(p => { p.concepto = texto(p.concepto); });
  if (n.opciones && typeof n.opciones === 'object') {
    if ('portafolioId' in n.opciones) n.opciones.portafolioId = texto(n.opciones.portafolioId).trim();
    if ('portafolio' in n.opciones) {
      n.opciones.portafolio = n.opciones.portafolio ? normalizarResumenPortafolio(n.opciones.portafolio, { logoValido }) : null;
    }
  }
  if (!logoValido(n.emisor.logo)) n.emisor.logo = '';
  if (!logoValido(n.emisor.foto)) n.emisor.foto = '';
  if (!logoValido(n.propuesta.imagenPortada)) n.propuesta.imagenPortada = '';
  return n;
};

export const totalServicio = s => (s?.modalidad === 'incluido' ? 0 : numero(s?.cantidad) * numero(s?.precio));

export const calcularTotales = (e, sumados = new Set()) => {
  let inicial = Math.max(0, numero(e.inversion?.montoGlobal));
  let mensual = Math.max(0, numero(e.inversion?.abonoMensual));
  e.servicios.forEach(s => {
    if (s.modalidad === 'incluido') return;
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


export const LISTAS_PORTAFOLIO = {
  proyectos: {
    ruta: 'proyectos',
    nombre: 'proyecto',
    nuevo: () => ({
      id: uid(),
      titulo: '',
      categoria: '',
      subtitulo: '',
      destacado: '',
      descripcion: '',
      tags: '',
      imagen: '',
      galeria: [],
      proporcion: 'panoramica',
      enlace: '',
      textoEnlace: 'Ver proyecto'
    })
  },
  especialidades: {
    ruta: 'especialidades',
    nombre: 'especialidad',
    nuevo: () => ({ id: uid(), texto: '' })
  },
  galeria: {
    ruta: 'galeria',
    nombre: 'foto',
    nuevo: () => ({ id: uid(), imagen: '', titulo: '', descripcion: '', proporcion: 'panoramica' })
  },
  serviciosWeb: {
    ruta: 'serviciosWeb',
    nombre: 'servicio',
    nuevo: () => ({ id: uid(), titulo: '', precio: '', descripcion: '', imagen: '', cta: 'Consultar' })
  },
  testimonios: {
    ruta: 'testimonios',
    nombre: 'testimonio',
    nuevo: () => ({ id: uid(), texto: '', autor: '', rol: '', avatar: '' })
  },
  faqs: {
    ruta: 'faqs',
    nombre: 'pregunta',
    nuevo: () => ({ id: uid(), pregunta: '', respuesta: '' })
  }
};

export const vacioPortafolio = () => ({
  emisor: {
    nombre: '', rol: '', email: '', telefono: '', web: '', presentacion: '',
    logo: '', foto: '', ubicacion: '', instagram: '', linkedin: '', behance: '', github: ''
  },
  portafolio: {
    nombreInterno: '',
    titulo: '',
    subtitulo: '',
    insignia: 'Portfolio & Página Web',
    disponibilidad: 'Disponible para nuevos proyectos',
    imagenPortada: '',
    opacidadPortada: 35,
    ctaTexto: 'Contactar',
    cierreTitulo: '¿Trabajamos juntos en tu próximo proyecto?',
    cierreTexto: 'Escribime por WhatsApp o email para conversar sobre tu proyecto o solicitar una propuesta a medida.'
  },
  especialidades: [],
  proyectos: [],
  galeria: [],
  serviciosWeb: [],
  testimonios: [],
  faqs: [],
  opciones: {
    credito: true,
    barraNav: true,
    lightbox: true,
    galeriaTitulo: 'Galería visual',
    galeriaSubtitulo: '',
    galeriaLayout: 'bento',
    galeriaProporcion: 'panoramica',
    serviciosTitulo: 'Servicios y soluciones'
  },
  tema: {
    preset: 'elegante-oscuro',
    acento: '#C9A84C',
    colorTexto: '',
    colorSvg: '',
    colorFondo: '',
    colorPortada: '',
    opacidadSvg: 100,
    fuenteTitulos: 'Bebas Neue',
    fuenteCuerpo: 'Montserrat',
    portada: 'editorial',
    decoracion: 'marco',
    estilo: 'bento',
    escalaTituloPortada: 100,
    escalaTitulos: 100,
    escalaTexto: 100,
    espaciadoSecciones: 100,
    espaciadoInterno: 100
  }
});

export const ejemploPortafolio = () => ({
  emisor: {
    nombre: 'Martina Ríos',
    rol: 'Diseño de marca, UX/UI y tiendas online',
    email: 'hola@martinarios.com',
    telefono: '+54 9 11 5555-0142',
    web: 'martinarios.com',
    presentacion: 'Diseño sistemas visuales y experiencias de compra digital para marcas que buscan diferenciarse. Cada proyecto combina estrategia comercial, dirección de arte e implementación técnica lista para vender.',
    logo: '',
    foto: '',
    ubicacion: 'Buenos Aires · Remoto',
    instagram: '@martinarios.studio',
    linkedin: 'linkedin.com/in/martinarios',
    behance: 'behance.net/martinarios',
    github: ''
  },
  portafolio: {
    nombreInterno: 'Portfolio Diseño & E-commerce',
    titulo: 'Selección de proyectos y casos de estudio',
    subtitulo: 'Identidad visual, diseño UX/UI y tiendas online desarrolladas a medida.',
    insignia: 'Portfolio & Página Web',
    disponibilidad: 'Agenda abierta para nuevos proyectos',
    imagenPortada: '',
    opacidadPortada: 35,
    ctaTexto: 'Contactar por un proyecto',
    cierreTitulo: '¿Tenés un proyecto en mente?',
    cierreTexto: 'Contame qué querés lanzar o rediseñar y te preparo una propuesta a medida con plazos e inversión detallada.'
  },
  especialidades: [
    { id: uid(), texto: 'Identidad visual y manuales de marca' },
    { id: uid(), texto: 'Diseño UX/UI en Figma' },
    { id: uid(), texto: 'Tiendas online y e-commerce' },
    { id: uid(), texto: 'Dirección de arte y packaging' }
  ],
  proyectos: [
    {
      id: uid(),
      titulo: 'Rebranding integral y tienda online',
      categoria: 'Branding & E-commerce',
      subtitulo: 'Almacén Botánico · Palermo',
      destacado: '+140% ventas online en 60 días',
      descripcion: 'Rediseño completo del sistema visual, fotografía de catálogo y desarrollo de tienda con cobros integrados y cálculo automático de envíos en AMBA.',
      tags: 'Identidad visual, Tienda Nube / Shopify, Packaging, Fotografía',
      imagen: '',
      galeria: [],
      proporcion: 'panoramica',
      enlace: 'https://almacenbotanico.example.com',
      textoEnlace: 'Ver caso online'
    },
    {
      id: uid(),
      titulo: 'Identidad gastronómica y carta digital interactiva',
      categoria: 'Dirección de Arte & Web',
      subtitulo: 'Casa Tostadores · Especialidad',
      destacado: 'Sistema para 3 sucursales',
      descripcion: 'Creación de marca desde cero, empaques para café de especialidad en grano y experiencia web móvil para reservas y suscripción mensual.',
      tags: 'Branding, Packaging, Diseño Web, Ilustración',
      imagen: '',
      galeria: [],
      proporcion: 'panoramica',
      enlace: '',
      textoEnlace: 'Ver proyecto'
    },
    {
      id: uid(),
      titulo: 'Landing page de alta conversión y sistema UI',
      categoria: 'UX/UI & Desarrollo Web',
      subtitulo: 'Lumen Estudio Solar',
      destacado: '3.8x más solicitudes de cotización',
      descripcion: 'Arquitectura de información, calculadora interactiva de ahorro energético y diseño de interfaz adaptable con tiempos de carga menores a 1 segundo.',
      tags: 'Figma, Diseño UI, Desarrollo Frontend, SEO',
      imagen: '',
      galeria: [],
      proporcion: 'panoramica',
      enlace: '',
      textoEnlace: 'Ver proyecto'
    }
  ],
  galeria: [],
  serviciosWeb: [
    {
      id: uid(),
      titulo: 'Identidad Visual & Manual de Marca',
      precio: 'Desde USD 950',
      descripcion: 'Sistema completo de logo, paleta cromática, tipografías, papelería y plantillas editables para redes sociales.',
      imagen: '',
      cta: 'Consultar por Branding'
    },
    {
      id: uid(),
      titulo: 'Diseño UX/UI & Tienda Online',
      precio: 'Desde USD 1.600',
      descripcion: 'Diseño a medida y puesta en marcha de tu tienda o landing page optimizada para celulares, cobros y envíos.',
      imagen: '',
      cta: 'Pedir presupuesto web'
    }
  ],
  testimonios: [
    {
      id: uid(),
      texto: 'Pasamos de tomar pedidos a mano por Instagram a tener una tienda que vende sola las 24 horas y una marca que nuestros clientes reconocen al instante.',
      autor: 'Gastón Peralta',
      rol: 'Fundador de Almacén Botánico',
      avatar: ''
    },
    {
      id: uid(),
      texto: 'El proceso fue súper ordenado: cada semana veíamos avances concretos y el resultado superó por completo lo que imaginábamos.',
      autor: 'Clara Mendizábal',
      rol: 'Directora de Casa Tostadores',
      avatar: ''
    }
  ],
  faqs: [
    {
      id: uid(),
      pregunta: '¿Cómo es la forma de trabajo y los pagos?',
      respuesta: 'Trabajamos por etapas con entregas semanales. Se reserva fecha con un 40% de anticipo y el saldo contra entregas.'
    },
    {
      id: uid(),
      pregunta: '¿Entregan los archivos editables y accesos?',
      respuesta: 'Sí, al finalizar el proyecto recibís el 100% de los originales, manuales y accesos de administrador junto con una capacitación.'
    }
  ],
  opciones: {
    credito: true,
    barraNav: true,
    lightbox: true,
    galeriaTitulo: 'Galería visual',
    galeriaSubtitulo: '',
    galeriaLayout: 'bento',
    galeriaProporcion: 'panoramica',
    serviciosTitulo: 'Servicios y soluciones'
  },
  tema: {
    preset: 'elegante-oscuro',
    acento: '#C9A84C',
    colorTexto: '',
    colorSvg: '',
    colorFondo: '',
    colorPortada: '',
    opacidadSvg: 100,
    fuenteTitulos: 'Bebas Neue',
    fuenteCuerpo: 'Montserrat',
    portada: 'editorial',
    decoracion: 'marco',
    estilo: 'bento',
    escalaTituloPortada: 100,
    escalaTitulos: 100,
    escalaTexto: 100,
    espaciadoSecciones: 100,
    espaciadoInterno: 100
  }
});

export const PLANTILLAS_PORTAFOLIO = {
  'en-blanco': {
    nombre: 'En blanco (desde cero)',
    rubro: 'Lienzo limpio',
    desc: 'Empezá tu página o portfolio con fondo 100% blanco y sin bloques precargados.',
    plan: 'gratis',
    crear: () => {
      const base = vacioPortafolio();
      base.tema = {
        ...base.tema,
        preset: 'lienzo-blanco',
        acento: '#111827',
        fuenteTitulos: 'Inter',
        fuenteCuerpo: 'Inter',
        portada: 'editorial',
        decoracion: 'ninguna',
        estilo: 'minimal'
      };
      return base;
    }
  },
  'diseno-web': {
    nombre: 'Diseño, Branding & Web',
    rubro: 'Diseño & Estudio',
    desc: 'Casos de identidad visual, tiendas online y dirección de arte.',
    plan: 'gratis',
    crear: () => ejemploPortafolio()
  },
  'software-producto': {
    nombre: 'Software, Apps & Tech',
    rubro: 'Desarrollo & SaaS',
    desc: 'Plataformas web, paneles operativos, APIs y productos digitales.',
    plan: 'pro',
    crear: () => ({
      emisor: {
        nombre: 'Nexo Digital Studio',
        rol: 'Desarrollo de software a medida, UX/UI y automatización',
        email: 'proyectos@nexodigital.io',
        telefono: '+54 9 11 4488-9210',
        web: 'nexodigital.io',
        presentacion: 'Construimos aplicaciones web rápidas, paneles operativos e integraciones en la nube. Diseñamos pensando en la usabilidad diaria del equipo y en una arquitectura limpia que escale sin fricción.',
        logo: ''
      },
      portafolio: {
        nombreInterno: 'Portfolio Software & Producto',
        titulo: 'Productos digitales y sistemas en producción',
        subtitulo: 'Aplicaciones web, portales B2B y automatizaciones diseñadas a medida.',
        insignia: 'Portfolio Técnico',
        disponibilidad: 'Disponibles para nuevos desarrollos',
        ctaTexto: 'Agendar llamada técnica',
        cierreTitulo: '¿Querés digitalizar un proceso o lanzar tu plataforma?',
        cierreTexto: 'Analizamos tu caso sin cargo y te proponemos una arquitectura por etapas con entregas quincenales.'
      },
      especialidades: [
        { id: uid(), texto: 'Aplicaciones Web Full-Stack' },
        { id: uid(), texto: 'Portales de clientes y paneles B2B' },
        { id: uid(), texto: 'Integraciones API y WhatsApp Cloud' },
        { id: uid(), texto: 'Prototipado UX/UI en Figma' }
      ],
      proyectos: [
        {
          id: uid(),
          titulo: 'Portal corporativo de trazabilidad logística en vivo',
          categoria: 'Web App & API REST',
          subtitulo: 'Logística Sur S.A.',
          destacado: '-72% consultas manuales de soporte',
          descripcion: 'Plataforma autogestionable para más de 400 empresas clientes con seguimiento de envíos en tiempo real, descarga de remitos firmados y alertas por WhatsApp.',
          tags: 'React, Node.js, PostgreSQL, WhatsApp API',
          imagen: '',
          enlace: '',
          textoEnlace: 'Ver arquitectura'
        },
        {
          id: uid(),
          titulo: 'Sistema de turnos, historia clínica y cobros online',
          categoria: 'Plataforma SaaS',
          subtitulo: 'Red de Consultorios Vitae',
          destacado: '+12.000 turnos mensuales gestionados',
          descripcion: 'Agenda médica multi-sede con recordatorios automáticos, cobro de señas por Mercado Pago y liquidación automática de honorarios para 45 profesionales.',
          tags: 'TypeScript, Firebase, Mercado Pago API, PWA',
          imagen: '',
          enlace: '',
          textoEnlace: 'Ver caso'
        },
        {
          id: uid(),
          titulo: 'Tablero gerencial de ventas e inventario multi-depósito',
          categoria: 'BI & Automatización',
          subtitulo: 'Distribuidora Andina',
          destacado: 'Sincronización en tiempo real',
          descripcion: 'Unificación de stock entre ERP, tienda mayorista y vendedores en calle, con alertas de reposición y métricas de rentabilidad por línea.',
          tags: 'Dashboard, API ERP, Cloud Functions, UX/UI',
          imagen: '',
          enlace: '',
          textoEnlace: 'Ver proyecto'
        }
      ],
      opciones: { credito: true },
      tema: {
        preset: 'aurora-tech',
        acento: '#06B6D4',
        colorTexto: '',
        colorSvg: '',
        opacidadSvg: 100,
        fuenteTitulos: 'Sora',
        fuenteCuerpo: 'IBM Plex Sans',
        portada: 'impacto',
        decoracion: 'aurora',
        estilo: 'bento'
      }
    })
  },
  'marketing-contenido': {
    nombre: 'Marketing, Redes & Video',
    rubro: 'Agencia & Contenido',
    desc: 'Campañas digitales, producción de Reels, estrategia y performance.',
    plan: 'pro',
    crear: () => ({
      emisor: {
        nombre: 'Pulso Estudio Creativo',
        rol: 'Contenido audiovisual, redes sociales y campañas Meta/Google Ads',
        email: 'hola@pulsoestudio.ar',
        telefono: '+54 9 11 6120-3344',
        web: 'pulsoestudio.ar',
        presentacion: 'Combinamos dirección creativa, rodaje ágil y pauta publicitaria para que las marcas no solo sumen visualizaciones, sino consultas, reservas y ventas medibles.',
        logo: ''
      },
      portafolio: {
        nombreInterno: 'Portfolio Agencia & Redes',
        titulo: 'Campañas, contenido audiovisual y resultados',
        subtitulo: 'Reels, dirección de arte y performance para marcas gastronómicas y lifestyle.',
        insignia: 'Casos & Reel',
        disponibilidad: 'Cupos mensuales disponibles',
        ctaTexto: 'Consultar disponibilidad',
        cierreTitulo: '¿Listos para darle pulso a tu marca?',
        cierreTexto: 'Escribinos para evaluar tu cuenta actual y armar un plan de contenidos y anuncios a medida.'
      },
      especialidades: [
        { id: uid(), texto: 'Producción y edición de Reels 4K' },
        { id: uid(), texto: 'Estrategia y gestión de Instagram & TikTok' },
        { id: uid(), texto: 'Campañas en Meta Ads y Google Ads' },
        { id: uid(), texto: 'Fotografía gastronómica y de producto' }
      ],
      proyectos: [
        {
          id: uid(),
          titulo: 'Relanzamiento audiovisual y campaña de reservas nocturnas',
          categoria: 'Reels & Meta Ads',
          subtitulo: 'Casa Brava Bistró',
          destacado: 'Salón completo de jueves a sábado',
          descripcion: 'Producción mensual en locación mostrando cocina en vivo y coctelería, acompañada de anuncios segmentados por radio geográfico directo a WhatsApp.',
          tags: 'Rodaje 4K, Reels, Meta Ads, Dirección de Arte',
          imagen: '',
          enlace: '',
          textoEnlace: 'Ver piezas'
        },
        {
          id: uid(),
          titulo: 'Lanzamiento de colección cápsula y performance e-commerce',
          categoria: 'Campaña Integral',
          subtitulo: 'Ámbar Indumentaria',
          destacado: 'ROAS 6.4x en mes de lanzamiento',
          descripcion: 'Editorial fotográfica, serie de 10 videos cortos de estilismo y embudo de anuncios dinámicos de catálogo para venta online en todo el país.',
          tags: 'Fotografía, TikTok & Reels, Social Ads, Copywriting',
          imagen: '',
          enlace: '',
          textoEnlace: 'Ver campaña'
        }
      ],
      opciones: { credito: true },
      tema: {
        preset: 'editorial-studio',
        acento: '#E11D48',
        colorTexto: '',
        colorSvg: '',
        opacidadSvg: 100,
        fuenteTitulos: 'Archivo Black',
        fuenteCuerpo: 'Source Sans 3',
        portada: 'dividida',
        decoracion: 'geometrica',
        estilo: 'tarjetas'
      }
    })
  },
  'conceptos-expertise': {
    nombre: 'Conceptos & Muestra de Expertise',
    rubro: 'Sin clientes previos',
    desc: 'Ideal para presentar proyectos conceptuales, rediseños y habilidades técnicas.',
    plan: 'gratis',
    crear: () => ({
      emisor: {
        nombre: 'Lucas Méndez',
        rol: 'Diseñador UX/UI & Desarrollador Frontend',
        email: 'lucas@mendezstudio.dev',
        telefono: '+54 9 11 3344-7788',
        web: 'mendezstudio.dev',
        presentacion: 'Me especializo en diseñar interfaces claras y construir sitios web modernos y veloces. Desarrollé esta selección de casos de estudio y prototipos funcionales para mostrar mi criterio visual, proceso de trabajo y calidad de código en distintos rubros.',
        logo: ''
      },
      portafolio: {
        nombreInterno: 'Portfolio Proyectos Conceptuales',
        titulo: 'Muestras de trabajo y prototipos funcionales',
        subtitulo: 'Exploraciones de diseño, arquitectura de interfaz y desarrollo web aplicado a casos reales de uso.',
        insignia: 'Portfolio Profesional',
        disponibilidad: 'Disponible para proyectos freelance',
        ctaTexto: 'Contratar / Consultar',
        cierreTitulo: '¿Te gusta este enfoque para tu proyecto?',
        cierreTexto: 'Puedo aplicar este mismo nivel de detalle y dedicación en tu marca o negocio. Escribime y conversamos sin compromiso.'
      },
      especialidades: [
        { id: uid(), texto: 'Diseño de interfaces (Figma)' },
        { id: uid(), texto: 'Desarrollo Web Responsivo' },
        { id: uid(), texto: 'Prototipos interactivos' },
        { id: uid(), texto: 'Optimización de conversión y velocidad' }
      ],
      proyectos: [
        {
          id: uid(),
          titulo: 'Kova — Experiencia de compra para café de especialidad',
          categoria: 'Proyecto Conceptual · E-commerce',
          subtitulo: 'Caso de estudio propio',
          destacado: 'Flujo de suscripción en 3 pasos',
          descripcion: 'Exploración de marca y diseño de tienda online con un recomendador interactivo según el método de filtrado del usuario y checkout simplificado para celular.',
          tags: 'Figma, Sistema de Diseño, Prototipo Mobile, UI',
          imagen: '',
          enlace: '',
          textoEnlace: 'Ver prototipo'
        },
        {
          id: uid(),
          titulo: 'NovaPay — Rediseño de billetera virtual y panel de gastos',
          categoria: 'Caso de Estudio UX/UI',
          subtitulo: 'Concepto Fintech',
          destacado: '24 pantallas + modo oscuro',
          descripcion: 'Rediseño conceptual enfocado en simplificar la lectura de gastos mensuales, transferencias frecuentes en un toque y accesibilidad de contraste AAA.',
          tags: 'UX Research, Wireframes, Design System, Accesibilidad',
          imagen: '',
          enlace: '',
          textoEnlace: 'Ver estudio'
        },
        {
          id: uid(),
          titulo: 'Landing page interactiva para estudio de arquitectura',
          categoria: 'Desarrollo Frontend',
          subtitulo: 'Demostración técnica',
          destacado: 'Puntaje 100/100 en Lighthouse',
          descripcion: 'Maquetado web editorial con grilla adaptable, galería filtrable por tipología de obra y formulario de cotización paso a paso.',
          tags: 'HTML5, SCSS, JavaScript, Animaciones CSS',
          imagen: '',
          enlace: '',
          textoEnlace: 'Ver demo en vivo'
        }
      ],
      opciones: { credito: true },
      tema: {
        preset: 'moderno',
        acento: '#8B5CF6',
        colorTexto: '',
        colorSvg: '',
        opacidadSvg: 100,
        fuenteTitulos: 'Space Grotesk',
        fuenteCuerpo: 'Inter',
        portada: 'impacto',
        decoracion: 'aurora',
        estilo: 'bento'
      }
    })
  }
};

export const normalizarResumenPortafolio = (datos, { logoValido = logo => /^data:image\//.test(logo) } = {}) => {
  if (!datos || typeof datos !== 'object') return null;
  const proyectos = Array.isArray(datos.proyectos)
    ? datos.proyectos
        .filter(x => x && typeof x === 'object')
        .map(x => ({
          id: texto(x.id) || uid(),
          titulo: texto(x.titulo),
          categoria: texto(x.categoria),
          subtitulo: texto(x.subtitulo),
          destacado: texto(x.destacado),
          descripcion: texto(x.descripcion),
          tags: texto(x.tags),
          imagen: logoValido(texto(x.imagen)) ? texto(x.imagen) : '',
          galeria: Array.isArray(x.galeria) ? x.galeria.map(img => texto(img)).filter(img => logoValido(img)).slice(0, 8) : [],
          proporcion: PROPORCIONES_IMAGEN[x.proporcion] ? x.proporcion : 'panoramica',
          enlace: texto(x.enlace),
          textoEnlace: texto(x.textoEnlace) || 'Ver proyecto'
        }))
    : [];
  const galeria = Array.isArray(datos.galeria)
    ? datos.galeria
        .filter(g => g && typeof g === 'object' && logoValido(texto(g.imagen)))
        .map(g => ({
          id: texto(g.id) || uid(),
          imagen: texto(g.imagen),
          titulo: texto(g.titulo),
          descripcion: texto(g.descripcion),
          proporcion: PROPORCIONES_IMAGEN[g.proporcion] ? g.proporcion : 'panoramica'
        }))
    : [];
  return {
    id: texto(datos.id),
    titulo: texto(datos.titulo),
    subtitulo: texto(datos.subtitulo),
    insignia: texto(datos.insignia) || 'Portfolio & Página Web',
    publico: datos.publico === true,
    proyectos,
    galeria
  };
};

export const normalizarPortafolio = (datos, { logoValido = logo => /^data:image\//.test(logo) } = {}) => {
  const base = vacioPortafolio();
  const d = datos && typeof datos === 'object' ? datos : {};
  const lista = (arr, nuevo) => (Array.isArray(arr) ? arr.filter(x => x && typeof x === 'object').map(x => ({ ...nuevo(), ...x, id: x.id || uid() })) : []);
  const limpiar = (obj, molde) => Object.fromEntries(Object.entries(molde).map(([k, v]) => [k, typeof v === 'string' ? texto(obj?.[k] ?? v) : (obj?.[k] ?? v)]));
  const temaEntrada = d.tema && typeof d.tema === 'object' ? d.tema : {};
  const presetValido = TEMAS[temaEntrada.preset] ? temaEntrada.preset : 'elegante-oscuro';
  const presetDef = TEMAS[presetValido];
  const esColorHex = c => /^#[0-9A-Fa-f]{6}$/.test(texto(c).trim());
  const opacidadValida = rangoEntero(temaEntrada.opacidadSvg, 0, 200, 100);
  const opPortadaValida = rangoEntero(d.portafolio?.opacidadPortada, 0, 90, 35);
  const n = {
    emisor: limpiar(d.emisor, base.emisor),
    portafolio: {
      ...limpiar(d.portafolio, base.portafolio),
      opacidadPortada: opPortadaValida
    },
    especialidades: lista(d.especialidades, LISTAS_PORTAFOLIO.especialidades.nuevo),
    proyectos: lista(d.proyectos, LISTAS_PORTAFOLIO.proyectos.nuevo),
    galeria: lista(d.galeria, LISTAS_PORTAFOLIO.galeria.nuevo),
    serviciosWeb: lista(d.serviciosWeb, LISTAS_PORTAFOLIO.serviciosWeb.nuevo),
    testimonios: lista(d.testimonios, LISTAS_PORTAFOLIO.testimonios.nuevo),
    faqs: lista(d.faqs, LISTAS_PORTAFOLIO.faqs.nuevo),
    opciones: {
      ...base.opciones,
      ...(d.opciones || {}),
      credito: d.opciones?.credito !== undefined ? !!d.opciones.credito : true,
      barraNav: d.opciones?.barraNav !== undefined ? !!d.opciones.barraNav : true,
      lightbox: d.opciones?.lightbox !== undefined ? !!d.opciones.lightbox : true,
      galeriaTitulo: texto(d.opciones?.galeriaTitulo ?? base.opciones.galeriaTitulo),
      galeriaSubtitulo: texto(d.opciones?.galeriaSubtitulo ?? base.opciones.galeriaSubtitulo),
      galeriaLayout: LAYOUTS_GALERIA[d.opciones?.galeriaLayout] ? d.opciones.galeriaLayout : 'bento',
      galeriaProporcion: PROPORCIONES_IMAGEN[d.opciones?.galeriaProporcion] ? d.opciones.galeriaProporcion : 'panoramica',
      serviciosTitulo: texto(d.opciones?.serviciosTitulo ?? base.opciones.serviciosTitulo)
    },
    tema: {
      ...base.tema,
      ...temaEntrada,
      preset: presetValido,
      acento: esColorHex(temaEntrada.acento) ? texto(temaEntrada.acento).trim() : (presetDef.acento || base.tema.acento),
      colorTexto: esColorHex(temaEntrada.colorTexto) ? texto(temaEntrada.colorTexto).trim() : '',
      colorSvg: esColorHex(temaEntrada.colorSvg) ? texto(temaEntrada.colorSvg).trim() : '',
      colorFondo: esColorHex(temaEntrada.colorFondo) ? texto(temaEntrada.colorFondo).trim() : '',
      colorPortada: esColorHex(temaEntrada.colorPortada) ? texto(temaEntrada.colorPortada).trim() : '',
      opacidadSvg: opacidadValida,
      portada: PORTADAS[temaEntrada.portada] ? temaEntrada.portada : (presetDef.portada || 'editorial'),
      decoracion: DECORACIONES[temaEntrada.decoracion] ? temaEntrada.decoracion : (presetDef.decoracion || 'marco'),
      estilo: ESTILOS_BLOQUES[temaEntrada.estilo] ? temaEntrada.estilo : (presetDef.estilo || 'bento'),
      escalaTituloPortada: rangoEntero(temaEntrada.escalaTituloPortada, 60, 150, 100),
      escalaTitulos: rangoEntero(temaEntrada.escalaTitulos, 70, 140, 100),
      escalaTexto: rangoEntero(temaEntrada.escalaTexto, 85, 125, 100),
      espaciadoSecciones: rangoEntero(temaEntrada.espaciadoSecciones, 40, 170, 100),
      espaciadoInterno: rangoEntero(temaEntrada.espaciadoInterno, 60, 150, 100)
    }
  };
  n.especialidades.forEach(e => { e.texto = texto(e.texto); });
  n.proyectos.forEach(p => {
    ['titulo', 'categoria', 'subtitulo', 'destacado', 'descripcion', 'tags', 'enlace', 'textoEnlace'].forEach(k => {
      p[k] = texto(p[k]);
    });
    if (!p.textoEnlace.trim()) p.textoEnlace = 'Ver proyecto';
    p.proporcion = PROPORCIONES_IMAGEN[p.proporcion] ? p.proporcion : 'panoramica';
    p.imagen = logoValido(texto(p.imagen)) ? texto(p.imagen) : '';
    p.galeria = Array.isArray(p.galeria)
      ? p.galeria.map(img => texto(img)).filter(img => logoValido(img)).slice(0, 8)
      : [];
  });
  n.galeria.forEach(g => {
    g.titulo = texto(g.titulo);
    g.descripcion = texto(g.descripcion);
    g.proporcion = PROPORCIONES_IMAGEN[g.proporcion] ? g.proporcion : 'panoramica';
    g.imagen = logoValido(texto(g.imagen)) ? texto(g.imagen) : '';
  });
  n.serviciosWeb.forEach(s => {
    ['titulo', 'precio', 'descripcion', 'cta'].forEach(k => { s[k] = texto(s[k]); });
    if (!s.cta.trim()) s.cta = 'Consultar';
    s.imagen = logoValido(texto(s.imagen)) ? texto(s.imagen) : '';
  });
  n.testimonios.forEach(t => {
    ['texto', 'autor', 'rol'].forEach(k => { t[k] = texto(t[k]); });
    t.avatar = logoValido(texto(t.avatar)) ? texto(t.avatar) : '';
  });
  n.faqs.forEach(f => {
    f.pregunta = texto(f.pregunta);
    f.respuesta = texto(f.respuesta);
  });
  if (!logoValido(n.emisor.logo)) n.emisor.logo = '';
  if (!logoValido(n.emisor.foto)) n.emisor.foto = '';
  if (!logoValido(n.portafolio.imagenPortada)) n.portafolio.imagenPortada = '';
  return n;
};

export const resumenPortafolio = (portafolio, id = '', publico = false) => {
  const norm = normalizarPortafolio(portafolio, { logoValido: () => true });
  return {
    id: texto(id),
    titulo: norm.portafolio.titulo.trim() || norm.portafolio.nombreInterno.trim() || 'Portfolio de proyectos',
    subtitulo: norm.portafolio.subtitulo.trim(),
    insignia: norm.portafolio.insignia.trim() || 'Portfolio & Página Web',
    publico: !!publico,
    proyectos: norm.proyectos.filter(p => p.titulo.trim() || p.descripcion.trim() || p.imagen || (p.galeria && p.galeria.length)),
    galeria: norm.galeria.filter(g => g.imagen)
  };
};
