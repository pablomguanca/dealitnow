import { describe, expect, it } from 'vitest';
import { FIRMA_MAX, firmaSVG, pideFirma, trazosAFirma, validarFirma } from '../src/firma.js';
import { normalizarPropuesta, vacio } from '../src/modelo.js';

const trazo = (n = 12, desde = 10) => Array.from({ length: n }, (_, i) => ({ x: desde + i * 20, y: 80 + (i % 3) * 15 }));

describe('trazosAFirma', () => {
  it('arma un path con curvas y enteros, recortado al lienzo', () => {
    const d = trazosAFirma([[{ x: -5, y: 10.4 }, { x: 50, y: 60 }, { x: 900, y: 300 }]]);
    expect(d).toBe('M0 10 Q50 60 325 130 L600 200');
  });

  it('un toque suelto queda como un punto', () => {
    expect(trazosAFirma([[{ x: 5, y: 5 }]])).toBe('M5 5 L5 5');
  });

  it('varios trazos van separados', () => {
    expect(trazosAFirma([trazo(2), trazo(2, 300)]).match(/M/g)).toHaveLength(2);
  });
});

describe('validarFirma', () => {
  it('acepta una firma armada en la app', () => {
    const d = trazosAFirma([trazo(), trazo(6, 200)]);
    expect(validarFirma(d)).toBe(d);
  });

  it('rechaza lo que no es un trazo seguro', () => {
    expect(validarFirma(undefined)).toBe('');
    expect(validarFirma('')).toBe('');
    expect(validarFirma('M1 1 L2 2" onload="x')).toBe('');
    expect(validarFirma('M1 1 C2 2 3 3 4 4')).toBe('');
    expect(validarFirma('M1 1 L999 2')).toBe('');
    expect(validarFirma('M1 1 L2 2'.padEnd(FIRMA_MAX + 1, ' L2 2'))).toBe('');
  });

  it('un toque no alcanza para firmar', () => {
    expect(validarFirma('M5 5 L5 5')).toBe('');
  });
});

describe('firmaSVG', () => {
  it('devuelve el SVG solo con una firma válida', () => {
    const d = trazosAFirma([trazo()]);
    expect(firmaSVG(d, { titulo: 'Firma de <Ana>' })).toContain(`d="${d}"`);
    expect(firmaSVG(d, { titulo: 'Firma de <Ana>' })).toContain('Firma de &#60;Ana&#62;');
    expect(firmaSVG('nada')).toBe('');
  });
});

describe('pideFirma', () => {
  it('está apagada por defecto y la prende el dueño', () => {
    expect(pideFirma(normalizarPropuesta(vacio()))).toBe(false);
    expect(pideFirma(normalizarPropuesta({ ...vacio(), opciones: { firmaCliente: true } }))).toBe(true);
    expect(pideFirma(normalizarPropuesta({ ...vacio(), opciones: { firmaCliente: 'si' } }))).toBe(false);
  });
});
