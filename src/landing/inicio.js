// Landing de Dealit (inicio.html, servida en / sin sesión y en /inicio). Página estática: no
// carga Firebase ni la app. Acá van solo las animaciones de entrada, el celular del hero y el
// selector mensual / anual de Pro. La comparativa PDF vs. link se anima solo con CSS.

import './inicio.scss';
import { haySesionGuardada, marcarSesion } from '../lib/marca-sesion.js';

// Abierta como app instalada (la PWA, o Dealit en la pantalla de inicio del iPhone).
const instalada = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// En la app de Android (Capacitor abre dealit.com.ar) y en la PWA instalada nunca va la landing:
// /empezar entra al editor sin cuenta o, con la sesión iniciada, al panel. La PWA arranca en `/`
// (start_url) y, sin la cookie (en iPhone la app instalada no comparte las de Safari), caería acá.
if (window.Capacitor?.isNativePlatform?.() || instalada) {
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
    // Las animaciones arrancan (o vuelven a arrancar) con las medidas ya puestas: Chrome toma
    // los valores de las variables al crear la animación y no los actualiza después.
    pg.classList.remove('medido');
    void pg.offsetWidth;
    pg.classList.add('medido');
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
    if (usd) usd.textContent = anual ? usd.dataset.usdAnio : usd.dataset.usdMes;
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
  // Tampoco tapa el botón «Instalar» de la tarjeta de instalación.
  const instalador = $('#instalador');
  addEventListener('scroll', () => cabecera.classList.toggle('con-fondo', scrollY > 12), { passive: true });
  if (!('IntersectionObserver' in window) || !heroBoton) return;
  const visibles = new Map();
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(e => visibles.set(e.target, e.isIntersecting));
    const heroVisible = visibles.get(heroBoton) ?? true;
    const tapa = [cierre, instalador].some(el => visibles.get(el));
    fijo.classList.toggle('visible', !heroVisible && !tapa);
  });
  observador.observe(heroBoton);
  [cierre, instalador].forEach(el => el && observador.observe(el));
};

// Instalar Dealit como app (PWA), sin tienda. En la compu se ve el QR que lleva a /instalar
// (esta misma landing, bajando hasta acá); en el celular, lo que corresponde a su sistema:
// - Android y navegadores con Chromium: el botón «Instalar» con el aviso propio del navegador
//   (beforeinstallprompt). Si no lo ofrece (Firefox, ya instalada, etc.), los pasos del menú.
//   En la compu, si el navegador también la puede instalar, un link discreto bajo el QR.
// - iPhone y iPad: no hay aviso propio, solo los pasos de Compartir → «Agregar a inicio».
const plataforma = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua) || matchMedia('(pointer: coarse) and (hover: none)').matches) return 'android';
  return 'escritorio';
};

const instalarInstalador = () => {
  const seccion = $('#instalar');
  if (!seccion) return;
  seccion.dataset.plataforma = plataforma();

  let aviso = null;
  const botones = seccion.querySelectorAll('[data-instalar]');
  const mostrarBotones = si => {
    botones.forEach(b => { b.hidden = !si; });
    seccion.toggleAttribute('data-con-aviso', si);
  };

  addEventListener('beforeinstallprompt', evento => {
    evento.preventDefault();
    aviso = evento;
    mostrarBotones(true);
  });
  addEventListener('appinstalled', () => {
    aviso = null;
    mostrarBotones(false);
    seccion.dataset.plataforma = 'lista';
  });
  botones.forEach(boton => boton.addEventListener('click', async () => {
    if (!aviso) return;
    const evento = aviso;
    aviso = null;
    evento.prompt();
    const { outcome } = await evento.userChoice.catch(() => ({}));
    // El aviso se usa una sola vez: si lo cerró, quedan los pasos del menú.
    mostrarBotones(false);
    if (outcome === 'accepted') seccion.dataset.plataforma = 'lista';
  }));

  // Sin service worker, algunos navegadores (Samsung Internet, Chrome viejos) no la consideran
  // instalable. El de Dealit no guarda nada en caché, así que registrarlo no cambia la landing.
  if ('serviceWorker' in navigator) {
    const registrar = () => navigator.serviceWorker.register('/sw.js').catch(() => {});
    if ('requestIdleCallback' in window) requestIdleCallback(registrar, { timeout: 4000 });
    else setTimeout(registrar, 2000);
  }

  // Llegó escaneando el QR (/instalar): directo a la sección, de un salto (el scroll suave de
  // la página tardaría en recorrerla entera) y con todo cargado, para que nada la corra después.
  if (location.pathname.replace(/\/$/, '') === '/instalar') {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const ir = () => seccion.scrollIntoView({ block: 'start', behavior: 'instant' });
    ir();
    // Al terminar de cargar, se reacomoda solo si la persona no se movió de ahí.
    const donde = scrollY;
    if (document.readyState !== 'complete') {
      addEventListener('load', () => { if (Math.abs(scrollY - donde) < 80) ir(); }, { once: true });
    }
  }
};

instalarApariciones();
instalarInstalador();
instalarCelular();
instalarRecorridos();
instalarPeriodo();
instalarCabeceraYFijo();
