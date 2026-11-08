// Mercado Pago Suscripciones para las funciones de Vercel. El Access Token y la clave
// secreta del webhook vienen de variables de entorno (MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET):
// nunca van al repo. Los datos de tarjetas nunca pasan por Dealit: se paga en Mercado Pago.
import { createHmac, timingSafeEqual } from 'node:crypto';

const API = 'https://api.mercadopago.com';

const token = () => {
  const t = process.env.MP_ACCESS_TOKEN;
  if (!t) throw new Error('Falta la variable de entorno MP_ACCESS_TOKEN');
  return t;
};

const llamar = async (ruta, { method = 'GET', body } = {}) => {
  const respuesta = await fetch(`${API}${ruta}`, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw Object.assign(new Error(`Mercado Pago ${respuesta.status}: ${datos?.message || 'sin detalle'}`), { estado: respuesta.status, datos });
  }
  return datos;
};

// Suscripción sin plan asociado y con pago pendiente: Mercado Pago devuelve el link
// (init_point) donde la persona carga su medio de pago.
export const crearSuscripcion = datos => llamar('/preapproval', { method: 'POST', body: datos });
export const obtenerSuscripcion = id => llamar(`/preapproval/${encodeURIComponent(id)}`);
export const obtenerPagoDeSuscripcion = id => llamar(`/authorized_payments/${encodeURIComponent(id)}`);

// Verifica la firma de un aviso (encabezado x-signature: «ts=…,v1=…»). Sin firma válida,
// el aviso se descarta: así nadie puede falsificar un «pagó».
export const firmaValida = ({ firma, idSolicitud, idDato, secreto = process.env.MP_WEBHOOK_SECRET }) => {
  if (!secreto || !firma || !idDato) return false;
  const partes = Object.fromEntries(String(firma).split(',').map(p => p.trim().split('=').map(x => x.trim())));
  if (!partes.ts || !partes.v1) return false;
  // Mercado Pago firma el id del dato en minúsculas si es alfanumérico.
  const id = /^[a-z0-9]+$/i.test(idDato) ? String(idDato).toLowerCase() : String(idDato);
  const manifiesto = `id:${id};${idSolicitud ? `request-id:${idSolicitud};` : ''}ts:${partes.ts};`;
  const esperado = createHmac('sha256', secreto).update(manifiesto).digest('hex');
  const a = Buffer.from(esperado);
  const b = Buffer.from(String(partes.v1));
  return a.length === b.length && timingSafeEqual(a, b);
};
