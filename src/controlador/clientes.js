// Pestaña «Clientes» del panel: las propuestas agrupadas por cliente (src/clientes.js), con
// lo ganado, lo que está en juego y la última actividad. Cada cliente se despliega con sus
// propuestas (las mismas tarjetas de «Mis propuestas») y «Nueva propuesta para…», que
// arranca una propuesta en blanco con sus datos ya cargados. No guarda nada propio.

import { $, esc, dinero } from '../lib/formato.js';
import { vacio } from '../modelo.js';
import { agruparClientes, clienteDormido } from '../clientes.js';
import { haceCuanto, tiempoHTML, tonoDe, sinAcentos, propuestaHTML } from '../lib/paneles.js';
import { ctx } from './contexto.js';
import { registrarAcciones } from './acciones.js';
import { restriccionesActivas } from './plan.js';
import { emisorDeCuenta } from './cuenta.js';

// Los clientes abiertos siguen abiertos cuando la lista se redibuja (llega en tiempo real).
const abiertos = new Set();
let ultimos = [];

const iniciales = nombre => nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(p => [...p][0]).join('').toUpperCase() || '?';

const resumenDe = c => {
  const partes = [`${c.cantidad} ${c.cantidad === 1 ? 'propuesta' : 'propuestas'}`];
  if (c.aceptadas) partes.push(`${c.aceptadas} ${c.aceptadas === 1 ? 'aceptada' : 'aceptadas'}`);
  if (c.enJuego) partes.push(`${c.enJuego} esperando`);
  return partes.join(' · ');
};

const clienteHTML = (c, { conSeguimiento }) => {
  const [principal, ...otras] = c.ganado.map(g => dinero(g.total, g.moneda));
  const dormido = clienteDormido(c);
  return `
    <li class="cliente">
      <details class="cliente__detalle" data-clave="${esc(c.clave)}"${abiertos.has(c.clave) ? ' open' : ''}>
        <summary class="cliente__fila">
          <span class="cliente__avatar cliente__avatar--${tonoDe(c.clave)}" aria-hidden="true">${esc(iniciales(c.nombre))}</span>
          <span class="cliente__datos">
            <span class="cliente__nombre">${esc(c.nombre)}</span>
            <span class="cliente__contacto">${esc(c.contacto || resumenDe(c))}</span>
          </span>
          <span class="cliente__resumen">${c.contacto ? esc(resumenDe(c)) : ''}</span>
          <span class="cliente__ganado">
            ${principal ? `<strong>${esc(principal)}</strong><small>${otras.length ? `y ${esc(otras.join(' · '))}` : 'aceptado'}</small>` : '<small>Sin aceptadas todavía</small>'}
          </span>
          <span class="cliente__fecha">${c.ultima ? tiempoHTML(c.ultima, haceCuanto(c.ultima)) : ''}${dormido ? '<span class="cliente__retomar">Para retomar</span>' : ''}</span>
          <svg class="cliente__chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 6.25 8 9.75l3.5-3.5" /></svg>
        </summary>
        <div class="cliente__cuerpo">
          <div class="cliente__barra">
            <p class="cliente__barra-texto">${esc(resumenDe(c))}</p>
            <button type="button" class="boton boton--secundario boton--chico" data-accion="nueva-para-cliente" data-clave="${esc(c.clave)}">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9" /></svg>
              Nueva propuesta para ${esc(c.nombre)}
            </button>
          </div>
          <ul class="clientes__propuestas" aria-label="Propuestas de ${esc(c.nombre)}">
            ${c.propuestas.map(p => propuestaHTML(p, { conSeguimiento })).join('')}
          </ul>
        </div>
      </details>
    </li>`;
};

export const renderClientes = ({ cargando = false } = {}) => {
  const lista = $('#lista-clientes');
  if (!lista || $('#panel-clientes')?.hidden) return;
  const { clientes, sinCliente } = agruparClientes(ctx.propuestas);
  ultimos = clientes;
  const campo = $('#clientes-buscar');
  const filtro = sinAcentos(campo?.value.trim() || '');
  const visibles = filtro
    ? clientes.filter(c => sinAcentos(`${c.nombre} ${c.contacto}`).includes(filtro))
    : clientes;
  $('#clientes-herramientas').hidden = clientes.length < 6;

  const estado = $('#clientes-estado');
  if (cargando) estado.textContent = 'Cargando tus clientes…';
  else if (!ctx.propuestas.length) estado.textContent = 'Cuando armes tu primera propuesta, tus clientes van a aparecer acá.';
  else if (!clientes.length) estado.textContent = 'Tus propuestas todavía no tienen cliente. Cargalo en el paso «Cliente» de cada una y se agrupan acá.';
  else if (filtro && !visibles.length) estado.textContent = `No hay clientes que coincidan con «${campo.value.trim()}».`;
  else estado.textContent = sinCliente
    ? `${sinCliente === 1 ? 'Una propuesta no tiene' : `${sinCliente} propuestas no tienen`} cliente cargado y no ${sinCliente === 1 ? 'aparece' : 'aparecen'} acá.`
    : '';

  lista.innerHTML = cargando ? '' : visibles.map(c => clienteHTML(c, { conSeguimiento: !restriccionesActivas() })).join('');
};

// Cuántos clientes hay, para la pestaña (se ve también desde «Mis propuestas»).
export const cantidadClientes = () => agruparClientes(ctx.propuestas).clientes.length;

export const instalarClientes = (nuevaPropuesta) => {
  $('#clientes-buscar')?.addEventListener('input', () => renderClientes());
  // «toggle» no burbujea: se escucha en captura para recordar qué cliente quedó abierto.
  $('#lista-clientes')?.addEventListener('toggle', ev => {
    const det = ev.target;
    if (!(det instanceof HTMLDetailsElement)) return;
    if (det.open) abiertos.add(det.dataset.clave);
    else abiertos.delete(det.dataset.clave);
  }, true);

  registrarAcciones({
    'nueva-para-cliente': boton => {
      const c = ultimos.find(x => x.clave === boton.dataset.clave);
      if (!c) return;
      const base = vacio();
      base.cliente = { ...base.cliente, ...c.datos };
      // Si solo había un nombre, es el de la persona o el de la empresa: se respeta como estaba.
      if (!c.datos.nombre && !c.datos.empresa) base.cliente.empresa = c.nombre;
      base.emisor = emisorDeCuenta(base.emisor);
      nuevaPropuesta(base);
    }
  });
};
