// Firma del cliente al aceptar (opcional, la pide el dueño con «opciones.firmaCliente»).
// Se guarda como trazo vectorial: un `d` de SVG con números enteros en un lienzo de
// FIRMA_ANCHO × FIRMA_ALTO. Pesa poco, se ve nítida en el link y en el PDF, y como solo se
// aceptan comandos M, L y Q con números, es seguro insertarla en el HTML tal cual.
// Lo usan la app (para armarla y mostrarla) y el servidor (api/aceptar, para validarla).

export const FIRMA_ANCHO = 600;
export const FIRMA_ALTO = 200;
export const FIRMA_MAX = 40000;
// Menos puntos que esto es un toque, no una firma.
const PUNTOS_MIN = 8;

const NUM = '\\d{1,3}';
const PAR = `${NUM} ${NUM}`;
const FORMATO = new RegExp(`^M${PAR}(?: (?:M${PAR}|L${PAR}|Q${PAR} ${PAR}))*$`);

// Si la propuesta pide la firma del cliente al aceptar.
export const pideFirma = contenido => contenido?.opciones?.firmaCliente === true;

// Devuelve el trazo si es válido, o '' si no.
export const validarFirma = trazo => {
  if (typeof trazo !== 'string' || trazo.length > FIRMA_MAX || !FORMATO.test(trazo)) return '';
  const numeros = trazo.match(/\d+/g).map(Number);
  for (let i = 0; i < numeros.length; i += 2) {
    if (numeros[i] > FIRMA_ANCHO || numeros[i + 1] > FIRMA_ALTO) return '';
  }
  return numeros.length / 2 >= PUNTOS_MIN ? trazo : '';
};

const redondear = (v, max) => Math.min(max, Math.max(0, Math.round(v)));

// trazos: [[{x, y}, …], …] en coordenadas del lienzo lógico. Une los puntos con curvas
// (por los puntos medios) para que el trazo no quede quebrado.
export const trazosAFirma = trazos => {
  const partes = [];
  for (const trazo of trazos || []) {
    const pts = trazo.map(p => [redondear(p.x, FIRMA_ANCHO), redondear(p.y, FIRMA_ALTO)]);
    if (!pts.length) continue;
    partes.push(`M${pts[0][0]} ${pts[0][1]}`);
    if (pts.length === 1) { partes.push(`L${pts[0][0]} ${pts[0][1]}`); continue; }
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i];
      const [nx, ny] = pts[i + 1];
      partes.push(`Q${x} ${y} ${Math.round((x + nx) / 2)} ${Math.round((y + ny) / 2)}`);
    }
    const ultimo = pts[pts.length - 1];
    partes.push(`L${ultimo[0]} ${ultimo[1]}`);
  }
  return partes.join(' ');
};

// SVG de la firma, con el color del texto donde se muestra. '' si el trazo no es válido.
export const firmaSVG = (trazo, { titulo = 'Firma del cliente' } = {}) => {
  const d = validarFirma(trazo);
  if (!d) return '';
  const t = String(titulo).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
  return `<svg class="firma-trazo" viewBox="0 0 ${FIRMA_ANCHO} ${FIRMA_ALTO}" role="img" aria-label="${t}" preserveAspectRatio="xMidYMid meet"><path d="${d}" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
};
