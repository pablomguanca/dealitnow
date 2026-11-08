// Llamadas a las funciones de /api. Si hay sesión, se identifica con su token: así el
// servidor sabe quién es (para no contar visitas propias, aplicar el plan, etc.).

import { AteneaDB } from './contexto.js';

export const llamarApi = async (ruta, cuerpo, { keepalive = false } = {}) => {
  const token = AteneaDB ? await AteneaDB.auth.tokenDeSesion().catch(() => null) : null;
  const respuesta = await fetch(ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(cuerpo),
    keepalive
  });
  if (!respuesta.ok) {
    const codigo = await respuesta.json().then(r => r.error).catch(() => null);
    throw Object.assign(new Error(codigo || `HTTP ${respuesta.status}`), { codigo, estado: respuesta.status });
  }
  return respuesta.status === 204 ? null : respuesta.json();
};
