// Cliente de Claude (Anthropic) para las funciones de /api. La clave va en la variable de
// entorno ANTHROPIC_API_KEY de Vercel, nunca en el repo.
import Anthropic from '@anthropic-ai/sdk';
import { ErrorHttp } from './http.js';

// Se puede cambiar sin tocar código con la variable IA_MODELO (por ejemplo, un modelo más
// económico para empezar). Por defecto, el más capaz de la línea Opus.
export const MODELO_IA = process.env.IA_MODELO || 'claude-opus-5-5';
// Modelos que aceptan el respaldo automático del servidor de Anthropic ante un rechazo.
const CON_FALLBACK = ['claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5', 'claude-fable-5-1', 'claude-fable-5-2'];

let cliente = null;
const clienteClaude = () => {
  // Un timeout menor que el de la función de Vercel (60 s), con un reintento.
  cliente ??= new Anthropic({ timeout: 50_000, maxRetries: 1 });
  return cliente;
};

// Pide una respuesta en JSON que cumple el esquema (structured outputs) y la devuelve ya
// parseada. Si el modelo declina, el servidor de Anthropic reintenta con otro modelo
// (fallbacks «default»); si igual no hay respuesta útil, se corta con un error claro.
export const generarJSON = async ({ sistema, mensaje, esquema }) => {
  if (!process.env.ANTHROPIC_API_KEY) throw new ErrorHttp(503, 'ia-no-configurada');
  let respuesta;
  try {
    const conFallback = CON_FALLBACK.includes(MODELO_IA);
    respuesta = await clienteClaude().beta.messages.create({
      model: MODELO_IA,
      max_tokens: 16000,
      ...(conFallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: esquema } },
      system: sistema,
      messages: [{ role: 'user', content: mensaje }]
    });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) throw new ErrorHttp(503, 'ia-ocupada');
    if (e instanceof Anthropic.APIError) {
      console.error('Claude respondió con error:', e.status, e.message);
      throw new ErrorHttp(502, 'ia-error');
    }
    throw e;
  }
  if (respuesta.stop_reason === 'refusal') throw new ErrorHttp(422, 'ia-rechazo');
  if (respuesta.stop_reason === 'max_tokens') throw new ErrorHttp(422, 'ia-incompleta');
  const bloque = respuesta.content.find(b => b.type === 'text');
  try {
    return JSON.parse(bloque?.text || '');
  } catch {
    throw new ErrorHttp(502, 'ia-error');
  }
};
