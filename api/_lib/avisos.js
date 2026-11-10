// Avisos al dueño (Pro): cuando su cliente abre la propuesta por primera vez y cuando la
// acepta. Van por email con Resend (RESEND_API_KEY) y como notificación push a los
// dispositivos donde las activó (ver push.js). Sin las claves no se manda nada.
// Un aviso que falla nunca rompe la visita ni la aceptación: solo queda en el log.
import { esPro } from '../../src/planes.js';
import { dinero, texto } from '../../src/lib/formato.js';
import { enviarPush as enviarPushReal } from './push.js';

const escapar = s => texto(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const datosDe = propuesta => {
  const p = propuesta?.payload || {};
  return {
    titulo: texto(p.propuesta?.titulo).trim() || texto(propuesta?.title).trim() || 'tu propuesta',
    cliente: texto(p.cliente?.nombre).trim() || texto(p.cliente?.empresa).trim() || texto(propuesta?.clientName).trim()
  };
};

const plantilla = ({ titular, parrafos, boton, url }) => `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#F4F1EA;font-family:Arial,Helvetica,sans-serif;color:#1F1D1A">
  <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:14px;padding:28px">
    <p style="margin:0 0 18px;font-size:13px;font-weight:700;letter-spacing:.08em;color:#B45309">DEALIT</p>
    <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3">${titular}</h1>
    ${parrafos.map(p => `<p style="margin:0 0 12px;font-size:15px;line-height:1.55">${p}</p>`).join('')}
    <p style="margin:22px 0 0"><a href="${escapar(url)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#1F1D1A;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px">${boton}</a></p>
  </div>
  <p style="max-width:520px;margin:14px auto 0;font-size:12px;color:#77716A;text-align:center">Recibís este aviso porque tenés Dealit Pro.</p>
</body></html>`;

// Asunto, HTML y texto plano de cada aviso. Puro: se testea sin red.
export const contenidoAviso = ({ tipo, id, propuesta, aceptacion, urlApp }) => {
  const { titulo, cliente } = datosDe(propuesta);
  const url = `${urlApp}/propuesta/${encodeURIComponent(id)}`;
  if (tipo === 'aceptada') {
    const nombre = texto(aceptacion?.nombre).trim() || cliente || 'Tu cliente';
    const moneda = aceptacion?.moneda || 'USD';
    const inicial = Number(aceptacion?.inicial) || 0;
    const mensual = Number(aceptacion?.mensual) || 0;
    const total = `${dinero(inicial, moneda)}${mensual > 0 ? ` + ${dinero(mensual, moneda)} por mes` : ''}`;
    const opcionales = (aceptacion?.opcionales || []).map(o => texto(o.nombre)).filter(Boolean);
    const lineas = [
      `${nombre} aceptó «${titulo}».`,
      `Total aceptado: ${total}.`,
      ...(opcionales.length ? [`Sumó: ${opcionales.join(', ')}.`] : []),
      'Escribile para arrancar mientras está entusiasmado.'
    ];
    return {
      asunto: `🎉 ${nombre} aceptó «${titulo}»`,
      html: plantilla({
        titular: `¡${escapar(nombre)} aceptó tu propuesta!`,
        parrafos: [
          `Aceptó <strong>«${escapar(titulo)}»</strong>.`,
          `Total aceptado: <strong>${escapar(total)}</strong>.`,
          ...(opcionales.length ? [`Sumó: ${escapar(opcionales.join(', '))}.`] : []),
          'Escribile para arrancar mientras está entusiasmado.'
        ],
        boton: 'Ver la propuesta',
        url
      }),
      texto: `${lineas.join('\n')}\n\n${url}`
    };
  }
  const quien = cliente || 'Tu cliente';
  return {
    asunto: `${quien} abrió «${titulo}»`,
    html: plantilla({
      titular: `${escapar(quien)} está mirando tu propuesta`,
      parrafos: [
        `Abrió <strong>«${escapar(titulo)}»</strong> por primera vez.`,
        'Es un buen momento para escribirle: la tiene fresca y puede tener preguntas.'
      ],
      boton: 'Ver la propuesta',
      url
    }),
    texto: `${quien} abrió «${titulo}» por primera vez. Es un buen momento para escribirle.\n\n${url}`
  };
};

// Notificación push del mismo aviso: corta, para la pantalla bloqueada. Pura.
export const contenidoPush = ({ tipo, id, propuesta, aceptacion, urlApp }) => {
  const { titulo, cliente } = datosDe(propuesta);
  const url = `${urlApp}/propuesta/${encodeURIComponent(id)}`;
  const tag = `${tipo}-${id}`;
  if (tipo === 'aceptada') {
    const nombre = texto(aceptacion?.nombre).trim() || cliente || 'Tu cliente';
    const moneda = aceptacion?.moneda || 'USD';
    const inicial = Number(aceptacion?.inicial) || 0;
    const mensual = Number(aceptacion?.mensual) || 0;
    const total = `${dinero(inicial, moneda)}${mensual > 0 ? ` + ${dinero(mensual, moneda)} por mes` : ''}`;
    return { titulo: `🎉 ${nombre} aceptó «${titulo}»`, cuerpo: `Total aceptado: ${total}. Escribile para arrancar.`, url, tag };
  }
  const quien = cliente || 'Tu cliente';
  return { titulo: `${quien} abrió «${titulo}»`, cuerpo: 'La está mirando ahora: buen momento para escribirle.', url, tag };
};

export const enviarEmail = async ({ para, asunto, html, texto: plano }, { entorno = process.env, fetchFn = fetch } = {}) => {
  if (!entorno.RESEND_API_KEY) return false;
  const r = await fetchFn('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${entorno.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: entorno.EMAIL_REMITENTE || 'Dealit <onboarding@resend.dev>',
      to: [para],
      subject: asunto,
      html,
      text: plano
    }),
    signal: AbortSignal.timeout(5000)
  });
  if (!r.ok) throw new Error(`Resend respondió ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return true;
};

// Avisa al dueño de la propuesta si le corresponde (Pro, o los planes apagados para su cuenta):
// por email y por push a la vez. Devuelve cómo le fue al email.
export const crearAvisador = ({ db, planesActivos, enviar = enviarEmail, enviarPush = enviarPushReal }) => async ({ tipo, id, propuesta, aceptacion, urlApp }) => {
  try {
    const uid = propuesta?.userId;
    if (!uid) return 'sin-duenio';
    const [snapUsuario, snapPlan] = await Promise.all([
      db().collection('users').doc(uid).get(),
      db().collection('planes').doc(uid).get()
    ]);
    const email = snapUsuario.exists ? texto(snapUsuario.data()?.email).trim() : '';
    const plan = snapPlan.exists ? snapPlan.data() : {};
    if (!esPro(plan) && planesActivos(email)) return 'gratis';
    const datos = { tipo, id, propuesta, aceptacion, urlApp };
    const [porEmail, porPush] = await Promise.allSettled([
      email ? enviar({ para: email, ...contenidoAviso(datos) }) : Promise.resolve(null),
      enviarPush({ db, uid, mensaje: contenidoPush(datos) })
    ]);
    if (porPush.status === 'rejected') console.error(`No se pudo mandar el aviso «${tipo}» por push:`, porPush.reason?.message);
    if (!email) return 'sin-email';
    if (porEmail.status === 'rejected') throw porEmail.reason;
    return porEmail.value ? 'enviado' : 'sin-clave';
  } catch (e) {
    console.error(`No se pudo mandar el aviso «${tipo}» por email:`, e.message);
    return 'error';
  }
};

export const urlAppDe = req => process.env.APP_URL || `https://${req?.headers?.host || 'dealit.com.ar'}`;
