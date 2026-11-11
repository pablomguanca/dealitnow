// Pantalla «Resultados» (/resultados). Los números salen de src/resultados.js; acá se
// dibujan. En Gratis se ve lo ganado y la conversión; el seguimiento (aperturas, a quién
// escribirle hoy, cuándo abren) es Pro y se muestra bloqueado con lo que hay detrás.

import { $, $$, esc, dinero, fechaLarga } from '../lib/formato.js';
import { calcularResultados, fechaDe, FRANJAS } from '../resultados.js';
import { ctx } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { cerrarEdicion, irRuta, mostrarVista } from './navegacion.js';
import { restriccionesActivas } from './plan.js';
import { linkCorto } from './compartir.js';
import { calcularVigencia } from '../lib/render.js';

let periodo = 'mes';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const porcentaje = v => (v === null ? '—' : `${Math.round(v * 100)} %`);
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Montos grandes en el eje y las etiquetas: 1.250.000 → 1,3 M.
const compacto = (n, moneda) => {
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda, notation: 'compact', maximumFractionDigits: 1 }).format(n);
  } catch {
    return dinero(n, moneda);
  }
};

const insignia = '<span class="insignia-pro">PRO</span>';

const bloqueadoHTML = (titulo, gancho) => `
  <button type="button" class="res-bloqueado" data-accion="ofrecer-pro" data-motivo="seguimiento">
    <span class="res-bloqueado__titulo">${esc(titulo)} ${insignia}</span>
    <span class="res-bloqueado__gancho">${esc(gancho)}</span>
    <span class="res-bloqueado__accion">Ver con Pro →</span>
  </button>`;

const tarjeta = (titulo, cuerpo, { clase = '', ayuda = '' } = {}) => `
  <section class="res-tarjeta ${clase}">
    <h2 class="res-tarjeta__titulo">${titulo}</h2>
    ${ayuda ? `<p class="res-tarjeta__ayuda">${esc(ayuda)}</p>` : ''}
    ${cuerpo}
  </section>`;

// --- Cabecera: lo ganado y las cifras que lo explican ---
const cifrasHTML = r => {
  const [principal, ...otras] = r.ganado;
  const mensual = r.mensual.map(m => `${dinero(m.total, m.moneda)} por mes`).join(' · ');
  const cifra = (valor, etiqueta, detalle) => `
    <div class="res-cifra">
      <span class="res-cifra__valor">${esc(valor)}</span>
      <span class="res-cifra__etiqueta">${esc(etiqueta)}</span>
      ${detalle ? `<span class="res-cifra__detalle">${esc(detalle)}</span>` : ''}
    </div>`;
  const enJuego = r.enJuego[0];
  return `
    <section class="res-heroe">
      <div class="res-heroe__principal">
        <span class="res-heroe__etiqueta">Ganado · ${esc(PERIODO_TEXTO[r.periodo])}</span>
        <span class="res-heroe__valor">${esc(principal ? dinero(principal.total, principal.moneda) : dinero(0, r.monedaPrincipal))}</span>
        <span class="res-heroe__detalle">${esc([
          plural(r.aceptadas, 'propuesta aceptada', 'propuestas aceptadas'),
          ...otras.map(o => `y ${dinero(o.total, o.moneda)}`),
          mensual ? `+ ${mensual}` : ''
        ].filter(Boolean).join(' · '))}</span>
      </div>
      <div class="res-heroe__cifras">
        ${cifra(porcentaje(r.conversion), 'Tasa de aceptación', r.embudo.enviadas ? `${r.embudo.aceptadas} de ${plural(r.embudo.enviadas, 'enviada', 'enviadas')}` : 'Sin envíos en el período')}
        ${cifra(r.ticketMedio === null ? '—' : dinero(Math.round(r.ticketMedio), r.monedaPrincipal), 'Ticket promedio', 'Por propuesta aceptada')}
        ${cifra(r.diasHastaAceptar === null ? '—' : r.diasHastaAceptar < 1 ? 'Menos de 1 día' : plural(Math.round(r.diasHastaAceptar), 'día', 'días'), 'Hasta que aceptan', 'Mediana desde el envío')}
        ${cifra(enJuego ? dinero(enJuego.total, enJuego.moneda) : '—', 'En juego', r.abiertasAhora ? plural(r.abiertasAhora, 'propuesta esperando respuesta', 'propuestas esperando respuesta') : 'Nada esperando respuesta')}
      </div>
    </section>`;
};

const PERIODO_TEXTO = { mes: 'este mes', trimestre: 'últimos 90 días', anio: 'últimos 12 meses' };

// --- Para seguir hoy: calientes, sin abrir y por vencer ---
// Mensajes de WhatsApp que se ofrecen para escribirle al cliente (botón «Escribile»).
// Cordiales y sin presionar: la idea es ayudar a cerrar, no cansar.
// Para cambiar los textos, es acá.
const mensajeWhatsApp = (p, tipo) => {
  const nombre = String(p.payload?.cliente?.nombre || '').trim().split(' ')[0];
  const hola = nombre ? `Hola ${nombre}, ¿cómo estás?` : 'Hola, ¿cómo estás?';
  const link = linkCorto(p.id);
  if (tipo === 'caliente') return `${hola} Si te quedó alguna duda con la propuesta o querés ajustar algo, contame y lo vemos. ${link}`;
  if (tipo === 'vence') {
    const vence = calcularVigencia(p.payload?.propuesta || {}).vence;
    const hasta = vence ? ` hasta el ${fechaLarga(vence)}` : '';
    return `${hola} Te cuento que los valores de la propuesta se mantienen${hasta}. Cualquier consulta, acá estoy. ${link}`;
  }
  return `${hola} Te dejo el link de la propuesta para cuando tengas un rato: ${link}`;
};

const filaSeguimiento = (p, tipo, detalle) => {
  const titulo = String(p.title || '').trim() || 'Sin título';
  const cliente = String(p.clientName || '').trim();
  return `
    <li class="res-seguir__fila">
      <span class="res-seguir__marca res-seguir__marca--${tipo}" aria-hidden="true"></span>
      <a class="res-seguir__texto" href="/propuesta/${encodeURIComponent(p.id)}" data-accion="abrir-propuesta" data-id="${esc(p.id)}">
        <strong>${esc(titulo)}</strong>
        <span>${esc([cliente, detalle].filter(Boolean).join(' · '))}</span>
      </a>
      <a class="boton boton--secundario boton--chico" href="https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp(p, tipo))}" target="_blank" rel="noopener">Escribile</a>
    </li>`;
};

const seguirHTML = (r, conSeguimiento) => {
  const total = r.calientes.length + r.sinAbrir.length + r.porVencer.length;
  if (!conSeguimiento) {
    const gancho = r.calientes.length
      ? `${plural(r.calientes.length, 'propuesta se está mirando ahora y no tiene respuesta', 'propuestas se están mirando ahora y no tienen respuesta')}. Con Pro sabés cuáles son y le escribís en el momento justo.`
      : 'Con Pro ves qué propuestas tu cliente está mirando, cuáles nunca abrió y cuáles están por vencer, con el mensaje listo para mandarle.';
    return tarjeta(`Para seguir hoy ${insignia}`, bloqueadoHTML('A quién escribirle hoy', gancho), { clase: 'res-tarjeta--ancha' });
  }
  if (!total) {
    return tarjeta('Para seguir hoy', '<p class="res-vacio">Nada urgente. Cuando un cliente mire una propuesta y no responda, aparece acá.</p>', { clase: 'res-tarjeta--ancha' });
  }
  const filas = [
    ...r.calientes.map(p => filaSeguimiento(p, 'caliente', `La abrió ${plural(Number(p.vistas), 'vez', 'veces')}, la última ${haceCuanto(fechaDe(p.vistoUltimo))}`)),
    ...r.porVencer.filter(p => !r.calientes.includes(p)).map(p => filaSeguimiento(p, 'vence', 'Vence pronto')),
    ...r.sinAbrir.filter(p => !r.porVencer.includes(p)).map(p => filaSeguimiento(p, 'sin-abrir', 'Todavía no la abrió'))
  ].slice(0, 8);
  return tarjeta('Para seguir hoy', `<ul class="res-seguir">${filas.join('')}</ul>`, {
    clase: 'res-tarjeta--ancha',
    ayuda: 'Escribile mientras la tiene fresca: el mensaje ya va armado con el link.'
  });
};

const haceCuanto = fecha => {
  if (!fecha) return '';
  const horas = Math.round((Date.now() - fecha) / 3600000);
  if (horas < 1) return 'hace un rato';
  if (horas < 24) return `hace ${plural(horas, 'hora', 'horas')}`;
  return `hace ${plural(Math.round(horas / 24), 'día', 'días')}`;
};

// --- Embudo: enviadas → abiertas → aceptadas (barras horizontales, una serie) ---
const embudoHTML = (r, conSeguimiento) => {
  const { enviadas, abiertas, aceptadas } = r.embudo;
  if (!enviadas) return tarjeta('Del envío al sí', '<p class="res-vacio">Sin propuestas enviadas en el período.</p>');
  const fila = (etiqueta, valor, detalle, bloqueada = false) => `
    <div class="res-embudo__fila${bloqueada ? ' res-embudo__fila--bloqueada' : ''}">
      <span class="res-embudo__etiqueta">${etiqueta}</span>
      <span class="res-embudo__pista"><span class="res-embudo__barra" style="--valor:${bloqueada ? 0 : valor / enviadas}"></span></span>
      <span class="res-embudo__valor">${bloqueada ? '—' : valor}${detalle && !bloqueada ? ` <small>${esc(detalle)}</small>` : ''}</span>
    </div>`;
  const filas = [
    fila('Enviadas', enviadas),
    conSeguimiento
      ? fila('Abiertas', abiertas, porcentaje(r.tasaApertura))
      : fila(`Abiertas ${insignia}`, 0, '', true),
    fila('Aceptadas', aceptadas, porcentaje(r.conversion))
  ].join('');
  const lectura = conSeguimiento && enviadas
    ? (abiertas < enviadas
      ? `${plural(enviadas - abiertas, 'propuesta no se abrió', 'propuestas no se abrieron')}: reenvialas antes de bajar el precio.`
      : 'Todas tus propuestas se abrieron: el desafío está en convencer, no en llegar.')
    : '';
  return tarjeta('Del envío al sí', `<div class="res-embudo" role="img" aria-label="${esc(`Enviadas ${enviadas}${conSeguimiento ? `, abiertas ${abiertas}` : ''}, aceptadas ${aceptadas}`)}">${filas}</div>${lectura ? `<p class="res-lectura">${esc(lectura)}</p>` : ''}`);
};

// --- Ganado por mes (columnas, una serie, valor en la más alta y en la actual) ---
const mesesHTML = r => {
  const max = Math.max(...r.meses.map(m => m.total));
  if (!max) return tarjeta('Ganado por mes', '<p class="res-vacio">Todavía no hay propuestas aceptadas en estos meses.</p>');
  const ultimo = r.meses.length - 1;
  const indiceMax = r.meses.findIndex(m => m.total === max);
  const columnas = r.meses.map((m, i) => {
    const nombre = `${MESES[m.inicio.getMonth()]}${m.inicio.getMonth() === 0 || i === 0 ? ` ${String(m.inicio.getFullYear()).slice(2)}` : ''}`;
    const valor = dinero(m.total, r.monedaPrincipal);
    const etiqueta = (i === indiceMax || i === ultimo) && m.total > 0;
    return `
      <div class="res-meses__col${i === ultimo ? ' res-meses__col--actual' : ''}" tabindex="0" aria-label="${esc(`${nombre}: ${valor}`)}">
        <span class="res-meses__tip" role="tooltip">${esc(`${nombre} · ${valor}`)}</span>
        ${etiqueta ? `<span class="res-meses__valor">${esc(compacto(m.total, r.monedaPrincipal))}</span>` : ''}
        <span class="res-meses__barra" style="--valor:${m.total / max}"></span>
        <span class="res-meses__mes">${esc(nombre)}</span>
      </div>`;
  }).join('');
  const tabla = `
    <table class="visualmente-oculto">
      <caption>Ganado por mes en ${esc(r.monedaPrincipal)}</caption>
      <thead><tr><th scope="col">Mes</th><th scope="col">Ganado</th></tr></thead>
      <tbody>${r.meses.map(m => `<tr><td>${esc(`${MESES[m.inicio.getMonth()]} ${m.inicio.getFullYear()}`)}</td><td>${esc(dinero(m.total, r.monedaPrincipal))}</td></tr>`).join('')}</tbody>
    </table>`;
  return tarjeta('Ganado por mes', `<div class="res-meses" aria-hidden="false">${columnas}</div>${tabla}`, { ayuda: `En ${r.monedaPrincipal}, por fecha de aceptación.` });
};

// --- Opcionales que suman tus clientes ---
const opcionalesHTML = r => {
  if (!r.ofrecieronOpcionales) {
    return tarjeta('Opcionales', '<p class="res-vacio">Sumá servicios opcionales a tus propuestas: el cliente los agrega solo y sube el ticket sin que tengas que negociar.</p>');
  }
  const lista = r.opcionales.length
    ? `<ol class="res-lista">${r.opcionales.map(o => `<li><span>${esc(o.nombre)}</span><strong>${plural(o.veces, 'vez', 'veces')}</strong></li>`).join('')}</ol>`
    : '';
  return tarjeta('Opcionales', `
    <p class="res-destacado"><strong>${r.sumaronOpcionales} de ${r.ofrecieronOpcionales}</strong> clientes sumaron al menos un opcional al aceptar.</p>
    ${lista}`);
};

// --- Mejores clientes ---
const clientesHTML = r => (r.clientes.length
  ? tarjeta('Mejores clientes', `<ol class="res-lista">${r.clientes.map(c => `<li><span>${esc(c.nombre)} <small>${plural(c.aceptadas, 'aceptada', 'aceptadas')}</small></span><strong>${esc(dinero(c.total, r.monedaPrincipal))}</strong></li>`).join('')}</ol>`)
  : tarjeta('Mejores clientes', '<p class="res-vacio">Cuando te acepten propuestas, acá ves quién te deja más.</p>'));

// --- Cuándo abren (franja de la primera visita) ---
const franjasHTML = (r, conSeguimiento) => {
  if (!conSeguimiento) return tarjeta(`Cuándo abren ${insignia}`, bloqueadoHTML('El mejor momento para enviar', 'Con Pro ves en qué momento del día tus clientes abren las propuestas, para mandarlas cuando las van a leer.'));
  const total = Object.values(r.franjas).reduce((s, n) => s + n, 0);
  if (total < 3) return tarjeta('Cuándo abren', '<p class="res-vacio">Con algunas propuestas abiertas más, acá ves en qué momento del día las leen tus clientes.</p>');
  const max = Math.max(...Object.values(r.franjas));
  const mejor = FRANJAS.find(f => r.franjas[f.id] === max);
  const filas = FRANJAS.map(f => `
    <div class="res-embudo__fila">
      <span class="res-embudo__etiqueta">${f.nombre}</span>
      <span class="res-embudo__pista"><span class="res-embudo__barra" style="--valor:${r.franjas[f.id] / max}"></span></span>
      <span class="res-embudo__valor">${r.franjas[f.id]}</span>
    </div>`).join('');
  return tarjeta('Cuándo abren', `<div class="res-embudo">${filas}</div><p class="res-lectura">${esc(`La mayoría abre a la ${mejor.nombre.toLowerCase()}: mandalas un rato antes.`)}</p>`, { ayuda: 'Primera apertura de cada propuesta, en hora de Argentina.' });
};

const vacioHTML = () => `
  <div class="panel__vacio">
    <h2 class="panel__vacio-titulo">Tus resultados empiezan con tu primera propuesta</h2>
    <p>Cuando envíes propuestas vas a ver acá cuánto ganás, qué porcentaje te aceptan, cuánto tardan en decidir y a quién conviene escribirle hoy.</p>
    <div class="panel__acciones">
      <button type="button" class="boton boton--primario" data-accion="nueva">Crear una propuesta</button>
    </div>
  </div>`;

export const renderResultados = () => {
  const el = $('#resultados-contenido');
  if (!el || $('#resultados')?.hidden) return;
  $$('[data-accion="resultados-periodo"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.periodo === periodo)));
  const r = calcularResultados(ctx.propuestas || [], { periodo });
  if (!r.hayDatos) {
    el.innerHTML = vacioHTML();
    return;
  }
  const conSeguimiento = !restriccionesActivas();
  el.innerHTML = `
    ${cifrasHTML(r)}
    <div class="res-grilla">
      ${seguirHTML(r, conSeguimiento)}
      ${embudoHTML(r, conSeguimiento)}
      ${mesesHTML(r)}
      ${opcionalesHTML(r)}
      ${clientesHTML(r)}
      ${franjasHTML(r, conSeguimiento)}
    </div>
    <p class="res-pie">Actualizado ${esc(fechaLarga(new Date()))}. Los montos son lo inicial aceptado; los abonos mensuales se muestran aparte.</p>`;
};

export const irAResultados = ({ historial = true } = {}) => {
  cerrarEdicion();
  if (historial && location.pathname !== '/resultados') irRuta('/resultados');
  mostrarVista('resultados');
  renderResultados();
  $('#resultados').scrollTop = 0;
};

export const instalarResultados = () => {
  // Se recalcula cuando cambian las propuestas (alguien abre o acepta) o el plan.
  document.addEventListener('dealit:propuestas', renderResultados);
  document.addEventListener('dealit:plan', renderResultados);
  registrarAcciones({
    'resultados-periodo': boton => {
      periodo = boton.dataset.periodo;
      renderResultados();
    }
  });
};
