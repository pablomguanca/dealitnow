// Logo y medios de pago oficiales de Mercado Pago (Brand Brick del SDK de Mercado Pago).
// Cada lugar donde va lleva un contenedor [data-mp-marca] con un texto de respaldo adentro;
// acá se carga el SDK (una sola vez, recién cuando hace falta) y se monta el Brick en cada
// contenedor. Sin clave pública (VITE_MP_PUBLIC_KEY) o si el SDK no carga, queda el texto.
//
// La clave es la pública de la aplicación de Dealit en Mercado Pago: está pensada para el
// navegador (no es un secreto). El Brick solo muestra la marca; el pago lo crea el servidor.

const CLAVE_PUBLICA = import.meta.env?.VITE_MP_PUBLIC_KEY || '';
const SDK = 'https://sdk.mercadopago.com/js/v2';

let sdk = null;
const cargarSdk = () => {
  sdk ||= new Promise((listo, fallo) => {
    if (window.MercadoPago) return listo(window.MercadoPago);
    const s = document.createElement('script');
    s.src = SDK;
    s.async = true;
    s.onload = () => (window.MercadoPago ? listo(window.MercadoPago) : fallo(new Error('Sin SDK de Mercado Pago')));
    s.onerror = () => fallo(new Error('No cargó el SDK de Mercado Pago'));
    document.head.append(s);
  }).catch(e => {
    sdk = null; // se puede reintentar más adelante
    throw e;
  });
  return sdk;
};

let constructor = null;
const bricks = async () => {
  if (!constructor) {
    const MercadoPago = await cargarSdk();
    constructor = new MercadoPago(CLAVE_PUBLICA, { locale: 'es-AR' }).bricks();
  }
  return constructor;
};

// Configuración del Brick: el mensaje de medios de pago, con el logo, centrado y sobrio.
const ajustes = ({ alListo, alFallar }) => ({
  customization: {
    texts: { valueProp: 'payment_methods', align: 'center', useCustomFont: false, size: 'medium', fontWeight: 'semibold', color: 'secondary' },
    paymentMethods: { excludedPaymentMethods: [], excludedPaymentTypes: [], maxInstallments: 6, interestFreeInstallments: false },
    visual: {
      backgroundColor: 'white',
      hideMercadoPagoLogo: false,
      border: false,
      borderColor: 'dark',
      contentAlign: 'center',
      borderWidth: '1px',
      borderRadius: '10px',
      verticalPadding: '8px',
      horizontalPadding: '16px'
    }
  },
  callbacks: { onReady: alListo, onError: alFallar }
});

// El Brick se dibuja en una capa aparte, sobre el texto de respaldo; el texto se saca recién
// cuando Mercado Pago avisa que está listo. Si no avisa (clave inválida, sin conexión), el
// texto queda y la capa se borra: nunca queda un hueco vacío.
let contador = 0;
const ESPERA_LISTO_MS = 8000;
const montar = async contenedor => {
  if (contenedor.dataset.montado) return;
  contenedor.dataset.montado = '1';
  const capa = document.createElement('div');
  capa.id = `mp-marca-${++contador}`;
  capa.className = 'mp-marca__brick';
  contenedor.append(capa);
  const quitar = () => capa.remove();
  try {
    const builder = await bricks();
    if (!contenedor.isConnected) return;
    let listo = false;
    const tope = setTimeout(() => { if (!listo) quitar(); }, ESPERA_LISTO_MS);
    await builder.create('brand', capa.id, ajustes({
      alListo: () => {
        listo = true;
        clearTimeout(tope);
        contenedor.querySelector('.mp-marca__respaldo')?.remove();
        contenedor.classList.add('mp-marca--brick');
      },
      alFallar: e => {
        console.warn('Brand Brick de Mercado Pago:', e);
        clearTimeout(tope);
        if (!listo) quitar();
      }
    }));
  } catch (e) {
    quitar();
    console.warn('No se pudo mostrar la marca de Mercado Pago:', e?.message || e);
  }
};

// Monta el Brick en los contenedores nuevos de «raiz». En el editor, donde el documento se
// vuelve a dibujar con cada tecla, conviene llamarla con «espera» para no recrearlo de más.
let temporizador = null;
export const montarMarcasMp = (raiz = document, { espera = 0 } = {}) => {
  if (!CLAVE_PUBLICA || typeof window === 'undefined') return;
  const pendientes = () => [...raiz.querySelectorAll('[data-mp-marca]:not([data-montado])')];
  if (!espera) {
    pendientes().forEach(montar);
    return;
  }
  clearTimeout(temporizador);
  temporizador = setTimeout(() => pendientes().forEach(montar), espera);
};
