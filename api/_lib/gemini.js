// Cliente de Gemini (Google AI Studio) para las funciones de /api. La clave se saca en
// aistudio.google.com y va en la variable de entorno GEMINI_API_KEY de Vercel, nunca en el
// repo. Se llama a la API REST con fetch (generateContent), sin SDK.
import { ErrorHttp } from './http.js';

// Por defecto Gemini 3.5 Flash-Lite: rápido y el más económico, alcanza para armar una
// propuesta a partir de lo dictado. Se puede cambiar sin tocar código con IA_MODELO
// (por ejemplo, gemini-3.8-flash si hiciera falta más calidad).
export const MODELO_IA = process.env.IA_MODELO || 'gemini-3.5-flash-lite';
const API = 'https://generativelanguage.googleapis.com/v1beta/models';
// Menor que el límite de la función de Vercel (60 s).
const TIMEOUT_MS = 50_000;

export const iaConfigurada = () => !!process.env.GEMINI_API_KEY;

const llamar = async cuerpo => {
  const res = await fetch(`${API}/${encodeURIComponent(MODELO_IA)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (res.ok) return res.json();
  if (res.status === 429 || res.status === 503) throw new ErrorHttp(503, 'ia-ocupada');
  console.error('Gemini respondió con error:', res.status, (await res.text().catch(() => '')).slice(0, 500));
  throw new ErrorHttp(502, 'ia-error');
};

// Pide una respuesta en JSON que cumple el esquema (structured output) y la devuelve ya
// parseada. Un reintento si la API está ocupada o se cae; si el modelo bloquea la
// respuesta o se queda sin espacio, se corta con un error claro.
export const generarJSON = async ({ sistema, mensaje, esquema }) => {
  if (!iaConfigurada()) throw new ErrorHttp(503, 'ia-no-configurada');
  const cuerpo = {
    systemInstruction: { parts: [{ text: sistema }] },
    contents: [{ role: 'user', parts: [{ text: mensaje }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseJsonSchema: esquema,
      maxOutputTokens: 16000
    }
  };

  let respuesta;
  try {
    try {
      respuesta = await llamar(cuerpo);
    } catch (e) {
      if (e instanceof ErrorHttp && e.estado === 502) throw e;
      respuesta = await llamar(cuerpo);
    }
  } catch (e) {
    if (e instanceof ErrorHttp) throw e;
    // Timeout o red caída.
    console.error('No se pudo llamar a Gemini:', e.message);
    throw new ErrorHttp(503, 'ia-ocupada');
  }

  if (respuesta.promptFeedback?.blockReason) throw new ErrorHttp(422, 'ia-rechazo');
  const candidato = respuesta.candidates?.[0];
  const fin = candidato?.finishReason;
  if (fin === 'MAX_TOKENS') throw new ErrorHttp(422, 'ia-incompleta');
  if (fin && fin !== 'STOP') throw new ErrorHttp(422, 'ia-rechazo');
  const texto = (candidato?.content?.parts || [])
    .filter(p => typeof p.text === 'string' && !p.thought)
    .map(p => p.text)
    .join('');
  try {
    return JSON.parse(texto);
  } catch {
    throw new ErrorHttp(502, 'ia-error');
  }
};
