// Catálogo ampliado de plantillas de portfolio: rubros nuevos (1 gratis y 9 PRO), cada uno
// con un diseño que ya existe (TEMAS o TEMAS_CATALOGO) y textos de ejemplo escritos para ese
// oficio. modelo.js las suma a PLANTILLAS_PORTAFOLIO con catalogo: true.
//
// Los datos van sin IDs: modelo.js los completa al crear el portfolio (desdeCatalogoPf).
// Especialidades, como lista de textos; proyectos, servicios, testimonios y preguntas,
// como objetos con solo los campos que cambian.

export const PLANTILLAS_PORTFOLIO_CATALOGO = {
  'pf-oficios-reformas': {
    nombre: 'Oficios, Reformas & Mantenimiento',
    rubro: 'Oficios & Obra',
    desc: 'Trabajos terminados con antes y después, zonas de cobertura y presupuesto sin cargo.',
    plan: 'gratis',
    datos: () => ({
      emisor: {
        nombre: 'Reformas Benítez',
        rol: 'Albañilería, pintura, plomería y electricidad',
        email: 'presupuestos@reformasbenitez.com.ar',
        telefono: '+54 9 11 5233-4410',
        web: 'reformasbenitez.com.ar',
        ubicacion: 'Zona Oeste y CABA',
        presentacion: 'Hace 15 años hacemos reformas de casas, departamentos y locales. Trabajamos con cuadrilla propia, cumplimos los plazos que firmamos y dejamos la obra limpia todos los días.'
      },
      portafolio: {
        nombreInterno: 'Portfolio Reformas',
        titulo: 'Reformas terminadas, a tiempo y sin sorpresas',
        subtitulo: 'Baños, cocinas, pintura y mantenimiento de casas, departamentos y locales.',
        insignia: 'Trabajos realizados',
        disponibilidad: 'Visitamos la obra esta semana',
        ctaTexto: 'Pedir presupuesto',
        cierreTitulo: '¿Tenés una reforma en mente?',
        cierreTexto: 'Mandanos fotos por WhatsApp y coordinamos una visita sin cargo para pasarte el presupuesto por escrito.'
      },
      especialidades: ['Baños y cocinas llave en mano', 'Pintura interior y exterior', 'Instalaciones de agua y gas', 'Electricidad y tableros'],
      proyectos: [
        {
          titulo: 'Baño completo en departamento de Caballito',
          categoria: 'Reforma integral',
          subtitulo: 'Departamento de 3 ambientes',
          destacado: 'Terminado en 12 días hábiles',
          descripcion: 'Demolición, cañerías nuevas de termofusión, impermeabilización, porcelanato 60×120, mampara y vanitory a medida.',
          tags: 'Plomería, Revestimientos, Sanitarios'
        },
        {
          titulo: 'Pintura y puesta a punto de casa en Castelar',
          categoria: 'Pintura',
          subtitulo: 'Casa de dos plantas',
          destacado: '280 m² con garantía de un año',
          descripcion: 'Reparación de humedad, enduido completo, látex lavable en interiores y membrana en terraza antes de la temporada de lluvias.',
          tags: 'Pintura, Impermeabilización'
        },
        {
          titulo: 'Cocina abierta para local gastronómico',
          categoria: 'Local comercial',
          subtitulo: 'Cafetería de barrio',
          destacado: 'Habilitación aprobada a la primera',
          descripcion: 'Instalación de gas aprobada, tablero eléctrico nuevo, revestimiento sanitario y extracción, con el local abierto al público durante la obra.',
          tags: 'Gas, Electricidad, Habilitación'
        }
      ],
      serviciosWeb: [
        { titulo: 'Visita y presupuesto', precio: 'Sin cargo', descripcion: 'Vamos, medimos y te pasamos el presupuesto detallado por escrito en 48 horas.', cta: 'Coordinar visita' },
        { titulo: 'Reforma de baño', precio: 'Desde $2.400.000', descripcion: 'Llave en mano: demolición, instalaciones, revestimientos y sanitarios.', cta: 'Consultar' },
        { titulo: 'Mantenimiento mensual', precio: 'Abono a convenir', descripcion: 'Para consorcios y locales: urgencias resueltas en el día y visitas programadas.', cta: 'Consultar' }
      ],
      testimonios: [
        { texto: 'Cumplieron la fecha y dejaron todo impecable. Ya los llamé de nuevo para la cocina.', autor: 'Mariela Ortiz', rol: 'Vecina de Caballito' },
        { texto: 'Nos hicieron la obra con el café abierto y no perdimos un solo día de ventas.', autor: 'Diego Ferrari', rol: 'Café La Esquina' }
      ],
      faqs: [
        { pregunta: '¿El presupuesto incluye materiales?', respuesta: 'Te pasamos las dos opciones: con materiales incluidos o solo mano de obra, para que elijas.' },
        { pregunta: '¿Dan garantía?', respuesta: 'Sí, un año por escrito sobre la mano de obra en todos los trabajos.' }
      ],
      opciones: { serviciosTitulo: 'Servicios y precios de referencia', galeriaTitulo: 'Antes y después' },
      tema: 'obra'
    })
  },

  'pf-fotografia-bodas': {
    nombre: 'Fotografía de Bodas & Eventos',
    rubro: 'Fotografía',
    desc: 'Historias de casamientos y eventos con paquetes, testimonios de parejas y fechas libres.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Sol Aranda Fotografía',
        rol: 'Fotografía de bodas, civiles y eventos',
        email: 'hola@solaranda.com.ar',
        telefono: '+54 9 351 612-8890',
        web: 'solaranda.com.ar',
        ubicacion: 'Córdoba y viajes a todo el país',
        instagram: '@solaranda.foto',
        presentacion: 'Fotografío bodas con mirada documental: momentos reales, sin poses forzadas. Acompaño a cada pareja desde la sesión previa hasta la entrega del álbum.'
      },
      portafolio: {
        nombreInterno: 'Portfolio Bodas',
        titulo: 'Historias de amor contadas en fotos',
        subtitulo: 'Bodas, civiles y sesiones de pareja con estilo documental y natural.',
        insignia: 'Bodas 2026 · 2027',
        disponibilidad: 'Quedan fechas para la temporada 2027',
        ctaTexto: 'Consultar mi fecha',
        cierreTitulo: '¿Ya tienen fecha?',
        cierreTexto: 'Escribanme con la fecha y el lugar del evento y les cuento disponibilidad y paquetes.'
      },
      especialidades: ['Bodas y civiles', 'Sesiones de pareja', 'Fotografía documental', 'Álbumes de diseño'],
      proyectos: [
        {
          titulo: 'Agus & Fede — Boda en estancia en Sierras Chicas',
          categoria: 'Boda de día completo',
          subtitulo: 'Estancia La Paz',
          destacado: '650 fotos editadas en 4 semanas',
          descripcion: 'Desde los preparativos hasta la fiesta, con la ceremonia al atardecer y una sesión de pareja entre los árboles del parque.',
          tags: 'Boda, Documental, Golden hour'
        },
        {
          titulo: 'Civil íntimo en Barrio Güemes',
          categoria: 'Civil',
          subtitulo: 'Lu & Tomi',
          destacado: 'Cobertura de 3 horas',
          descripcion: 'Ceremonia en el Registro Civil y brindis con amigos en un bar del barrio, con retratos espontáneos por las calles empedradas.',
          tags: 'Civil, Urbano, Retratos'
        },
        {
          titulo: 'Sesión preboda en el Cerro Champaquí',
          categoria: 'Sesión de pareja',
          subtitulo: 'Cami & Nico',
          destacado: 'Amanecer en la cumbre',
          descripcion: 'Caminata de dos días para fotografiar el amanecer en la cumbre, pensada como regalo para la familia antes de la boda.',
          tags: 'Preboda, Aventura, Paisaje'
        }
      ],
      serviciosWeb: [
        { titulo: 'Civil', precio: 'Desde $650.000', descripcion: '3 horas de cobertura y 250 fotos editadas en galería online.', cta: 'Reservar fecha' },
        { titulo: 'Boda completa', precio: 'Desde $1.900.000', descripcion: 'Día completo, segundo fotógrafo y 600 fotos editadas.', cta: 'Reservar fecha' },
        { titulo: 'Álbum de diseño', precio: 'Desde $380.000', descripcion: 'Álbum de 30×30 con tapa de lino y 40 páginas diseñadas a mano.', cta: 'Sumar al paquete' }
      ],
      testimonios: [
        { texto: 'Nos olvidamos de que estaba y aun así no se perdió nada. Lloramos viendo la galería.', autor: 'Agustina y Federico', rol: 'Boda en Sierras Chicas' },
        { texto: 'Súper profesional y cálida. Nuestras familias todavía hablan de las fotos.', autor: 'Lucía y Tomás', rol: 'Civil en Córdoba' }
      ],
      faqs: [
        { pregunta: '¿Cómo se reserva la fecha?', respuesta: 'Con una seña del 30%. El resto se abona una semana antes del evento.' },
        { pregunta: '¿Viajás fuera de Córdoba?', respuesta: 'Sí, a todo el país. Los traslados y el alojamiento se cotizan aparte.' }
      ],
      opciones: { serviciosTitulo: 'Paquetes', galeriaTitulo: 'Momentos favoritos' },
      tema: 'arena-nupcial'
    })
  },

  'pf-arquitectura-interiorismo': {
    nombre: 'Arquitectura & Interiorismo',
    rubro: 'Arquitectura',
    desc: 'Obras y proyectos con superficie, ubicación y etapas, para estudios y profesionales.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Estudio Lagos Arquitectura',
        rol: 'Arquitectura residencial e interiorismo',
        email: 'estudio@lagosarq.com',
        telefono: '+54 9 11 4022-7710',
        web: 'lagosarq.com',
        ubicacion: 'Buenos Aires',
        instagram: '@lagos.arq',
        presentacion: 'Diseñamos casas y espacios interiores luminosos, funcionales y fáciles de mantener. Acompañamos la obra de punta a punta con dirección técnica y control de costos.'
      },
      portafolio: {
        nombreInterno: 'Portfolio Arquitectura',
        titulo: 'Espacios pensados para vivirlos',
        subtitulo: 'Viviendas, reformas e interiorismo con dirección de obra y presupuesto controlado.',
        insignia: 'Obras seleccionadas',
        disponibilidad: 'Tomamos proyectos para el próximo semestre',
        ctaTexto: 'Agendar una reunión',
        cierreTitulo: '¿Tenés un terreno o un espacio para transformar?',
        cierreTexto: 'Contanos tu idea y armamos una primera reunión para ver alcance, plazos y presupuesto estimado.'
      },
      especialidades: ['Vivienda unifamiliar', 'Reforma y reciclaje', 'Interiorismo y mobiliario', 'Dirección de obra'],
      proyectos: [
        {
          titulo: 'Casa Patio en Nordelta',
          categoria: 'Vivienda nueva',
          subtitulo: '240 m² cubiertos',
          destacado: 'Obra terminada en 11 meses',
          descripcion: 'Casa en una planta organizada alrededor de un patio central, con galería semicubierta, ventilación cruzada y aberturas de doble vidriado hermético.',
          tags: 'Vivienda, Dirección de obra, Sustentable'
        },
        {
          titulo: 'Reciclaje de PH en Villa Crespo',
          categoria: 'Reforma integral',
          subtitulo: 'PH de 1940',
          destacado: '+40% de luz natural',
          descripcion: 'Recuperamos pisos de pinotea y bóvedas originales, abrimos la cocina al patio y sumamos un altillo con estructura metálica liviana.',
          tags: 'Reciclaje, Patrimonio, Interiorismo'
        },
        {
          titulo: 'Oficinas para estudio contable',
          categoria: 'Interiorismo corporativo',
          subtitulo: '18 puestos de trabajo',
          destacado: 'Mudanza sin cortar la atención',
          descripcion: 'Planta libre con salas acústicas, mobiliario a medida y una paleta cálida que mejoró el día a día del equipo.',
          tags: 'Oficinas, Mobiliario, Acústica'
        }
      ],
      serviciosWeb: [
        { titulo: 'Anteproyecto', precio: 'Desde USD 1.800', descripcion: 'Plantas, cortes, imágenes 3D y estimación de costos para decidir con datos.', cta: 'Consultar' },
        { titulo: 'Proyecto ejecutivo', precio: 'Según m²', descripcion: 'Documentación completa para construir y pedir presupuestos a contratistas.', cta: 'Consultar' },
        { titulo: 'Dirección de obra', precio: 'Honorario mensual', descripcion: 'Visitas semanales, certificaciones de avance y control de calidad.', cta: 'Consultar' }
      ],
      testimonios: [
        { texto: 'Cumplieron el presupuesto que nos dijeron desde el principio. Eso no tiene precio.', autor: 'Carolina y Martín', rol: 'Casa Patio' },
        { texto: 'Entendieron cómo trabajamos y nos dieron una oficina que da gusto venir.', autor: 'Estudio Ruiz & Asoc.', rol: 'Oficinas' }
      ],
      faqs: [
        { pregunta: '¿Trabajan fuera de Buenos Aires?', respuesta: 'Sí, el proyecto se hace a distancia y la dirección de obra se cotiza según la distancia.' },
        { pregunta: '¿Se puede hacer solo el interiorismo?', respuesta: 'Sí, tomamos encargos de interiorismo y mobiliario sin obra.' }
      ],
      opciones: { serviciosTitulo: 'Cómo trabajamos', galeriaTitulo: 'Detalles de obra' },
      tema: 'arquitectura'
    })
  },

  'pf-ilustracion-arte': {
    nombre: 'Ilustración & Arte',
    rubro: 'Ilustración',
    desc: 'Encargos editoriales, packaging y murales con estilo propio y tarifas por pieza.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Juli Ferraro',
        rol: 'Ilustradora editorial, packaging y murales',
        email: 'juli@juliferraro.art',
        telefono: '+54 9 341 588-2210',
        web: 'juliferraro.art',
        ubicacion: 'Rosario',
        instagram: '@juli.ferraro',
        presentacion: 'Ilustro para editoriales, marcas y espacios. Me gustan los colores vivos, los personajes con carácter y las historias que se cuentan sin palabras.'
      },
      portafolio: {
        nombreInterno: 'Portfolio Ilustración',
        titulo: 'Ilustraciones con personalidad',
        subtitulo: 'Libros, packaging, murales y piezas para marcas que quieren destacarse.',
        insignia: 'Ilustración & Arte',
        disponibilidad: 'Abierta a encargos',
        ctaTexto: 'Encargar una ilustración',
        cierreTitulo: '¿Tenés una idea para ilustrar?',
        cierreTexto: 'Contame el proyecto, los plazos y dónde se va a usar, y te paso una propuesta con bocetos.'
      },
      especialidades: ['Ilustración editorial', 'Packaging y etiquetas', 'Murales', 'Personajes y mascotas de marca'],
      proyectos: [
        {
          titulo: 'Tapa e interiores de «El bosque que hablaba»',
          categoria: 'Libro infantil',
          subtitulo: 'Editorial Pez Azul',
          destacado: '32 ilustraciones · 2.ª edición',
          descripcion: 'Ilustración completa de un libro álbum, desde el storyboard hasta los archivos finales para imprenta.',
          tags: 'Editorial, Infantil, Acuarela digital'
        },
        {
          titulo: 'Línea de etiquetas para cerveza artesanal',
          categoria: 'Packaging',
          subtitulo: 'Cervecería Ribera',
          destacado: '6 variedades, un sistema',
          descripcion: 'Un personaje por estilo de cerveza, con una grilla común para que la línea se reconozca en la góndola.',
          tags: 'Packaging, Personajes, Branding'
        },
        {
          titulo: 'Mural en patio de escuela',
          categoria: 'Mural',
          subtitulo: 'Escuela N.º 1342',
          destacado: '45 m² pintados con los chicos',
          descripcion: 'Diseño participativo con los alumnos y pintura en tres jornadas, con materiales para exterior.',
          tags: 'Mural, Comunidad, Exterior'
        }
      ],
      serviciosWeb: [
        { titulo: 'Ilustración editorial', precio: 'Desde $180.000', descripcion: 'Por pieza, con boceto, dos rondas de cambios y archivo en alta.', cta: 'Pedir presupuesto' },
        { titulo: 'Packaging', precio: 'Desde $450.000', descripcion: 'Ilustración y adaptación a las medidas de tu envase.', cta: 'Pedir presupuesto' },
        { titulo: 'Mural', precio: 'Por m²', descripcion: 'Diseño, materiales y pintura en el lugar.', cta: 'Pedir presupuesto' }
      ],
      testimonios: [
        { texto: 'Las etiquetas cambiaron cómo nos ven. Hoy la gente pide la cerveza por el personaje.', autor: 'Pablo Ribera', rol: 'Cervecería Ribera' },
        { texto: 'Entendió el texto mejor que nadie. Los chicos aman este libro.', autor: 'Marta Sosa', rol: 'Editorial Pez Azul' }
      ],
      faqs: [
        { pregunta: '¿Cedés los derechos?', respuesta: 'Se ceden los derechos de uso para lo acordado. Otros usos se cotizan aparte.' }
      ],
      opciones: { serviciosTitulo: 'Encargos', galeriaTitulo: 'Bocetos y procesos' },
      tema: 'rosa-editorial'
    })
  },

  'pf-ux-producto': {
    nombre: 'UX/UI & Diseño de Producto',
    rubro: 'Producto digital',
    desc: 'Casos de estudio con problema, proceso y métricas, como los pide un equipo de producto.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Tomás Quiroga',
        rol: 'Product Designer · UX/UI',
        email: 'tomas@quiroga.design',
        telefono: '+54 9 11 6011-2287',
        web: 'quiroga.design',
        ubicacion: 'Remoto desde Buenos Aires',
        linkedin: 'linkedin.com/in/tomasquiroga',
        presentacion: 'Diseño productos digitales con foco en investigación y métricas. Trabajé con fintechs, healthtechs y startups B2B, desde el discovery hasta el handoff.'
      },
      portafolio: {
        nombreInterno: 'Portfolio Producto',
        titulo: 'Diseño de producto con impacto medible',
        subtitulo: 'Casos de estudio: el problema, cómo lo investigamos y qué cambió en los números.',
        insignia: 'Casos de estudio',
        disponibilidad: 'Disponible para proyectos y equipos remotos',
        ctaTexto: 'Agendar una charla',
        cierreTitulo: '¿Tu producto necesita una vuelta?',
        cierreTexto: 'Charlemos 30 minutos sobre tu producto y te cuento cómo encararía los próximos pasos.'
      },
      especialidades: ['Investigación con usuarios', 'Diseño de interfaces', 'Design systems', 'Prototipos y testeo'],
      proyectos: [
        {
          titulo: 'Onboarding de una billetera virtual',
          categoria: 'Fintech · Mobile',
          subtitulo: 'Startup de pagos',
          destacado: '+31% de cuentas activadas',
          descripcion: 'Entrevistas, análisis de abandono y un onboarding nuevo en 4 pasos con validación de identidad más clara.',
          tags: 'Research, Mobile, A/B test'
        },
        {
          titulo: 'Design system para una plataforma de turnos',
          categoria: 'Healthtech · Web',
          subtitulo: 'Red de clínicas',
          destacado: '-40% de tiempo de desarrollo',
          descripcion: 'Librería de componentes en Figma y código, con guías de accesibilidad y tokens compartidos con el equipo de front.',
          tags: 'Design system, Figma, Accesibilidad'
        },
        {
          titulo: 'Panel de reportes para equipos de ventas',
          categoria: 'SaaS B2B',
          subtitulo: 'CRM para pymes',
          destacado: 'NPS de 22 a 47',
          descripcion: 'Rediseño del panel principal a partir de 15 entrevistas: menos gráficos, mejores preguntas y acciones en un clic.',
          tags: 'B2B, Dashboards, Discovery'
        }
      ],
      serviciosWeb: [
        { titulo: 'Auditoría UX', precio: 'USD 900', descripcion: 'Revisión heurística, análisis de métricas y lista de mejoras priorizadas.', cta: 'Consultar' },
        { titulo: 'Sprint de diseño', precio: 'USD 2.400', descripcion: 'Dos semanas para investigar, prototipar y testear una funcionalidad.', cta: 'Consultar' },
        { titulo: 'Diseñador en tu equipo', precio: 'Mensual', descripcion: 'Dedicación parcial o completa, integrado a tus rituales de producto.', cta: 'Consultar' }
      ],
      testimonios: [
        { texto: 'Nos ayudó a tomar decisiones con datos y no con opiniones. El onboarding nuevo se pagó solo.', autor: 'Valeria Díaz', rol: 'Head of Product' },
        { texto: 'El design system ordenó al equipo entero. Hoy lanzamos el doble de rápido.', autor: 'Ignacio Paz', rol: 'CTO' }
      ],
      faqs: [
        { pregunta: '¿Trabajás con equipos de otros países?', respuesta: 'Sí, en español o inglés, con superposición horaria con América y Europa.' }
      ],
      opciones: { serviciosTitulo: 'Formas de trabajar juntos', galeriaTitulo: 'Pantallas y prototipos' },
      tema: 'indigo-producto'
    })
  },

  'pf-audiovisual': {
    nombre: 'Producción Audiovisual & Video',
    rubro: 'Audiovisual',
    desc: 'Reel, videos institucionales, publicidad y redes, con equipo y entregables claros.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Cuadro Films',
        rol: 'Productora audiovisual',
        email: 'produccion@cuadrofilms.com.ar',
        telefono: '+54 9 11 3122-9004',
        web: 'cuadrofilms.com.ar',
        ubicacion: 'Buenos Aires',
        instagram: '@cuadro.films',
        presentacion: 'Producimos videos para marcas, empresas y artistas: desde el guion hasta la posproducción. Equipo chico, cámaras de cine y mucha planificación para que el rodaje rinda.'
      },
      portafolio: {
        nombreInterno: 'Portfolio Audiovisual',
        titulo: 'Videos que la gente mira hasta el final',
        subtitulo: 'Publicidad, institucionales, contenido para redes y videoclips.',
        insignia: 'Reel 2026',
        disponibilidad: 'Agenda de rodajes abierta',
        ctaTexto: 'Cotizar un video',
        cierreTitulo: '¿Qué historia querés contar?',
        cierreTexto: 'Contanos el objetivo, la fecha y dónde se va a ver el video, y te mandamos una propuesta con guion y presupuesto.'
      },
      especialidades: ['Publicidad y spots', 'Videos institucionales', 'Contenido vertical para redes', 'Videoclips'],
      proyectos: [
        {
          titulo: 'Campaña de lanzamiento para app de delivery',
          categoria: 'Publicidad',
          subtitulo: 'Spot de 30" y 12 piezas verticales',
          destacado: '2,1 M de reproducciones',
          descripcion: 'Guion, casting, rodaje de dos días en exteriores y una versión para cada red, con subtítulos y ganchos en los primeros 3 segundos.',
          tags: 'Spot, Redes, Rodaje en exteriores'
        },
        {
          titulo: 'Video institucional para planta industrial',
          categoria: 'Institucional',
          subtitulo: 'Metalúrgica con 60 años',
          destacado: 'Usado en ferias de 4 países',
          descripcion: 'Entrevistas al equipo, tomas aéreas con dron y una pieza de 3 minutos con versiones en inglés y portugués.',
          tags: 'Institucional, Drone, Entrevistas'
        },
        {
          titulo: 'Videoclip «Madrugada»',
          categoria: 'Videoclip',
          subtitulo: 'Banda Los Faros',
          destacado: 'Seleccionado en festival BAFICI',
          descripcion: 'Rodaje nocturno en un plano secuencia con iluminación práctica y colorización cinematográfica.',
          tags: 'Videoclip, Plano secuencia, Color'
        }
      ],
      serviciosWeb: [
        { titulo: 'Pack redes', precio: 'Desde $900.000', descripcion: 'Una jornada de rodaje y 8 videos verticales editados con subtítulos.', cta: 'Cotizar' },
        { titulo: 'Video institucional', precio: 'Desde $2.800.000', descripcion: 'Guion, rodaje, entrevistas, drone y edición de hasta 3 minutos.', cta: 'Cotizar' },
        { titulo: 'Spot publicitario', precio: 'A medida', descripcion: 'Producción completa con casting, locaciones y posproducción.', cta: 'Cotizar' }
      ],
      testimonios: [
        { texto: 'Planificaron todo al minuto y el rodaje fue un paseo. El resultado superó lo que imaginábamos.', autor: 'Sofía Méndez', rol: 'Gerenta de Marketing' },
        { texto: 'Entendieron la canción y la llevaron a otro lugar.', autor: 'Los Faros', rol: 'Banda' }
      ],
      faqs: [
        { pregunta: '¿Cuánto tarda la entrega?', respuesta: 'Entre 7 y 15 días hábiles después del rodaje, según la pieza.' },
        { pregunta: '¿Incluye música?', respuesta: 'Sí, con licencia de uso para redes y web. Música original se cotiza aparte.' }
      ],
      opciones: { serviciosTitulo: 'Producciones', galeriaTitulo: 'Fotogramas' },
      tema: 'medianoche'
    })
  },

  'pf-musica-dj': {
    nombre: 'DJ, Música & Shows en vivo',
    rubro: 'Música & Eventos',
    desc: 'Fechas, eventos destacados, formatos de show y rider técnico para contrataciones.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'DJ Maia Luz',
        rol: 'DJ para casamientos, fiestas y eventos corporativos',
        email: 'contrataciones@maialuz.com',
        telefono: '+54 9 11 2290-6612',
        web: 'maialuz.com',
        ubicacion: 'AMBA y todo el país',
        instagram: '@maialuz.dj',
        presentacion: 'Leo la pista y armo la noche en el momento. Más de 300 eventos con sonido e iluminación propios y un equipo que se encarga de todo lo técnico.'
      },
      portafolio: {
        nombreInterno: 'Portfolio DJ',
        titulo: 'La pista llena hasta el final',
        subtitulo: 'Casamientos, fiestas de 15, eventos de empresa y fiestas privadas.',
        insignia: '+300 eventos',
        disponibilidad: 'Consultá tu fecha',
        ctaTexto: 'Consultar disponibilidad',
        cierreTitulo: '¿Cuándo es tu evento?',
        cierreTexto: 'Pasame fecha, lugar y cantidad de invitados y te mando el presupuesto con sonido e iluminación.'
      },
      especialidades: ['Casamientos', 'Fiestas de 15', 'Eventos corporativos', 'Sonido e iluminación propios'],
      proyectos: [
        {
          titulo: 'Casamiento en quinta de Pilar',
          categoria: 'Casamiento',
          subtitulo: '220 invitados',
          destacado: 'Pista llena hasta las 5 a. m.',
          descripcion: 'Música para la ceremonia, cóctel lounge y fiesta con tandas pensadas con los novios, más show de luces en la entrada.',
          tags: 'Casamiento, Ceremonia, Iluminación'
        },
        {
          titulo: 'Fiesta de fin de año de empresa tech',
          categoria: 'Corporativo',
          subtitulo: '500 personas',
          destacado: 'Sonido para dos ambientes',
          descripcion: 'Set en vivo con saxofonista invitado y un segundo ambiente chill, con pantallas LED y la identidad de la marca.',
          tags: 'Corporativo, Show en vivo, LED'
        },
        {
          titulo: 'Fiesta de 15 temática',
          categoria: 'Fiesta de 15',
          subtitulo: 'Salón en Belgrano',
          destacado: 'Coreografía y vals sincronizados',
          descripcion: 'Entrada con efectos, vals, coreografía de amigas y una fiesta con los hits que pidió la cumpleañera.',
          tags: 'Fiesta de 15, Efectos, Pista'
        }
      ],
      serviciosWeb: [
        { titulo: 'Fiesta privada', precio: 'Desde $750.000', descripcion: '5 horas de música con sonido para hasta 120 personas.', cta: 'Consultar fecha' },
        { titulo: 'Casamiento completo', precio: 'Desde $1.600.000', descripcion: 'Ceremonia, cóctel y fiesta, con iluminación y pista LED.', cta: 'Consultar fecha' },
        { titulo: 'Show con músicos', precio: 'A medida', descripcion: 'Sumá saxo, percusión o voz en vivo al set.', cta: 'Consultar' }
      ],
      testimonios: [
        { texto: 'Nadie se sentó en toda la noche. Nuestros abuelos bailaron cumbia y reggaetón.', autor: 'Flor y Juan', rol: 'Casamiento en Pilar' },
        { texto: 'Impecable con los tiempos del evento y con la gente.', autor: 'Laura Benítez', rol: 'Recursos Humanos' }
      ],
      faqs: [
        { pregunta: '¿Se pueden pedir canciones?', respuesta: 'Sí, armamos juntos una lista de imperdibles y otra de las que no tienen que sonar.' },
        { pregunta: '¿Tenés rider técnico?', respuesta: 'Sí, te lo mando con la propuesta para coordinar con el salón.' }
      ],
      opciones: { serviciosTitulo: 'Formatos', galeriaTitulo: 'Noches que quedaron' },
      tema: 'neon-pulso'
    })
  },

  'pf-gastronomia-catering': {
    nombre: 'Gastronomía, Catering & Pastelería',
    rubro: 'Gastronomía',
    desc: 'Menús, eventos realizados y paquetes por invitado para cocineros, caterings y pastelerías.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Lumbre Catering',
        rol: 'Catering para eventos y cocina de autor',
        email: 'eventos@lumbrecatering.com.ar',
        telefono: '+54 9 261 455-3091',
        web: 'lumbrecatering.com.ar',
        ubicacion: 'Mendoza',
        instagram: '@lumbre.catering',
        presentacion: 'Cocinamos con fuego y productos de la región para casamientos, eventos de empresa y encuentros privados. Menús a medida y un equipo de servicio que hace que todo fluya.'
      },
      portafolio: {
        nombreInterno: 'Portfolio Catering',
        titulo: 'Cocina de fuego para eventos que se recuerdan',
        subtitulo: 'Casamientos, eventos de empresa y cenas privadas en Mendoza y alrededores.',
        insignia: 'Eventos realizados',
        disponibilidad: 'Fechas disponibles para la temporada',
        ctaTexto: 'Pedir un menú',
        cierreTitulo: '¿Organizás un evento?',
        cierreTexto: 'Contanos la fecha, la cantidad de invitados y el estilo, y te armamos una propuesta de menú con degustación incluida.'
      },
      especialidades: ['Cocina a las brasas', 'Menús por pasos', 'Mesas dulces', 'Opciones vegetarianas y sin TACC'],
      proyectos: [
        {
          titulo: 'Casamiento entre viñedos en Valle de Uco',
          categoria: 'Casamiento',
          subtitulo: '180 invitados',
          destacado: 'Menú de 5 pasos maridado',
          descripcion: 'Recepción con estaciones al fuego, cena por pasos con vinos de la bodega y mesa dulce con frutas de estación.',
          tags: 'Casamiento, Fuegos, Maridaje'
        },
        {
          titulo: 'Convención anual de empresa minera',
          categoria: 'Corporativo',
          subtitulo: '3 días · 400 personas',
          destacado: '2.600 servicios sin demoras',
          descripcion: 'Desayunos, almuerzos y coffee breaks con opciones para cada dieta, más una cena de cierre con cordero patagónico.',
          tags: 'Corporativo, Volumen, Logística'
        },
        {
          titulo: 'Cena privada a ciegas',
          categoria: 'Experiencia',
          subtitulo: '24 comensales',
          destacado: 'Lista de espera de 3 meses',
          descripcion: 'Una cena de 8 pasos con los ojos vendados y un relato de cada plato, para un grupo de amigos que festejaba un aniversario.',
          tags: 'Cocina de autor, Experiencia'
        }
      ],
      serviciosWeb: [
        { titulo: 'Cocktail', precio: 'Desde $38.000 por persona', descripcion: '4 horas con 12 bocados, estación de fuego y servicio.', cta: 'Pedir menú' },
        { titulo: 'Menú por pasos', precio: 'Desde $55.000 por persona', descripcion: 'Entrada, principal y postre, con vajilla y mozos.', cta: 'Pedir menú' },
        { titulo: 'Mesa dulce', precio: 'Desde $9.000 por persona', descripcion: 'Tortas, tartas y petit fours de nuestra pastelería.', cta: 'Sumar al evento' }
      ],
      testimonios: [
        { texto: 'La comida fue lo que más nos comentaron los invitados. Y el servicio, impecable.', autor: 'Pilar y Andrés', rol: 'Casamiento en Valle de Uco' },
        { texto: 'Tres días, 400 personas y ni un solo problema. Ya los reservamos para el año que viene.', autor: 'Gustavo Lima', rol: 'Gerente de Eventos' }
      ],
      faqs: [
        { pregunta: '¿Hacen degustación?', respuesta: 'Sí, para eventos de más de 80 invitados la degustación está incluida.' },
        { pregunta: '¿Tienen opciones sin TACC?', respuesta: 'Sí, cocinamos sin TACC en un sector aparte y lo señalizamos en el servicio.' }
      ],
      opciones: { serviciosTitulo: 'Propuestas por invitado', galeriaTitulo: 'Platos y mesas' },
      tema: 'botanico'
    })
  },

  'pf-consultoria-profesional': {
    nombre: 'Consultoría & Estudio Profesional',
    rubro: 'Legal, contable & consultoría',
    desc: 'Áreas de práctica, casos resueltos y honorarios orientativos para estudios y consultores.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Estudio Paredes & Asociados',
        rol: 'Asesoramiento contable, impositivo y societario',
        email: 'consultas@estudioparedes.com.ar',
        telefono: '+54 9 11 4810-2290',
        web: 'estudioparedes.com.ar',
        ubicacion: 'Microcentro, Buenos Aires',
        linkedin: 'linkedin.com/company/estudioparedes',
        presentacion: 'Acompañamos a pymes, profesionales y emprendedores en lo contable e impositivo desde hace 20 años. Respuestas claras, plazos cumplidos y un contador que te atiende el teléfono.'
      },
      portafolio: {
        nombreInterno: 'Portfolio Estudio',
        titulo: 'Tus números en orden, tu negocio en marcha',
        subtitulo: 'Contabilidad, impuestos, sueldos y sociedades para pymes y profesionales.',
        insignia: 'Estudio profesional',
        disponibilidad: 'Primera reunión sin cargo',
        ctaTexto: 'Agendar una reunión',
        cierreTitulo: '¿Necesitás ordenar tu situación impositiva?',
        cierreTexto: 'Agendá una primera reunión de 30 minutos y te decimos por dónde empezar y cuánto cuesta.'
      },
      especialidades: ['Liquidación de impuestos', 'Sueldos y cargas sociales', 'Constitución de sociedades', 'Planificación fiscal'],
      proyectos: [
        {
          titulo: 'Paso de monotributo a responsable inscripto',
          categoria: 'Planificación impositiva',
          subtitulo: 'Agencia de diseño con 8 personas',
          destacado: 'Transición sin multas ni intereses',
          descripcion: 'Proyección de ingresos, armado de la estructura y acompañamiento mes a mes durante el primer año.',
          tags: 'Impuestos, Pymes, Planificación'
        },
        {
          titulo: 'Constitución de SAS para startup',
          categoria: 'Societario',
          subtitulo: 'Startup de logística',
          destacado: 'Sociedad inscripta en 10 días',
          descripcion: 'Estatuto, inscripción, alta en AFIP y apertura de cuenta bancaria, listos para recibir inversión.',
          tags: 'Sociedades, Startups, Inversión'
        },
        {
          titulo: 'Ordenamiento contable de cadena de cafeterías',
          categoria: 'Contabilidad',
          subtitulo: '4 locales',
          destacado: 'Balances al día en 3 meses',
          descripcion: 'Regularización de dos ejercicios atrasados, tablero mensual de costos y liquidación de sueldos de 35 empleados.',
          tags: 'Contabilidad, Sueldos, Gastronomía'
        }
      ],
      serviciosWeb: [
        { titulo: 'Monotributo', precio: 'Desde $45.000 por mes', descripcion: 'Recategorizaciones, facturación y pagos al día.', cta: 'Consultar' },
        { titulo: 'Responsable inscripto', precio: 'Desde $160.000 por mes', descripcion: 'IVA, Ganancias, Ingresos Brutos y contabilidad completa.', cta: 'Consultar' },
        { titulo: 'Sueldos', precio: 'Por empleado', descripcion: 'Liquidación, recibos, cargas sociales y altas y bajas.', cta: 'Consultar' }
      ],
      testimonios: [
        { texto: 'Por primera vez entiendo lo que pago y por qué. Y siempre me contestan rápido.', autor: 'Carla Benedetti', rol: 'Fundadora de agencia' },
        { texto: 'Nos ordenaron dos años atrasados sin que tuviéramos que frenar el negocio.', autor: 'Hernán Gil', rol: 'Socio gerente' }
      ],
      faqs: [
        { pregunta: '¿Atienden a distancia?', respuesta: 'Sí, trabajamos con clientes de todo el país por videollamada y documentos online.' },
        { pregunta: '¿La primera reunión tiene costo?', respuesta: 'No, la primera reunión de 30 minutos es sin cargo.' }
      ],
      opciones: { serviciosTitulo: 'Honorarios orientativos', galeriaTitulo: 'El estudio' },
      tema: 'azul-notarial'
    })
  },

  'pf-fitness-bienestar': {
    nombre: 'Entrenamiento & Bienestar',
    rubro: 'Fitness & Salud',
    desc: 'Programas, transformaciones de alumnos y planes mensuales para entrenadores y terapeutas.',
    plan: 'pro',
    datos: () => ({
      emisor: {
        nombre: 'Rami Sosa Training',
        rol: 'Entrenamiento personal y online',
        email: 'hola@ramisosa.com',
        telefono: '+54 9 11 6644-1820',
        web: 'ramisosa.com',
        ubicacion: 'Palermo y online',
        instagram: '@ramisosa.training',
        presentacion: 'Profesor de educación física con 10 años de experiencia. Armo planes que entran en tu semana real, con seguimiento cercano y objetivos que se pueden medir.'
      },
      portafolio: {
        nombreInterno: 'Portfolio Entrenamiento',
        titulo: 'Entrená con un plan, no con ganas',
        subtitulo: 'Entrenamiento personal, grupos reducidos y planes online con seguimiento semanal.',
        insignia: 'Resultados reales',
        disponibilidad: 'Quedan 4 cupos este mes',
        ctaTexto: 'Quiero empezar',
        cierreTitulo: '¿Arrancamos el lunes?',
        cierreTexto: 'Escribime tu objetivo y tu disponibilidad, y te propongo un plan con la primera clase de evaluación sin cargo.'
      },
      especialidades: ['Fuerza e hipertrofia', 'Running y resistencia', 'Recuperación postlesión', 'Planes online'],
      proyectos: [
        {
          titulo: 'De 0 a 21 km en 6 meses',
          categoria: 'Running',
          subtitulo: 'Paula, 38 años',
          destacado: 'Media maratón en 2 h 05',
          descripcion: 'Plan progresivo de 4 días por semana con fuerza complementaria y ajustes según cada entrenamiento registrado.',
          tags: 'Running, Plan online, Fuerza'
        },
        {
          titulo: 'Vuelta al deporte después de una cirugía de rodilla',
          categoria: 'Recuperación',
          subtitulo: 'Martín, 45 años',
          destacado: 'De vuelta al fútbol en 5 meses',
          descripcion: 'Trabajo coordinado con su kinesiólogo, fortalecimiento por etapas y pruebas de retorno antes de volver a la cancha.',
          tags: 'Postlesión, Fuerza, Prevención'
        },
        {
          titulo: 'Programa de pausas activas para una empresa',
          categoria: 'Corporativo',
          subtitulo: 'Equipo de 60 personas',
          destacado: '-35% de consultas por dolor de espalda',
          descripcion: 'Clases semanales en la oficina y rutinas de 10 minutos para hacer en casa, con un informe trimestral para Recursos Humanos.',
          tags: 'Empresas, Bienestar, Grupos'
        }
      ],
      serviciosWeb: [
        { titulo: 'Plan online', precio: '$45.000 por mes', descripcion: 'Rutina en la app, videos de cada ejercicio y revisión semanal.', cta: 'Empezar' },
        { titulo: 'Personal', precio: '$120.000 por mes', descripcion: '2 clases por semana en el parque o en tu edificio.', cta: 'Empezar' },
        { titulo: 'Empresas', precio: 'A medida', descripcion: 'Pausas activas y programas de bienestar para equipos.', cta: 'Consultar' }
      ],
      testimonios: [
        { texto: 'Nunca había sostenido un plan más de un mes. Con Rami llevo un año y corrí mi primera media.', autor: 'Paula R.', rol: 'Alumna online' },
        { texto: 'Me devolvió la confianza en la rodilla. Profesional y muy paciente.', autor: 'Martín G.', rol: 'Alumno presencial' }
      ],
      faqs: [
        { pregunta: '¿Necesito ir a un gimnasio?', respuesta: 'No. Armamos el plan con lo que tengas: parque, casa o gimnasio.' },
        { pregunta: '¿Puedo pausar el plan?', respuesta: 'Sí, se puede pausar hasta un mes por vacaciones o lesiones sin perder el cupo.' }
      ],
      opciones: { serviciosTitulo: 'Planes', galeriaTitulo: 'Entrenamientos' },
      tema: 'energia'
    })
  }
};
