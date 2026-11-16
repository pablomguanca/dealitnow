// Landing de Dealit (inicio.html, servida en / sin sesión y en /inicio). Página estática: no
// carga Firebase ni la app. Acá van solo las animaciones de entrada, el celular del hero y el
// selector mensual / anual de Pro. La comparativa PDF vs. link se anima solo con CSS.

import './inicio.scss';
import { haySesionGuardada, marcarSesion } from '../lib/marca-sesion.js';

// En la app de Android (Capacitor abre dealit.com.ar) nunca va la landing: /empezar entra al
// editor sin cuenta o, con la sesión iniciada, al panel.
if (window.Capacitor?.isNativePlatform?.()) {
  location.replace('/empezar');
} else if (location.pathname === '/') {
  // Quien tiene la sesión iniciada pero todavía no la marca (por ejemplo, entró antes de que
  // existiera, o borró las cookies) va al panel y desde ahí ya entra directo. En /inicio no:
  // ahí la landing se ve siempre.
  haySesionGuardada().then(hay => {
    if (!hay) return;
    marcarSesion();
    location.replace('/');
  });
}

const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = sel => document.querySelector(sel);

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
const DICTADO = '«Rediseño de marca y web para Vero García: identidad visual 420 mil, sitio de cinco secciones 680 mil, y de opcional el kit para redes…»';
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

// La propuesta dentro de los teléfonos (.ld-pg) se recorre sola con CSS (ld-recorrido): acá se
// mide hasta dónde bajar en cada parada (los servicios, el opcional y el final) según el tamaño
// real de cada teléfono.
const instalarRecorridos = () => {
  const medir = () => document.querySelectorAll('.ld-pg').forEach(pg => {
    const contenido = pg.querySelector('.ld-pg__contenido');
    const servicios = pg.querySelectorAll('.ld-pg__seccion')[1];
    const opcional = pg.querySelector('.ld-pg__servicio--opcional');
    if (!contenido || !servicios || !opcional) return;
    const alto = pg.clientHeight;
    const fin = Math.max(0, contenido.scrollHeight - alto);
    const hasta = y => `${-Math.round(Math.min(Math.max(y, 0), fin))}px`;
    pg.style.setProperty('--pg-servicios', hasta(servicios.offsetTop));
    pg.style.setProperty('--pg-opcional', hasta(opcional.offsetTop - alto * 0.3));
    pg.style.setProperty('--pg-fin', hasta(fin));
  });
  medir();
  document.fonts?.ready.then(medir);
  addEventListener('resize', medir, { passive: true });
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
instalarRecorridos();
instalarPeriodo();
instalarCabeceraYFijo();
