// Motor de temas visuales: mezcla cromática, contraste perceptual WCAG y aplicación de variables CSS en vivo.

import {
  TEMAS,
  PORTADAS,
  DECORACIONES,
  ESTILOS_BLOQUES
} from '../modelo.js';

export const hexARgb = hex => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [201, 168, 76];
};

export const rgbAHex = (r, g, b) => '#' + [r, g, b]
  .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
  .join('')
  .toUpperCase();

export const mezclar = (hex, blanco, peso) => {
  const [r, g, b] = hexARgb(hex);
  const d = blanco ? 255 : 0;
  return rgbAHex(r + (d - r) * peso, g + (d - g) * peso, b + (d - b) * peso);
};

export const mezclarDos = (hex1, hex2, peso = 0.5) => {
  const [r1, g1, b1] = hexARgb(hex1);
  const [r2, g2, b2] = hexARgb(hex2);
  return rgbAHex(r1 + (r2 - r1) * peso, g1 + (g2 - g1) * peso, b1 + (b2 - b1) * peso);
};

// Luminancia relativa perceptual (0 = negro puro, 1 = blanco puro)
export const luminancia = hex => {
  const [r, g, b] = hexARgb(hex).map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrasteRatio = (hex1, hex2) => {
  const l1 = luminancia(hex1);
  const l2 = luminancia(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

// Garantiza que un color de acento o decoración sea legible sobre un fondo dado
export const asegurarContraste = (colorHex, fondoHex, minRatio = 3.2) => {
  if (contrasteRatio(colorHex, fondoHex) >= minRatio) return colorHex;
  const haciaBlanco = luminancia(fondoHex) < 0.45;
  let actual = colorHex;
  for (let i = 1; i <= 10; i++) {
    actual = mezclar(colorHex, haciaBlanco, i * 0.09);
    if (contrasteRatio(actual, fondoHex) >= minRatio) return actual;
  }
  return actual;
};

const clampNumero = (val, min, max, def = 100) => {
  if (val === undefined || val === null || val === '') return def;
  const n = Number(val);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : def;
};

const fuentesEnUso = new Set();
export const cargarFuente = nombre => {
  if (!nombre || fuentesEnUso.has(nombre) || typeof document === 'undefined') return;
  fuentesEnUso.add(nombre);
  const pesos = nombre === 'Bebas Neue' || nombre === 'Archivo Black' ? '400' : '400;500;700';
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(nombre)}:wght@${pesos}&display=swap`;
  document.head.append(link);
};

// Resuelve todos los colores efectivos del tema (incluyendo portada, texto, SVG, fondos y escalas tipográficas/espaciados)
export const resolverColoresTema = t => {
  const preset = TEMAS[t?.preset] || TEMAS['elegante-oscuro'];
  const esHex = c => /^#[0-9A-Fa-f]{6}$/.test((c || '').trim());
  const acento = esHex(t?.acento) ? t.acento.trim() : preset.acento;
  const fondoPersonalizado = esHex(t?.colorFondo) ? t.colorFondo.trim() : '';
  const portadaPersonalizada = esHex(t?.colorPortada) ? t.colorPortada.trim() : '';

  const fondoBase = fondoPersonalizado || preset.fondo;
  const presetClaro = preset.modo === 'claro';
  const esClaro = fondoPersonalizado ? luminancia(fondoBase) > 0.42 : presetClaro;
  const cambioModoFondo = esClaro !== presetClaro;
  const fondo2 = fondoPersonalizado ? mezclar(fondoBase, !esClaro, 0.04) : preset.fondo2;
  const superficie = fondoPersonalizado ? mezclar(fondoBase, !esClaro, 0.1) : preset.superficie;
  const superficieBorde = fondoPersonalizado ? mezclar(fondoBase, !esClaro, 0.16) : preset.superficieBorde;

  const textoPersonalizado = esHex(t?.colorTexto) ? t.colorTexto.trim() : '';
  const svgPersonalizado = esHex(t?.colorSvg) ? t.colorSvg.trim() : '';

  // Fondo de portada: respeta el color de portada elegido, o fondo blanco en «lienzo-blanco», o portada ejecutiva en otros temas
  let portadaBg;
  if (portadaPersonalizada) {
    portadaBg = portadaPersonalizada;
  } else if (preset.portadaClara) {
    portadaBg = fondoBase;
  } else if (fondoPersonalizado) {
    portadaBg = fondoPersonalizado;
  } else {
    portadaBg = esClaro ? mezclar(acento, false, 0.72) : preset.fondo;
  }
  if (!portadaPersonalizada && !preset.portadaClara && !fondoPersonalizado && textoPersonalizado) {
    const lumTexto = luminancia(textoPersonalizado);
    if (lumTexto < 0.28) {
      portadaBg = esClaro ? preset.fondo : mezclar(textoPersonalizado, true, 0.9);
    } else if (lumTexto > 0.65 && luminancia(portadaBg) > 0.45) {
      portadaBg = mezclar(acento, false, 0.78);
    }
  }

  const portadaClara = luminancia(portadaBg) > 0.42;
  const portadaTexto = textoPersonalizado || (portadaClara ? '#0F172A' : (esClaro ? '#F8FAFC' : preset.texto));
  const portadaApagado = mezclarDos(portadaTexto, portadaBg, 0.36);
  const portadaLinea = mezclarDos(portadaTexto, portadaBg, 0.82);

  // Tinta de texto del cuerpo: conserva los colores exactos del preset salvo que el usuario elija un color de texto propio o invierta el modo del fondo
  const cuerpoTexto = textoPersonalizado
    || (cambioModoFondo ? (esClaro ? '#0F172A' : '#F8FAFC') : preset.texto);
  const usaCuerpoPersonalizado = !!(textoPersonalizado || cambioModoFondo);
  const cuerpoApagado = usaCuerpoPersonalizado ? mezclarDos(cuerpoTexto, fondoBase, 0.38) : preset.textoApagado;
  const cuerpoTenue = usaCuerpoPersonalizado ? mezclarDos(cuerpoTexto, fondoBase, 0.56) : preset.textoTenue;

  // Acento legible sobre portada y sobre cuerpo
  const portadaAcento = asegurarContraste(acento, portadaBg, 2.8);
  const cuerpoAcento = asegurarContraste(acento, fondoBase, 3.0);

  // Tinta sobre botones primarios con fondo = acento
  const acentoClaro = luminancia(acento) > 0.44;
  const acentoTinta = acentoClaro ? '#0A0A0F' : '#FFFFFF';
  // Si el color de acento es muy parecido al fondo (ej. botón blanco sobre fondo claro), agrega borde sutil
  const acentoBordeContraste = contrasteRatio(acento, fondoBase) < 1.35
    ? mezclar(acento, !acentoClaro, 0.35)
    : 'transparent';

  // Color de la decoración SVG (respeta el color elegido por el usuario tal cual)
  const colorSvg = svgPersonalizado || portadaAcento;
  const opCruda = t?.opacidadSvg;
  const opacidadSvg = clampNumero(opCruda, 0, 200, 100);

  // Escalas de tipografía y espaciado de secciones
  const escalaTituloPortada = clampNumero(t?.escalaTituloPortada, 60, 150, 100);
  const escalaTitulos = clampNumero(t?.escalaTitulos, 70, 140, 100);
  const escalaTexto = clampNumero(t?.escalaTexto, 85, 125, 100);
  const espaciadoSecciones = clampNumero(t?.espaciadoSecciones, 40, 170, 100);
  const espaciadoInterno = clampNumero(t?.espaciadoInterno, 60, 150, 100);

  return {
    preset,
    esClaro,
    acento,
    fondoBase,
    fondo2,
    superficie,
    superficieBorde,
    colorTexto: textoPersonalizado,
    colorSvg,
    colorFondo: fondoPersonalizado,
    colorPortada: portadaPersonalizada,
    opacidadSvg,
    portadaBg,
    portadaClara,
    portadaTexto,
    portadaApagado,
    portadaLinea,
    portadaAcento,
    cuerpoTexto,
    cuerpoApagado,
    cuerpoTenue,
    cuerpoAcento,
    acentoTinta,
    acentoBordeContraste,
    escalaTituloPortada,
    escalaTitulos,
    escalaTexto,
    espaciadoSecciones,
    espaciadoInterno
  };
};

// Actualiza únicamente las variables CSS de tamaños tipográficos y espaciados
// sin tocar ni recalcular ningún color del documento.
export const aplicarEscalasTema = (doc, t) => {
  if (!doc) return;
  const escalaTituloPortada = clampNumero(t?.escalaTituloPortada, 60, 150, 100);
  const escalaTitulos = clampNumero(t?.escalaTitulos, 70, 140, 100);
  const escalaTexto = clampNumero(t?.escalaTexto, 85, 125, 100);
  const espaciadoSecciones = clampNumero(t?.espaciadoSecciones, 40, 170, 100);
  const espaciadoInterno = clampNumero(t?.espaciadoInterno, 60, 150, 100);
  doc.style.setProperty('--escala-titulo-portada', (escalaTituloPortada / 100).toFixed(3));
  doc.style.setProperty('--escala-titulos', (escalaTitulos / 100).toFixed(3));
  doc.style.setProperty('--escala-texto', (escalaTexto / 100).toFixed(3));
  doc.style.setProperty('--escala-espaciado', (espaciadoSecciones / 100).toFixed(3));
  doc.style.setProperty('--escala-espaciado-interno', (espaciadoInterno / 100).toFixed(3));
};

// Aplica las variables CSS del tema elegido sobre el contenedor #documento (.doc)
export const aplicarTema = (doc, t) => {
  if (!doc) return;
  const col = resolverColoresTema(t);
  const { preset, esClaro, acento } = col;
  const [r, g, b] = hexARgb(acento);
  const ft = t?.fuenteTitulos || preset.fuenteTitulos || 'Bebas Neue';
  const fc = t?.fuenteCuerpo || preset.fuenteCuerpo || 'Montserrat';
  cargarFuente(ft);
  cargarFuente(fc);

  const vars = {
    '--dorado': acento,
    '--dorado-claro': mezclar(acento, true, 0.3),
    '--dorado-papel': col.cuerpoAcento,
    '--dorado-lectura': col.cuerpoAcento,
    '--dorado-tenue': `rgba(${r}, ${g}, ${b}, ${esClaro ? 0.32 : 0.28})`,
    '--dorado-fondo': `rgba(${r}, ${g}, ${b}, ${esClaro ? 0.09 : 0.08})`,
    '--acento-tinta': col.acentoTinta,
    '--acento-borde-contraste': col.acentoBordeContraste,
    '--negro': col.fondoBase,
    '--negro-2': col.fondo2,
    '--superficie': col.superficie,
    '--superficie-borde': col.superficieBorde,
    '--marfil': col.cuerpoTexto,
    '--marfil-apagado': col.cuerpoApagado,
    '--marfil-tenue': col.cuerpoTenue,
    '--papel': esClaro ? col.fondoBase : '#FAF7F2',
    '--tinta': esClaro ? col.cuerpoTexto : '#17161B',
    '--tinta-suave': esClaro ? col.cuerpoApagado : '#5A564E',
    '--tinta-tenue': esClaro ? col.cuerpoTenue : '#8C867B',
    '--linea-papel': esClaro ? col.superficie : '#E5DFD3',
    '--portada-fondo': col.portadaBg,
    '--portada-texto': col.portadaTexto,
    '--portada-apagado': col.portadaApagado,
    '--portada-linea': col.portadaLinea,
    '--portada-superficie': col.portadaClara ? 'rgba(15, 23, 42, 0.035)' : 'rgba(0, 0, 0, 0.22)',
    '--portada-acento': col.portadaAcento,
    '--portada-acento-claro': mezclar(col.portadaAcento, !col.portadaClara, 0.25),
    '--portada-borde': col.portadaClara ? col.portadaLinea : `rgba(${r}, ${g}, ${b}, 0.32)`,
    '--portada-svg-color': col.colorSvg,
    '--svg-opacidad': (col.opacidadSvg / 100).toFixed(2),
    '--fuente-display': `'${ft}', Georgia, serif`,
    '--fuente-texto': `'${fc}', system-ui, sans-serif`
  };
  Object.entries(vars).forEach(([k, v]) => doc.style.setProperty(k, v));
  aplicarEscalasTema(doc, t);
  doc.dataset.tema = t?.preset || 'elegante-oscuro';
  doc.dataset.modo = esClaro ? 'claro' : 'oscuro';
  doc.dataset.portada = PORTADAS[t?.portada] ? t.portada : (preset.portada || 'editorial');
  doc.dataset.decoracion = DECORACIONES[t?.decoracion] ? t.decoracion : (preset.decoracion || 'marco');
  doc.dataset.estilo = ESTILOS_BLOQUES[t?.estilo] ? t.estilo : (preset.estilo || 'editorial');
};
