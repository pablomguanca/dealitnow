import { describe, expect, it } from 'vitest';
import { comprimir, descomprimir } from '../src/link.js';
import { ejemplo } from '../src/modelo.js';

describe('links largos', () => {
  it('comprimir y descomprimir devuelven el mismo contenido', async () => {
    const original = JSON.stringify(ejemplo());
    const codigo = await comprimir(original);
    expect(codigo.startsWith('z')).toBe(true);
    expect(codigo).toMatch(/^[A-Za-z0-9_-]+$/); // seguro para URL
    expect(codigo.length).toBeLessThan(original.length);
    expect(await descomprimir(codigo)).toBe(original);
  });

  it('conserva acentos y emojis', async () => {
    const original = 'Propuesta para Café Ñandú 🌱';
    expect(await descomprimir(await comprimir(original))).toBe(original);
  });

  it('rechaza formatos desconocidos', async () => {
    await expect(descomprimir('xAAAA')).rejects.toThrow('Formato desconocido');
  });
});
