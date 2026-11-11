// Resultados del dueño: cuánto ganó, cuánto convierte, qué está en juego y qué propuestas
// conviene seguir ahora. Puro: recibe la lista de propuestas (como llega de Firestore) y
// devuelve números; la pantalla está en controlador/resultados.js.

const DIA = 86400000;

// Fechas de Firestore (Timestamp), ISO o Date → Date (o null).
export const fechaDe = v => {
  if (!v) return null;
  const f = typeof v.toDate === 'function' ? v.toDate() : v instanceof Date ? v : new Date(v);
  return Number.isNaN(f.getTime()) ? null : f;
};

const monedaDe = p => p.aceptacion?.moneda || p.payload?.inversion?.moneda || 'USD';
const fueEnviada = p => !!p.enviadaEn || ['sent', 'accepted', 'rejected'].includes(p.status) || p.publico === true || !!p.aceptacion;
// Fecha de envío: la del servidor; las propuestas viejas no la tienen y usan la de creación.
const fechaEnvio = p => fechaDe(p.enviadaEn) || fechaDe(p.createdAt) || fechaDe(p.updatedAt);
const fechaAceptacion = p => fechaDe(p.aceptacion?.fecha);
const clienteDe = p => String(p.clientName || p.payload?.cliente?.empresa || p.payload?.cliente?.nombre || '').trim();

// Vencimiento de la propuesta (fecha + días de validez).
const venceDe = p => {
  const inicio = fechaDe(p.payload?.propuesta?.fecha);
  const dias = Number(p.payload?.propuesta?.validez);
  return inicio && dias > 0 ? new Date(inicio.getTime() + dias * DIA) : null;
};

export const PERIODOS = {
  mes: { nombre: 'Este mes', meses: 1 },
  trimestre: { nombre: '90 días', dias: 90 },
  anio: { nombre: '12 meses', meses: 12 }
};

// Comienzo del período: «mes» es el mes calendario; el resto, hacia atrás desde hoy.
export const inicioDe = (periodo, ahora = new Date()) => {
  if (periodo === 'mes') return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  if (periodo === 'anio') return new Date(ahora.getFullYear(), ahora.getMonth() - 11, 1);
  return new Date(ahora.getTime() - (PERIODOS[periodo]?.dias || 90) * DIA);
};

const mediana = lista => {
  if (!lista.length) return null;
  const orden = [...lista].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2;
};

const sumarPorMoneda = (lista, valor) => {
  const sumas = new Map();
  lista.forEach(p => sumas.set(monedaDe(p), (sumas.get(monedaDe(p)) || 0) + (Number(valor(p)) || 0)));
  return [...sumas].map(([moneda, total]) => ({ moneda, total })).sort((a, b) => b.total - a.total);
};

// Franja horaria (hora de Argentina) en que el cliente abrió por primera vez.
const formatoHora = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', hourCycle: 'h23' });
export const FRANJAS = [
  { id: 'manana', nombre: 'Mañana', desde: 6, hasta: 12 },
  { id: 'tarde', nombre: 'Tarde', desde: 12, hasta: 19 },
  { id: 'noche', nombre: 'Noche', desde: 19, hasta: 24 },
  { id: 'madrugada', nombre: 'Madrugada', desde: 0, hasta: 6 }
];
const franjaDe = fecha => {
  const hora = Number(formatoHora.format(fecha));
  return FRANJAS.find(f => hora >= f.desde && hora < f.hasta)?.id;
};

export const calcularResultados = (propuestas = [], { periodo = 'mes', ahora = new Date() } = {}) => {
  const desde = inicioDe(periodo, ahora);
  const enPeriodo = f => !!f && f >= desde && f <= ahora;

  const enviadas = propuestas.filter(p => fueEnviada(p) && enPeriodo(fechaEnvio(p)));
  const abiertas = enviadas.filter(p => Number(p.vistas) > 0 || !!p.aceptacion);
  const aceptadasDeEnviadas = enviadas.filter(p => p.aceptacion);
  // Lo ganado cuenta por fecha de aceptación (una propuesta de octubre aceptada en noviembre
  // es plata de noviembre).
  const aceptadas = propuestas.filter(p => p.aceptacion && enPeriodo(fechaAceptacion(p)));

  const ganado = sumarPorMoneda(aceptadas, p => p.aceptacion.inicial);
  const mensual = sumarPorMoneda(aceptadas.filter(p => Number(p.aceptacion.mensual) > 0), p => p.aceptacion.mensual);
  const monedaPrincipal = ganado[0]?.moneda || monedaDe(propuestas[0] || {});
  const aceptadasPrincipal = aceptadas.filter(p => monedaDe(p) === monedaPrincipal);
  const ticketMedio = aceptadasPrincipal.length
    ? aceptadasPrincipal.reduce((s, p) => s + (Number(p.aceptacion.inicial) || 0), 0) / aceptadasPrincipal.length
    : null;

  const diasHastaAceptar = mediana(aceptadas
    .map(p => {
      const envio = fechaEnvio(p);
      const acepto = fechaAceptacion(p);
      return envio && acepto && acepto >= envio ? (acepto - envio) / DIA : null;
    })
    .filter(d => d !== null));

  // En juego: enviadas, sin aceptar ni rechazar, vigentes y con el link activo (todas, no
  // solo las del período: es lo que hoy se puede ganar).
  const abiertasAhora = propuestas.filter(p => fueEnviada(p) && !p.aceptacion && p.status !== 'rejected' && p.publico === true
    && !((venceDe(p) || Infinity) < ahora));
  const enJuego = sumarPorMoneda(abiertasAhora, p => p.amount);

  // Para seguir hoy, con paciencia (insistir antes de tiempo cansa al cliente):
  // - calientes: la abrió más de una vez y no respondió, pero se le da un día para pensarla
  //   (la última vez, hace entre 1 y 5 días);
  // - sin abrir: a los 3 días del envío;
  // - por vencer: en los últimos 3 días de vigencia.
  const calientes = abiertasAhora
    .filter(p => {
      const desde = ahora - (fechaDe(p.vistoUltimo) || 0);
      return Number(p.vistas) >= 2 && desde >= DIA && desde <= 5 * DIA;
    })
    .sort((a, b) => fechaDe(b.vistoUltimo) - fechaDe(a.vistoUltimo));
  const sinAbrir = abiertasAhora
    .filter(p => !(Number(p.vistas) > 0) && (ahora - (fechaEnvio(p) || ahora)) >= 3 * DIA)
    .sort((a, b) => fechaEnvio(a) - fechaEnvio(b));
  const porVencer = abiertasAhora
    .filter(p => { const v = venceDe(p); return v && v - ahora <= 3 * DIA; })
    .sort((a, b) => venceDe(a) - venceDe(b));

  // Opcionales que más suman tus clientes al aceptar.
  const conteo = new Map();
  aceptadas.forEach(p => (p.aceptacion.opcionales || []).forEach(o => {
    const nombre = String(o?.nombre || '').trim();
    if (nombre) conteo.set(nombre, (conteo.get(nombre) || 0) + 1);
  }));
  const opcionales = [...conteo].map(([nombre, veces]) => ({ nombre, veces })).sort((a, b) => b.veces - a.veces).slice(0, 5);
  const ofrecieronOpcionales = aceptadas.filter(p => (p.payload?.servicios || []).some(s => s.opcional)).length;
  const sumaronOpcionales = aceptadas.filter(p => (p.aceptacion.opcionales || []).length > 0).length;

  // Mejores clientes por lo aceptado en la moneda principal.
  const porCliente = new Map();
  aceptadasPrincipal.forEach(p => {
    const nombre = clienteDe(p) || 'Sin nombre';
    const c = porCliente.get(nombre) || { nombre, total: 0, aceptadas: 0 };
    c.total += Number(p.aceptacion.inicial) || 0;
    c.aceptadas += 1;
    porCliente.set(nombre, c);
  });
  const clientes = [...porCliente.values()].sort((a, b) => b.total - a.total).slice(0, 5);

  // Cuándo abren: franja de la primera visita.
  const franjas = Object.fromEntries(FRANJAS.map(f => [f.id, 0]));
  enviadas.forEach(p => {
    const f = fechaDe(p.vistoPrimero);
    if (f) franjas[franjaDe(f)] += 1;
  });

  // Ganado por mes (moneda principal), para el gráfico: los últimos 6 meses (12 en «anio»).
  const cantidadMeses = periodo === 'anio' ? 12 : 6;
  const meses = Array.from({ length: cantidadMeses }, (_, i) => {
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - (cantidadMeses - 1 - i), 1);
    const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
    const total = propuestas
      .filter(p => p.aceptacion && monedaDe(p) === monedaPrincipal)
      .filter(p => { const f = fechaAceptacion(p); return f && f >= inicio && f < fin; })
      .reduce((s, p) => s + (Number(p.aceptacion.inicial) || 0), 0);
    return { inicio, total };
  });

  return {
    periodo,
    desde,
    monedaPrincipal,
    ganado,
    mensual,
    ticketMedio,
    diasHastaAceptar,
    embudo: { enviadas: enviadas.length, abiertas: abiertas.length, aceptadas: aceptadasDeEnviadas.length },
    conversion: enviadas.length ? aceptadasDeEnviadas.length / enviadas.length : null,
    tasaApertura: enviadas.length ? abiertas.length / enviadas.length : null,
    aceptadas: aceptadas.length,
    enJuego,
    abiertasAhora: abiertasAhora.length,
    calientes,
    sinAbrir,
    porVencer,
    opcionales,
    ofrecieronOpcionales,
    sumaronOpcionales,
    clientes,
    franjas,
    meses,
    hayDatos: propuestas.some(fueEnviada)
  };
};
