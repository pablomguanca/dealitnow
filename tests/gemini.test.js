import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generarJSON } from '../api/_lib/gemini.js';

const respuestaOk = (texto, finishReason = 'STOP') => ({
  ok: true,
  status: 200,
  json: async () => ({ candidates: [{ finishReason, content: { parts: [{ text: texto }] } }] })
});
const respuestaError = status => ({ ok: false, status, text: async () => 'error' });
const pedido = { sistema: 'reglas', mensaje: 'trabajo', esquema: { type: 'object' } };

describe('generarJSON (Gemini)', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'clave-de-prueba');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sin clave avisa que la IA no está configurada', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    await expect(generarJSON(pedido)).rejects.toMatchObject({ estado: 503, codigo: 'ia-no-configurada' });
  });

  it('manda el esquema y devuelve el JSON parseado', async () => {
    const fetch = vi.fn().mockResolvedValue(respuestaOk('{"titulo":"Web"}'));
    vi.stubGlobal('fetch', fetch);
    await expect(generarJSON(pedido)).resolves.toEqual({ titulo: 'Web' });
    const [url, opciones] = fetch.mock.calls[0];
    expect(url).toMatch(/:generateContent$/);
    expect(opciones.headers['x-goog-api-key']).toBe('clave-de-prueba');
    const cuerpo = JSON.parse(opciones.body);
    expect(cuerpo.generationConfig.responseJsonSchema).toEqual({ type: 'object' });
    expect(cuerpo.systemInstruction.parts[0].text).toBe('reglas');
  });

  it('reintenta una vez si está ocupada', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(respuestaError(429)).mockResolvedValueOnce(respuestaOk('{}'));
    vi.stubGlobal('fetch', fetch);
    await expect(generarJSON(pedido)).resolves.toEqual({});
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('ocupada dos veces → ia-ocupada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaError(429)));
    await expect(generarJSON(pedido)).rejects.toMatchObject({ estado: 503, codigo: 'ia-ocupada' });
  });

  it('error de la API → ia-error, sin reintentar', async () => {
    const fetch = vi.fn().mockResolvedValue(respuestaError(400));
    vi.stubGlobal('fetch', fetch);
    await expect(generarJSON(pedido)).rejects.toMatchObject({ estado: 502, codigo: 'ia-error' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('corta si se queda sin espacio o bloquea la respuesta', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaOk('{"a":', 'MAX_TOKENS')));
    await expect(generarJSON(pedido)).rejects.toMatchObject({ codigo: 'ia-incompleta' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaOk('', 'SAFETY')));
    await expect(generarJSON(pedido)).rejects.toMatchObject({ codigo: 'ia-rechazo' });
  });
});
