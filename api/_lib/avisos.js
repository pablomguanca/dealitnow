// Avisos al dueño: cuando su cliente acepta la propuesta, no avanza, pide un cambio o le paga
// con Mercado Pago (a todos,
// también en Gratis: es su cliente respondiendo) y, solo con Pro, cuando la abre y cuando
// está por vencer sin respuesta (tarea diaria en api/visto). Van por email con Resend (RESEND_API_KEY) y como notificación push a los
// dispositivos donde las activó (ver push.js). Sin las claves no se manda nada.
// Un aviso que falla nunca rompe la visita ni la aceptación: solo queda en el log.
import { esPro } from '../../src/planes.js';
import { dinero, texto } from '../../src/lib/formato.js';
import { MOTIVOS_RECHAZO, venceTexto } from '../../src/respuestas.js';
import { enviarPush as enviarPushReal } from './push.js';

const escapar = s => texto(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const datosDe = propuesta => {
  const p = propuesta?.payload || {};
  return {
    titulo: texto(p.propuesta?.titulo).trim() || texto(propuesta?.title).trim() || 'tu propuesta',
    cliente: texto(p.cliente?.nombre).trim() || texto(p.cliente?.empresa).trim() || texto(propuesta?.clientName).trim()
  };
};

const PIE = {
  pro: 'Recibís este aviso porque tenés Dealit Pro.',
  gratis: 'Recibís este aviso porque tu propuesta se aceptó en Dealit. Con Dealit Pro también te avisamos cada vez que tu cliente la abre.',
  respuesta: 'Recibís este aviso porque tu cliente respondió tu propuesta en Dealit.',
  pago: 'Recibís este aviso porque tu cliente te pagó con Mercado Pago desde tu propuesta en Dealit.'
};

// Quien pagó: el nombre con el que aceptó o, si no, el cliente de la propuesta.
const pagadorDe = (propuesta, cliente) => texto(propuesta?.aceptacion?.nombre).trim() || cliente || 'Tu cliente';

// Lo que escribió el cliente, recortado para el aviso.
const citar = (t, max = 280) => {
  const limpio = texto(t).trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1).trimEnd()}…` : limpio;
};

const quienResponde = (respuesta, cliente) => texto(respuesta?.nombre).trim() || cliente || 'Tu cliente';

const plantilla = ({ titular, parrafos, boton, url, pie = PIE.pro }) => `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#F4F1EA;font-family:Arial,Helvetica,sans-serif;color:#1F1D1A">
  <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:14px;padding:28px">
    <p style="margin:0 0 18px;font-size:13px;font-weight:700;letter-spacing:.08em;color:#B45309">DEALIT</p>
    <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3">${titular}</h1>
    ${parrafos.map(p => `<p style="margin:0 0 12px;font-size:15px;line-height:1.55">${p}</p>`).join('')}
    <p style="margin:22px 0 0"><a href="${escapar(url)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#1F1D1A;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px">${boton}</a></p>
  </div>
  <p style="max-width:520px;margin:14px auto 0;font-size:12px;color:#77716A;text-align:center">${pie}</p>
</body></html>`;

// Asunto, HTML y texto plano de cada aviso. Puro: se testea sin red.
export const contenidoAviso = ({ tipo, id, propuesta, aceptacion, respuesta, recordatorio, pago, urlApp, pro = true }) => {
  const { titulo, cliente } = datosDe(propuesta);
  const url = `${urlApp}/propuesta/${encodeURIComponent(id)}`;
  if (tipo === 'pago-acreditado' || tipo === 'pago-revertido') {
    const quien = pagadorDe(propuesta, cliente);
    const monto = dinero(Number(pago?.monto) || 0, pago?.moneda || 'ARS');
    const concepto = texto(pago?.concepto).trim() || 'Pago';
    if (tipo === 'pago-acreditado') {
      return {
        asunto: `💸 ${quien} te pagó ${monto} por «${titulo}»`,
        html: plantilla({
          titular: `¡Se acreditó el pago de ${escapar(quien)}!`,
          parrafos: [
            `Mercado Pago confirmó el pago de <strong>«${escapar(titulo)}»</strong>.`,
            `${escapar(concepto)}: <strong>${escapar(monto)}</strong>, en tu cuenta de Mercado Pago.`
          ],
          boton: 'Ver la propuesta',
          url,
          pie: PIE.pago
        }),
        texto: `Mercado Pago confirmó el pago de ${quien} por «${titulo}».\n${concepto}: ${monto}.\n\n${url}`
      };
    }
    const que = pago?.estado === 'contracargo' ? 'desconoció el pago ante su tarjeta (contracargo)' : 'se devolvió';
    return {
      asunto: `El pago de «${titulo}» ${pago?.estado === 'contracargo' ? 'tiene un contracargo' : 'se reembolsó'}`,
      html: plantilla({
        titular: pago?.estado === 'contracargo' ? 'Un pago tiene un contracargo' : 'Se reembolsó un pago',
        parrafos: [
          `El pago de ${escapar(quien)} por <strong>«${escapar(titulo)}»</strong> (${escapar(concepto)}: ${escapar(monto)}) ${pago?.estado === 'contracargo' ? 'fue desconocido ante la tarjeta (contracargo)' : 'se devolvió'}.`,
          'Revisá el detalle en tu cuenta de Mercado Pago.'
        ],
        boton: 'Ver la propuesta',
        url,
        pie: PIE.pago
      }),
      texto: `El pago de ${quien} por «${titulo}» (${concepto}: ${monto}) ${que}.\nRevisá el detalle en tu cuenta de Mercado Pago.\n\n${url}`
    };
  }
  if (tipo === 'rechazada') {
    const quien = quienResponde(respuesta, cliente);
    const motivo = MOTIVOS_RECHAZO[respuesta?.motivo] || 'Otro motivo';
    const comentario = citar(respuesta?.comentario);
    const cierre = 'Si le podés ofrecer otra opción, todavía la puede aceptar desde el mismo link.';
    return {
      asunto: `${quien} no avanza por ahora con «${titulo}»`,
      html: plantilla({
        titular: `${escapar(quien)} no avanza por ahora`,
        parrafos: [
          `Respondió <strong>«${escapar(titulo)}»</strong>.`,
          `Motivo: <strong>${escapar(motivo)}</strong>.`,
          ...(comentario ? [`«${escapar(comentario)}»`] : []),
          cierre
        ],
        boton: 'Ver la propuesta',
        url,
        pie: PIE.respuesta
      }),
      texto: `${quien} no avanza por ahora con «${titulo}».\nMotivo: ${motivo}.${comentario ? `\n«${comentario}»` : ''}\n${cierre}\n\n${url}`
    };
  }
  if (tipo === 'cambio') {
    const quien = quienResponde(respuesta, cliente);
    const pedido = citar(respuesta?.texto, 600);
    return {
      asunto: `${quien} te pidió un cambio en «${titulo}»`,
      html: plantilla({
        titular: `${escapar(quien)} te pidió un cambio`,
        parrafos: [
          `En <strong>«${escapar(titulo)}»</strong>:`,
          `«${escapar(pedido).replace(/\n/g, '<br>')}»`,
          'Ajustala y volvé a compartirle el link: que pida cambios es señal de que le interesa.'
        ],
        boton: 'Abrir la propuesta',
        url,
        pie: PIE.respuesta
      }),
      texto: `${quien} te pidió un cambio en «${titulo}»:\n«${pedido}»\n\n${url}`
    };
  }
  if (tipo === 'por-vencer') {
    const quien = cliente || 'Tu cliente';
    const cuando = venceTexto(recordatorio?.vence, recordatorio?.quedan);
    const vistas = Number(recordatorio?.vistas) || 0;
    const estado = vistas > 0
      ? `${quien} la abrió ${vistas === 1 ? 'una vez' : `${vistas} veces`} y todavía no respondió.`
      : `${quien} todavía no la abrió.`;
    return {
      asunto: `«${titulo}» vence ${cuando}`,
      html: plantilla({
        titular: `«${escapar(titulo)}» vence ${escapar(cuando)}`,
        parrafos: [
          escapar(estado),
          'Es un buen momento para escribirle: en la propuesta tenés un mensaje listo para mandarle.'
        ],
        boton: 'Recordarle',
        url,
        pie: PIE.pro
      }),
      texto: `«${titulo}» vence ${cuando}. ${estado}\nEs un buen momento para escribirle.\n\n${url}`
    };
  }
  if (tipo === 'aceptada') {
    const nombre = texto(aceptacion?.nombre).trim() || cliente || 'Tu cliente';
    const moneda = aceptacion?.moneda || 'USD';
    const inicial = Number(aceptacion?.inicial) || 0;
    const mensual = Number(aceptacion?.mensual) || 0;
    const total = `${dinero(inicial, moneda)}${mensual > 0 ? ` + ${dinero(mensual, moneda)} por mes` : ''}`;
    const opcionales = (aceptacion?.opcionales || []).map(o => texto(o.nombre)).filter(Boolean);
    const firmo = !!aceptacion?.firma;
    const lineas = [
      `${nombre} aceptó «${titulo}»${firmo ? ' y la firmó' : ''}.`,
      `Total aceptado: ${total}.`,
      ...(opcionales.length ? [`Sumó: ${opcionales.join(', ')}.`] : []),
      'Escribile para arrancar mientras está entusiasmado.'
    ];
    return {
      asunto: `🎉 ${nombre} aceptó «${titulo}»`,
      html: plantilla({
        titular: `¡${escapar(nombre)} aceptó tu propuesta!`,
        parrafos: [
          `Aceptó <strong>«${escapar(titulo)}»</strong>${firmo ? ' y la firmó online' : ''}.`,
          `Total aceptado: <strong>${escapar(total)}</strong>.`,
          ...(opcionales.length ? [`Sumó: ${escapar(opcionales.join(', '))}.`] : []),
          'Escribile para arrancar mientras está entusiasmado.'
        ],
        boton: 'Ver la propuesta',
        url,
        pie: pro ? PIE.pro : PIE.gratis
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
export const contenidoPush = ({ tipo, id, propuesta, aceptacion, respuesta, recordatorio, pago, urlApp, vistas }) => {
  const { titulo, cliente } = datosDe(propuesta);
  const url = `${urlApp}/propuesta/${encodeURIComponent(id)}`;
  // Cada visita con su propia etiqueta: si reemplazara al aviso anterior de la propuesta,
  // Android lo actualiza en silencio (sin sonido ni cartel) y parece que no llegó.
  const tag = tipo === 'revisita' ? `vista-${id}-${Number(vistas) || Date.now()}` : `${tipo}-${id}`;
  if (tipo === 'pago-acreditado' || tipo === 'pago-revertido') {
    const monto = dinero(Number(pago?.monto) || 0, pago?.moneda || 'ARS');
    const concepto = texto(pago?.concepto).trim() || 'Pago';
    if (tipo === 'pago-acreditado') return { titulo: `💸 ${pagadorDe(propuesta, cliente)} te pagó ${monto}`, cuerpo: `${concepto} de «${titulo}», acreditado en Mercado Pago.`, url, tag };
    return { titulo: `El pago de «${titulo}» ${pago?.estado === 'contracargo' ? 'tiene un contracargo' : 'se reembolsó'}`, cuerpo: `${concepto}: ${monto}. Revisá tu Mercado Pago.`, url, tag };
  }
  if (tipo === 'aceptada') {
    const nombre = texto(aceptacion?.nombre).trim() || cliente || 'Tu cliente';
    const moneda = aceptacion?.moneda || 'USD';
    const inicial = Number(aceptacion?.inicial) || 0;
    const mensual = Number(aceptacion?.mensual) || 0;
    const total = `${dinero(inicial, moneda)}${mensual > 0 ? ` + ${dinero(mensual, moneda)} por mes` : ''}`;
    return { titulo: `🎉 ${nombre} aceptó «${titulo}»`, cuerpo: `Total aceptado: ${total}. Escribile para arrancar.`, url, tag };
  }
  if (tipo === 'rechazada') {
    return { titulo: `${quienResponde(respuesta, cliente)} no avanza por ahora con «${titulo}»`, cuerpo: `Motivo: ${MOTIVOS_RECHAZO[respuesta?.motivo] || 'Otro motivo'}.`, url, tag };
  }
  if (tipo === 'cambio') {
    return { titulo: `${quienResponde(respuesta, cliente)} te pidió un cambio en «${titulo}»`, cuerpo: citar(respuesta?.texto, 140), url, tag: `cambio-${id}-${Date.now()}` };
  }
  if (tipo === 'por-vencer') {
    const vistas = Number(recordatorio?.vistas) || 0;
    return {
      titulo: `«${titulo}» vence ${venceTexto(recordatorio?.vence, recordatorio?.quedan)}`,
      cuerpo: `${cliente || 'Tu cliente'} ${vistas > 0 ? 'la abrió y no respondió' : 'todavía no la abrió'}. Recordale.`,
      url,
      tag
    };
  }
  const quien = cliente || 'Tu cliente';
  if (tipo === 'revisita') {
    const veces = Number(vistas) > 1 ? ` Ya la abrió ${Number(vistas)} veces.` : '';
    return { titulo: `${quien} volvió a abrir «${titulo}»`, cuerpo: `La está mirando ahora.${veces}`, url, tag };
  }
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

// Avisa al dueño de la propuesta si le corresponde, por email y por push a la vez: la
// aceptación, a todos; las visitas, solo con Pro (o con los planes apagados para su cuenta). Devuelve cómo le fue al email.
// Las revisitas van solo por push: un email cada vez que el cliente abre el link sería demasiado.
const SOLO_PUSH = new Set(['revisita']);
const PARA_TODOS = new Set(['aceptada', 'rechazada', 'cambio', 'pago-acreditado', 'pago-revertido']);

export const crearAvisador = ({ db, planesActivos, enviar = enviarEmail, enviarPush = enviarPushReal }) => async ({ tipo, id, propuesta, aceptacion, respuesta, recordatorio, pago, urlApp, vistas }) => {
  try {
    const uid = propuesta?.userId;
    if (!uid) return 'sin-duenio';
    const [snapUsuario, snapPlan] = await Promise.all([
      db().collection('users').doc(uid).get(),
      db().collection('planes').doc(uid).get()
    ]);
    const email = snapUsuario.exists ? texto(snapUsuario.data()?.email).trim() : '';
    const plan = snapPlan.exists ? snapPlan.data() : {};
    const pro = esPro(plan) || !planesActivos(email);
    if (!pro && !PARA_TODOS.has(tipo)) return 'gratis';
    const datos = { tipo, id, propuesta, aceptacion, respuesta, recordatorio, pago, urlApp, vistas, pro };
    const conEmail = email && !SOLO_PUSH.has(tipo);
    const [porEmail, porPush] = await Promise.allSettled([
      conEmail ? enviar({ para: email, ...contenidoAviso(datos) }) : Promise.resolve(null),
      enviarPush({ db, uid, mensaje: contenidoPush(datos) })
    ]);
    if (porPush.status === 'rejected') console.error(`No se pudo mandar el aviso «${tipo}» por push:`, porPush.reason?.message);
    if (SOLO_PUSH.has(tipo)) return porPush.status === 'fulfilled' ? 'push' : 'error';
    if (!email) return 'sin-email';
    if (porEmail.status === 'rejected') throw porEmail.reason;
    return porEmail.value ? 'enviado' : 'sin-clave';
  } catch (e) {
    console.error(`No se pudo mandar el aviso «${tipo}» por email:`, e.message);
    return 'error';
  }
};

export const urlAppDe = req => process.env.APP_URL || `https://${req?.headers?.host || 'dealit.com.ar'}`;
