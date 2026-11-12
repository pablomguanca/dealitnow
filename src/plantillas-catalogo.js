// Catálogo ampliado de plantillas de propuesta: rubros nuevos, cada uno con su diseño propio
// (TEMAS_CATALOGO) y textos de ejemplo escritos para ese oficio. modelo.js las suma a
// TEMAS y PLANTILLAS (con catalogo: true): no aparecen entre los atajos del editor, sino en
// «Explorar más plantillas» (pestaña Plantillas del panel).
//
// Los datos van sin IDs ni fecha: modelo.js los completa al crear la propuesta
// (desdeCatalogo). Objetivos y pagos se escriben cortos: ['texto'] y [concepto, %].

// ---------- Diseños nuevos ----------
export const TEMAS_CATALOGO = {
  'obra': {
    nombre: 'Obra', etiqueta: 'Acero & Naranja', plan: 'gratis', acento: '#EA580C', modo: 'claro', portadaFondo: '#1F1E1C',
    fondo: '#F7F7F5', fondo2: '#EFEEEA', superficie: '#E4E2DC', superficieBorde: '#D2CFC6',
    texto: '#1C1B19', textoApagado: '#5C5A55', textoTenue: '#8F8C85',
    fuenteTitulos: 'Oswald', fuenteCuerpo: 'Inter',
    portada: 'franja', decoracion: 'trama', estilo: 'contorno'
  },
  'arena-nupcial': {
    nombre: 'Arena', etiqueta: 'Bodas & Celebraciones', plan: 'pro', acento: '#A07845', modo: 'claro', portadaClara: true,
    fondo: '#FBF8F3', fondo2: '#F4EEE4', superficie: '#EAE1D3', superficieBorde: '#DCCFBC',
    texto: '#2B2620', textoApagado: '#776B5D', textoTenue: '#A89C8C',
    fuenteTitulos: 'Cormorant Garamond', fuenteCuerpo: 'Lato',
    portada: 'minimal', decoracion: 'organica', estilo: 'suave'
  },
  'bordo-lino': {
    nombre: 'Bordó', etiqueta: 'Legal & Clásico', plan: 'pro', acento: '#7F1D1D', modo: 'claro',
    fondo: '#FAF8F4', fondo2: '#F2EEE6', superficie: '#E7E0D3', superficieBorde: '#D6CCBA',
    texto: '#1F1A17', textoApagado: '#5E554D', textoTenue: '#968B80',
    fuenteTitulos: 'DM Serif Display', fuenteCuerpo: 'Source Sans 3',
    portada: 'insignia', decoracion: 'marco', estilo: 'editorial'
  },
  'azul-notarial': {
    nombre: 'Notarial', etiqueta: 'Finanzas & Confianza', plan: 'pro', acento: '#1E40AF', modo: 'claro',
    fondo: '#F7F9FC', fondo2: '#EEF2F8', superficie: '#DFE6F0', superficieBorde: '#C9D3E2',
    texto: '#0B1B33', textoApagado: '#4A5A73', textoTenue: '#8593A8',
    fuenteTitulos: 'Playfair Display', fuenteCuerpo: 'IBM Plex Sans',
    portada: 'dividida', decoracion: 'trama', estilo: 'tarjetas'
  },
  'indigo-producto': {
    nombre: 'Índigo', etiqueta: 'Producto & UX', plan: 'pro', acento: '#4F46E5', modo: 'claro',
    fondo: '#F8F8FF', fondo2: '#EFEFFD', superficie: '#E2E2FA', superficieBorde: '#CDCDF3',
    texto: '#14132B', textoApagado: '#55547A', textoTenue: '#8C8BAE',
    fuenteTitulos: 'Sora', fuenteCuerpo: 'Inter',
    portada: 'tarjeta', decoracion: 'geometrica', estilo: 'bento'
  },
  'coral-performance': {
    nombre: 'Coral', etiqueta: 'Ventas & Performance', plan: 'pro', acento: '#FB7185', modo: 'oscuro',
    fondo: '#0E0C0B', fondo2: '#171413', superficie: '#231F1D', superficieBorde: '#36302D',
    texto: '#FAF5F2', textoApagado: '#B3A7A0', textoTenue: '#7D736D',
    fuenteTitulos: 'Space Grotesk', fuenteCuerpo: 'Figtree',
    portada: 'franja', decoracion: 'trama', estilo: 'bento'
  },
  'neon-pulso': {
    nombre: 'Neón', etiqueta: 'Música & Noche', plan: 'pro', acento: '#D946EF', modo: 'oscuro',
    fondo: '#09060F', fondo2: '#120B1D', superficie: '#1E1430', superficieBorde: '#30224A',
    texto: '#F6F0FF', textoApagado: '#B4A6CC', textoTenue: '#7A6D93',
    fuenteTitulos: 'Syne', fuenteCuerpo: 'Manrope',
    portada: 'impacto', decoracion: 'ondas', estilo: 'bento'
  },
  'menta-clinica': {
    nombre: 'Menta', etiqueta: 'Salud & Bienestar', plan: 'pro', acento: '#0F766E', modo: 'claro',
    fondo: '#F3FAF8', fondo2: '#E7F4F0', superficie: '#D3EBE4', superficieBorde: '#B8DCD2',
    texto: '#0F2A26', textoApagado: '#4A6964', textoTenue: '#86A29D',
    fuenteTitulos: 'Lexend', fuenteCuerpo: 'Figtree',
    portada: 'tarjeta', decoracion: 'organica', estilo: 'suave'
  },
  'energia': {
    nombre: 'Energía', etiqueta: 'Fitness & Deporte', plan: 'pro', acento: '#F97316', modo: 'oscuro',
    fondo: '#0B0B0C', fondo2: '#141416', superficie: '#1F1F22', superficieBorde: '#303035',
    texto: '#FAFAFA', textoApagado: '#A8A8AE', textoTenue: '#6E6E75',
    fuenteTitulos: 'Archivo Black', fuenteCuerpo: 'Work Sans',
    portada: 'impacto', decoracion: 'geometrica', estilo: 'tarjetas'
  },
  'tinta': {
    nombre: 'Tinta', etiqueta: 'Editorial & Palabra', plan: 'pro', acento: '#B91C1C', modo: 'claro', portadaClara: true,
    fondo: '#FAF9F6', fondo2: '#F1EFEA', superficie: '#E5E2DA', superficieBorde: '#D3CFC4',
    texto: '#151412', textoApagado: '#58544C', textoTenue: '#8F8A80',
    fuenteTitulos: 'Fraunces', fuenteCuerpo: 'Source Sans 3',
    portada: 'editorial', decoracion: 'ninguna', estilo: 'editorial'
  },
  'olivo-noche': {
    nombre: 'Olivo', etiqueta: 'Real Estate Premium', plan: 'pro', acento: '#C8B07A', modo: 'oscuro',
    fondo: '#0F1210', fondo2: '#161A17', superficie: '#212722', superficieBorde: '#323A33',
    texto: '#F2EFE6', textoApagado: '#ABA897', textoTenue: '#77766A',
    fuenteTitulos: 'Playfair Display', fuenteCuerpo: 'Manrope',
    portada: 'dividida', decoracion: 'marco', estilo: 'contorno'
  }
};

// Servicio: [nombre, modalidad, cantidad, precio, descripcion, entregables, opcional?]
const srv = (nombre, modalidad, cantidad, precio, descripcion, entregables, opcional = false) =>
  ({ nombre, modalidad, cantidad, precio, descripcion, entregables, opcional });
const etapa = (nombre, duracion, descripcion) => ({ nombre, duracion, descripcion });
const faq = (pregunta, respuesta) => ({ pregunta, respuesta });

// ---------- Plantillas ----------
export const PLANTILLAS_CATALOGO = {
  'oficios-reformas': {
    nombre: 'Refacción de baño llave en mano',
    rubro: 'Oficios & Reformas',
    desc: 'Obra con materiales, mano de obra por etapas, garantía y forma de pago clara.',
    plan: 'gratis',
    datos: () => ({
      emisor: {
        nombre: 'Martín Ledesma Reformas',
        rol: 'Refacciones integrales, plomería y electricidad',
        email: 'presupuestos@ledesmareformas.com.ar',
        telefono: '+54 9 11 5320-7781',
        web: 'ledesmareformas.com.ar',
        presentacion: 'Hace 14 años hacemos refacciones de baños, cocinas y departamentos en CABA y zona norte. Trabajamos con cuadrilla propia, cumplimos los plazos que firmamos y dejamos la obra limpia todos los días.'
      },
      cliente: { nombre: 'Lucía Fernández', empresa: '', cargo: '' },
      propuesta: { titulo: 'Refacción completa de baño principal', numero: 'P-2026-118', validez: 10 },
      contexto: 'El baño tiene más de 30 años: la cañería es de hierro, hay una pérdida debajo de la bañera que ya manchó el techo del vecino y los revestimientos están rajados.\n\nLa idea es dejarlo a nuevo, cambiar la bañera por un receptáculo de ducha con mampara y ganar guardado con un vanitory suspendido.',
      objetivos: [
        'Terminar con la pérdida y renovar toda la instalación de agua y desagües.',
        'Un baño moderno, fácil de limpiar y con más lugar de guardado.',
        'Terminar la obra en tres semanas, sin sorpresas en el precio.'
      ],
      servicios: [
        srv('Demolición y retiro de escombros', 'unico', 1, 420000, 'Retiro de revestimientos, sanitarios y bañera. Embolsado y retiro de escombros con volquete incluido.', 'Volquete y retiro\nProtección de pisos y espacios comunes'),
        srv('Instalación sanitaria nueva', 'unico', 1, 980000, 'Cañería de termofusión para agua fría y caliente, desagües en PVC reforzado y prueba hidráulica antes de cerrar.', 'Cañería de agua completa\nDesagües y rejilla de piso\nPrueba de presión documentada'),
        srv('Revestimientos y colocación', 'unico', 1, 1350000, 'Carpeta, impermeabilización del sector ducha y colocación de porcellanato en piso y paredes hasta el techo.', 'Impermeabilización con membrana líquida\nColocación de 32 m² de porcellanato\nPastinas y terminaciones'),
        srv('Sanitarios, grifería y vanitory', 'unico', 1, 640000, 'Colocación de inodoro, vanitory suspendido, grifería monocomando, mampara y accesorios. Los materiales los elegís vos o te los conseguimos con descuento de corralón.', 'Colocación de todos los artefactos\nSellado y prueba de funcionamiento'),
        srv('Electricidad del baño', 'unico', 1, 310000, 'Nuevo circuito con disyuntor, tomas con tapa y luminarias LED empotradas.', 'Circuito nuevo con protección\nDos luminarias LED y luz de espejo'),
        srv('Pintura de cielorraso con antihongos', 'unico', 1, 120000, 'Enduido, fijador y pintura antihongos para el techo del baño.', 'Dos manos de pintura antihongos', true),
        srv('Calefactor toallero eléctrico', 'unico', 1, 185000, 'Provisión e instalación de un toallero eléctrico de bajo consumo.', 'Toallero de 500 W con termostato', true)
      ],
      etapas: [
        etapa('Demolición', '3 días', 'Retiro de todo lo existente y revisión de la losa.'),
        etapa('Instalaciones', '5 días', 'Agua, desagües y electricidad nuevos, con prueba de presión.'),
        etapa('Revestimientos', '8 días', 'Impermeabilización, carpeta y colocación de porcellanato.'),
        etapa('Terminaciones', '4 días', 'Sanitarios, grifería, mampara, limpieza final y entrega.')
      ],
      faqs: [
        faq('¿Los materiales están incluidos?', 'La mano de obra y los materiales de instalación (caños, membrana, adhesivos) sí. Revestimientos, sanitarios y grifería los elegís vos; te pasamos una lista con cantidades exactas.'),
        faq('¿Qué pasa si aparece algo imprevisto?', 'Si al demoler aparece un problema estructural, te lo mostramos con fotos y te pasamos el costo por escrito antes de hacer cualquier trabajo extra.')
      ],
      inversion: { moneda: 'ARS', pagos: [['Al aceptar, para materiales de instalación', 40], ['Al terminar instalaciones', 30], ['Al entregar la obra', 30]] },
      condiciones: 'Los precios se mantienen durante la validez de esta propuesta.\nHorario de trabajo: lunes a viernes de 8 a 17, respetando el reglamento del edificio.\nGarantía de 12 meses sobre la mano de obra y las instalaciones.\nLos materiales a cargo del cliente tienen que estar en obra antes de cada etapa.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nAbonar el primer pago para reservar la fecha de inicio.\nCoordinar la visita para elegir revestimientos y sanitarios.',
      tema: 'obra'
    })
  },

  'fotografia-bodas': {
    nombre: 'Cobertura de boda',
    rubro: 'Fotografía de bodas',
    desc: 'Fotografía y video de casamiento, preboda, álbum impreso y entrega online.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Luz de Tarde Fotografía',
        rol: 'Fotografía y video de bodas',
        email: 'hola@luzdetarde.com.ar',
        telefono: '+54 9 351 612-4409',
        web: 'luzdetarde.com.ar',
        presentacion: 'Somos Agus y Tomi. Hace ocho años contamos historias de casamientos en Córdoba y todo el país, con un estilo natural: poco posado, mucha emoción real y la luz del lugar.'
      },
      cliente: { nombre: 'Sofía y Joaquín', empresa: '', cargo: '' },
      propuesta: { titulo: 'Fotografía y video de su casamiento', numero: 'P-2026-073', validez: 7 },
      contexto: 'Se casan el sábado 14 de marzo en una estancia de Villa Allende: ceremonia al aire libre a las 18, fiesta hasta las 5 y unos 140 invitados.\n\nQuieren fotos naturales, que se vea la emoción de la familia, y un video corto para compartir que no parezca un spot publicitario.',
      objetivos: [
        'Registrar el día completo, desde los preparativos hasta el final de la fiesta.',
        'Un video corto y emotivo para compartir, y la película completa para guardar.',
        'Un álbum impreso de calidad, para tener en las manos y no solo en el celular.'
      ],
      servicios: [
        srv('Cobertura fotográfica del día', 'unico', 1, 1650000, 'Dos fotógrafos desde los preparativos de ambos hasta las 2 de la mañana. Edición de color a mano, foto por foto.', 'Más de 600 fotos editadas en alta\nGalería online privada para descargar y compartir\nAdelanto de 30 fotos en 72 horas'),
        srv('Video del casamiento', 'unico', 1, 1400000, 'Un camarógrafo con estabilizador y drone (si el lugar lo permite). Audio de la ceremonia y de los discursos.', 'Video resumen de 4 minutos\nPelícula completa de 40 minutos\nVersión vertical para redes'),
        srv('Sesión preboda', 'unico', 1, 380000, 'Una sesión de dos horas en el lugar que elijan, para conocernos y que lleguen relajados frente a la cámara.', '60 fotos editadas\nIdeal para el save the date'),
        srv('Álbum de lino 30×30', 'unico', 1, 520000, 'Álbum de 40 páginas en papel fotográfico, tapa de lino con grabado. Diseñamos el armado juntos.', 'Diseño del álbum con dos revisiones\nCaja de presentación', true),
        srv('Cabina de fotos para invitados', 'unico', 1, 450000, 'Cabina con fondo e impresión instantánea durante tres horas de fiesta.', 'Impresiones ilimitadas\nGalería digital de la cabina', true)
      ],
      etapas: [
        etapa('Reserva y reunión', 'Al confirmar', 'Reunión para conocer la historia, los horarios y las fotos que no pueden faltar.'),
        etapa('Preboda', '1 a 2 meses antes', 'Sesión de fotos y visita al lugar para planificar la luz.'),
        etapa('El gran día', '14 de marzo', 'Cobertura completa con dos fotógrafos y camarógrafo.'),
        etapa('Entregas', '6 a 8 semanas', 'Adelanto a las 72 horas, galería completa y videos.')
      ],
      faqs: [
        faq('¿Viajan fuera de Córdoba?', 'Sí. Fuera de un radio de 50 km sumamos traslado y alojamiento, que te pasamos antes de reservar.'),
        faq('¿Nos dan las fotos sin editar?', 'No entregamos material crudo: cada foto que reciben está editada y elegida para contar el día.')
      ],
      inversion: { moneda: 'ARS', pagos: [['Reserva de la fecha', 30], ['Un mes antes del casamiento', 40], ['Con la entrega final', 30]] },
      condiciones: 'La fecha queda reservada con el primer pago, que no se reintegra si se cancela el evento.\nSi se cambia la fecha, el pago de reserva se toma para la nueva fecha según disponibilidad.\nLas horas extra de cobertura se cobran aparte.\nPodemos usar algunas fotos en nuestro portfolio; si prefieren que no, lo dejamos por escrito.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nAbonar la reserva para bloquear el 14 de marzo.\nAgendar la reunión para conocernos.',
      tema: 'arena-nupcial'
    })
  },

  'estudio-juridico': {
    nombre: 'Honorarios: sociedad y contratos',
    rubro: 'Abogacía & Legal',
    desc: 'Constitución de SAS, pacto de socios, contratos y abono de asesoramiento.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Estudio Paz & Varela',
        rol: 'Derecho societario y comercial',
        email: 'consultas@pazvarela.com.ar',
        telefono: '+54 9 11 4312-0950',
        web: 'pazvarela.com.ar',
        presentacion: 'Asesoramos a emprendedores y pymes desde la constitución de la empresa hasta su crecimiento. Explicamos cada paso en lenguaje claro y cobramos honorarios cerrados, sin sorpresas.'
      },
      cliente: { nombre: 'Federico Ruiz', empresa: 'Andes Café Tostadores', cargo: 'Socio fundador' },
      propuesta: { titulo: 'Constitución de la sociedad y contratos comerciales', numero: 'H-2026-031', validez: 15 },
      contexto: 'Andes Café empezó como emprendimiento de tres socios y hoy factura con el monotributo de uno de ellos. Van a abrir un segundo local, firmar con distribuidores y sumar un inversor.\n\nNecesitan una sociedad que los proteja, reglas claras entre socios y contratos que acompañen la expansión.',
      objetivos: [
        'Separar el patrimonio personal de los socios del riesgo del negocio.',
        'Dejar por escrito cómo se toman las decisiones y qué pasa si un socio se va.',
        'Firmar con distribuidores e inversores con contratos sólidos.'
      ],
      servicios: [
        srv('Constitución de SAS', 'unico', 1, 950000, 'Redacción del estatuto, inscripción ante el registro, obtención del CUIT y alta impositiva inicial.', 'Estatuto a medida\nInscripción registral\nCUIT de la sociedad\nLibros digitales habilitados'),
        srv('Pacto de socios', 'unico', 1, 780000, 'Acuerdo privado sobre aportes, roles, distribución de utilidades, salida de un socio, no competencia y resolución de conflictos.', 'Pacto de socios firmado\nCláusulas de salida y valuación\nReunión de firma'),
        srv('Contrato de distribución', 'unico', 1, 520000, 'Contrato modelo para distribuidores con zonas, precios, objetivos y causales de rescisión.', 'Contrato modelo editable\nGuía para negociarlo'),
        srv('Acuerdo de inversión', 'unico', 1, 690000, 'Instrumento para el ingreso del inversor: aporte, participación, derechos y protección ante nuevas rondas.', 'Term sheet\nAcuerdo de inversión final', true),
        srv('Abono de asesoramiento legal', 'mensual', 1, 260000, 'Consultas ilimitadas por mail y WhatsApp, revisión de hasta tres contratos por mes y una reunión mensual.', 'Respuesta en 48 horas hábiles\nRevisión de contratos\nReunión mensual de seguimiento')
      ],
      etapas: [
        etapa('Diagnóstico', 'Semana 1', 'Reunión con los tres socios para definir participación, roles y objetivos.'),
        etapa('Sociedad', 'Semanas 2 a 5', 'Redacción del estatuto, firmas e inscripción.'),
        etapa('Pacto y contratos', 'Semanas 3 a 6', 'Pacto de socios y contrato de distribución, con dos rondas de revisión.'),
        etapa('Acompañamiento', 'Mensual', 'Abono de asesoramiento desde la inscripción.')
      ],
      faqs: [
        faq('¿Los honorarios incluyen las tasas?', 'No. Las tasas del registro, sellados y certificaciones de firma se abonan aparte, con comprobante. Hoy rondan los $180.000.'),
        faq('¿Por qué una SAS y no una SRL?', 'Para una empresa en crecimiento con inversores, la SAS es más rápida de constituir y más flexible para sumar socios. Lo vemos en la primera reunión.')
      ],
      inversion: { moneda: 'ARS', pagos: [['Al aceptar la propuesta', 50], ['Con la inscripción de la sociedad', 50]] },
      condiciones: 'Los honorarios son cerrados por el alcance descripto. Las tareas fuera de alcance se presupuestan aparte.\nTasas, sellados y gastos de registro a cargo del cliente.\nLos plazos de inscripción dependen del organismo y pueden variar.\nEl abono mensual se puede cancelar con 30 días de aviso.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nEnviar DNI y constancia de CUIL de los tres socios.\nAgendar la reunión de diagnóstico.',
      tema: 'bordo-lino'
    })
  },

  'contable-impositivo': {
    nombre: 'Abono contable e impositivo',
    rubro: 'Contabilidad & Impuestos',
    desc: 'Liquidación de impuestos, sueldos, balance anual y tablero mensual de números.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Romero Contadores',
        rol: 'Estudio contable e impositivo para pymes',
        email: 'estudio@romerocontadores.com.ar',
        telefono: '+54 9 341 588-2014',
        web: 'romerocontadores.com.ar',
        presentacion: 'Llevamos los números de más de 80 pymes de Rosario y la región. Además de cumplir con los vencimientos, te explicamos qué dicen tus números para que tomes mejores decisiones.'
      },
      cliente: { nombre: 'Valeria Ibáñez', empresa: 'Ibáñez Climatización S.R.L.', cargo: 'Gerente general' },
      propuesta: { titulo: 'Servicio contable, impositivo y laboral mensual', numero: 'P-2026-205', validez: 15 },
      contexto: 'Ibáñez Climatización tiene 12 empleados y factura como responsable inscripto. Hoy los impuestos los liquida un contador externo, los sueldos otro y nadie les muestra cómo viene el mes hasta que llega el balance.\n\nBuscan un solo estudio que se ocupe de todo y les dé información a tiempo.',
      objetivos: [
        'Cumplir todos los vencimientos sin multas ni intereses.',
        'Unificar impuestos, sueldos y balance en un solo equipo.',
        'Tener un tablero mensual con ventas, márgenes y la posición de IVA.'
      ],
      servicios: [
        srv('Liquidación de impuestos', 'mensual', 1, 420000, 'IVA, ingresos brutos (Convenio Multilateral), retenciones y percepciones, y anticipos de ganancias.', 'Declaraciones juradas mensuales\nCalendario de vencimientos\nVEP listos para pagar'),
        srv('Liquidación de sueldos', 'mensual', 12, 28000, 'Recibos, F.931, altas y bajas, vacaciones y SAC, según el convenio de la actividad.', 'Recibos de sueldo digitales\nF.931 y cargas sociales\nLibro de sueldos digital'),
        srv('Tablero mensual de gestión', 'mensual', 1, 150000, 'Un resumen claro de cada mes: ventas, compras, margen, posición de IVA y flujo de caja proyectado.', 'Tablero en línea\nReunión mensual de 30 minutos'),
        srv('Balance anual y ganancias de la sociedad', 'unico', 1, 1800000, 'Estados contables, memoria, certificación y declaración jurada anual de ganancias.', 'Balance certificado\nDDJJ de ganancias\nPresentación ante el organismo de control'),
        srv('Planificación fiscal', 'unico', 1, 650000, 'Revisión de la estructura para pagar lo que corresponde, ni un peso más: regímenes, deducciones y aportes.', 'Informe de oportunidades\nPlan de acción', true)
      ],
      etapas: [
        etapa('Relevamiento', 'Semana 1', 'Revisión de la situación fiscal, laboral y de los últimos balances.'),
        etapa('Traspaso', 'Semanas 2 y 3', 'Claves fiscales, delegaciones y nota al estudio anterior.'),
        etapa('Primer cierre', 'Mes 1', 'Primera liquidación completa y primer tablero de gestión.'),
        etapa('Servicio continuo', 'Mensual', 'Liquidaciones, reunión mensual y balance anual.')
      ],
      inversion: { moneda: 'ARS', pagos: [['Balance anual: al aceptar', 50], ['Balance anual: con la presentación', 50]] },
      condiciones: 'El abono mensual se factura por mes adelantado y se actualiza cada trimestre.\nLa documentación de cada mes tiene que llegar antes del día 7.\nLas multas por documentación entregada fuera de término corren por cuenta del cliente.\nEl servicio se puede cancelar con 60 días de aviso.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nDelegar las claves fiscales al estudio.\nAgendar la reunión de relevamiento.',
      tema: 'azul-notarial'
    })
  },

  'ux-ui-producto': {
    nombre: 'Rediseño UX/UI de una app',
    rubro: 'UX/UI & Producto',
    desc: 'Investigación con usuarios, prototipo, sistema de diseño y handoff a desarrollo.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Clara Benítez',
        rol: 'Diseño de producto UX/UI',
        email: 'clara@clarabenitez.design',
        telefono: '+54 9 11 6801-2233',
        web: 'clarabenitez.design',
        presentacion: 'Diseño productos digitales hace nueve años, para fintechs, salud y e-commerce. Mi foco: entender a las personas que usan el producto y convertir eso en pantallas simples que se desarrollan sin vueltas.'
      },
      cliente: { nombre: 'Pablo Díaz', empresa: 'Turnito', cargo: 'Head of Product' },
      propuesta: { titulo: 'Rediseño de la experiencia de reserva de turnos', numero: 'UX-2026-012', validez: 15 },
      contexto: 'Turnito tiene 40.000 usuarios activos, pero el 58% abandona antes de confirmar un turno. Las reseñas repiten lo mismo: no se entiende qué horarios están libres y el pago confunde.\n\nEl equipo de desarrollo está listo para construir, pero necesita un diseño validado y un sistema de componentes para avanzar rápido.',
      objetivos: [
        'Bajar el abandono del flujo de reserva por debajo del 35%.',
        'Un sistema de diseño que el equipo pueda reutilizar en toda la app.',
        'Entregar el diseño listo para desarrollar en seis semanas.'
      ],
      servicios: [
        srv('Investigación con usuarios', 'unico', 1, 1200, 'Análisis de métricas, ocho entrevistas y un test de usabilidad de la versión actual para encontrar dónde y por qué se traban.', 'Informe de hallazgos priorizados\nMapa del recorrido del usuario\nVideos de las sesiones'),
        srv('Arquitectura y prototipo', 'unico', 1, 1800, 'Nuevo flujo de reserva y pago, wireframes y prototipo navegable en Figma, validado con usuarios.', 'Flujos y wireframes\nPrototipo de alta fidelidad\nTest con cinco usuarios'),
        srv('Sistema de diseño', 'unico', 1, 1500, 'Tipografía, color, grilla y componentes documentados, con variantes y estados.', 'Librería de componentes en Figma\nTokens de diseño\nGuía de uso'),
        srv('Handoff y acompañamiento', 'hora', 20, 45, 'Horas para resolver dudas del equipo y revisar lo desarrollado contra el diseño.', 'Revisiones de calidad\nAjustes durante el desarrollo'),
        srv('Rediseño del panel de profesionales', 'unico', 1, 2100, 'El mismo proceso aplicado a la agenda que usan médicos y centros.', 'Investigación, prototipo y diseño final', true)
      ],
      etapas: [
        etapa('Descubrir', '2 semanas', 'Métricas, entrevistas y test de usabilidad.'),
        etapa('Definir y prototipar', '2 semanas', 'Nuevo flujo, prototipo y validación con usuarios.'),
        etapa('Diseñar el sistema', '2 semanas', 'Diseño final de pantallas y sistema de componentes.'),
        etapa('Acompañar', 'Durante el desarrollo', 'Handoff, dudas y control de calidad.')
      ],
      faqs: [
        faq('¿Trabajás con nuestro equipo o por tu cuenta?', 'Con el equipo: una reunión semanal con producto y desarrollo, y acceso a Figma en vivo durante todo el proyecto.'),
        faq('¿Cómo medimos si funcionó?', 'Definimos juntos la métrica de abandono y el embudo antes de empezar, y la comparamos un mes después del lanzamiento.')
      ],
      inversion: { moneda: 'USD', pagos: [['Al iniciar', 40], ['Con el prototipo validado', 30], ['Con la entrega del sistema de diseño', 30]] },
      condiciones: 'Incluye dos rondas de cambios por entrega.\nLos archivos de Figma y los derechos de uso pasan al cliente con el pago completo.\nLos incentivos para usuarios entrevistados corren por cuenta del cliente.\nLas horas de acompañamiento no usadas se pueden usar hasta 90 días después de la entrega.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nCompartir acceso a métricas y a la app de prueba.\nAgendar el kickoff con producto y desarrollo.',
      tema: 'indigo-producto'
    })
  },

  'ecommerce-performance': {
    nombre: 'Tienda online y campañas de venta',
    rubro: 'E-commerce & Performance',
    desc: 'Tienda Nube optimizada, catálogo, campañas en Meta y Google y reporte de ventas.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Carrito Lleno',
        rol: 'E-commerce y campañas de performance',
        email: 'hola@carritolleno.com.ar',
        telefono: '+54 9 11 3378-4410',
        web: 'carritolleno.com.ar',
        presentacion: 'Ayudamos a marcas argentinas a vender más online: tiendas que convierten, catálogos bien armados y campañas medidas peso por peso. Nos pagan por resultados, no por posteos.'
      },
      cliente: { nombre: 'Carla Méndez', empresa: 'Lúa Indumentaria', cargo: 'Dueña' },
      propuesta: { titulo: 'Tienda que vende y campañas de temporada', numero: 'P-2026-160', validez: 10 },
      contexto: 'Lúa vende ropa de mujer por Instagram y en una tienda con plantilla básica. Tiene buen tráfico, pero solo el 0,6% de las visitas compra, y los anuncios se cargan sin seguimiento de ventas.\n\nSe viene la temporada primavera-verano y quieren llegar con la tienda optimizada y campañas que se puedan medir.',
      objetivos: [
        'Duplicar la tasa de conversión de la tienda antes de diciembre.',
        'Medir cada peso invertido en anuncios hasta la venta.',
        'Recuperar carritos abandonados de forma automática.'
      ],
      servicios: [
        srv('Optimización de la tienda', 'unico', 1, 1850000, 'Rediseño de home, fichas de producto y checkout en Tienda Nube, con guía de talles, cuotas visibles y velocidad de carga.', 'Home y fichas rediseñadas\nCheckout simplificado\nGuía de talles y políticas'),
        srv('Medición y píxeles', 'unico', 1, 480000, 'Configuración de Píxel de Meta, API de conversiones, Google Analytics 4 y etiquetas de Google Ads.', 'Eventos de compra medidos\nTablero de ventas por canal'),
        srv('Gestión de campañas', 'mensual', 1, 950000, 'Campañas en Meta y Google Shopping con objetivo de venta, catálogo dinámico y remarketing. La inversión en anuncios se paga directo a cada plataforma.', 'Estrategia mensual\nCreatividades en video y estático\nOptimización semanal'),
        srv('Email y carritos abandonados', 'mensual', 1, 320000, 'Secuencias automáticas de bienvenida, carrito abandonado y recompra.', 'Tres automatizaciones activas\nUn envío de novedades por semana'),
        srv('Sesión de fotos de catálogo', 'unico', 1, 900000, 'Una jornada con modelo para 40 productos, fondo neutro y fotos de ambiente.', '120 fotos editadas\nVersiones para tienda y anuncios', true)
      ],
      etapas: [
        etapa('Auditoría', 'Semana 1', 'Análisis de la tienda, el embudo y las campañas actuales.'),
        etapa('Tienda y medición', 'Semanas 2 a 4', 'Optimización de la tienda y configuración de la medición.'),
        etapa('Lanzamiento', 'Semana 5', 'Campañas de temporada y automatizaciones activas.'),
        etapa('Optimización', 'Mensual', 'Mejoras semanales y reporte de ventas cada mes.')
      ],
      inversion: { moneda: 'ARS', pagos: [['Al aceptar', 50], ['Con la tienda optimizada', 50]] },
      condiciones: 'La inversión en anuncios se abona directo a Meta y Google y no está incluida.\nLa gestión de campañas se contrata por un mínimo de tres meses.\nEl cliente provee stock, precios y fotos actualizados.\nLos accesos a la tienda y las cuentas publicitarias quedan siempre a nombre del cliente.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nCompartir accesos a la tienda y al administrador de anuncios.\nAgendar la reunión de auditoría.',
      tema: 'coral-performance'
    })
  },

  'eventos-dj': {
    nombre: 'Música, sonido e iluminación',
    rubro: 'Música & Eventos',
    desc: 'DJ, sonido, iluminación y pista LED para casamientos, cumpleaños y eventos corporativos.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Groove Eventos',
        rol: 'DJ, sonido e iluminación',
        email: 'reservas@grooveeventos.com.ar',
        telefono: '+54 9 11 2290-6655',
        web: 'grooveeventos.com.ar',
        presentacion: 'Hace diez años hacemos bailar a casamientos, fiestas de 15 y eventos de empresa. Equipos propios, técnico en cada evento y una pista que no se vacía.'
      },
      cliente: { nombre: 'Mariana Costa', empresa: 'Grupo Andina', cargo: 'Responsable de RR. HH.' },
      propuesta: { titulo: 'Fiesta de fin de año de Grupo Andina', numero: 'EV-2026-091', validez: 7 },
      contexto: 'La fiesta de fin de año es el viernes 11 de diciembre en un salón de Costanera Norte, para 250 personas. Habrá cena, entrega de reconocimientos con presentación en pantalla y fiesta hasta las 3.\n\nQuieren que la parte formal salga prolija y que después la fiesta tenga nivel de boliche.',
      objetivos: [
        'Una entrega de reconocimientos prolija, con buen sonido y video.',
        'Una fiesta que mantenga la pista llena hasta el final.',
        'Un solo proveedor para sonido, luces, pantalla y música.'
      ],
      servicios: [
        srv('DJ y musicalización', 'unico', 1, 950000, 'DJ durante la recepción, la cena y cinco horas de fiesta. Armamos juntos la música según el público.', 'Reunión de planificación musical\nMusicalización de toda la noche'),
        srv('Sonido profesional', 'unico', 1, 780000, 'Sistema line array para 250 personas, consola digital y dos micrófonos inalámbricos para los discursos.', 'Sonido para salón y pista\nTécnico de sonido toda la noche'),
        srv('Iluminación de pista y ambientación', 'unico', 1, 620000, 'Cabezales móviles, láser, humo bajo para el primer baile y ambientación de salón en los colores de la marca.', 'Show de luces programado\nAmbientación en colores institucionales'),
        srv('Pantalla LED y operación de video', 'unico', 1, 850000, 'Pantalla LED de 3×2 m para la presentación de reconocimientos, con operador.', 'Pantalla LED\nOperador de video y ensayo previo'),
        srv('Show de percusión y saxo', 'unico', 1, 540000, 'Dos músicos en vivo durante 40 minutos sobre los sets del DJ.', 'Show en el pico de la fiesta', true),
        srv('Cabina 360 para invitados', 'unico', 1, 420000, 'Plataforma 360 con videos cortos para compartir al instante.', 'Videos ilimitados durante tres horas', true)
      ],
      etapas: [
        etapa('Planificación', '3 semanas antes', 'Reunión de cronograma, música y requisitos técnicos del salón.'),
        etapa('Ensayo técnico', 'Día del evento', 'Armado desde las 15 y prueba de sonido y pantalla.'),
        etapa('Evento', '11 de diciembre', 'Recepción, cena, reconocimientos y fiesta.'),
        etapa('Desarme', 'Al finalizar', 'Desarme sin interferir con el cierre del salón.')
      ],
      inversion: { moneda: 'ARS', pagos: [['Reserva de la fecha', 50], ['Una semana antes del evento', 50]] },
      condiciones: 'La fecha queda reservada con el primer pago.\nEl salón tiene que contar con tomas de 220 V con descarga a tierra cerca de la pista.\nCada hora extra de fiesta se cobra aparte.\nSi el evento se suspende con menos de 15 días, se retiene la reserva.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nAbonar la reserva para confirmar el 11 de diciembre.\nCompartir el plano del salón y el cronograma.',
      tema: 'neon-pulso'
    })
  },

  'salud-nutricion': {
    nombre: 'Programa de bienestar para empresas',
    rubro: 'Salud & Bienestar',
    desc: 'Nutrición, pausas activas y talleres para equipos, con seguimiento y métricas.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Lic. Camila Ortiz',
        rol: 'Nutrición y bienestar corporativo',
        email: 'camila@nutricionalcentro.com.ar',
        telefono: '+54 9 261 455-3091',
        web: 'nutricionalcentro.com.ar',
        presentacion: 'Soy licenciada en Nutrición (M.P. 4512) y coordino un equipo de nutricionistas y profesores de educación física. Llevamos programas de bienestar a empresas de Mendoza con resultados medibles.'
      },
      cliente: { nombre: 'Diego Sosa', empresa: 'Bodega Altos del Valle', cargo: 'Gerente de Personas' },
      propuesta: { titulo: 'Programa de bienestar para el equipo de la bodega', numero: 'P-2026-044', validez: 20 },
      contexto: 'La bodega tiene 85 personas entre planta, administración y turismo. En la última encuesta interna, el cansancio y los dolores de espalda aparecieron entre las primeras quejas, y el ausentismo subió en temporada de cosecha.\n\nQuieren un programa concreto, que el equipo use y que se pueda medir.',
      objetivos: [
        'Bajar el ausentismo por problemas de salud evitables.',
        'Que al menos el 60% del equipo participe del programa.',
        'Medir el impacto con una encuesta al inicio y a los seis meses.'
      ],
      servicios: [
        srv('Evaluación inicial', 'unico', 1, 680000, 'Encuesta de hábitos y medición de peso, cintura y presión de forma voluntaria y confidencial.', 'Informe general anónimo\nPlan de acción para la empresa'),
        srv('Consultorio de nutrición en la empresa', 'mensual', 1, 540000, 'Dos jornadas por mes de consultas individuales en la bodega, con plan alimentario personalizado.', 'Hasta 24 consultas por mes\nSeguimiento por WhatsApp'),
        srv('Pausas activas', 'mensual', 1, 360000, 'Dos pausas semanales de 15 minutos en planta y oficinas, guiadas por profesores de educación física.', 'Ocho pausas por mes\nRutinas para hacer en casa'),
        srv('Talleres mensuales', 'mensual', 1, 220000, 'Un taller de 45 minutos por mes: viandas, descanso, cosecha sin lesiones y más.', 'Material para el equipo\nGrabación del taller'),
        srv('Menú saludable para el comedor', 'unico', 1, 450000, 'Rediseño del menú del comedor con el concesionario, sin subir el costo por plato.', 'Menú de cuatro semanas\nRecetas y porciones', true)
      ],
      etapas: [
        etapa('Lanzamiento', 'Mes 1', 'Presentación al equipo, encuesta y evaluación inicial.'),
        etapa('Programa', 'Meses 2 a 6', 'Consultorio, pausas activas y talleres.'),
        etapa('Medición', 'Mes 6', 'Nueva encuesta, informe de resultados y próximos pasos.')
      ],
      faqs: [
        faq('¿Los datos de salud se comparten con la empresa?', 'Nunca de forma individual. La empresa recibe solo información general y anónima, según la ley de protección de datos.'),
        faq('¿Es obligatorio para el equipo?', 'No. La participación es voluntaria; nuestra tarea es que quieran sumarse.')
      ],
      inversion: { moneda: 'ARS', pagos: [['Evaluación inicial: al aceptar', 100]] },
      condiciones: 'El programa se contrata por seis meses.\nLa empresa provee un espacio privado para las consultas.\nLos honorarios mensuales se actualizan cada trimestre.\nLos datos de salud son confidenciales y se tratan según la ley 25.326.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nDefinir las fechas de lanzamiento con RR. HH.\nComunicar el programa al equipo.',
      tema: 'menta-clinica'
    })
  },

  'fitness-entrenamiento': {
    nombre: 'Plan de entrenamiento de 12 semanas',
    rubro: 'Fitness & Deporte',
    desc: 'Evaluación, rutinas personalizadas, seguimiento por app y plan de alimentación.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Nico Ferreyra Training',
        rol: 'Entrenamiento personal y preparación física',
        email: 'nico@ferreyratraining.com',
        telefono: '+54 9 11 6122-9087',
        web: 'ferreyratraining.com',
        presentacion: 'Profesor de educación física y preparador físico. Entreno a personas ocupadas que quieren resultados reales: rutinas posibles, seguimiento cercano y cero dietas imposibles.'
      },
      cliente: { nombre: 'Andrés Vidal', empresa: '', cargo: '' },
      propuesta: { titulo: 'Plan de 12 semanas para correr tus primeros 21K', numero: 'FT-2026-027', validez: 7 },
      contexto: 'Corrés tres veces por semana desde hace un año y querés llegar a la media maratón de Buenos Aires sin lesionarte. Trabajás muchas horas y tus entrenamientos hoy no tienen un plan.\n\nEl objetivo es llegar a la largada fuerte, con fuerza en las piernas y un ritmo que puedas sostener.',
      objetivos: [
        'Terminar los 21K en menos de 2 horas y sin dolor.',
        'Sumar fuerza para prevenir lesiones de rodilla y tobillo.',
        'Entrenar cuatro veces por semana con un plan que entre en tu agenda.'
      ],
      servicios: [
        srv('Evaluación física inicial', 'unico', 1, 65000, 'Test de fuerza, movilidad y un test de campo para definir tus ritmos de entrenamiento.', 'Informe de evaluación\nRitmos personalizados'),
        srv('Plan de entrenamiento personalizado', 'mensual', 1, 120000, 'Rutinas de carrera y fuerza en la app, ajustadas cada semana según cómo te sentís.', 'Plan semanal en la app\nAjustes según tu feedback\nVideos de cada ejercicio'),
        srv('Clases presenciales de fuerza', 'mensual', 4, 28000, 'Una clase por semana en el gimnasio, para corregir técnica y progresar seguro.', 'Cuatro clases por mes'),
        srv('Seguimiento por WhatsApp', 'mensual', 1, 35000, 'Respuestas a tus dudas y revisión semanal de tus datos de reloj o app.', 'Revisión semanal\nRespuesta en el día'),
        srv('Plan de alimentación deportiva', 'unico', 1, 90000, 'Con una nutricionista del equipo: alimentación para entrenar, recuperar y el día de la carrera.', 'Plan de alimentación\nEstrategia de hidratación para la carrera', true)
      ],
      etapas: [
        etapa('Base', 'Semanas 1 a 4', 'Volumen progresivo y fuerza general.'),
        etapa('Construcción', 'Semanas 5 a 9', 'Fondos largos, cambios de ritmo y fuerza específica.'),
        etapa('Afinar', 'Semanas 10 a 12', 'Bajamos la carga para llegar fresco a la largada.')
      ],
      inversion: { moneda: 'ARS', pagos: [['Al aceptar', 100]] },
      condiciones: 'El plan mensual se abona por mes adelantado durante las 12 semanas.\nLas clases presenciales se reprograman con 24 horas de aviso.\nAntes de empezar se necesita un apto físico vigente.\nLos resultados dependen de cumplir el plan; vamos a ajustarlo juntos las veces que haga falta.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nEnviar tu apto físico.\nAgendar la evaluación inicial.',
      tema: 'energia'
    })
  },

  'redaccion-contenidos': {
    nombre: 'Contenidos SEO y blog',
    rubro: 'Redacción & Copywriting',
    desc: 'Estrategia de palabras clave, artículos de blog, textos web y newsletter.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Julieta Arce',
        rol: 'Redacción SEO y copywriting',
        email: 'julieta@julietaarce.com',
        telefono: '+54 9 223 512-7740',
        web: 'julietaarce.com',
        presentacion: 'Escribo textos que se encuentran en Google y que convencen a quien los lee. Trabajo con empresas de servicios, salud y tecnología que quieren que su web sea su mejor vendedora.'
      },
      cliente: { nombre: 'Ramiro Gil', empresa: 'Solaris Energía', cargo: 'Gerente comercial' },
      propuesta: { titulo: 'Estrategia de contenidos para atraer clientes desde Google', numero: 'P-2026-058', validez: 15 },
      contexto: 'Solaris instala paneles solares para hogares y comercios. La web tiene buen diseño pero casi no recibe visitas desde Google: el 80% de las consultas llega por recomendación.\n\nQuieren aparecer cuando alguien busca cuánto cuesta instalar paneles o cuánto se ahorra, y que esa visita termine en una consulta.',
      objetivos: [
        'Aparecer en las primeras posiciones para búsquedas clave de energía solar.',
        'Triplicar las visitas orgánicas en seis meses.',
        'Convertir lectores en consultas con textos y llamados a la acción claros.'
      ],
      servicios: [
        srv('Estrategia de palabras clave', 'unico', 1, 380, 'Investigación de lo que busca tu cliente, análisis de la competencia y calendario editorial de seis meses.', 'Mapa de palabras clave\nCalendario editorial\nArquitectura de contenidos'),
        srv('Textos de las páginas principales', 'unico', 1, 650, 'Reescritura de home, servicios y nosotros, pensada para posicionar y para vender.', 'Cinco páginas reescritas\nTítulos y descripciones para Google'),
        srv('Artículos de blog', 'mensual', 4, 95, 'Artículos de 1.200 a 1.800 palabras, investigados y optimizados, con imágenes sugeridas.', 'Cuatro artículos por mes\nOptimización SEO de cada nota\nEnlaces internos'),
        srv('Newsletter mensual', 'mensual', 1, 120, 'Un envío por mes para mantener el contacto con quienes consultaron y no compraron.', 'Redacción y armado del envío', true),
        srv('Reporte de posicionamiento', 'mensual', 1, 60, 'Evolución de posiciones, visitas y consultas generadas por los contenidos.', 'Reporte mensual con recomendaciones')
      ],
      etapas: [
        etapa('Investigación', 'Semanas 1 y 2', 'Palabras clave, competencia y calendario.'),
        etapa('Páginas principales', 'Semanas 3 y 4', 'Textos nuevos para las páginas que más venden.'),
        etapa('Publicación continua', 'Mensual', 'Artículos, newsletter y reporte de resultados.')
      ],
      inversion: { moneda: 'USD', pagos: [['Al aceptar', 50], ['Con las páginas principales', 50]] },
      condiciones: 'Cada texto incluye una ronda de cambios.\nEl servicio mensual se contrata por un mínimo de cuatro meses: el SEO necesita tiempo.\nLos textos pasan a ser del cliente al abonarse.\nEl cliente revisa la información técnica de cada nota antes de publicarla.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nCompartir accesos a la web y a Search Console.\nAgendar la entrevista con el equipo comercial.',
      tema: 'tinta'
    })
  },

  'inmobiliaria-lanzamiento': {
    nombre: 'Lanzamiento de un emprendimiento',
    rubro: 'Real Estate',
    desc: 'Branding del edificio, renders, tour virtual, sitio de ventas y campaña de leads.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Atelier Propiedades',
        rol: 'Marketing inmobiliario y comercialización',
        email: 'desarrollos@atelierpropiedades.com.ar',
        telefono: '+54 9 11 5017-3388',
        web: 'atelierpropiedades.com.ar',
        presentacion: 'Comercializamos emprendimientos residenciales en CABA y GBA norte. Acompañamos al desarrollista desde el pozo: marca, piezas de venta, campañas y nuestro equipo comercial.'
      },
      cliente: { nombre: 'Ing. Hernán Quiroga', empresa: 'Quiroga Desarrollos', cargo: 'Director' },
      propuesta: { titulo: 'Lanzamiento comercial de Edificio Arce, Núñez', numero: 'RE-2026-009', validez: 30 },
      contexto: 'Edificio Arce tiene 32 unidades de uno a tres ambientes y amenities, a 300 metros de la avenida Cabildo. La obra empieza en marzo y la meta es vender el 40% en pozo para financiar la estructura.\n\nHoy solo hay planos técnicos: falta marca, imágenes y un plan para llegar a inversores y compradores finales.',
      objetivos: [
        'Vender 13 unidades en pozo durante los primeros seis meses.',
        'Una marca e imágenes que justifiquen un precio por m² por encima de la zona.',
        'Un flujo constante de consultas calificadas para el equipo comercial.'
      ],
      servicios: [
        srv('Marca del emprendimiento', 'unico', 1, 3200, 'Nombre, logo, paleta y tono de comunicación para el edificio, más el cartel de obra.', 'Identidad del emprendimiento\nDiseño del cartel de obra'),
        srv('Renders y tour virtual', 'unico', 1, 6800, 'Seis renders exteriores e interiores fotorrealistas y un recorrido 360 de una unidad tipo.', 'Seis renders en alta\nTour 360 navegable\nPlantas comerciales ilustradas'),
        srv('Sitio de ventas', 'unico', 1, 2900, 'Landing con unidades disponibles, planos, precios y formulario conectado al CRM.', 'Sitio con tabla de unidades\nIntegración con CRM y WhatsApp'),
        srv('Campaña de captación de leads', 'mensual', 1, 1400, 'Campañas en Meta, Google y portales inmobiliarios, con calificación de consultas. La inversión en anuncios se paga aparte.', 'Campañas activas\nReporte semanal de leads'),
        srv('Comercialización', 'incluido', 1, 0, 'Atención de consultas, visitas al showroom y cierre de operaciones. Honorarios del 3% sobre cada venta, a cargo del comprador.', 'Equipo comercial dedicado\nShowroom y visitas'),
        srv('Video de lanzamiento con drone', 'unico', 1, 2400, 'Video de 60 segundos con vistas reales desde la altura de cada piso y animación del edificio.', 'Video horizontal y vertical', true)
      ],
      etapas: [
        etapa('Marca e imágenes', 'Semanas 1 a 6', 'Identidad, renders, tour y plantas comerciales.'),
        etapa('Preventa', 'Semanas 7 y 8', 'Sitio de ventas y lanzamiento para inversores de la base.'),
        etapa('Lanzamiento abierto', 'Desde la semana 9', 'Campañas, portales y showroom.')
      ],
      inversion: { moneda: 'USD', pagos: [['Al aceptar', 40], ['Con los renders aprobados', 30], ['Con el sitio publicado', 30]] },
      condiciones: 'La exclusividad de comercialización es por 18 meses.\nLa inversión en anuncios y portales se abona aparte.\nLos renders se realizan sobre los planos aprobados; los cambios de proyecto se cotizan aparte.\nTodo el material pasa a ser del desarrollista con el pago completo.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nEnviar planos, memoria descriptiva y lista de precios.\nAgendar la reunión de marca.',
      tema: 'olivo-noche'
    })
  },

  'paisajismo-jardines': {
    nombre: 'Diseño y ejecución de jardín',
    rubro: 'Paisajismo',
    desc: 'Proyecto paisajístico, plantación, riego automático y mantenimiento mensual.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Verde Raíz Paisajismo',
        rol: 'Diseño, construcción y mantenimiento de jardines',
        email: 'proyectos@verderaiz.com.ar',
        telefono: '+54 9 11 4790-2215',
        web: 'verderaiz.com.ar',
        presentacion: 'Diseñamos jardines que se ven bien todo el año y se cuidan fácil. Usamos especies nativas y adaptadas, que necesitan menos agua y atraen aves y mariposas.'
      },
      cliente: { nombre: 'Familia Correa', empresa: '', cargo: '' },
      propuesta: { titulo: 'Jardín y galería de la casa en Pilar', numero: 'PJ-2026-064', validez: 15 },
      contexto: 'La casa es nueva y el terreno de 600 m² quedó con tierra de relleno y sin plantas. La familia quiere disfrutar del jardín con los chicos y el perro, tener privacidad con los vecinos y no pasar los fines de semana regando.',
      objetivos: [
        'Un jardín lindo todo el año, con bajo mantenimiento.',
        'Privacidad en los laterales y sombra en la galería.',
        'Riego automático para no depender de nadie.'
      ],
      servicios: [
        srv('Proyecto paisajístico', 'unico', 1, 650000, 'Relevamiento, plano del jardín, selección de especies y render del proyecto.', 'Plano de plantación\nRender del jardín\nListado de especies'),
        srv('Preparación del terreno', 'unico', 1, 980000, 'Retiro de escombros, nivelación y aporte de tierra negra con compost.', '60 m³ de tierra preparada\nNivelación y drenajes'),
        srv('Plantación y césped', 'unico', 1, 2350000, 'Árboles, cercos vivos, canteros de nativas y césped en panes.', 'Tres árboles de 3 m\n40 m de cerco vivo\nCanteros y 350 m² de césped'),
        srv('Riego automático', 'unico', 1, 1450000, 'Sistema por aspersión y goteo por sectores, con programador wifi.', 'Seis sectores de riego\nProgramador controlable desde el celular'),
        srv('Mantenimiento mensual', 'mensual', 1, 180000, 'Dos visitas por mes: corte, poda, control de plagas y ajuste del riego.', 'Dos visitas por mes\nReporte con fotos'),
        srv('Iluminación del jardín', 'unico', 1, 720000, 'Luces bajo consumo en árboles, senderos y canteros, con encendido automático.', 'Diez puntos de luz\nFotocélula y temporizador', true)
      ],
      etapas: [
        etapa('Proyecto', '2 semanas', 'Relevamiento, diseño y aprobación del render.'),
        etapa('Obra', '3 semanas', 'Terreno, riego y plantación.'),
        etapa('Implantación', '2 meses', 'Seguimiento cercano mientras las plantas se adaptan.'),
        etapa('Mantenimiento', 'Mensual', 'Visitas regulares para que el jardín crezca sano.')
      ],
      inversion: { moneda: 'ARS', pagos: [['Al aceptar', 40], ['Con el inicio de obra', 40], ['Con la entrega del jardín', 20]] },
      condiciones: 'Garantía de reposición de plantas durante los primeros 60 días.\nLa conexión eléctrica y de agua para el riego tiene que estar disponible al iniciar la obra.\nLos plazos pueden moverse por lluvia.\nEl mantenimiento mensual es opcional y se puede cancelar con 30 días de aviso.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nAbonar el primer pago para empezar el proyecto.\nAgendar la visita de relevamiento.',
      tema: 'botanico'
    })
  },

  'web-pymes': {
    nombre: 'Sitio web para una pyme',
    rubro: 'Desarrollo Web',
    desc: 'Sitio institucional rápido, SEO local, WhatsApp, Google Business y hosting incluido.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Bruno Sánchez',
        rol: 'Desarrollo web para pymes',
        email: 'bruno@brunosanchez.dev',
        telefono: '+54 9 11 3964-1180',
        web: 'brunosanchez.dev',
        presentacion: 'Hago sitios web rápidos y fáciles de actualizar para pymes y profesionales. Me ocupo de todo: diseño, textos, dominio, hosting y que te encuentren en Google.'
      },
      cliente: { nombre: 'Laura Pereyra', empresa: 'Pereyra Seguros', cargo: 'Productora asesora' },
      propuesta: { titulo: 'Sitio web nuevo para Pereyra Seguros', numero: 'W-2026-133', validez: 15 },
      contexto: 'Pereyra Seguros trabaja con 12 aseguradoras y tiene más de 900 clientes en zona oeste. Su web actual es de 2015, no se ve bien en el celular y no aparece en Google cuando alguien busca un seguro en Morón.\n\nNecesitan un sitio moderno que genere consultas por WhatsApp.',
      objetivos: [
        'Aparecer en Google cuando alguien busca seguros en la zona.',
        'Recibir consultas de cotización por WhatsApp desde la web.',
        'Un sitio que puedan actualizar sin depender de nadie.'
      ],
      servicios: [
        srv('Diseño y desarrollo del sitio', 'unico', 1, 1650000, 'Sitio de seis secciones, adaptado a celulares, con cotizador por WhatsApp y blog.', 'Diseño a medida\nSeis secciones y blog\nPanel para editar textos'),
        srv('SEO local y Google Business', 'unico', 1, 420000, 'Optimización para búsquedas de la zona y perfil de Google Business completo.', 'Perfil de Google optimizado\nTextos con palabras clave locales'),
        srv('Dominio, hosting y correo', 'mensual', 1, 45000, 'Hosting rápido con certificado de seguridad, copias de seguridad diarias y cinco casillas de correo.', 'Hosting y SSL\nBackups diarios\nCorreos con el dominio'),
        srv('Mantenimiento', 'mensual', 1, 65000, 'Actualizaciones, cambios menores y soporte por WhatsApp.', 'Hasta dos horas de cambios por mes', true),
        srv('Fotos profesionales del equipo', 'unico', 1, 280000, 'Sesión en la oficina para la web y redes.', '25 fotos editadas', true)
      ],
      etapas: [
        etapa('Contenido', 'Semana 1', 'Reunión, estructura del sitio y textos.'),
        etapa('Diseño', 'Semana 2', 'Diseño de la home y aprobación.'),
        etapa('Desarrollo', 'Semanas 3 y 4', 'Todas las secciones, SEO y pruebas.'),
        etapa('Publicación', 'Semana 5', 'Lanzamiento y capacitación para editar.')
      ],
      inversion: { moneda: 'ARS', pagos: [['Al aceptar', 50], ['Al publicar el sitio', 50]] },
      condiciones: 'Incluye dos rondas de cambios de diseño.\nEl dominio queda a nombre del cliente.\nEl hosting se abona por mes adelantado; el primer mes está incluido.\nLos textos y fotos que no estén listos al empezar pueden mover la fecha de publicación.',
      proximosPasos: 'Aceptar la propuesta desde este link.\nCompartir logo, fotos y accesos al dominio actual.\nAgendar la reunión de contenido.',
      tema: 'grafito-lima'
    })
  }
};
