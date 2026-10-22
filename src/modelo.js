// Modelo de una propuesta: temas, decoraciones, disposiciones, plantillas por rubro, normalización y totales.

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

export const TEMAS = {
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
  tema: {
    preset: 'elegante-oscuro',
    acento: '#C9A84C',
    colorTexto: '',
    colorSvg: '',
    opacidadSvg: 100,
    fuenteTitulos: 'Bebas Neue',
    fuenteCuerpo: 'Montserrat',
    portada: 'editorial',
    decoracion: 'marco',
    estilo: 'editorial'
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
    opacidadSvg: 100,
    fuenteTitulos: 'Bebas Neue',
    fuenteCuerpo: 'Montserrat',
    portada: 'editorial',
    decoracion: 'marco',
    estilo: 'editorial'
  }
});

export const PLANTILLAS = {
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
        { id: uid(), texto: 'Reducir en un 70% las consultas manuales de seguimiento por WhatsApp y teléfono.' },
        { id: uid(), texto: 'Centralizar órdenes de retiro, estados de entrega y remitos firmados en un único panel.' },
        { id: uid(), texto: 'Integrar notificaciones automáticas por WhatsApp e email en cada cambio de estado.' }
      ],
      servicios: [
        { id: uid(), nombre: 'Arquitectura UX/UI y prototipo interactivo', modalidad: 'unico', cantidad: 1, precio: 950, descripcion: 'Diseño completo de pantallas para choferes, operadores y clientes corporativos, validado antes de programar.', entregables: 'Flujos de usuario completos\nPrototipo navegable en Figma\nSistema de componentes UI', opcional: false },
        { id: uid(), nombre: 'Portal web de clientes y panel administrador', modalidad: 'unico', cantidad: 1, precio: 3400, descripcion: 'Aplicación web responsiva con acceso por roles, historial de envíos, descarga de remitos y tablero de métricas.', entregables: 'Portal de clientes con login seguro\nPanel operativo para administración\nCarga masiva por Excel/CSV\nExportación de reportes contables', opcional: false },
        { id: uid(), nombre: 'API y sincronización con sistema actual', modalidad: 'unico', cantidad: 1, precio: 1100, descripcion: 'Conexión segura con la base de datos de despachos y generación automática de etiquetas con código QR.', entregables: 'Endpoints REST documentados\nGenerador de etiquetas QR en PDF\nPruebas de carga y seguridad', opcional: false },
        { id: uid(), nombre: 'Infraestructura cloud, monitoreo y evolución', modalidad: 'mensual', cantidad: 1, precio: 420, descripcion: 'Mantenimiento preventivo, copias de seguridad diarias, monitoreo 24/7 y bolsa mensual de mejoras.', entregables: 'Backups automáticos diarios\nMonitoreo de disponibilidad\nHasta 8 horas mensuales de mejoras', opcional: false },
        { id: uid(), nombre: 'Bot de avisos por WhatsApp Business API', modalidad: 'unico', cantidad: 1, precio: 780, descripcion: 'Envío automático de mensajes al destinatario cuando el pedido sale a reparto y cuando se entrega.', entregables: 'Integración oficial con Meta Cloud API\nPlantillas de mensajes aprobadas\nPanel de historial de envíos', opcional: true },
        { id: uid(), nombre: 'Modo offline para choferes en ruta', modalidad: 'unico', cantidad: 1, precio: 640, descripcion: 'Permite registrar entregas y firmas digitales sin señal celular, sincronizando al recuperar conexión.', entregables: 'PWA instalable en celulares\nCaptura de firma y foto en entrega\nSincronización automática en segundo plano', opcional: true }
      ],
      etapas: [
        { id: uid(), nombre: 'Relevamiento y prototipo UX', duracion: '2 semanas', descripcion: 'Mapeo de procesos operativos, diseño de pantallas y validación con el equipo.' },
        { id: uid(), nombre: 'Desarrollo del núcleo y API', duracion: '4 semanas', descripcion: 'Construcción de base de datos, panel operativo, roles y sincronización.' },
        { id: uid(), nombre: 'Portal de clientes y pruebas', duracion: '2 semanas', descripcion: 'Pruebas con usuarios reales, ajustes de rendimiento y capacitación.' },
        { id: uid(), nombre: 'Puesta en marcha asistida', duracion: '1 semana', descripcion: 'Despliegue a producción y acompañamiento en vivo durante la primera semana.' }
      ],
      inversion: {
        moneda: 'USD',
        descuento: 0,
        impuestoNombre: 'IVA',
        impuesto: 0,
        pagos: [
          { id: uid(), concepto: 'Al dar inicio al proyecto', porcentaje: 40 },
          { id: uid(), concepto: 'Contra aprobación del prototipo y avance funcional', porcentaje: 30 },
          { id: uid(), concepto: 'Contra puesta en producción y entrega final', porcentaje: 30 }
        ]
      },
      condiciones: 'El código fuente desarrollado a medida pasa a ser propiedad del cliente una vez completados los pagos.\nCada etapa cuenta con una instancia de revisión y validación conjunta.\nLos costos directos de servidores o consumo de mensajes de WhatsApp corren por cuenta del cliente.\nGarantía técnica de 60 días sobre todo el alcance entregado.',
      proximosPasos: 'Aceptar la propuesta seleccionando los módulos opcionales deseados.\nCoordinar el pago inicial para reservar el equipo de desarrollo.\nRealizar la reunión de kickoff técnico este jueves.',
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
    nombre: 'Marketing Digital & Contenido',
    rubro: 'Agencia & Redes',
    desc: 'Gestión mensual de redes, producción de Reels y pauta publicitaria.',
    plan: 'pro',
    crear: () => ({
      emisor: {
        nombre: 'Pulso Estudio Creativo',
        rol: 'Estrategia digital, contenido audiovisual y performance',
        email: 'hola@pulsoestudio.ar',
        telefono: '+54 9 11 6120-3344',
        web: 'pulsoestudio.ar',
        presentacion: 'Acompañamos a marcas gastronómicas y de estilo de vida a transformar su presencia en redes en reservas y ventas reales. Combinamos dirección de arte, rodaje ágil en locación y campañas de anuncios orientadas a conversión.',
        logo: ''
      },
      cliente: { nombre: 'Valentina Giménez', empresa: 'Casa Brava Bistró', cargo: 'Socia Gerente' },
      propuesta: { titulo: 'Relanzamiento digital, producción de Reels y campañas de reservas', numero: 'P-2026-042', fecha: hoyISO(), validez: 10 },
      contexto: 'Casa Brava renovó su carta de noche y sumó coctelería de autor, pero el perfil de Instagram sigue mostrando fotos estáticas del menú anterior y las reservas de miércoles a viernes dependen solo del público de paso.\n\nEl objetivo es transmitir la experiencia real del salón en video corto y activar campañas segmentadas en un radio de 5 km para llenar los dos turnos de cena.',
      objetivos: [
        { id: uid(), texto: 'Posicionar la nueva propuesta nocturna y de coctelería con contenido audiovisual de alto impacto.' },
        { id: uid(), texto: 'Generar un flujo constante de reservas directas por WhatsApp y link de reservas de miércoles a domingo.' },
        { id: uid(), texto: 'Construir una comunidad activa con identidad visual reconocible y tono propio.' }
      ],
      servicios: [
        { id: uid(), nombre: 'Manual de contenido y dirección estética', modalidad: 'unico', cantidad: 1, precio: 420000, descripcion: 'Definición de pilares narrativos, estética de video, tipografías en pantalla y guía visual del feed.', entregables: 'Playbook creativo de la marca\nGuía de estilo para Reels e historias\nOptimización integral de biografía y destacados', opcional: false },
        { id: uid(), nombre: 'Gestión mensual de redes y producción de Reels', modalidad: 'mensual', cantidad: 1, precio: 890000, descripcion: 'Jornada de rodaje mensual en el bistró, edición dinámica, redacción creativa y publicación programada.', entregables: '1 jornada de rodaje mensual (4 horas)\n8 Reels editados con diseño sonoro\n8 secuencias de historias estratégicas\nCalendario editorial y reporte mensual', opcional: false },
        { id: uid(), nombre: 'Gestión de campañas Meta Ads (Instagram & Facebook)', modalidad: 'mensual', cantidad: 1, precio: 360000, descripcion: 'Configuración, segmentación geográfica y optimización semanal de anuncios para reservas y eventos.', entregables: 'Estructura de campañas por turno y audiencia\nTest A/B de piezas ganadoras\nTablero de resultados y costo por reserva', opcional: false },
        { id: uid(), nombre: 'Cobertura especial de noche de degustación / evento', modalidad: 'unico', cantidad: 1, precio: 310000, descripcion: 'Cobertura en vivo durante el evento de lanzamiento con entrega de material editado en 24 horas.', entregables: 'Cobertura en tiempo real en historias\n1 Reel resumen de alto impacto\n25 fotografías editadas para prensa y redes', opcional: true },
        { id: uid(), nombre: 'Diseño de carta digital interactiva y QR en mesa', modalidad: 'unico', cantidad: 1, precio: 280000, descripcion: 'Rediseño visual del menú móvil rápido con fotos destacadas de platos insignia y maridajes.', entregables: 'Carta web adaptable al celular\nPiezas gráficas para mesa con QR\nArchivo editable para cambios de precios', opcional: true }
      ],
      etapas: [
        { id: uid(), nombre: 'Estrategia y preproducción', duracion: 'Semana 1', descripcion: 'Definición de estética, guiones técnicos y armado del calendario del primer mes.' },
        { id: uid(), nombre: 'Día de rodaje y edición', duracion: 'Semana 2', descripcion: 'Producción en el local de platos, barra y ambiente, y posproducción de las primeras piezas.' },
        { id: uid(), nombre: 'Lanzamiento y campañas activas', duracion: 'Semana 3 en adelante', descripcion: 'Publicación continua, activación de pauta publicitaria y optimización semanal.' }
      ],
      inversion: {
        moneda: 'ARS',
        descuento: 0,
        impuestoNombre: 'IVA',
        impuesto: 0,
        pagos: [
          { id: uid(), concepto: 'Al confirmar el inicio del proyecto', porcentaje: 50 },
          { id: uid(), concepto: 'Al realizar la primera jornada de rodaje', porcentaje: 50 }
        ]
      },
      condiciones: 'Los abonos mensuales se facturan del 1 al 5 de cada mes por mes adelantado.\nLa inversión publicitaria en Meta Ads no está incluida en los honorarios y se abona directo con tarjeta de la marca.\nSe sugiere una permanencia mínima de 3 meses para consolidar el aprendizaje de las campañas.\nLos valores en pesos se actualizan trimestralmente según IPC.',
      proximosPasos: 'Aceptar la propuesta desde el botón inferior.\nDefinir la fecha de la primera jornada de rodaje en el local.\nCompartir accesos al Business Manager e Instagram.',
      opciones: { firmas: true, credito: true },
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
        estilo: 'bento'
      }
    })
  },
  'arquitectura-interiorismo': {
    nombre: 'Arquitectura e Interiorismo',
    rubro: 'Arquitectura & Obra',
    desc: 'Anteproyecto, legajo técnico, renders 3D y dirección ejecutiva.',
    plan: 'pro',
    crear: () => ({
      emisor: {
        nombre: 'Estudio Vértice Arquitectura',
        rol: 'Arquitectura comercial, interiorismo y dirección de obra',
        email: 'estudio@verticearq.com',
        telefono: '+54 9 11 5012-7788',
        web: 'verticearq.com',
        presentacion: 'Proyectamos espacios comerciales y gastronómicos pensados para durar y potenciar la experiencia de marca. Cuidamos tanto la espacialidad y la iluminación como la precisión técnica del legajo para evitar imprevistos en obra.',
        logo: ''
      },
      cliente: { nombre: 'Lucía Fernández', empresa: 'Origen Café de Especialidad', cargo: 'Fundadora' },
      propuesta: { titulo: 'Proyecto de interiorismo y reforma integral de local (85 m²)', numero: 'P-2026-031', fecha: hoyISO(), validez: 20 },
      contexto: 'El nuevo local de Colegiales cuenta con 85 m² en planta libre y un patio interno, pero requiere reubicar por completo la barra de máquinas expreso, adecuar las instalaciones eléctricas y sanitarias, y crear sectores de permanencia cálidos y acústicamente confortables.',
      objetivos: [
        { id: uid(), texto: 'Optimizar el flujo operativo detrás de la barra y la circulación de clientes para horas pico.' },
        { id: uid(), texto: 'Lograr una identidad espacial cálida y luminosa que integre el salón con el patio verde.' },
        { id: uid(), texto: 'Contar con cómputo y documentación ejecutiva exacta para licitar rubros con presupuesto cerrado.' }
      ],
      servicios: [
        { id: uid(), nombre: 'Relevamiento, layout funcional y anteproyecto 3D', modalidad: 'unico', cantidad: 1, precio: 1650, descripcion: 'Medición exhaustiva del local, opciones de zonificación, modelado 3D y selección de materiales e iluminación.', entregables: 'Plano de relevamiento y demolición\nDos propuestas de layout operativo\nMaqueta 3D y 6 renders fotorrealistas\nMoodboard de materiales y luminarias', opcional: false },
        { id: uid(), nombre: 'Proyecto ejecutivo y legajo técnico de obra', modalidad: 'unico', cantidad: 1, precio: 2200, descripcion: 'Documentación completa a escala para que los gremios coticen y ejecuten sin dudas en obra.', entregables: 'Planos de replanteo, cielorrasos y solados\nPlanos de instalaciones eléctrica, sanitaria y termomecánica\nDetalles constructivos de barra y mobiliario fijo\nPlanilla de cómputo de materiales', opcional: false },
        { id: uid(), nombre: 'Licitación de gremios y comparativa de presupuestos', modalidad: 'unico', cantidad: 1, precio: 680, descripcion: 'Armado de pliegos, pedido de cotización a contratistas de confianza y análisis técnico-económico.', entregables: 'Pliego de condiciones por rubro\nCuadro comparativo de al menos 3 oferentes\nCronograma físico-financiero de obra', opcional: false },
        { id: uid(), nombre: 'Dirección de obra y coordinación de gremios (estimado 8 semanas)', modalidad: 'mensual', cantidad: 2, precio: 1100, descripcion: 'Visitas semanales a obra, control de calidad de ejecución, certificaciones de avance y coordinación de entregas.', entregables: '2 a 3 visitas semanales de control\nActas de avance y certificación de pagos a gremios\nResolución técnica en obra', opcional: true },
        { id: uid(), nombre: 'Diseño de fachada, cartelería corpórea y mobiliario exterior', modalidad: 'unico', cantidad: 1, precio: 540, descripcion: 'Intervención integral de la vidriera sobre vereda, toldos, deck exterior e iluminación escénica nocturna.', entregables: 'Planos y detalles de herrería y cartelería\nRender diurno y nocturno de fachada', opcional: true }
      ],
      etapas: [
        { id: uid(), nombre: 'Anteproyecto e imagen', duracion: '3 semanas', descripcion: 'Relevamiento, definición de layout y renders de validación espacial.' },
        { id: uid(), nombre: 'Legajo ejecutivo y detalles', duracion: '3 semanas', descripcion: 'Desarrollo de planos técnicos de instalaciones y carpinterías a medida.' },
        { id: uid(), nombre: 'Licitación y adjudicación', duracion: '2 semanas', descripcion: 'Visita a obra con contratistas, cierre de presupuestos y firma de inicio.' }
      ],
      inversion: {
        moneda: 'USD',
        descuento: 0,
        impuestoNombre: 'IVA',
        impuesto: 0,
        pagos: [
          { id: uid(), concepto: 'Al encomendar el proyecto y realizar el relevamiento', porcentaje: 40 },
          { id: uid(), concepto: 'Contra entrega del anteproyecto 3D aprobado', porcentaje: 35 },
          { id: uid(), concepto: 'Contra entrega del legajo técnico ejecutivo completo', porcentaje: 25 }
        ]
      },
      condiciones: 'Los honorarios no incluyen tasas municipales, gestiones de habilitación comercial ni derechos de construcción.\nEl plazo de cada etapa contempla hasta dos instancias de revisión sobre la propuesta.\nLa dirección de obra se abona mensualmente durante los meses efectivos de ejecución.',
      proximosPasos: 'Confirmar la propuesta desde este enlace.\nCoordinar el acceso al local para el relevamiento métrico y fotográfico.\nRealizar la reunión de programa de necesidades y equipamiento gastronómico.',
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
  const opacidadCruda = temaEntrada.opacidadSvg;
  const opacidadValida = opacidadCruda !== undefined && opacidadCruda !== null && opacidadCruda !== '' && Number.isFinite(Number(opacidadCruda))
    ? Math.min(200, Math.max(0, Math.round(Number(opacidadCruda))))
    : 100;
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
    tema: {
      ...base.tema,
      ...temaEntrada,
      preset: presetValido,
      acento: esColorHex(temaEntrada.acento) ? texto(temaEntrada.acento).trim() : (presetDef.acento || base.tema.acento),
      colorTexto: esColorHex(temaEntrada.colorTexto) ? texto(temaEntrada.colorTexto).trim() : '',
      colorSvg: esColorHex(temaEntrada.colorSvg) ? texto(temaEntrada.colorSvg).trim() : '',
      opacidadSvg: opacidadValida,
      portada: PORTADAS[temaEntrada.portada] ? temaEntrada.portada : (presetDef.portada || 'editorial'),
      decoracion: DECORACIONES[temaEntrada.decoracion] ? temaEntrada.decoracion : (presetDef.decoracion || 'marco'),
      estilo: ESTILOS_BLOQUES[temaEntrada.estilo] ? temaEntrada.estilo : (presetDef.estilo || 'editorial')
    }
  };
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