// Landing de Dealit (inicio.html, servida en /inicio). Página estática: no carga Firebase ni
// la app. Acá van solo las animaciones de entrada, el celular del hero, la calculadora de
// retorno y el selector mensual / anual de Pro.

import './inicio.scss';
import { recordarApp } from '../lib/cookie-app.js';

// En la app de Android (Capacitor abre dealit.com.ar) nunca va la landing: si llegó sin la
// cookie (la primera vez que se abre), la deja y entra a la app.
if (window.Capacitor?.isNativePlatform?.()) {
  recordarApp();
  location.replace('/');
}

const PRECIO_PRO_MES = 13900;
const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = sel => document.querySelector(sel);
const numero = n => Math.round(n).toLocaleString('es-AR');

// Entrada al hacer scroll: cada bloque aparece una vez, con un pequeño escalonado entre hermanos.
const instalarApariciones = () => {
  const elementos = document.querySelectorAll('.ld-aparece');
  if (sinMovimiento || !('IntersectionObserver' in window)) {
    elementos.forEach(el => el.classList.add('visible'));
    return;
  }
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      const el = entrada.target;
      const hermanos = [...el.parentElement.children].filter(h => h.classList.contains('ld-aparece'));
      el.style.setProperty('--retraso', `${Math.min(hermanos.indexOf(el), 5) * 70}ms`);
      el.classList.add('visible');
      observador.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  elementos.forEach(el => observador.observe(el));
};

// Celular del hero: dictado (con el texto que se escribe solo) → propuesta → «la abrió» → «aceptó».
const DICTADO = '«Rediseño de marca y web para Juan Pérez: identidad visual 420 mil, sitio de cinco secciones 680 mil, y de opcional el kit para redes…»';
const DURACIONES = [3600, 2600, 2600, 3000];

const instalarCelular = () => {
  const celular = $('#celular');
  const texto = $('#dictado');
  const pasitos = [...document.querySelectorAll('#pasitos li')];
  if (!celular || !texto) return;

  const marcar = paso => {
    celular.dataset.paso = paso;
    pasitos.forEach((li, i) => li.classList.toggle('activo', i === paso));
  };

  if (sinMovimiento) {
    texto.textContent = DICTADO;
    marcar(2);
    return;
  }

  let paso = 0;
  let escritura;
  const escribir = () => {
    clearInterval(escritura);
    let i = 0;
    texto.textContent = '';
    escritura = setInterval(() => {
      i += 2;
      texto.textContent = DICTADO.slice(0, i);
      if (i >= DICTADO.length) clearInterval(escritura);
    }, 3000 / DICTADO.length * 2);
  };

  const avanzar = () => {
    marcar(paso);
    if (paso === 0) escribir();
    setTimeout(() => {
      paso = (paso + 1) % DURACIONES.length;
      avanzar();
    }, DURACIONES[paso]);
  };
  avanzar();
};

// Calculadora: cuántos meses de Pro paga un solo cliente más.
const instalarRoi = () => {
  const entrada = $('#roi-ticket');
  const rango = $('#roi-rango');
  if (!entrada || !rango) return;

  const mostrar = valor => {
    const meses = Math.floor(valor / PRECIO_PRO_MES);
    $('#roi-meses').textContent = `${numero(meses)} ${meses === 1 ? 'mes' : 'meses'}`;
    const anios = Math.floor(meses / 12);
    $('#roi-anios').textContent = anios >= 1
      ? `Eso son ${anios === 1 ? 'un año' : `${numero(anios)} años`}${meses % 12 ? ` y ${meses % 12} ${meses % 12 === 1 ? 'mes' : 'meses'}` : ''}.`
      : meses >= 1 ? 'Y sigue sumando con cada cliente.' : 'Un cliente más ya casi lo paga.';
  };

  entrada.addEventListener('input', () => {
    const valor = Number(entrada.value.replace(/\D/g, '')) || 0;
    entrada.value = valor ? numero(valor) : '';
    rango.value = Math.min(Math.max(valor, Number(rango.min)), Number(rango.max));
    mostrar(valor);
  });
  rango.addEventListener('input', () => {
    const valor = Number(rango.value);
    entrada.value = numero(valor);
    mostrar(valor);
  });
  mostrar(Number(rango.value));
};

// Selector mensual / anual del plan Pro.
const instalarPeriodo = () => {
  const botones = document.querySelectorAll('[data-periodo]');
  const precio = $('[data-precio-mes]');
  const sufijo = $('[data-sufijo-mes]');
  const usd = $('[data-usd-mes]');
  botones.forEach(boton => boton.addEventListener('click', () => {
    const anual = boton.dataset.periodo === 'anio';
    botones.forEach(b => {
      b.classList.toggle('activo', b === boton);
      b.setAttribute('aria-pressed', String(b === boton));
    });
    precio.textContent = anual ? precio.dataset.precioAnio : precio.dataset.precioMes;
    sufijo.textContent = anual ? sufijo.dataset.sufijoAnio : sufijo.dataset.sufijoMes;
    usd.textContent = anual ? usd.dataset.usdAnio : usd.dataset.usdMes;
    precio.classList.remove('cambia');
    void precio.offsetWidth;
    precio.classList.add('cambia');
  }));
};

// Cabecera con fondo al bajar, y botón fijo en el celular cuando el del hero ya no se ve.
const instalarCabeceraYFijo = () => {
  const cabecera = $('#cabecera');
  const fijo = $('#cta-fijo');
  const heroBoton = $('[data-cta="hero"]');
  const cierre = $('.ld-cierre');
  addEventListener('scroll', () => cabecera.classList.toggle('con-fondo', scrollY > 12), { passive: true });
  if (!('IntersectionObserver' in window) || !heroBoton) return;
  const visibles = new Map();
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(e => visibles.set(e.target, e.isIntersecting));
    const heroVisible = visibles.get(heroBoton) ?? true;
    const cierreVisible = visibles.get(cierre) ?? false;
    fijo.classList.toggle('visible', !heroVisible && !cierreVisible);
  });
  observador.observe(heroBoton);
  if (cierre) observador.observe(cierre);
};

instalarApariciones();
instalarCelular();
instalarRoi();
instalarPeriodo();
instalarCabeceraYFijo();
