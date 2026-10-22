import './styles/styles.scss';
import { AteneaDB, AteneaDBError } from './firebase.js';
import {
  $,
  $$,
  obtener,
  asignar,
  numero,
  texto,
  esc,
  lineas,
  parrafos,
  dinero,
  cantidadTexto,
  desdeISO,
  fechaLarga
} from './lib/formato.js';
import {
  MODALIDADES,
  DECORACIONES,
  PORTADAS,
  ESTILOS_BLOQUES,
  TEMAS,
  PLANTILLAS,
  LISTAS,
  vacio,
  ejemplo,
  normalizarPropuesta,
  totalServicio,
  calcularTotales
} from './modelo.js';
import {
  comprimir,
  descomprimir
} from './link.js';
import { MENSAJES_ACEPTACION, NOMBRE_MIN, limpiarNombre } from './aceptacion.js';

const CLAVE = 'generador-propuestas-v1';
const LOGO_MAX_ARCHIVO = 5 * 1024 * 1024;
const LOGO_MAX_LINK = 40000;
const PREFIJO = '#p=';
const RUTA_LINK = /^\/p\/([A-Za-z0-9]{20})\/?$/; // IDs de Firestore: 20 caracteres

const ICONO_SUMAR = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>';
const ICONO_SUMADO = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
const ICONO_CHECK = '<svg class="icono-check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6.5"/></svg>';

const escalarOpacidadSVG = (svg, opacidadPct = 100) => {
  const escala = Math.max(0, Math.min(2.5, numero(opacidadPct) / 100));
  if (!svg || escala <= 0) return '';
  if (Math.abs(escala - 1) < 0.01) return svg;
  return svg
    .split(/(<mask[\s\S]*?<\/mask>)/gi)
    .map(parte => {
      if (/^<mask/i.test(parte)) return parte;
      return parte.replace(/\b(stop-opacity|opacity)="([\d.]+)"/g, (m, attr, val) => {
        const num = parseFloat(val);
        if (!Number.isFinite(num) || num === 0) return m;
        const nuevo = Math.min(0.95, Math.max(0, +(num * escala).toFixed(3)));
        return `${attr}="${nuevo}"`;
      });
    })
    .join('');
};

const decoracionPortadaSVGBase = tipo => {
  switch (tipo) {
    case 'organica':
      return `
        <svg class="portada__svg portada__svg--organica" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="org-grad-a" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.2"/>
              <stop offset="55%" stop-color="currentColor" stop-opacity="0.07"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="org-grad-b" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.16"/>
              <stop offset="60%" stop-color="currentColor" stop-opacity="0.05"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </linearGradient>
            <radialGradient id="org-halo" cx="84%" cy="16%" r="46%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.18"/>
              <stop offset="60%" stop-color="currentColor" stop-opacity="0.04"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
            <mask id="org-safe">
              <rect width="800" height="1000" fill="white"/>
              <ellipse cx="340" cy="490" rx="310" ry="230" fill="black" opacity="0.72"/>
            </mask>
          </defs>
          <rect width="800" height="1000" fill="url(#org-halo)"/>
          <g mask="url(#org-safe)">
            <path d="M510,-60 C680,-50 860,70 850,260 C840,450 690,520 575,435 C460,350 420,210 455,75 C475,-5 480,-60 510,-60 Z" fill="url(#org-grad-a)"/>
            <path d="M600,-20 C750,10 850,150 815,310 C780,470 630,545 535,455 C440,365 450,170 530,50 C560,5 575,-25 600,-20 Z" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.22"/>
            <path d="M645,40 C755,65 820,185 785,315 C750,445 625,490 560,415 C495,340 535,15 645,40 Z" fill="none" stroke="currentColor" stroke-width="0.75" stroke-dasharray="3 5" opacity="0.18"/>
            <path d="M-90,740 C40,650 240,700 310,830 C380,960 270,1070 100,1055 C-70,1040 -150,795 -90,740 Z" fill="url(#org-grad-b)"/>
            <path d="M-50,805 C75,715 235,765 285,895 C315,970 250,1040 140,1035" fill="none" stroke="currentColor" stroke-width="1.15" opacity="0.2"/>
            <g opacity="0.22" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round">
              <path d="M655,295 C675,220 715,150 770,95"/>
              <path d="M675,245 C650,225 645,195 668,175 C692,188 692,220 675,245 Z" fill="currentColor" fill-opacity="0.08"/>
              <path d="M702,195 C728,182 745,198 738,224 C714,225 702,210 702,195 Z" fill="currentColor" fill-opacity="0.08"/>
              <path d="M722,152 C700,132 702,106 724,92 C742,108 738,135 722,152 Z" fill="currentColor" fill-opacity="0.08"/>
            </g>
            <g opacity="0.18" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
              <path d="M35,965 C75,895 130,840 205,795"/>
              <path d="M78,910 C60,885 65,856 90,844 C108,862 100,892 78,910 Z" fill="currentColor" fill-opacity="0.07"/>
              <path d="M128,858 C152,850 168,868 156,892 C134,890 124,874 128,858 Z" fill="currentColor" fill-opacity="0.07"/>
            </g>
            <circle cx="630" cy="160" r="3.5" fill="currentColor" opacity="0.28"/>
            <circle cx="585" cy="215" r="2" fill="currentColor" opacity="0.2"/>
            <circle cx="715" cy="275" r="2.5" fill="currentColor" opacity="0.22"/>
            <circle cx="195" cy="845" r="3" fill="currentColor" opacity="0.22"/>
            <circle cx="240" cy="790" r="1.8" fill="currentColor" opacity="0.16"/>
          </g>
          <rect x="36" y="36" width="728" height="928" rx="4" fill="none" stroke="currentColor" stroke-width="0.75" opacity="0.16"/>
        </svg>`;
    case 'geometrica':
      return `
        <svg class="portada__svg portada__svg--geometrica" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="geo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.18"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0.02"/>
            </linearGradient>
            <linearGradient id="geo-grad-2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.14"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </linearGradient>
            <pattern id="geo-halftone" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="9" cy="9" r="1.35" fill="currentColor" opacity="0.2"/>
            </pattern>
            <radialGradient id="geo-dot-mask-grad" cx="82%" cy="18%" r="36%">
              <stop offset="0%" stop-color="white" stop-opacity="1"/>
              <stop offset="65%" stop-color="white" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="black" stop-opacity="0"/>
            </radialGradient>
            <mask id="geo-dots-mask">
              <rect width="800" height="1000" fill="url(#geo-dot-mask-grad)"/>
            </mask>
            <mask id="geo-safe">
              <rect width="800" height="1000" fill="white"/>
              <ellipse cx="330" cy="495" rx="300" ry="230" fill="black" opacity="0.78"/>
            </mask>
          </defs>
          <rect width="800" height="1000" fill="url(#geo-halftone)" mask="url(#geo-dots-mask)"/>
          <g mask="url(#geo-safe)">
            <circle cx="695" cy="155" r="210" fill="none" stroke="currentColor" stroke-width="1" opacity="0.18"/>
            <circle cx="695" cy="155" r="165" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="10 8" opacity="0.22"/>
            <circle cx="695" cy="155" r="118" fill="url(#geo-grad-1)"/>
            <path d="M695,37 A118,118 0 0,1 813,155 L695,155 Z" fill="currentColor" opacity="0.09"/>
            <circle cx="695" cy="155" r="56" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.26"/>
            <circle cx="695" cy="155" r="14" fill="currentColor" opacity="0.24"/>
            <path d="M520,0 L800,280 M580,0 L800,220 M640,0 L800,160" stroke="currentColor" stroke-width="0.9" opacity="0.14"/>
            <path d="M0,780 L220,1000 L0,1000 Z" fill="url(#geo-grad-2)"/>
            <path d="M0,845 L155,1000" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.2"/>
            <path d="M40,960 A140,140 0 0,1 180,820" fill="none" stroke="currentColor" stroke-width="1.1" stroke-dasharray="4 6" opacity="0.22"/>
            <rect x="640" y="790" width="112" height="112" fill="none" stroke="currentColor" stroke-width="0.9" opacity="0.15"/>
            <path d="M640,902 A112,112 0 0,1 752,790" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.2"/>
          </g>
          <rect x="44" y="44" width="712" height="912" fill="none" stroke="currentColor" stroke-width="1" opacity="0.2"/>
          <rect x="60" y="60" width="32" height="5" fill="currentColor" opacity="0.38"/>
          <rect x="98" y="60" width="10" height="5" fill="currentColor" opacity="0.2"/>
          <g stroke="currentColor" stroke-width="1.1" opacity="0.32">
            <path d="M485,62 H499 M492,55 V69"/>
            <path d="M735,442 H749 M742,435 V449"/>
            <path d="M62,745 H76 M69,738 V752"/>
          </g>
        </svg>`;
    case 'aurora':
      return `
        <svg class="portada__svg portada__svg--aurora" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="aurora-a" cx="82%" cy="15%" r="52%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.3"/>
              <stop offset="45%" stop-color="currentColor" stop-opacity="0.1"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="aurora-b" cx="14%" cy="86%" r="48%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.22"/>
              <stop offset="55%" stop-color="currentColor" stop-opacity="0.06"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="aurora-c" cx="72%" cy="76%" r="36%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.14"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="aurora-mesh-fade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="white" stop-opacity="0.9"/>
              <stop offset="28%" stop-color="white" stop-opacity="0"/>
              <stop offset="74%" stop-color="white" stop-opacity="0"/>
              <stop offset="100%" stop-color="white" stop-opacity="0.75"/>
            </linearGradient>
            <mask id="aurora-mesh-mask">
              <rect width="800" height="1000" fill="url(#aurora-mesh-fade)"/>
            </mask>
            <mask id="aurora-safe">
              <rect width="800" height="1000" fill="white"/>
              <ellipse cx="340" cy="490" rx="310" ry="235" fill="black" opacity="0.76"/>
            </mask>
          </defs>
          <rect width="800" height="1000" fill="url(#aurora-a)"/>
          <rect width="800" height="1000" fill="url(#aurora-b)"/>
          <rect width="800" height="1000" fill="url(#aurora-c)"/>
          <g mask="url(#aurora-mesh-mask)" stroke="currentColor" stroke-width="0.75" opacity="0.16" fill="none">
            <path d="M0,60 H800 M0,115 H800 M0,170 H800 M0,225 H800"/>
            <path d="M120,0 L40,250 M260,0 L210,250 M400,0 L400,250 M540,0 L590,250 M680,0 L760,250"/>
            <path d="M0,780 H800 M0,835 H800 M0,890 H800 M0,945 H800"/>
            <path d="M160,750 L60,1000 M300,750 L240,1000 M440,750 L440,1000 M580,750 L640,1000 M720,750 L820,1000"/>
          </g>
          <g mask="url(#aurora-safe)">
            <ellipse cx="655" cy="175" rx="220" ry="115" transform="rotate(-18 655 175)" fill="none" stroke="currentColor" stroke-width="1" opacity="0.22"/>
            <ellipse cx="655" cy="175" rx="155" ry="76" transform="rotate(-18 655 175)" fill="none" stroke="currentColor" stroke-width="0.85" stroke-dasharray="5 7" opacity="0.2"/>
            <path d="M510,130 C590,85 690,110 755,190 C680,235 585,220 510,130 Z" fill="currentColor" opacity="0.05"/>
            <g stroke="currentColor" stroke-width="0.9" opacity="0.22" fill="none">
              <path d="M555,115 L635,85 L715,135 L685,215 L590,195 Z"/>
              <path d="M635,85 L685,215 M555,115 L715,135" stroke-dasharray="2 4" opacity="0.7"/>
            </g>
            <circle cx="555" cy="115" r="3" fill="currentColor" opacity="0.4"/>
            <circle cx="635" cy="85" r="3.5" fill="currentColor" opacity="0.45"/>
            <circle cx="715" cy="135" r="4" fill="currentColor" opacity="0.5"/>
            <circle cx="685" cy="215" r="3" fill="currentColor" opacity="0.38"/>
            <circle cx="590" cy="195" r="2.5" fill="currentColor" opacity="0.32"/>
            <path d="M690,68 L694,82 L708,86 L694,90 L690,104 L686,90 L672,86 L686,82 Z" fill="currentColor" opacity="0.48"/>
            <path d="M530,220 L532.5,229 L541.5,231.5 L532.5,234 L530,243 L527.5,234 L518.5,231.5 L527.5,229 Z" fill="currentColor" opacity="0.32"/>
            <path d="M125,805 L128,815 L138,818 L128,821 L125,831 L122,821 L112,818 L122,815 Z" fill="currentColor" opacity="0.34"/>
          </g>
          <rect x="38" y="38" width="724" height="924" rx="6" fill="none" stroke="currentColor" stroke-width="0.85" opacity="0.18"/>
        </svg>`;
    case 'trama':
      return `
        <svg class="portada__svg portada__svg--trama" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="trama-menor" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.11"/>
            </pattern>
            <pattern id="trama-mayor" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#trama-menor)"/>
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" stroke-width="0.9" opacity="0.2"/>
              <circle cx="0" cy="0" r="1.4" fill="currentColor" opacity="0.32"/>
            </pattern>
            <radialGradient id="trama-vignette" cx="38%" cy="48%" r="62%">
              <stop offset="0%" stop-color="black" stop-opacity="1"/>
              <stop offset="42%" stop-color="gray" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="white" stop-opacity="1"/>
            </radialGradient>
            <mask id="trama-mask">
              <rect width="800" height="1000" fill="url(#trama-vignette)"/>
            </mask>
          </defs>
          <g mask="url(#trama-mask)">
            <rect x="44" y="44" width="712" height="912" fill="url(#trama-mayor)"/>
            <g transform="translate(650, 175)" fill="none" stroke="currentColor">
              <circle cx="0" cy="0" r="92" stroke-width="1" opacity="0.24"/>
              <circle cx="0" cy="0" r="68" stroke-width="0.8" stroke-dasharray="3 4" opacity="0.22"/>
              <circle cx="0" cy="0" r="34" stroke-width="0.9" opacity="0.24"/>
              <circle cx="0" cy="0" r="3" fill="currentColor" opacity="0.38"/>
              <path d="M-108,0 H108 M0,-108 V108" stroke-width="0.75" opacity="0.22"/>
              <path d="M-65,-65 L65,65 M-65,65 L65,-65" stroke-width="0.6" stroke-dasharray="2 5" opacity="0.18"/>
              <path d="M0,-92 A92,92 0 0,1 92,0" stroke-width="2" opacity="0.34"/>
            </g>
            <path d="M540,44 V956" stroke="currentColor" stroke-width="0.8" stroke-dasharray="4 6" opacity="0.18"/>
            <path d="M44,265 H756" stroke="currentColor" stroke-width="0.8" stroke-dasharray="4 6" opacity="0.16"/>
            <path d="M756,740 A216,216 0 0,0 540,956" fill="none" stroke="currentColor" stroke-width="0.9" opacity="0.2"/>
          </g>
          <rect x="44" y="44" width="712" height="912" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.26"/>
          <rect x="52" y="52" width="696" height="896" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.14"/>
          <path d="M32,44 H60 M44,32 V60 M740,44 H768 M756,32 V60 M32,956 H60 M44,940 V968 M740,956 H768 M756,940 V968" stroke="currentColor" stroke-width="1.6" opacity="0.42"/>
          <g fill="currentColor" opacity="0.28">
            <rect x="64" y="38" width="18" height="3"/>
            <rect x="86" y="38" width="6" height="3"/>
            <rect x="96" y="38" width="6" height="3"/>
            <rect x="690" y="959" width="24" height="3"/>
            <rect x="678" y="959" width="8" height="3"/>
          </g>
        </svg>`;
    case 'ondas':
      return `
        <svg class="portada__svg portada__svg--ondas" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="onda-linea" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.04"/>
              <stop offset="45%" stop-color="currentColor" stop-opacity="0.26"/>
              <stop offset="85%" stop-color="currentColor" stop-opacity="0.32"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0.08"/>
            </linearGradient>
            <linearGradient id="onda-fill-top" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.15"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="onda-fill-bot" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.16"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </linearGradient>
            <radialGradient id="onda-flare" cx="82%" cy="16%" r="38%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.22"/>
              <stop offset="50%" stop-color="currentColor" stop-opacity="0.05"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="800" height="1000" fill="url(#onda-flare)"/>
          <path d="M0,150 C240,55 460,225 800,85 L800,0 L0,0 Z" fill="url(#onda-fill-top)"/>
          <g fill="none" stroke="url(#onda-linea)">
            <path d="M-40,95 C210,10 450,190 840,55" stroke-width="1.5"/>
            <path d="M-40,122 C225,35 465,205 840,82" stroke-width="1.2" opacity="0.85"/>
            <path d="M-40,149 C240,60 480,220 840,109" stroke-width="1" opacity="0.7"/>
            <path d="M-40,176 C255,85 495,235 840,136" stroke-width="0.85" opacity="0.55"/>
            <path d="M-40,203 C270,110 510,250 840,163" stroke-width="0.7" opacity="0.4"/>
          </g>
          <path d="M0,845 C250,765 510,935 800,810 L800,1000 L0,1000 Z" fill="url(#onda-fill-bot)"/>
          <g fill="none" stroke="url(#onda-linea)">
            <path d="M-40,785 C235,705 500,895 840,755" stroke-width="0.75" opacity="0.45"/>
            <path d="M-40,812 C245,730 510,910 840,782" stroke-width="0.95" opacity="0.65"/>
            <path d="M-40,839 C255,755 520,925 840,809" stroke-width="1.25" opacity="0.85"/>
            <path d="M-40,866 C265,780 530,940 840,836" stroke-width="1.6"/>
            <path d="M-40,893 C275,805 540,955 840,863" stroke-width="1.1" opacity="0.75"/>
            <path d="M-40,920 C285,830 550,970 840,890" stroke-width="0.8" opacity="0.5"/>
          </g>
          <g transform="translate(665, 160)" fill="none" stroke="currentColor" opacity="0.22">
            <circle cx="0" cy="0" r="64" stroke-width="0.9"/>
            <circle cx="0" cy="0" r="42" stroke-width="0.7" stroke-dasharray="3 5"/>
            <circle cx="0" cy="0" r="4" fill="currentColor" opacity="0.6"/>
          </g>
          <path d="M42,68 V42 H68 M732,42 H758 V68 M42,932 V958 H68 M732,958 H758 V932" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.32"/>
        </svg>`;
    case 'ninguna':
      return '';
    case 'marco':
    default:
      return `
        <svg class="portada__svg portada__svg--marco" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="marco-luz" cx="82%" cy="16%" r="50%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.16"/>
              <stop offset="55%" stop-color="currentColor" stop-opacity="0.04"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="marco-luz-pie" cx="18%" cy="88%" r="44%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.1"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="800" height="1000" fill="url(#marco-luz)"/>
          <rect width="800" height="1000" fill="url(#marco-luz-pie)"/>
          <g transform="translate(675, 145)" fill="none" stroke="currentColor" opacity="0.2">
            <circle cx="0" cy="0" r="78" stroke-width="0.8"/>
            <circle cx="0" cy="0" r="58" stroke-width="0.7" stroke-dasharray="2 5"/>
            <ellipse cx="0" cy="0" rx="78" ry="26" transform="rotate(30)" stroke-width="0.65"/>
            <ellipse cx="0" cy="0" rx="78" ry="26" transform="rotate(-30)" stroke-width="0.65"/>
            <ellipse cx="0" cy="0" rx="78" ry="26" transform="rotate(90)" stroke-width="0.65"/>
            <polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" fill="currentColor" opacity="0.55" stroke="none"/>
          </g>
          <rect x="36" y="36" width="728" height="928" fill="none" stroke="currentColor" stroke-width="1.15" opacity="0.3"/>
          <rect x="46" y="46" width="708" height="908" fill="none" stroke="currentColor" stroke-width="0.7" opacity="0.16"/>
          <path d="M36,76 L76,36 M724,36 L764,76 M36,924 L76,964 M724,964 L764,924" stroke="currentColor" stroke-width="1.1" opacity="0.32"/>
          <path d="M46,86 L86,46 M714,46 L754,86 M46,914 L86,954 M714,954 L754,914" stroke="currentColor" stroke-width="0.7" opacity="0.2"/>
          <g fill="currentColor" opacity="0.42">
            <polygon points="400,29 407,36 400,43 393,36"/>
            <polygon points="400,957 407,964 400,971 393,964"/>
            <polygon points="29,500 36,507 43,500 36,493"/>
            <polygon points="757,500 764,507 771,500 764,493"/>
          </g>
        </svg>`;
  }
};

const decoracionPortadaSVG = (tipo, opacidadPct = 100) => escalarOpacidadSVG(decoracionPortadaSVGBase(tipo), opacidadPct);

const normalizar = datos => normalizarPropuesta(datos, { logoValido: esLogoValido });

const leerLocal = clave => {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? normalizar(JSON.parse(crudo)) : null;
  } catch {
    return null;
  }
};

// Sin cuenta, la propuesta vive solo en este navegador.
const cargarGuardado = () => leerLocal(CLAVE);

let estado = vacio();
let seleccion = new Set();
let esCliente = false;
// Link corto abierto por el cliente: { id, aceptacion }. aceptacion es null hasta que acepta.
let compartida = null;
const aceptada = () => !!compartida?.aceptacion;
let vista = 'escritorio';
let imprimiendo = false;

const servicioConContenido = s => s.nombre.trim() || numero(s.precio) > 0;

const calcular = (e = estado, sumados = seleccion) => calcularTotales(e, sumados);

const vigencia = () => {
  const fecha = desdeISO(estado.propuesta.fecha);
  const dias = Math.max(0, Math.round(numero(estado.propuesta.validez)));
  if (!fecha || !dias) return { fecha, vence: null, restantes: null, vencida: false };
  const vence = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const restantes = Math.round((vence - hoy) / 86400000);
  return { fecha, vence, restantes, vencida: restantes < 0 };
};

const digitosWhatsApp = () => estado.emisor.telefono.replace(/\D/g, '');

const enlaceWhatsApp = mensaje => {
  const d = digitosWhatsApp();
  return d.length >= 8 ? `https://wa.me/${d}?text=${encodeURIComponent(mensaje)}` : '';
};

const enlaceEmail = (asunto, mensaje) => {
  const mail = estado.emisor.email.trim();
  return mail ? `mailto:${mail}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}` : '';
};

const nombreEmisor = () => estado.emisor.nombre.trim();
const tituloPropuesta = () => estado.propuesta.titulo.trim() || 'la propuesta';

const mensajeConsulta = () => `Hola${nombreEmisor() ? ` ${nombreEmisor().split(' ')[0]}` : ''}, tengo una consulta sobre la propuesta «${tituloPropuesta()}».`;

const enlaceConsulta = () => enlaceWhatsApp(mensajeConsulta()) || enlaceEmail(`Consulta sobre ${tituloPropuesta()}`, mensajeConsulta());

const elAviso = $('#aviso');
let temporizadorAviso;
const avisar = (mensaje, ms = 4200) => {
  elAviso.textContent = mensaje;
  elAviso.classList.add('aviso--visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => elAviso.classList.remove('aviso--visible'), ms);
};

// Guardado en la cuenta: cada propuesta es un documento en Firestore (proposals/{id}).
// Sin cuenta (Firebase no disponible), la propuesta queda en este navegador.
const GUARDADO_ESPERA = 800;
const PAYLOAD_MAX = 900000; // Firestore admite hasta 1 MiB por documento
const AVISO_PESADA = 'La propuesta es demasiado pesada para guardarse (probá con un logo más liviano). Usá «Guardar borrador» para no perder los cambios.';
const elEstado = $('#estado-guardado');
let propuestaId = null;
let editando = false;
let temporizadorGuardado = null;
let escriturasPendientes = 0;
let ultimaEscritura = Promise.resolve(true);
let errorGuardado = '';
let avisoError = false;

const nube = () => (AteneaDB && AteneaDB.auth.getUser() ? AteneaDB : null);

const mostrarEstadoGuardado = () => {
  if (!elEstado || esCliente) return;
  if (errorGuardado) elEstado.textContent = errorGuardado;
  else if (!nube()) elEstado.textContent = 'Los cambios se guardan en este navegador.';
  else if (escriturasPendientes && !navigator.onLine) elEstado.textContent = 'Sin conexión: los cambios se suben a tu cuenta cuando vuelva.';
  else if (temporizadorGuardado || escriturasPendientes) elEstado.textContent = 'Guardando…';
  else elEstado.textContent = 'Cambios guardados en tu cuenta.';
};
window.addEventListener('online', mostrarEstadoGuardado);
window.addEventListener('offline', mostrarEstadoGuardado);

const fallarGuardado = mensaje => {
  errorGuardado = mensaje;
  if (!avisoError) {
    avisoError = true;
    avisar(mensaje, 7000);
  }
};

// Resumen que se guarda junto al contenido para poder listar sin abrir cada propuesta.
// Devuelve null si la propuesta no entra en un documento de Firestore.
const datosParaGuardar = e => {
  const payload = JSON.stringify(e);
  if (payload.length > PAYLOAD_MAX) return null;
  return {
    title: e.propuesta.titulo.trim(),
    clientName: e.cliente.empresa.trim() || e.cliente.nombre.trim(),
    amount: calcular(e, new Set()).inicial.total, // sin opcionales
    theme: e.tema.preset,
    payload: JSON.parse(payload)
  };
};

// Todas las escrituras pasan por acá: así el estado de guardado y el cierre de
// sesión saben si queda algo por llegar al servidor.
const registrarEscritura = (promesa, mensajeError) => {
  escriturasPendientes++;
  mostrarEstadoGuardado();
  const resultado = promesa
    .then(() => {
      errorGuardado = '';
      avisoError = false;
      return true;
    })
    .catch(e => {
      console.error(mensajeError, e);
      fallarGuardado(mensajeError);
      return false;
    })
    .finally(() => {
      escriturasPendientes--;
      mostrarEstadoGuardado();
    });
  ultimaEscritura = resultado;
  return resultado;
};

const guardarLocal = () => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
    errorGuardado = '';
  } catch {
    fallarGuardado('No se pudo guardar en este navegador. Usá «Guardar borrador» para no perder los cambios.');
  }
  mostrarEstadoGuardado();
};

const guardarAhora = () => {
  clearTimeout(temporizadorGuardado);
  temporizadorGuardado = null;
  if (!editando) return;
  const db = nube();
  if (!db) return guardarLocal();
  if (!propuestaId) return;
  const datos = datosParaGuardar(estado);
  if (!datos) {
    fallarGuardado(AVISO_PESADA);
    mostrarEstadoGuardado();
    return;
  }
  return registrarEscritura(
    db.proposals.actualizar(propuestaId, datos),
    'No se pudieron guardar los últimos cambios en tu cuenta. Usá «Guardar borrador» para no perderlos.'
  );
};

const guardarLuego = () => {
  if (esCliente || !editando) return;
  clearTimeout(temporizadorGuardado);
  temporizadorGuardado = setTimeout(guardarAhora, nube() ? GUARDADO_ESPERA : 400);
  mostrarEstadoGuardado();
};

// Si la pestaña se oculta o se cierra, no esperar al temporizador ni al próximo
// cuadro de animación (en pestañas ocultas no llega nunca).
const hayCambiosSinEnviar = () => editando && !esCliente && (temporizadorGuardado || renderPendiente);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && hayCambiosSinEnviar()) guardarAhora();
});
window.addEventListener('beforeunload', ev => {
  if (hayCambiosSinEnviar()) guardarAhora();
  if (escriturasPendientes && navigator.onLine) {
    ev.preventDefault();
    ev.returnValue = '';
  }
});

// Crea una propuesta en la cuenta. El ID sale del cliente, así se puede abrir
// y seguir editando sin esperar al servidor (y sin conexión).
const crearEnCuenta = e => {
  const datos = datosParaGuardar(e);
  if (!datos) {
    avisar(AVISO_PESADA, 7000);
    return null;
  }
  const id = AteneaDB.proposals.nuevoId();
  const listo = registrarEscritura(AteneaDB.proposals.crear(datos, id), 'No se pudo crear la propuesta en tu cuenta.');
  return { id, listo };
};

// Migración única: lo que la versión anterior guardaba en el navegador pasa a la
// cuenta, y se borra del navegador recién cuando el servidor confirmó la copia.
// Devuelve { id, contenido } de la propuesta creada, o null si no había nada que migrar.
const migrarLocal = () => {
  const claves = [`${CLAVE}:borrador:${AteneaDB.auth.getUid()}`, CLAVE];
  const clave = claves.find(c => leerLocal(c));
  if (!clave) return null;
  const contenido = leerLocal(clave);
  const creada = crearEnCuenta(contenido);
  if (!creada) return null;
  creada.listo.then(ok => {
    if (ok) try { localStorage.removeItem(clave); } catch {}
  });
  avisar('Guardamos en tu cuenta la propuesta que armaste.', 6000);
  return { id: creada.id, contenido };
};

const plantillaControles = $('#tpl-controles');

const actualizarItemServicio = (nodo, s) => {
  const modo = MODALIDADES[s.modalidad] || MODALIDADES.unico;
  $('[data-etiqueta-cantidad]', nodo).textContent = modo.cantidad;
  $('[data-etiqueta-precio]', nodo).textContent = modo.precio;
  const sufijo = s.modalidad === 'mensual' ? ' por mes' : '';
  $('[data-subtotal]', nodo).textContent = dinero(totalServicio(s), estado.inversion.moneda) + sufijo;
  nodo.classList.toggle('item--opcional', !!s.opcional);
};

const renderLista = nombre => {
  const conf = LISTAS[nombre];
  const contenedor = $(`.lista[data-lista="${nombre}"]`);
  const plantilla = $(`#tpl-${nombre}`);
  const arr = obtener(estado, conf.ruta);
  const nodos = arr.map((item, i) => {
    const nodo = plantilla.content.firstElementChild.cloneNode(true);
    nodo.dataset.indice = i;
    $$('[data-item]', nodo).forEach(el => {
      const v = item[el.dataset.item];
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = v ?? '';
    });
    const orden = $('[data-orden]', nodo);
    if (orden) orden.textContent = i + 1;
    const controles = $('[data-controles]', nodo);
    controles.append(plantillaControles.content.cloneNode(true));
    const [subir, bajar, quitar] = controles.children;
    subir.disabled = i === 0;
    bajar.disabled = i === arr.length - 1;
    subir.setAttribute('aria-label', `Subir ${conf.nombre} ${i + 1}`);
    bajar.setAttribute('aria-label', `Bajar ${conf.nombre} ${i + 1}`);
    quitar.setAttribute('aria-label', `Quitar ${conf.nombre} ${i + 1}`);
    if (nombre === 'servicios') actualizarItemServicio(nodo, item);
    return nodo;
  });
  contenedor.replaceChildren(...nodos);
};

const renderListas = () => Object.keys(LISTAS).forEach(renderLista);

const actualizarSubtotales = () => {
  $$('.lista[data-lista="servicios"] > .item').forEach(nodo => {
    const s = estado.servicios[Number(nodo.dataset.indice)];
    if (s) actualizarItemServicio(nodo, s);
  });
};

const actualizarAvisoPagos = () => {
  const el = $('#aviso-pagos');
  const pagos = estado.inversion.pagos;
  const suma = Math.round(pagos.reduce((t, p) => t + numero(p.porcentaje), 0) * 100) / 100;
  el.hidden = !pagos.length || suma === 100;
  if (!el.hidden) el.textContent = `Los porcentajes suman ${cantidadTexto(suma)}%. Ajustalos para que lleguen a 100%.`;
};

const actualizarLogo = () => {
  const logo = estado.emisor.logo;
  const vistaLogo = $('#logo-vista');
  vistaLogo.hidden = !logo;
  if (logo) vistaLogo.src = logo;
  else vistaLogo.removeAttribute('src');
  $('#logo-quitar').hidden = !logo;
  $('#logo-texto').textContent = logo ? 'Cambiar logo' : 'Subir logo';
};

const llenarFormulario = () => {
  $$('[data-campo]').forEach(el => {
    const v = obtener(estado, el.dataset.campo);
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v ?? '';
  });
  actualizarLogo();
  renderListas();
  llenarTemaEditor();
};

const vacioHTML = t => `<span class="doc__vacio">${esc(t)}</span>`;

const servicioHTML = (s, moneda, web) => {
  const precio = numero(s.precio);
  const cantidad = numero(s.cantidad);
  let modo = 'Pago único';
  if (s.modalidad === 'mensual') modo = cantidad === 1 ? 'por mes' : `${cantidadTexto(cantidad)} × ${dinero(precio, moneda)} por mes`;
  else if (s.modalidad === 'hora') modo = `${cantidadTexto(cantidad)} h × ${dinero(precio, moneda)}`;
  else if (cantidad !== 1) modo = `${cantidadTexto(cantidad)} × ${dinero(precio, moneda)}`;
  const sumado = s.opcional && seleccion.has(s.id);
  if (sumado && !web) modo += ', sumado por el cliente';
  const entregables = lineas(s.entregables);
  const etiquetaModalidad = s.modalidad === 'mensual' ? 'Abono mensual' : s.modalidad === 'hora' ? 'Por hora' : 'Incluido';
  const insignia = s.opcional
    ? `<span class="servicio__chip servicio__chip--opcional">${sumado ? 'Opcional sumado' : 'Opcional'}</span>`
    : `<span class="servicio__chip">${etiquetaModalidad}</span>`;
  const boton = web && s.opcional && aceptada()
    ? (sumado ? `<span class="servicio__incluido">${ICONO_SUMADO} Incluido en la aceptación</span>` : '')
    : web && s.opcional
    ? `<button type="button" class="servicio__sumar" data-accion="sumar" data-id="${esc(s.id)}" aria-pressed="${sumado}">${sumado ? `${ICONO_SUMADO} Sumado a la propuesta` : `${ICONO_SUMAR} Sumar a la propuesta`}</button>`
    : '';
  return `
    <div class="servicio${s.opcional ? ' servicio--opcional' : ''}${sumado ? ' servicio--sumado' : ''}">
      <div class="servicio__cabecera">
        <div class="servicio__titular">
          ${insignia}
          <h3 class="servicio__nombre">${s.nombre.trim() ? esc(s.nombre) : vacioHTML('Servicio sin nombre')}</h3>
        </div>
        <p class="servicio__precio">${dinero(totalServicio(s), moneda)}<span class="servicio__modo">${esc(modo)}</span></p>
      </div>
      ${s.descripcion.trim() ? `<p class="servicio__desc">${esc(s.descripcion.trim()).replace(/\n/g, '<br>')}</p>` : ''}
      ${entregables.length ? `<ul class="doc-lista servicio__entregables">${entregables.map(e => `<li>${ICONO_CHECK}<span>${esc(e)}</span></li>`).join('')}</ul>` : ''}
      ${boton}
    </div>`;
};

const filasResumen = (b, c, sufijo = '') => {
  const filas = [];
  const m = estado.inversion.moneda;
  if (c.descuento > 0 || c.impuesto > 0) filas.push(['Subtotal', dinero(b.base, m)]);
  if (c.descuento > 0) filas.push([`Descuento (${cantidadTexto(c.descuento * 100)}%)`, `−${dinero(b.desc, m)}`]);
  if (c.impuesto > 0) filas.push([`${estado.inversion.impuestoNombre.trim() || 'Impuestos'} (${cantidadTexto(c.impuesto * 100)}%)`, dinero(b.imp, m)]);
  return `
    <dl class="resumen__filas">
      ${filas.map(([a, v]) => `<div class="resumen__fila"><dt>${esc(a)}</dt><dd>${v}</dd></div>`).join('')}
      <div class="resumen__fila resumen__fila--total"><dt>Total</dt><dd>${dinero(b.total, m)}${sufijo ? `<span class="resumen__sufijo"> ${sufijo}</span>` : ''}</dd></div>
    </dl>`;
};

const textoRestantes = n => (n === 0 ? 'Vence hoy' : n === 1 ? 'Queda 1 día' : `Quedan ${n} días`);

const barraClienteHTML = (c, vig) => {
  const m = estado.inversion.moneda;
  if (c.inicial.base <= 0 && c.mensual.base <= 0) return '';
  let etiqueta;
  let monto;
  let extra = '';
  if (c.inicial.base > 0) {
    etiqueta = c.mensual.base > 0 ? 'Inversión inicial' : 'Inversión total';
    monto = dinero(c.inicial.total, m);
    if (c.mensual.base > 0) extra = `+ ${dinero(c.mensual.total, m)} por mes`;
  } else {
    etiqueta = 'Servicio mensual';
    monto = dinero(c.mensual.total, m);
    extra = 'por mes';
  }
  const consulta = enlaceConsulta();
  const accion = aceptada()
    ? '<span class="barra-cliente__aceptada">Propuesta aceptada</span>'
    : vig.vencida
    ? (consulta ? `<a class="boton boton--primario" href="${esc(consulta)}" target="_blank" rel="noopener" data-enlace-cliente>Pedir una actualización</a>` : '')
    : `<button type="button" class="boton boton--primario" data-accion="aceptar">Aceptar propuesta</button>`;
  return `
    <div class="barra-cliente">
      <div>
        <span class="barra-cliente__etiqueta">${etiqueta}</span>
        <span class="barra-cliente__monto">${monto}</span>
        ${extra ? `<span class="barra-cliente__extra">${extra}</span>` : ''}
      </div>
      ${accion}
    </div>`;
};

const fechaDeAceptacion = a => {
  const f = a?.fecha;
  const d = f && typeof f.toDate === 'function' ? f.toDate() : f ? new Date(f) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

const cierreHTML = vig => {
  const consulta = enlaceConsulta();
  const emisor = nombreEmisor();
  if (aceptada()) {
    const a = compartida.aceptacion;
    const fecha = fechaDeAceptacion(a);
    return `
      <div class="cierre cierre--aceptada">
        <p class="cierre__titulo">Propuesta aceptada</p>
        <p class="cierre__texto">Aceptada por ${esc(a.nombre)}${fecha ? ` el ${esc(fechaLarga(fecha))}` : ''}. Esta es la versión que se aceptó.</p>
        ${consulta ? `<div class="cierre__acciones"><a class="boton boton--secundario boton--grande" href="${esc(consulta)}" target="_blank" rel="noopener" data-enlace-cliente>Hacer una consulta</a></div>` : ''}
      </div>`;
  }
  if (vig.vencida) {
    return `
      <div class="cierre">
        <p class="cierre__titulo">Esta propuesta venció</p>
        <p class="cierre__texto">Los valores y plazos pueden haber cambiado. Pedile ${emisor ? `a ${esc(emisor)} ` : ''}una versión actualizada.</p>
        ${consulta ? `<div class="cierre__acciones"><a class="boton boton--primario boton--grande" href="${esc(consulta)}" target="_blank" rel="noopener" data-enlace-cliente>Pedir una actualización</a></div>` : ''}
      </div>`;
  }
  const textoCierre = compartida
    ? `Al aceptar, ${emisor ? esc(emisor) : 'quien te la mandó'} recibe tu confirmación con lo que elegiste.`
    : `Al aceptar se abre un mensaje con el resumen de lo que elegiste${emisor ? `, listo para mandárselo a ${esc(emisor)}` : ''}.`;
  return `
    <div class="cierre">
      <p class="cierre__titulo">¿Avanzamos?</p>
      <p class="cierre__texto">${textoCierre}</p>
      <div class="cierre__acciones">
        <button type="button" class="boton boton--primario boton--grande" data-accion="aceptar">Aceptar propuesta</button>
        ${consulta ? `<a class="boton boton--secundario boton--grande" href="${esc(consulta)}" target="_blank" rel="noopener" data-enlace-cliente>Hacer una consulta</a>` : ''}
      </div>
    </div>`;
};

let observador;
const OBS_SEL = '.bloque, .resumen, .cierre, .pie, .doc-aviso';
const HIJO_SEL = '.servicio, .etapa';
const observarElementos = raiz => {
  if (observador) observador.disconnect();
  const todos = raiz.querySelectorAll(`${OBS_SEL}, ${HIJO_SEL}`);
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    todos.forEach(el => el.classList.add('visible'));
    return;
  }
  const scrollRoot = esCliente ? null : raiz.closest('.visor');
  observador = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.querySelectorAll(HIJO_SEL).forEach((h, i) => {
          h.style.transitionDelay = `${i * 0.08}s`;
          h.classList.add('visible');
        });
        observador.unobserve(entry.target);
      }
    });
  }, { root: scrollRoot, rootMargin: '0px 0px 300px 0px', threshold: 0.01 });
  const viewH = scrollRoot ? scrollRoot.clientHeight : window.innerHeight;
  const rootTop = scrollRoot ? scrollRoot.getBoundingClientRect().top : 0;
  const targets = raiz.querySelectorAll(OBS_SEL);
  let delay = 0;
  targets.forEach(el => {
    const rect = el.getBoundingClientRect();
    const enVista = rect.top - rootTop < viewH;
    if (enVista) {
      el.style.transitionDelay = `${delay}s`;
      delay += 0.07;
      el.querySelectorAll(HIJO_SEL).forEach((h, i) => {
        h.style.transitionDelay = `${delay + i * 0.08}s`;
      });
    }
    observador.observe(el);
  });
};

const hexARgb = hex => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const rgbAHex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

const mezclar = (hex, blanco, t) => {
  const [r, g, b] = hexARgb(hex);
  const f = blanco ? 255 : 0;
  return rgbAHex(r + (f - r) * t, g + (f - g) * t, b + (f - b) * t);
};

const conAlpha = (hex, a) => { const [r, g, b] = hexARgb(hex); return `rgba(${r}, ${g}, ${b}, ${a})`; };

const luminancia = hex => { const [r, g, b] = hexARgb(hex).map(v => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

const fuentesEnUso = new Set();
const cargarFuente = nombre => {
  if (fuentesEnUso.has(nombre)) return;
  fuentesEnUso.add(nombre);
  const pesos = nombre === 'Bebas Neue' || nombre === 'Archivo Black' ? '400' : '400;500;700';
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(nombre)}:wght@${pesos}&display=swap`;
  document.head.append(link);
};

const esHexValido = v => /^#[0-9A-Fa-f]{6}$/.test(String(v || '').trim());

const mezclarColores = (hex1, hex2, peso) => {
  const [r1, g1, b1] = hexARgb(hex1);
  const [r2, g2, b2] = hexARgb(hex2);
  return rgbAHex(r1 + (r2 - r1) * peso, g1 + (g2 - g1) * peso, b1 + (b2 - b1) * peso);
};

const resolverColoresTema = (t = estado.tema) => {
  const preset = TEMAS[t.preset] || TEMAS['elegante-oscuro'];
  const esClaro = preset.modo === 'claro';
  const acento = esHexValido(t.acento) ? t.acento : preset.acento;
  const lumAcento = luminancia(acento);
  const lumFondo = luminancia(preset.fondo);

  // Tinta de contraste para botones y chips rellenos con el color de marca
  const acentoTinta = lumAcento > 0.42 ? '#0A0A0F' : '#FFFFFF';
  const acentoBordeContraste = Math.abs(lumAcento - lumFondo) < 0.14
    ? (esClaro ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.28)')
    : 'transparent';

  // Versión legible del acento para textos, montos y numeración sobre el fondo del documento
  let acentoLectura = acento;
  if (!esClaro && lumAcento < 0.24) {
    const factorLuz = Math.min(0.76, Math.max(0.46, (0.3 - lumAcento) * 2.4));
    acentoLectura = mezclar(acento, true, factorLuz);
  } else if (esClaro && lumAcento > 0.72) {
    acentoLectura = mezclar(acento, false, 0.45);
  }

  // Fondo de portada
  let portadaBg = esClaro ? mezclar(acento, false, 0.72) : preset.fondo;
  const colorTextoPersonalizado = esHexValido(t.colorTexto) ? t.colorTexto : '';
  if (esClaro && colorTextoPersonalizado && luminancia(colorTextoPersonalizado) < 0.3) {
    portadaBg = mezclar(acento, true, 0.88);
  }
  const lumPortada = luminancia(portadaBg);

  // Color de tipografía en portada y en cuerpo
  const portadaTexto = colorTextoPersonalizado
    || (esClaro ? (lumPortada > 0.4 ? '#111111' : '#F5F5F0') : preset.texto);

  let cuerpoTexto = colorTextoPersonalizado || preset.texto;
  if (colorTextoPersonalizado && Math.abs(luminancia(colorTextoPersonalizado) - lumFondo) < 0.18) {
    cuerpoTexto = esClaro ? mezclar(colorTextoPersonalizado, false, 0.78) : mezclar(colorTextoPersonalizado, true, 0.78);
  }
  const cuerpoApagado = colorTextoPersonalizado ? mezclarColores(cuerpoTexto, preset.fondo, 0.36) : preset.textoApagado;
  const cuerpoTenue = colorTextoPersonalizado ? mezclarColores(cuerpoTexto, preset.fondo, 0.58) : preset.textoTenue;

  // Color de acento en portada (para reglas, bordes y chips)
  let portadaAcento = esClaro ? mezclar(acento, true, 0.18) : acentoLectura;
  if (lumPortada < 0.35 && luminancia(portadaAcento) < 0.24) {
    portadaAcento = mezclar(acento, true, 0.62);
  } else if (lumPortada >= 0.35 && luminancia(portadaAcento) > 0.72) {
    portadaAcento = mezclar(acento, false, 0.45);
  }

  // Color de decoración SVG y marca de agua
  let colorSvg = esHexValido(t.colorSvg) ? t.colorSvg : '';
  if (!colorSvg) {
    if (lumPortada < 0.35) {
      colorSvg = lumAcento < 0.26
        ? mezclar(acento, true, Math.min(0.72, Math.max(0.45, (0.32 - lumAcento) * 2.2)))
        : (esClaro ? mezclar(acento, true, 0.18) : acento);
    } else {
      colorSvg = lumAcento > 0.72 ? mezclar(acento, false, 0.45) : acento;
    }
  }

  const opacidadSvg = t.opacidadSvg !== undefined && t.opacidadSvg !== null && t.opacidadSvg !== ''
    ? Math.min(200, Math.max(0, Math.round(numero(t.opacidadSvg))))
    : 100;

  return {
    preset,
    esClaro,
    acento,
    acentoTinta,
    acentoBordeContraste,
    acentoLectura,
    portadaBg,
    portadaTexto,
    portadaAcento,
    cuerpoTexto,
    cuerpoApagado,
    cuerpoTenue,
    colorSvg,
    opacidadSvg
  };
};

const aplicarTema = doc => {
  const t = estado.tema;
  const col = resolverColoresTema(t);
  const { preset, esClaro, acento } = col;

  doc.style.setProperty('--negro', preset.fondo);
  doc.style.setProperty('--negro-2', preset.fondo2);
  doc.style.setProperty('--superficie', preset.superficie);
  doc.style.setProperty('--superficie-borde', preset.superficieBorde);
  doc.style.setProperty('--marfil', col.cuerpoTexto);
  doc.style.setProperty('--marfil-apagado', col.cuerpoApagado);
  doc.style.setProperty('--marfil-tenue', col.cuerpoTenue);

  doc.style.setProperty('--dorado', acento);
  doc.style.setProperty('--dorado-lectura', col.acentoLectura);
  doc.style.setProperty('--acento-tinta', col.acentoTinta);
  doc.style.setProperty('--acento-borde-contraste', col.acentoBordeContraste);
  doc.style.setProperty('--dorado-claro', mezclar(col.acentoLectura, true, 0.3));
  doc.style.setProperty('--dorado-papel', mezclar(col.acentoLectura, false, 0.2));
  doc.style.setProperty('--dorado-tenue', conAlpha(col.acentoLectura, 0.32));
  doc.style.setProperty('--dorado-fondo', conAlpha(col.acentoLectura, 0.1));

  doc.style.setProperty('--portada-svg-color', col.colorSvg);
  doc.style.setProperty('--svg-opacidad', String(+(col.opacidadSvg / 100).toFixed(2)));

  const ft = t.fuenteTitulos || preset.fuenteTitulos;
  const fc = t.fuenteCuerpo || preset.fuenteCuerpo;
  cargarFuente(ft);
  cargarFuente(fc);
  doc.style.setProperty('--fuente-display', `'${ft}', 'Georgia', serif`);
  doc.style.setProperty('--fuente-texto', `'${fc}', 'Helvetica Neue', Arial, sans-serif`);

  doc.dataset.tema = t.preset || 'elegante-oscuro';
  doc.dataset.portada = PORTADAS[t.portada] ? t.portada : (preset.portada || 'editorial');
  doc.dataset.decoracion = DECORACIONES[t.decoracion] ? t.decoracion : (preset.decoracion || 'marco');
  doc.dataset.estilo = ESTILOS_BLOQUES[t.estilo] ? t.estilo : (preset.estilo || 'editorial');
  doc.dataset.modo = preset.modo;

  doc.style.setProperty('--portada-fondo', col.portadaBg);
  doc.style.setProperty('--portada-texto', col.portadaTexto);
  doc.style.setProperty('--portada-acento', col.portadaAcento);
  doc.style.setProperty('--portada-apagado', conAlpha(col.portadaTexto, 0.64));
  doc.style.setProperty('--portada-borde', conAlpha(col.portadaAcento, 0.28));
  doc.style.setProperty('--portada-linea', conAlpha(col.portadaTexto, 0.18));
  doc.style.setProperty('--portada-acento-claro', mezclar(col.portadaAcento, true, 0.32));

  if (esClaro) {
    doc.style.setProperty('--papel', preset.fondo);
    doc.style.setProperty('--tinta', col.cuerpoTexto);
    doc.style.setProperty('--tinta-suave', col.cuerpoApagado);
    doc.style.setProperty('--tinta-tenue', col.cuerpoTenue);
    doc.style.setProperty('--linea-papel', preset.superficie);
  }
};

const renderDocumento = () => {
  const web = !imprimiendo && (esCliente || vista !== 'pdf');
  const doc = $('#documento');
  doc.classList.toggle('doc--web', web);
  aplicarTema(doc);
  const s = estado;
  const m = s.inversion.moneda;
  const c = calcular();
  const e = s.emisor;
  const cl = s.cliente;
  const p = s.propuesta;
  const vig = vigencia();
  const destinatario = cl.empresa.trim() || cl.nombre.trim();
  const tipoDecoracion = doc.dataset.decoracion || 'marco';
  const tipoPortada = doc.dataset.portada || 'editorial';

  const marca = e.logo
    ? `<img class="portada__logo" src="${esc(e.logo)}" alt="${esc(e.nombre || 'Logo')}">`
    : `<span class="portada__marca">${e.nombre.trim() ? esc(e.nombre) : vacioHTML('Tu marca')}</span>`;

  const meta = [];
  if (cl.nombre.trim() || cl.empresa.trim()) {
    const sec = [cl.cargo.trim(), cl.empresa.trim() && cl.nombre.trim() ? cl.empresa.trim() : ''].filter(Boolean).join(', ');
    meta.push(['Preparada para', `${esc(cl.nombre.trim() || cl.empresa.trim())}${sec ? `<span>${esc(sec)}</span>` : ''}`]);
  }
  if (e.nombre.trim()) meta.push(['Preparada por', `${esc(e.nombre)}${e.rol.trim() ? `<span>${esc(e.rol)}</span>` : ''}`]);
  if (vig.fecha) meta.push(['Fecha', esc(fechaLarga(vig.fecha))]);
  if (vig.vence) {
    if (web && vig.vencida) meta.push(['Venció el', esc(fechaLarga(vig.vence))]);
    else {
      const urgente = web && vig.restantes !== null && vig.restantes <= 30 ? `<span class="portada__urgente">${textoRestantes(vig.restantes)}</span>` : '';
      meta.push(['Válida hasta', `${esc(fechaLarga(vig.vence))}${urgente}`]);
    }
  }

  const marcaAguaNumero = tipoPortada === 'impacto' && p.numero.trim()
    ? `<span class="portada__marca-agua" aria-hidden="true">${esc(p.numero.trim())}</span>`
    : '';

  const portada = `
    <section class="portada portada--${esc(tipoPortada)}" aria-label="Portada">
      <div class="portada__decoracion" aria-hidden="true">${decoracionPortadaSVG(tipoDecoracion, s.tema?.opacidadSvg ?? 100)}</div>
      ${marcaAguaNumero}
      <div class="portada__superior">
        ${marca}
        ${p.numero.trim() ? `<p class="portada__numero">Propuesta ${esc(p.numero)}</p>` : ''}
      </div>
      <div class="portada__centro">
        <p class="portada__para"><span class="portada__para-chip">${destinatario ? `Propuesta para ${esc(destinatario)}` : 'Propuesta comercial'}</span></p>
        <h1 class="portada__titulo">${p.titulo.trim() ? esc(p.titulo) : vacioHTML('Título de la propuesta')}</h1>
        <hr class="portada__regla">
      </div>
      ${meta.length ? `<dl class="portada__meta">${meta.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>` : ''}
    </section>`;

  const bloques = [];

  if (e.presentacion.trim()) {
    bloques.push({
      titulo: e.nombre.trim() ? `Sobre ${e.nombre.trim()}` : 'Quién presenta esta propuesta',
      html: `<div class="presentacion-bloque">${parrafos(e.presentacion)}</div>`
    });
  }

  if (s.contexto.trim()) {
    bloques.push({
      titulo: 'El punto de partida',
      html: `<div class="contexto-bloque">${parrafos(s.contexto)}</div>`
    });
  }

  const objetivos = s.objetivos.filter(o => o.texto.trim());
  if (objetivos.length) {
    bloques.push({
      titulo: 'Qué queremos lograr',
      html: `<ul class="doc-lista objetivos-lista">${objetivos.map((o, i) => `
        <li class="objetivo-item">
          <span class="objetivo-item__indice" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <span class="objetivo-item__texto">${esc(o.texto.trim())}</span>
        </li>`).join('')}</ul>`
    });
  }

  const incluidos = s.servicios.filter(x => !x.opcional && servicioConContenido(x));
  const opcionales = s.servicios.filter(x => x.opcional && servicioConContenido(x));
  if (incluidos.length || opcionales.length) {
    let html = `<div class="servicios-grilla">${incluidos.map(x => servicioHTML(x, m, web)).join('')}</div>`;
    if (opcionales.length) {
      const nota = web
        ? 'No están incluidos en la inversión base. Sumá los que quieras con un toque y el total se actualiza en el momento.'
        : 'No están incluidos en la inversión, salvo los que figuran como sumados. Se pueden agregar en cualquier momento del proyecto.';
      html += `
        <div class="doc-grupo">
          <div class="doc-grupo__cabecera">
            <h3 class="doc-subtitulo">Para sumar, si querés</h3>
            <span class="doc-grupo__badge">Interactivo</span>
          </div>
          <p class="doc-nota">${nota}</p>
          <div class="servicios-grilla servicios-grilla--opcionales">
            ${opcionales.map(x => servicioHTML(x, m, web)).join('')}
          </div>
        </div>`;
    }
    bloques.push({ titulo: 'Qué incluye la propuesta', html });
  }

  const etapas = s.etapas.filter(x => x.nombre.trim() || x.descripcion.trim() || x.duracion.trim());
  if (etapas.length) {
    bloques.push({
      titulo: 'Cómo vamos a trabajar',
      html: `<ol class="etapas">${etapas.map((x, i) => `
        <li class="etapa">
          <span class="etapa__num" aria-hidden="true">${i + 1}</span>
          <div class="etapa__cuerpo">
            <p class="etapa__nombre">${x.nombre.trim() ? esc(x.nombre) : vacioHTML('Etapa sin nombre')}</p>
            ${x.descripcion.trim() ? `<p class="etapa__desc">${esc(x.descripcion.trim())}</p>` : ''}
          </div>
          ${x.duracion.trim() ? `<p class="etapa__duracion"><span class="etapa__chip">${esc(x.duracion.trim())}</span></p>` : '<p class="etapa__duracion etapa__duracion--vacia"></p>'}
        </li>`).join('')}</ol>`
    });
  }

  if (c.inicial.base > 0 || c.mensual.base > 0) {
    const columnas = [];
    if (c.inicial.base > 0) columnas.push(`<div class="resumen__columna"><h3 class="resumen__titulo">${c.mensual.base > 0 ? 'Inversión inicial' : 'Inversión total'}</h3>${filasResumen(c.inicial, c)}</div>`);
    if (c.mensual.base > 0) columnas.push(`<div class="resumen__columna"><h3 class="resumen__titulo">Servicio mensual</h3>${filasResumen(c.mensual, c, 'por mes')}</div>`);
    let html = `<div class="resumen">${columnas.join('')}</div>`;
    const pagos = s.inversion.pagos.filter(x => x.concepto.trim() || numero(x.porcentaje) > 0);
    if (pagos.length && c.inicial.total > 0) {
      const barraSegmentos = pagos
        .filter(x => numero(x.porcentaje) > 0)
        .map((x, idx) => `<span class="pagos-barra__seg pagos-barra__seg--${(idx % 4) + 1}" style="flex:${Math.max(5, numero(x.porcentaje))}" title="${esc(x.concepto.trim() || `Pago ${idx + 1}`)}: ${cantidadTexto(numero(x.porcentaje))}%"><span>${cantidadTexto(numero(x.porcentaje))}%</span></span>`)
        .join('');
      html += `<h3 class="doc-subtitulo">Forma de pago</h3>
        ${barraSegmentos ? `<div class="pagos-barra" aria-hidden="true">${barraSegmentos}</div>` : ''}
        <table class="pagos">
          <thead><tr><th scope="col">Momento</th><th scope="col" class="pagos__num">Porcentaje</th><th scope="col" class="pagos__num">Monto</th></tr></thead>
          <tbody>${pagos.map(x => `<tr><td>${x.concepto.trim() ? esc(x.concepto) : vacioHTML('Pago sin descripción')}</td><td class="pagos__num"><span class="pagos__pct">${cantidadTexto(numero(x.porcentaje))}%</span></td><td class="pagos__num pagos__monto">${dinero(c.inicial.total * numero(x.porcentaje) / 100, m)}</td></tr>`).join('')}</tbody>
        </table>`;
      if (c.mensual.base > 0) html += '<p class="doc-nota">El servicio mensual se factura por mes adelantado, desde que empieza ese servicio.</p>';
    }
    bloques.push({ titulo: 'Inversión', html });
  }

  const condiciones = lineas(s.condiciones);
  if (condiciones.length) {
    bloques.push({ titulo: 'Condiciones', html: `<ul class="doc-lista">${condiciones.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` });
  }

  const pasos = lineas(s.proximosPasos);
  const firmas = !web && s.opciones.firmas;
  if (pasos.length || firmas || web) {
    let html = pasos.length ? `<ol class="pasos">${pasos.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '';
    if (web) html += cierreHTML(vig);
    if (firmas) {
      const quienCliente = cl.nombre.trim() || cl.empresa.trim() || 'Cliente';
      const quienEmisor = e.nombre.trim() || 'Responsable de la propuesta';
      html += `
        <div class="firmas">
          <div class="firma__linea"><p class="firma__quien">${esc(quienCliente)}</p><p class="firma__datos">Firma, aclaración y fecha</p></div>
          <div class="firma__linea"><p class="firma__quien">${esc(quienEmisor)}</p><p class="firma__datos">Firma, aclaración y fecha</p></div>
        </div>`;
    }
    bloques.push({ titulo: pasos.length ? 'Próximos pasos' : (web ? 'Siguiente paso' : 'Aceptación'), html });
  }

  const contactos = [];
  if (e.email.trim()) contactos.push(web ? `<a href="mailto:${esc(e.email.trim())}" data-enlace-cliente>${esc(e.email.trim())}</a>` : esc(e.email.trim()));
  if (e.telefono.trim()) contactos.push(esc(e.telefono.trim()));
  if (e.web.trim()) {
    const url = /^https?:\/\//i.test(e.web.trim()) ? e.web.trim() : `https://${e.web.trim()}`;
    contactos.push(web ? `<a href="${esc(url)}" target="_blank" rel="noopener" data-enlace-cliente>${esc(e.web.trim())}</a>` : esc(e.web.trim()));
  }
  const pie = `
    <footer class="pie">
      ${e.nombre.trim() ? `<span class="pie__nombre">${esc(e.nombre)}</span>` : ''}
      ${contactos.map(x => `<span>${x}</span>`).join('')}
      ${web ? '<button type="button" class="pie__pdf" data-accion="pdf">Descargar en PDF</button>' : ''}
      ${s.opciones.credito ? '<span class="pie__credito">Propuesta armada con la plantilla de AteneaGen</span>' : ''}
    </footer>`;

  const aviso = web && vig.vencida ? `<p class="doc-aviso">Esta propuesta venció el ${esc(fechaLarga(vig.vence))}. Los valores pueden haber cambiado.</p>` : '';

  const cuerpo = `
    <div class="cuerpo">
      ${aviso}
      ${bloques.length ? bloques.map((b, i) => `
        <section class="bloque">
          <span class="bloque__num" aria-hidden="true">${i + 1}</span>
          <div class="bloque__contenido">
            <h2 class="bloque__titulo">${esc(b.titulo)}</h2>
            ${b.html}
          </div>
        </section>`).join('') : '<p class="doc-nota">Completá las secciones del editor para armar el cuerpo de la propuesta.</p>'}
      ${pie}
    </div>`;

  doc.innerHTML = portada + cuerpo + (web ? barraClienteHTML(c, vig) : '');
  if (web) observarElementos(doc);
};

let renderPendiente = false;
// Se llama en cada cambio que hace quien edita (no en la carga inicial).
const actualizar = () => {
  if (invitado) invitadoEdito = true;
  if (renderPendiente) return;
  renderPendiente = true;
  requestAnimationFrame(() => {
    renderPendiente = false;
    renderDocumento();
    actualizarSubtotales();
    actualizarAvisoPagos();
    guardarLuego();
  });
};

const leerValor = el => {
  if (el.type === 'checkbox') return el.checked;
  if (el.dataset.tipo === 'numero') return numero(el.value);
  return el.value;
};

const alEditar = ev => {
  const el = ev.target;
  if (el.dataset.campo) {
    asignar(estado, el.dataset.campo, leerValor(el));
    actualizar();
    return;
  }
  if (el.dataset.item) {
    const nodo = el.closest('[data-indice]');
    const lista = el.closest('.lista');
    if (!nodo || !lista) return;
    const item = obtener(estado, LISTAS[lista.dataset.lista].ruta)[Number(nodo.dataset.indice)];
    if (!item) return;
    item[el.dataset.item] = leerValor(el);
    if (el.dataset.item === 'opcional' && !el.checked) seleccion.delete(item.id);
    actualizar();
  }
};

const formulario = $('#formulario');
formulario.addEventListener('input', alEditar);
formulario.addEventListener('change', alEditar);
formulario.addEventListener('submit', ev => ev.preventDefault());

const llenarTemaEditor = () => {
  const t = estado.tema;
  const preset = TEMAS[t.preset] || TEMAS['elegante-oscuro'];
  const col = resolverColoresTema(t);
  $$('.tema-card').forEach(el => el.classList.toggle('tema-card--activo', el.dataset.tema === t.preset));
  const decoracionActiva = DECORACIONES[t.decoracion] ? t.decoracion : (preset.decoracion || 'marco');
  const portadaActiva = PORTADAS[t.portada] ? t.portada : (preset.portada || 'editorial');
  const estiloActivo = ESTILOS_BLOQUES[t.estilo] ? t.estilo : (preset.estilo || 'editorial');
  $$('[data-decoracion]').forEach(el => el.classList.toggle('opcion-visual--activa', el.dataset.decoracion === decoracionActiva));
  $$('[data-portada]').forEach(el => el.classList.toggle('opcion-visual--activa', el.dataset.portada === portadaActiva));
  $$('[data-estilo]').forEach(el => el.classList.toggle('opcion-visual--activa', el.dataset.estilo === estiloActivo));
  const acento = $('#tema-acento');
  const colorTexto = $('#tema-color-texto');
  const colorSvg = $('#tema-color-svg');
  const opacidadSvg = $('#tema-opacidad-svg');
  const opacidadValor = $('#tema-opacidad-valor');
  const btnReset = $('#tema-restablecer-colores');
  const ft = $('#tema-fuente-titulos');
  const fc = $('#tema-fuente-cuerpo');
  if (acento) acento.value = col.acento;
  if (colorTexto) colorTexto.value = col.portadaTexto;
  if (colorSvg) colorSvg.value = col.colorSvg;
  if (opacidadSvg) opacidadSvg.value = String(col.opacidadSvg);
  if (opacidadValor) opacidadValor.textContent = `${col.opacidadSvg}%`;
  if (btnReset) {
    const cambiado = (t.acento && t.acento.toLowerCase() !== preset.acento.toLowerCase())
      || !!t.colorTexto
      || !!t.colorSvg
      || (t.opacidadSvg !== undefined && Number(t.opacidadSvg) !== 100);
    btnReset.hidden = !cambiado;
  }
  if (ft) ft.value = t.fuenteTitulos || preset.fuenteTitulos || 'Bebas Neue';
  if (fc) fc.value = t.fuenteCuerpo || preset.fuenteCuerpo || 'Montserrat';
};

const contenedorTemas = $('#temas-grid');
if (contenedorTemas) {
  contenedorTemas.addEventListener('click', ev => {
    const card = ev.target.closest('.tema-card');
    if (!card) return;
    const id = card.dataset.tema;
    const preset = TEMAS[id];
    if (!preset) return;
    estado.tema.preset = id;
    estado.tema.acento = preset.acento;
    estado.tema.colorTexto = '';
    estado.tema.colorSvg = '';
    estado.tema.opacidadSvg = 100;
    estado.tema.fuenteTitulos = preset.fuenteTitulos;
    estado.tema.fuenteCuerpo = preset.fuenteCuerpo;
    estado.tema.portada = preset.portada || 'editorial';
    estado.tema.decoracion = preset.decoracion || 'marco';
    estado.tema.estilo = preset.estilo || 'editorial';
    llenarTemaEditor();
    actualizar();
  });
}

const contenedorDecoraciones = $('#decoraciones-grid');
if (contenedorDecoraciones) {
  contenedorDecoraciones.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-decoracion]');
    if (!btn || !DECORACIONES[btn.dataset.decoracion]) return;
    estado.tema.decoracion = btn.dataset.decoracion;
    llenarTemaEditor();
    actualizar();
  });
}

const contenedorPortadas = $('#portadas-grid');
if (contenedorPortadas) {
  contenedorPortadas.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-portada]');
    if (!btn || !PORTADAS[btn.dataset.portada]) return;
    estado.tema.portada = btn.dataset.portada;
    llenarTemaEditor();
    actualizar();
  });
}

const contenedorEstilos = $('#estilos-grid');
if (contenedorEstilos) {
  contenedorEstilos.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-estilo]');
    if (!btn || !ESTILOS_BLOQUES[btn.dataset.estilo]) return;
    estado.tema.estilo = btn.dataset.estilo;
    llenarTemaEditor();
    actualizar();
  });
}

let plantillaPendiente = null;
const dialogoPlantilla = $('#dialogo-plantilla');
const aplicarPlantillaRubro = (id, soloDiseno = false) => {
  const tpl = PLANTILLAS[id];
  if (!tpl) return;
  const generada = normalizar(tpl.crear());
  if (soloDiseno) {
    estado.tema = { ...generada.tema };
    llenarTemaEditor();
    actualizar();
    avisar(`Diseño de «${tpl.nombre}» aplicado a tu propuesta.`);
  } else {
    // Si ya tenía sus propios datos de emisor guardados en Mi cuenta, los conserva
    if (perfil?.emisor && Object.values(perfil.emisor).some(Boolean)) {
      generada.emisor = { ...generada.emisor, ...perfil.emisor };
    }
    reemplazarEstado(generada);
    avisar(`Plantilla «${tpl.nombre}» cargada. Editá lo que quieras.`);
  }
  $$('.plantilla-chip').forEach(c => c.classList.toggle('plantilla-chip--activa', c.dataset.plantilla === id));
};

const contenedorPlantillas = $('#plantillas-grid');
if (contenedorPlantillas) {
  contenedorPlantillas.addEventListener('click', ev => {
    const chip = ev.target.closest('[data-plantilla]');
    if (!chip) return;
    const id = chip.dataset.plantilla;
    const tpl = PLANTILLAS[id];
    if (!tpl) return;
    const tieneTextoPropio = estado.propuesta.titulo.trim() || estado.servicios.some(servicioConContenido);
    if (tieneTextoPropio && dialogoPlantilla && typeof dialogoPlantilla.showModal === 'function') {
      plantillaPendiente = id;
      $('#plantilla-modal-titulo').textContent = `Plantilla: ${tpl.nombre}`;
      $('#plantilla-modal-texto').textContent = `¿Querés cargar los textos y servicios de ejemplo de «${tpl.nombre}» o aplicar únicamente su diseño visual (tema, decoración y disposición) conservando lo que ya escribiste?`;
      dialogoPlantilla.showModal();
    } else {
      aplicarPlantillaRubro(id, false);
    }
  });
}

$('#plantilla-solo-diseno')?.addEventListener('click', () => {
  if (plantillaPendiente) aplicarPlantillaRubro(plantillaPendiente, true);
  plantillaPendiente = null;
  dialogoPlantilla?.close();
});

$('#plantilla-completa')?.addEventListener('click', () => {
  if (plantillaPendiente) aplicarPlantillaRubro(plantillaPendiente, false);
  plantillaPendiente = null;
  dialogoPlantilla?.close();
});

const temaAcento = $('#tema-acento');
if (temaAcento) {
  temaAcento.addEventListener('input', ev => {
    estado.tema.acento = ev.target.value;
    llenarTemaEditor();
    actualizar();
  });
}

const temaColorTexto = $('#tema-color-texto');
if (temaColorTexto) {
  temaColorTexto.addEventListener('input', ev => {
    estado.tema.colorTexto = ev.target.value;
    llenarTemaEditor();
    actualizar();
  });
}

const temaColorSvg = $('#tema-color-svg');
if (temaColorSvg) {
  temaColorSvg.addEventListener('input', ev => {
    estado.tema.colorSvg = ev.target.value;
    llenarTemaEditor();
    actualizar();
  });
}

const temaOpacidadSvg = $('#tema-opacidad-svg');
if (temaOpacidadSvg) {
  temaOpacidadSvg.addEventListener('input', ev => {
    estado.tema.opacidadSvg = Number(ev.target.value);
    llenarTemaEditor();
    actualizar();
  });
}

const temaRestablecerColores = $('#tema-restablecer-colores');
if (temaRestablecerColores) {
  temaRestablecerColores.addEventListener('click', () => {
    const preset = TEMAS[estado.tema.preset] || TEMAS['elegante-oscuro'];
    estado.tema.acento = preset.acento;
    estado.tema.colorTexto = '';
    estado.tema.colorSvg = '';
    estado.tema.opacidadSvg = 100;
    llenarTemaEditor();
    actualizar();
    avisar('Colores e intensidad del SVG restablecidos al tema original.');
  });
}

const temaFT = $('#tema-fuente-titulos');
if (temaFT) {
  temaFT.addEventListener('change', ev => {
    estado.tema.fuenteTitulos = ev.target.value;
    actualizar();
  });
}

const temaFC = $('#tema-fuente-cuerpo');
if (temaFC) {
  temaFC.addEventListener('change', ev => {
    estado.tema.fuenteCuerpo = ev.target.value;
    actualizar();
  });
}

const dialogo = $('#dialogo');
const confirmar = ({ titulo, texto: cuerpo, aceptar }) => {
  if (typeof dialogo.showModal !== 'function') return Promise.resolve(true);
  $('#dialogo-titulo').textContent = titulo;
  $('#dialogo-texto').textContent = cuerpo;
  $('#dialogo-confirmar').textContent = aceptar;
  dialogo.returnValue = '';
  dialogo.showModal();
  return new Promise(res => dialogo.addEventListener('close', () => res(dialogo.returnValue === 'aceptar'), { once: true }));
};

const reemplazarEstado = nuevo => {
  estado = nuevo;
  seleccion = new Set();
  llenarFormulario();
  actualizar();
};

const nombreArchivo = () => {
  const base = [estado.propuesta.numero, estado.cliente.empresa || estado.cliente.nombre].map(x => texto(x).trim()).filter(Boolean).join(' ');
  return (base || 'propuesta').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
};

const guardarBorrador = () => {
  const blob = new Blob([JSON.stringify({ version: 1, ...estado }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${nombreArchivo()}.json`;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  avisar('Borrador guardado. Abrilo cuando quieras con «Abrir borrador».');
};

const campoBorrador = $('#campo-borrador');
campoBorrador.addEventListener('change', () => {
  const archivo = campoBorrador.files[0];
  campoBorrador.value = '';
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = () => {
    try {
      const abierto = normalizar(JSON.parse(lector.result));
      if (nube()) {
        // Con cuenta, el borrador entra como propuesta nueva: no pisa ninguna existente.
        nuevaPropuesta(abierto);
        avisar('Borrador abierto como propuesta nueva.');
      } else {
        reemplazarEstado(abierto);
        avisar('Borrador abierto.');
      }
    } catch {
      avisar('Ese archivo no es un borrador válido. Elegí un .json guardado desde este generador.');
    }
  };
  lector.onerror = () => avisar('No se pudo leer el archivo. Probá de nuevo.');
  lector.readAsText(archivo);
});

const leerComoDataURL = archivo => new Promise((res, rej) => {
  const lector = new FileReader();
  lector.onload = () => res(lector.result);
  lector.onerror = rej;
  lector.readAsDataURL(archivo);
});

// Dibuja el logo en un lienzo de hasta 360×140 px por la densidad pedida.
const lienzoLogo = async (archivo, densidad) => {
  const original = await leerComoDataURL(archivo);
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = original;
  });
  const anchoMax = 360 * densidad;
  const altoMax = 140 * densidad;
  const escala = Math.min(1, anchoMax / (img.naturalWidth || anchoMax), altoMax / (img.naturalHeight || altoMax));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.max(1, Math.round((img.naturalWidth || anchoMax) * escala));
  lienzo.height = Math.max(1, Math.round((img.naturalHeight || altoMax) * escala));
  lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
  return { lienzo, original };
};

// Sin cuenta: el logo viaja dentro de la propuesta, así que se guarda lo más liviano posible.
const reducirLogo = async archivo => {
  const { lienzo, original } = await lienzoLogo(archivo, 1);
  if (archivo.type === 'image/svg+xml' && original.length < 20000) return original;
  const png = lienzo.toDataURL('image/png');
  const webp = lienzo.toDataURL('image/webp', 0.86);
  return webp.startsWith('data:image/webp') && webp.length < png.length ? webp : png;
};

// Con cuenta: se sube a Storage al doble de resolución para que se vea nítido en pantallas
// de alta densidad. Los SVG también se rasterizan: un SVG servido como archivo puede
// ejecutar scripts si alguien abre su URL directo.
const logoParaSubir = async archivo => {
  const { lienzo } = await lienzoLogo(archivo, 2);
  const aBlob = (tipo, calidad) => new Promise(res => lienzo.toBlob(res, tipo, calidad));
  const webp = await aBlob('image/webp', 0.9);
  return webp && webp.type === 'image/webp' ? webp : aBlob('image/png');
};

const esLogoValido = logo => /^data:image\//.test(logo)
  || (!!AteneaDB?.logos && logo.startsWith(AteneaDB.logos.prefijoURL));

const subiendoLogo = estaSubiendo => {
  $('#logo-texto').textContent = estaSubiendo ? 'Subiendo logo…' : (estado.emisor.logo ? 'Cambiar logo' : 'Subir logo');
  campoLogo.disabled = estaSubiendo;
};

const campoLogo = $('#campo-logo');
campoLogo.addEventListener('change', async () => {
  const archivo = campoLogo.files[0];
  campoLogo.value = '';
  if (!archivo) return;
  if (!archivo.type.startsWith('image/')) {
    avisar('El logo tiene que ser una imagen PNG, JPG, SVG o WebP.');
    return;
  }
  if (archivo.size > LOGO_MAX_ARCHIVO) {
    avisar('El logo pesa más de 5 MB. Usá una versión más liviana.');
    return;
  }
  const db = nube();
  const id = propuestaId;
  let logo;
  subiendoLogo(true);
  try {
    if (db) {
      try {
        logo = await db.logos.subir(await logoParaSubir(archivo));
      } catch (e) {
        // Sin conexión o sin Storage: el logo queda dentro de la propuesta y
        // se sube solo la próxima vez que se abra.
        console.error('No se pudo subir el logo:', e);
        logo = await reducirLogo(archivo);
        avisar('No se pudo subir el logo a tu cuenta, así que quedó guardado dentro de la propuesta.', 6000);
      }
    } else {
      logo = await reducirLogo(archivo);
    }
  } catch {
    avisar('No se pudo leer la imagen. Probá con otra.');
  }
  // Si mientras subía se cambió de propuesta, el logo no se aplica a la otra.
  if (logo && propuestaId === id) {
    estado.emisor.logo = logo;
    actualizarLogo();
    actualizar();
  }
  subiendoLogo(false);
});

// Logos guardados dentro de la propuesta (versiones anteriores o subidas fallidas)
// se pasan a Storage al abrirla. Si falla, se reintenta la próxima vez.
const migrarLogo = async () => {
  const id = propuestaId;
  const logo = estado.emisor.logo;
  if (!nube() || !id || !logo.startsWith('data:')) return;
  try {
    const blob = await (await fetch(logo)).blob();
    const url = await AteneaDB.logos.subir(/^image\/(png|jpeg|webp)$/.test(blob.type) ? blob : await logoParaSubir(blob));
    if (propuestaId !== id || estado.emisor.logo !== logo) return;
    estado.emisor.logo = url;
    actualizarLogo();
    actualizar();
  } catch (e) {
    console.warn('No se pudo pasar el logo a Storage:', e);
  }
};

const datosParaLink = () => {
  const sinId = arr => arr.map(({ id, ...resto }) => resto);
  const logoEntra = estado.emisor.logo.length <= LOGO_MAX_LINK;
  return {
    logoOmitido: !!estado.emisor.logo && !logoEntra,
    datos: {
      v: 1,
      ...estado,
      emisor: { ...estado.emisor, logo: logoEntra ? estado.emisor.logo : '' },
      objetivos: sinId(estado.objetivos),
      servicios: sinId(estado.servicios),
      etapas: sinId(estado.etapas),
      inversion: { ...estado.inversion, pagos: sinId(estado.inversion.pagos) }
    }
  };
};

let linkActual = '';

const linkCorto = id => `${location.origin}/p/${id}`;

// Activa el link corto: la propuesta pasa a ser legible por quien tenga el link
// y, si era un borrador, queda como enviada. Devuelve true si el servidor lo
// confirmó, false si falló y null si todavía no hay respuesta (sin conexión).
const activarLink = async () => {
  if (hayCambiosSinEnviar()) guardarAhora();
  const actual = propuestas.find(p => p.id === propuestaId);
  const cambios = { publico: true };
  if (!actual || !actual.status || actual.status === 'draft') cambios.status = 'sent';
  if (actual?.publico && !cambios.status) return true;
  const escritura = registrarEscritura(
    AteneaDB.proposals.actualizar(propuestaId, cambios),
    'No se pudo activar el link de la propuesta. Revisá tu conexión y probá de nuevo.'
  );
  return Promise.race([escritura, new Promise(res => setTimeout(() => res(null), 4000))]);
};

const abrirCompartir = async () => {
  const tieneContenido = estado.propuesta.titulo.trim() || estado.servicios.some(servicioConContenido);
  if (!tieneContenido) {
    avisar('Cargá al menos el título y un servicio antes de compartir la propuesta.');
    return;
  }
  const conCuenta = !!(nube() && propuestaId);
  const avisos = [];
  if (conCuenta) {
    const activado = await activarLink();
    if (activado === false) return;
    if (activado === null) avisos.push('Estás sin conexión: el link empieza a funcionar en cuanto vuelva.');
    linkActual = linkCorto(propuestaId);
  } else {
    const { datos, logoOmitido } = datosParaLink();
    try {
      linkActual = `${location.origin}${location.pathname}${PREFIJO}${await comprimir(JSON.stringify(datos))}`;
    } catch {
      avisar('No se pudo generar el link. Probá de nuevo.');
      return;
    }
    if (location.protocol === 'file:') avisos.push('Estás usando el generador desde un archivo de tu compu, así que este link solo abre acá. Publicá el generador en una web (Vercel, Netlify, tu hosting) y el link le va a funcionar a cualquiera.');
    if (logoOmitido) avisos.push('Tu logo es demasiado pesado para viajar en el link, así que no se incluye. Probá con un SVG o un PNG más simple.');
  }
  $('#enlace-propuesta').value = linkActual;
  $('#compartir-abrir').href = linkActual;
  const saludo = estado.cliente.nombre.trim() ? `Hola ${estado.cliente.nombre.trim().split(' ')[0]}!` : 'Hola!';
  const mensaje = `${saludo} Te comparto la propuesta${estado.propuesta.titulo.trim() ? ` «${estado.propuesta.titulo.trim()}»` : ''}. Desde el link podés ver todo el detalle, sumar opcionales y aceptarla: ${linkActual}`;
  $('#compartir-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  $('#compartir-nativo').hidden = typeof navigator.share !== 'function';
  $('#compartir-desactivar').hidden = !conCuenta;
  $('#compartir-nota').textContent = conCuenta
    ? 'El link muestra siempre la última versión: si cambiás algo, tu cliente lo ve la próxima vez que lo abra.'
    : 'Cada link guarda la propuesta tal como está ahora. Si después cambiás algo, generá uno nuevo y mandá ese.';
  if (!digitosWhatsApp() && !estado.emisor.email.trim()) avisos.push('No cargaste WhatsApp ni email: tu cliente va a poder aceptar, pero solo copiando el mensaje de confirmación.');
  const elAvisoCompartir = $('#compartir-aviso');
  elAvisoCompartir.hidden = !avisos.length;
  elAvisoCompartir.textContent = avisos.join(' ');
  $('#dialogo-compartir').showModal();
};

const desactivarLink = async () => {
  const id = propuestaId;
  if (!id) return;
  const ok = await confirmar({
    titulo: '¿Desactivar el link?',
    texto: 'Quien tenga el link ya no va a poder ver la propuesta. Si más adelante la volvés a compartir, se reactiva el mismo link.',
    aceptar: 'Desactivar link'
  });
  if (!ok) return;
  $('#dialogo-compartir').close();
  const desactivado = await registrarEscritura(
    AteneaDB.proposals.actualizar(id, { publico: false }),
    'No se pudo desactivar el link. Revisá tu conexión y probá de nuevo.'
  );
  if (desactivado) avisar('Link desactivado.');
};

const copiar = async contenido => {
  try {
    await navigator.clipboard.writeText(contenido);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = contenido;
    area.setAttribute('readonly', '');
    area.className = 'visualmente-oculto';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
};

const mensajeAceptacion = (firma = estado.cliente.nombre.trim()) => {
  const c = calcular();
  const m = estado.inversion.moneda;
  const sumados = estado.servicios.filter(s => s.opcional && seleccion.has(s.id) && servicioConContenido(s)).map(s => s.nombre.trim());
  const emisor = nombreEmisor();
  const lineasMsg = [`Hola${emisor ? ` ${emisor.split(' ')[0]}` : ''}! Acepto la propuesta${estado.propuesta.numero.trim() ? ` ${estado.propuesta.numero.trim()}` : ''} «${tituloPropuesta()}».`];
  if (c.inicial.total > 0) lineasMsg.push(`${c.mensual.base > 0 ? 'Inversión inicial' : 'Inversión total'}: ${dinero(c.inicial.total, m)}`);
  if (c.mensual.total > 0) lineasMsg.push(`Servicio mensual: ${dinero(c.mensual.total, m)} por mes`);
  if (sumados.length) lineasMsg.push(`Sumé: ${sumados.join(', ')}.`);
  if (firma) lineasMsg.push(firma);
  return { texto: lineasMsg.join('\n'), c, sumados };
};

// Llama a una función de /api. Si hay sesión, se identifica (así no cuentan las visitas
// propias ni se puede aceptar la propuesta de uno mismo).
const llamarApi = async (ruta, cuerpo, { keepalive = false } = {}) => {
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

// Una visita cada media hora por navegador: recargar la página no suma visitas.
const VISITA_INTERVALO = 30 * 60 * 1000;
const registrarVisita = id => {
  const clave = `${CLAVE}:visto:${id}`;
  try {
    if (Date.now() - Number(localStorage.getItem(clave) || 0) < VISITA_INTERVALO) return;
    localStorage.setItem(clave, String(Date.now()));
  } catch {}
  llamarApi('/api/visto', { id }, { keepalive: true }).catch(e => console.warn('No se pudo registrar la visita:', e));
};

const dialogoAceptar = $('#dialogo-aceptar');
const campoAceptarNombre = $('#aceptar-nombre');
const casillaConformidad = $('#aceptar-conformidad');
const botonConfirmarAceptacion = $('#aceptar-confirmar');
const errorAceptacion = $('#aceptar-error');

const llenarResumenAceptacion = () => {
  const { c, sumados } = mensajeAceptacion();
  const m = estado.inversion.moneda;
  const filas = [];
  if (c.inicial.total > 0) filas.push([c.mensual.base > 0 ? 'Inversión inicial' : 'Inversión total', dinero(c.inicial.total, m)]);
  if (c.mensual.total > 0) filas.push(['Servicio mensual', `${dinero(c.mensual.total, m)} por mes`]);
  if (sumados.length) filas.push(['Sumaste', sumados.join(', ')]);
  $('#aceptar-resumen').innerHTML = filas.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('');
  $('#aceptar-resumen').hidden = !filas.length;
};

// Configura los botones que abren WhatsApp o el email con el mensaje. Devuelve si hay alguno.
const prepararMensajeria = (mensaje, { whatsapp, email }) => {
  const wa = enlaceWhatsApp(mensaje);
  const mail = enlaceEmail(`Acepto la propuesta ${estado.propuesta.numero.trim() || tituloPropuesta()}`.trim(), mensaje);
  const elWa = $('#aceptar-whatsapp');
  const elMail = $('#aceptar-email');
  elWa.hidden = !wa;
  elMail.hidden = !mail;
  if (wa) elWa.href = wa;
  if (mail) elMail.href = mail;
  elWa.textContent = whatsapp;
  elMail.textContent = email;
  return !!(wa || mail);
};

// 'mensaje': link largo, se confirma por WhatsApp o email. 'formulario': link corto,
// se acepta con nombre y casilla. 'listo': aceptación registrada.
const modoAceptar = modo => {
  $('#aceptar-formulario').hidden = modo !== 'formulario';
  botonConfirmarAceptacion.hidden = modo !== 'formulario';
  if (modo === 'formulario') ['#aceptar-whatsapp', '#aceptar-email', '#aceptar-copiar'].forEach(sel => { $(sel).hidden = true; });
  $('#aceptar-titulo').textContent = modo === 'listo' ? '¡Propuesta aceptada!' : 'Confirmar la propuesta';
  $('#aceptar-cerrar').textContent = modo === 'listo' ? 'Cerrar' : 'Volver a la propuesta';
};

const actualizarBotonAceptar = () => {
  botonConfirmarAceptacion.disabled = limpiarNombre(campoAceptarNombre.value).length < NOMBRE_MIN || !casillaConformidad.checked;
};
campoAceptarNombre.addEventListener('input', actualizarBotonAceptar);
casillaConformidad.addEventListener('change', actualizarBotonAceptar);

const abrirAceptar = () => {
  if (!esCliente) {
    avisar('Así lo ve tu cliente. En el link, este botón le permite aceptar la propuesta.');
    return;
  }
  if (aceptada()) return;
  llenarResumenAceptacion();
  const emisor = nombreEmisor();
  if (compartida) {
    modoAceptar('formulario');
    errorAceptacion.hidden = true;
    if (!campoAceptarNombre.value) campoAceptarNombre.value = estado.cliente.nombre.trim();
    casillaConformidad.checked = false;
    actualizarBotonAceptar();
    $('#aceptar-texto').textContent = `${emisor || 'Quien te mandó la propuesta'} va a ver tu aceptación al instante. Queda registrado tu nombre, la fecha y lo que elegiste.`;
  } else {
    modoAceptar('mensaje');
    const hay = prepararMensajeria(mensajeAceptacion().texto, { whatsapp: 'Confirmar por WhatsApp', email: 'Confirmar por email' });
    $('#aceptar-copiar').hidden = hay;
    $('#aceptar-texto').textContent = hay
      ? `Se abre un mensaje${emisor ? ` para ${emisor}` : ''} con este resumen, listo para enviar.`
      : `Copiá el mensaje y mandáselo${emisor ? ` a ${emisor}` : ''} por donde suelan hablar.`;
  }
  dialogoAceptar.showModal();
};

botonConfirmarAceptacion.addEventListener('click', async () => {
  const nombre = limpiarNombre(campoAceptarNombre.value);
  botonConfirmarAceptacion.disabled = true;
  botonConfirmarAceptacion.textContent = 'Aceptando…';
  errorAceptacion.hidden = true;
  try {
    const { aceptacion } = await llamarApi('/api/aceptar', { id: compartida.id, nombre, acepto: true, opcionales: [...seleccion] });
    compartida.aceptacion = aceptacion;
    renderDocumento();
    modoAceptar('listo');
    const emisor = nombreEmisor();
    const hay = prepararMensajeria(mensajeAceptacion(nombre).texto, { whatsapp: 'Avisar por WhatsApp', email: 'Avisar por email' });
    $('#aceptar-texto').textContent = `Listo, ${nombre.split(' ')[0]}. ${emisor || 'Quien te mandó la propuesta'} ya puede ver tu aceptación.${hay ? ' Si querés, avisale también por mensaje.' : ''}`;
  } catch (e) {
    console.error('No se pudo aceptar la propuesta:', e);
    errorAceptacion.textContent = MENSAJES_ACEPTACION[e.codigo] || 'No pudimos registrar tu aceptación. Revisá tu conexión y probá de nuevo.';
    errorAceptacion.hidden = false;
  } finally {
    botonConfirmarAceptacion.textContent = 'Aceptar propuesta';
    actualizarBotonAceptar();
  }
});

const app = $('#app');
const cambiarPestana = previa => {
  app.classList.toggle('app--previa', previa);
  $$('.pestana').forEach(t => t.setAttribute('aria-selected', String((t.dataset.accion === 'ver-previa') === previa)));
};

const cambiarVista = nueva => {
  vista = nueva;
  const escenario = $('#escenario');
  ['escritorio', 'celular', 'pdf'].forEach(v => escenario.classList.toggle(`visor__escenario--${v}`, v === nueva));
  $$('.segmento').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.vista === nueva)));
  $('#visor-nota').textContent = nueva === 'pdf'
    ? 'Versión para imprimir. Los saltos de página se ajustan solos.'
    : 'Así ve tu cliente la propuesta cuando abre el link.';
  renderDocumento();
};

const botonMenu = $('[data-accion="menu"]');
const panelMenu = $('#menu-panel');
const abrirMenu = abrir => {
  panelMenu.hidden = !abrir;
  botonMenu.setAttribute('aria-expanded', String(abrir));
};

document.addEventListener('click', ev => {
  if (!panelMenu.hidden && !ev.target.closest('#menu')) abrirMenu(false);
  const enlaceCliente = ev.target.closest('[data-enlace-cliente]');
  if (enlaceCliente && !esCliente) {
    ev.preventDefault();
    avisar('Así lo ve tu cliente. En el link, este enlace le abre una conversación con vos.');
  }
});

document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && !panelMenu.hidden) {
    abrirMenu(false);
    botonMenu.focus();
  }
});

window.addEventListener('beforeprint', () => {
  imprimiendo = true;
  renderDocumento();
});

window.addEventListener('afterprint', () => {
  imprimiendo = false;
  renderDocumento();
});

const descargarPDF = () => {
  const tituloOriginal = document.title;
  document.title = nombreArchivo();
  window.addEventListener('afterprint', () => { document.title = tituloOriginal; }, { once: true });
  avisar('Elegí «Guardar como PDF» como destino y desactivá «Encabezados y pies de página».', 7000);
  setTimeout(() => window.print(), 350);
};

const enfocarUltimo = nombre => {
  const ultimo = $(`.lista[data-lista="${nombre}"] > :last-child`);
  const campo = ultimo && $('input, textarea', ultimo);
  if (campo) campo.focus();
};

document.addEventListener('click', async ev => {
  const boton = ev.target.closest('[data-accion]');
  if (!boton) return;
  const accion = boton.dataset.accion;

  if (accion === 'menu') {
    abrirMenu(panelMenu.hidden);
    return;
  }
  if (boton.closest('#menu-panel')) abrirMenu(false);

  if (['subir', 'bajar', 'quitar'].includes(accion)) {
    const nodo = boton.closest('[data-indice]');
    const nombre = boton.closest('.lista').dataset.lista;
    const arr = obtener(estado, LISTAS[nombre].ruta);
    const i = Number(nodo.dataset.indice);
    const j = accion === 'subir' ? i - 1 : i + 1;
    if (accion === 'quitar') arr.splice(i, 1);
    else {
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    renderLista(nombre);
    if (accion !== 'quitar') {
      const destino = $(`.lista[data-lista="${nombre}"] > [data-indice="${j}"] [data-accion="${accion}"]`);
      if (destino && !destino.disabled) destino.focus();
    }
    actualizar();
    return;
  }

  switch (accion) {
    case 'agregar': {
      const nombre = boton.dataset.lista;
      obtener(estado, LISTAS[nombre].ruta).push(LISTAS[nombre].nuevo());
      renderLista(nombre);
      enfocarUltimo(nombre);
      actualizar();
      break;
    }
    case 'sumar': {
      if (aceptada()) break;
      const id = boton.dataset.id;
      if (seleccion.has(id)) seleccion.delete(id);
      else seleccion.add(id);
      renderDocumento();
      const nuevo = $(`.servicio__sumar[data-id="${CSS.escape(id)}"]`);
      if (nuevo) nuevo.focus({ preventScroll: true });
      break;
    }
    case 'aceptar':
      abrirAceptar();
      break;
    case 'copiar-aceptacion':
      avisar(await copiar(mensajeAceptacion().texto) ? 'Mensaje copiado. Pegalo en tu chat o mail.' : 'No se pudo copiar. Probá de nuevo.');
      break;
    case 'compartir':
      if (invitado) abrirRegistro('compartir');
      else abrirCompartir();
      break;
    case 'registrarse':
      abrirRegistro('guardar');
      break;
    case 'ingresar':
      abrirRegistro('ingresar');
      break;
    case 'copiar-link':
      if (await copiar(linkActual)) {
        boton.textContent = 'Copiado';
        setTimeout(() => { boton.textContent = 'Copiar link'; }, 2000);
      } else {
        $('#enlace-propuesta').select();
        avisar('No se pudo copiar automáticamente. El link quedó seleccionado para que lo copies.');
      }
      break;
    case 'desactivar-link':
      desactivarLink();
      break;
    case 'copiar-link-propuesta':
      if (await copiar(linkCorto(boton.dataset.id))) avisar('Link copiado.');
      else avisar('No se pudo copiar el link. Abrí la propuesta y copialo desde «Compartir».');
      break;
    case 'compartir-nativo':
      try {
        await navigator.share({ title: estado.propuesta.titulo.trim() || 'Propuesta', url: linkActual });
      } catch {}
      break;
    case 'vista':
      cambiarVista(boton.dataset.vista);
      break;
    case 'quitar-logo':
      estado.emisor.logo = '';
      actualizarLogo();
      actualizar();
      break;
    case 'ir-panel':
      if (!nube()) break;
      if (boton.tagName === 'A') {
        if (!clicComun(ev)) break;
        ev.preventDefault();
      }
      irAlPanel();
      break;
    case 'abrir-propuesta':
      if (!clicComun(ev)) break;
      ev.preventDefault();
      abrirPropuesta(boton.dataset.id);
      break;
    case 'ir-cuenta':
      if (!nube()) break;
      if (boton.tagName === 'A') {
        if (!clicComun(ev)) break;
        ev.preventDefault();
      }
      irACuenta();
      break;
    case 'filtrar':
      filtroEstado = boton.dataset.estado;
      renderPanel();
      $(`.filtro[data-estado="${CSS.escape(filtroEstado)}"]`)?.focus();
      break;
    case 'quitar-logo-cuenta':
      logoCuenta = '';
      cuentaEditada = true;
      pintarLogoCuenta();
      break;
    case 'cambiar-password':
      cambiarPassword();
      break;
    case 'nueva':
      if (nube()) nuevaPropuesta();
      break;
    case 'nueva-ejemplo':
      if (nube()) nuevaPropuesta(ejemplo());
      break;
    case 'duplicar-propuesta':
      duplicarPropuesta(boton.dataset.id);
      break;
    case 'borrar-propuesta':
      borrarPropuesta(boton.dataset.id);
      break;
    case 'cerrar-sesion':
      cerrarSesion();
      break;
    case 'eliminar-cuenta':
      if (nube()) abrirEliminarCuenta();
      break;
    case 'reintentar-panel':
      escucharPropuestas();
      break;
    case 'guardar-borrador':
      if (invitado) abrirRegistro('guardar');
      else guardarBorrador();
      break;
    case 'abrir-borrador':
      campoBorrador.click();
      break;
    case 'pdf':
      if (invitado) abrirRegistro('pdf');
      else descargarPDF();
      break;
    case 'ver-editor':
      cambiarPestana(false);
      break;
    case 'ver-previa':
      cambiarPestana(true);
      break;
  }
});

// Panel «Mis propuestas». La lista se escucha en tiempo real toda la sesión:
// refleja al instante lo que se edita, se duplica o se borra, también sin conexión.
const elPanel = $('#panel');
const elLista = $('#lista-propuestas');
const elPanelEstado = $('#panel-estado');
const elPanelVacio = $('#panel-vacio');
const elPanelResumen = $('#panel-resumen');
const elHerramientas = $('#panel-herramientas');
const elMetricas = $('#panel-metricas');
const elFiltros = $('#panel-filtros');
const campoBuscar = $('#panel-buscar');
const elCuenta = $('#cuenta');
const ESTADOS_PROPUESTA = { draft: 'Borrador', sent: 'Enviada', accepted: 'Aceptada', rejected: 'Rechazada' };

let propuestas = [];
let panelCargando = true;
let panelError = false;
let dejarDeEscuchar = null;

const fechaDe = ts => (ts && typeof ts.toDate === 'function' ? ts.toDate() : null);
const sinAcentos = t => texto(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const haceCuanto = fecha => {
  if (!fecha) return '';
  const segundos = Math.round((fecha - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const unidades = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unidad, s] of unidades) {
    if (Math.abs(segundos) >= s) return rtf.format(Math.round(segundos / s), unidad);
  }
  return 'recién';
};

const tiempoHTML = (fecha, etiqueta) => `<time datetime="${fecha.toISOString()}" title="${esc(fecha.toLocaleString('es-AR'))}">${esc(etiqueta)}</time>`;

// Qué pasó con la propuesta, en una línea: aceptada, vista, sin abrir o solo editada.
const seguimientoHTML = p => {
  if (p.aceptacion) {
    const fecha = fechaDeAceptacion(p.aceptacion);
    const nombre = texto(p.aceptacion.nombre).split(' ')[0];
    return `<strong class="propuesta__hito">${fecha ? tiempoHTML(fecha, `Aceptada por ${nombre} ${haceCuanto(fecha)}`) : `Aceptada por ${esc(nombre)}`}</strong>`;
  }
  const vistas = Number(p.vistas) || 0;
  const vista = fechaDe(p.vistoUltimo);
  if (vistas > 0 && vista) return tiempoHTML(vista, `${vistas === 1 ? 'Vista 1 vez' : `Vista ${vistas} veces`} · ${haceCuanto(vista)}`);
  if (p.publico === true) return 'Sin abrir todavía';
  const editada = fechaDe(p.updatedAt);
  return editada ? tiempoHTML(editada, `Editada ${haceCuanto(editada)}`) : '';
};

// Color estable por cliente para el avatar con su inicial.
const tonoDe = nombre => [...texto(nombre)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) % 6;
const estadoDe = p => (ESTADOS_PROPUESTA[p.status] ? p.status : 'draft');

const propuestaHTML = p => {
  const titulo = texto(p.title).trim() || 'Sin título';
  const cliente = texto(p.clientName).trim();
  const moneda = p.aceptacion?.moneda || p.payload?.inversion?.moneda || 'USD';
  const importe = p.aceptacion ? Number(p.aceptacion.inicial) : Number(p.amount);
  const monto = importe > 0 ? dinero(importe, moneda) : '';
  const estadoP = estadoDe(p);
  const inicial = (cliente || titulo).trim().charAt(0).toUpperCase() || '·';
  return `
    <li class="propuesta">
      <a class="propuesta__abrir" href="?propuesta=${encodeURIComponent(p.id)}" data-accion="abrir-propuesta" data-id="${esc(p.id)}">
        <span class="propuesta__avatar" data-tono="${tonoDe(cliente || titulo)}" aria-hidden="true">${esc(inicial)}</span>
        <span class="propuesta__textos">
          <span class="propuesta__titulo">${esc(titulo)}</span>
          <span class="propuesta__cliente">${cliente ? esc(cliente) : 'Sin cliente'}</span>
        </span>
      </a>
      <span class="propuesta__monto">${esc(monto)}</span>
      <span class="propuesta__estado propuesta__estado--${estadoP}">${ESTADOS_PROPUESTA[estadoP]}</span>
      <span class="propuesta__fecha">${seguimientoHTML(p)}</span>
      <span class="propuesta__acciones">
        ${p.publico === true ? `<button type="button" class="icono-boton icono-boton--activo" data-accion="copiar-link-propuesta" data-id="${esc(p.id)}" aria-label="Copiar el link de «${esc(titulo)}»" title="Link activo: copiar">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.8 9.2a3 3 0 0 0 4.3 0l2-2a3 3 0 0 0-4.3-4.3l-.9.9M9.2 6.8a3 3 0 0 0-4.3 0l-2 2a3 3 0 0 0 4.3 4.3l.9-.9"/></svg>
        </button>` : ''}
        <button type="button" class="icono-boton" data-accion="duplicar-propuesta" data-id="${esc(p.id)}" aria-label="Duplicar «${esc(titulo)}»" title="Duplicar">
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.2"/><path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"/></svg>
        </button>
        <button type="button" class="icono-boton icono-boton--peligro" data-accion="borrar-propuesta" data-id="${esc(p.id)}" aria-label="Borrar «${esc(titulo)}»" title="Borrar">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/></svg>
        </button>
      </span>
    </li>`;
};

const FILTROS = [['todas', 'Todas'], ['draft', 'Borradores'], ['sent', 'Enviadas'], ['accepted', 'Aceptadas'], ['rejected', 'Rechazadas']];
let filtroEstado = 'todas';

const filtrosHTML = () => {
  const cuenta = id => (id === 'todas' ? propuestas.length : propuestas.filter(p => estadoDe(p) === id).length);
  return FILTROS
    .filter(([id]) => id !== 'rejected' || cuenta(id) > 0)
    .map(([id, nombre]) => `<button type="button" class="filtro" data-accion="filtrar" data-estado="${id}" aria-pressed="${filtroEstado === id}">${nombre} <span class="filtro__cuenta">${cuenta(id)}</span></button>`)
    .join('');
};

// Montos por moneda: el principal grande y el resto debajo.
const montosPorMoneda = lista => {
  const sumas = new Map();
  lista.forEach(p => {
    const m = p.aceptacion.moneda || 'USD';
    sumas.set(m, (sumas.get(m) || 0) + (Number(p.aceptacion.inicial) || 0));
  });
  return [...sumas].sort((a, b) => b[1] - a[1]).map(([m, total]) => dinero(total, m));
};

const metricaHTML = (valor, etiqueta, detalle, destacada = false) => `
  <div class="metrica${destacada ? ' metrica--destacada' : ''}">
    <span class="metrica__etiqueta">${esc(etiqueta)}</span>
    <span class="metrica__valor">${esc(valor)}</span>
    <span class="metrica__detalle">${esc(detalle)}</span>
  </div>`;

const metricasHTML = () => {
  const ahora = Date.now();
  const esperando = propuestas.filter(p => p.status === 'sent' && !p.aceptacion);
  const sinAbrir = esperando.filter(p => !(Number(p.vistas) > 0)).length;
  const abiertasSemana = propuestas.filter(p => {
    const f = fechaDe(p.vistoUltimo);
    return f && ahora - f < 7 * 86400000;
  }).length;
  const aceptadas = propuestas.filter(p => p.aceptacion);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const delMes = aceptadas.filter(p => (fechaDeAceptacion(p.aceptacion) || 0) >= inicioMes);
  const enviadas = propuestas.filter(p => ['sent', 'accepted', 'rejected'].includes(p.status)).length;
  const tasa = enviadas ? Math.round((aceptadas.length / enviadas) * 100) : null;
  const [montoPrincipal, ...otrosMontos] = montosPorMoneda(delMes);
  return [
    metricaHTML(esperando.length, 'Esperando respuesta', esperando.length ? (sinAbrir ? `${sinAbrir} sin abrir todavía` : 'Todas abiertas') : 'Nada pendiente'),
    metricaHTML(abiertasSemana, 'Abiertas esta semana', 'Propuestas que tus clientes miraron'),
    metricaHTML(delMes.length, 'Aceptadas este mes', tasa === null ? 'Todavía no enviaste ninguna' : `${tasa} % de las que enviaste`),
    metricaHTML(montoPrincipal || '—', 'Aceptado este mes', otrosMontos.length ? `y ${otrosMontos.join(' · ')}` : 'Total inicial aceptado', true)
  ].join('');
};

const primerNombre = () => nombreVisible().split(' ')[0];

const renderPanel = () => {
  if (elPanel.hidden) return;
  const filtro = sinAcentos(campoBuscar.value.trim());
  const visibles = propuestas
    .filter(p => filtroEstado === 'todas' || estadoDe(p) === filtroEstado)
    .filter(p => !filtro || sinAcentos(`${p.title} ${p.clientName}`).includes(filtro));
  const hay = propuestas.length > 0;

  $('#panel-saludo').textContent = primerNombre() ? `Hola, ${primerNombre()}` : 'Hola';
  elPanelResumen.textContent = hay ? `${propuestas.length} ${propuestas.length === 1 ? 'propuesta' : 'propuestas'}` : '';
  elMetricas.hidden = !hay;
  if (hay) elMetricas.innerHTML = metricasHTML();
  elHerramientas.hidden = propuestas.length < 2;
  elFiltros.innerHTML = filtrosHTML();
  elPanelVacio.hidden = panelCargando || panelError || hay;

  if (panelError) {
    elPanelEstado.innerHTML = 'No pudimos cargar tus propuestas. Revisá tu conexión. <button type="button" class="boton boton--texto boton--chico" data-accion="reintentar-panel">Reintentar</button>';
  } else if (panelCargando) {
    elPanelEstado.textContent = 'Cargando tus propuestas…';
  } else if (filtro && !visibles.length) {
    elPanelEstado.textContent = `No hay propuestas que coincidan con «${campoBuscar.value.trim()}».`;
  } else if (hay && !visibles.length) {
    elPanelEstado.textContent = 'No hay propuestas en este estado.';
  } else {
    elPanelEstado.textContent = '';
  }
  elLista.innerHTML = visibles.map(propuestaHTML).join('');
};

campoBuscar.addEventListener('input', renderPanel);

// Avisa en el momento cuando un cliente abre o acepta una propuesta. La primera
// carga solo registra cómo estaba todo, sin avisar.
let seguimientoAnterior = null;
const avisarNovedades = docs => {
  const actual = new Map(docs.map(p => [p.id, { aceptada: !!p.aceptacion, vistas: Number(p.vistas) || 0 }]));
  if (seguimientoAnterior) {
    for (const p of docs) {
      const antes = seguimientoAnterior.get(p.id);
      if (!antes) continue;
      const titulo = texto(p.title).trim() || 'tu propuesta';
      if (p.aceptacion && !antes.aceptada) avisar(`🎉 ${texto(p.aceptacion.nombre)} aceptó «${titulo}».`, 8000);
      else if ((Number(p.vistas) || 0) > antes.vistas) avisar(`Tu cliente está viendo «${titulo}».`, 6000);
    }
  }
  seguimientoAnterior = actual;
};

const elAvisoAceptada = $('#editor-aceptada');
// En el editor: si ya la aceptaron, el cliente sigue viendo la versión aceptada.
const actualizarAvisoAceptada = () => {
  const a = propuestaId ? propuestas.find(p => p.id === propuestaId)?.aceptacion : null;
  elAvisoAceptada.hidden = !a;
  if (!a) return;
  const fecha = fechaDeAceptacion(a);
  elAvisoAceptada.textContent = `${texto(a.nombre)} aceptó esta propuesta${fecha ? ` el ${fechaLarga(fecha)}` : ''}. Tu cliente sigue viendo la versión que aceptó: los cambios que hagas acá no le llegan.`;
};

const escucharPropuestas = () => {
  if (dejarDeEscuchar) dejarDeEscuchar();
  panelCargando = true;
  panelError = false;
  renderPanel();
  dejarDeEscuchar = AteneaDB.proposals.escuchar(docs => {
    // Más recientes primero; las que tienen cambios sin confirmar traen fecha estimada.
    propuestas = docs.sort((a, b) => (fechaDe(b.updatedAt) || 0) - (fechaDe(a.updatedAt) || 0));
    panelCargando = false;
    panelError = false;
    avisarNovedades(docs);
    renderPanel();
    actualizarAvisoAceptada();
  }, () => {
    panelCargando = false;
    panelError = true;
    renderPanel();
  });
};

const idEnUrl = () => new URLSearchParams(location.search).get('propuesta');
const seccionEnUrl = () => new URLSearchParams(location.search).get('seccion');

// Vistas: 'panel' (Mis propuestas), 'cuenta' (Mi cuenta) y 'editor'.
const TITULOS_VISTA = { panel: 'Mis propuestas | Dealit', cuenta: 'Mi cuenta | Dealit' };
const mostrarVista = vista => {
  const inicio = vista !== 'editor';
  document.body.classList.toggle('vista-inicio', inicio);
  document.body.classList.toggle('vista-panel', vista === 'panel');
  document.body.classList.toggle('vista-cuenta', vista === 'cuenta');
  elPanel.hidden = vista !== 'panel';
  elCuenta.hidden = vista !== 'cuenta';
  app.hidden = inicio;
  $$('.barra__nav-link').forEach(a => {
    if (a.dataset.seccion === vista) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  abrirMenu(false);
  if (TITULOS_VISTA[vista]) document.title = TITULOS_VISTA[vista];
};

// Antes de cambiar de propuesta o de vista, lo pendiente se manda a la cuenta.
const cerrarEdicion = () => {
  if (hayCambiosSinEnviar()) guardarAhora();
  editando = false;
  propuestaId = null;
};

const irAlPanel = ({ historial = true } = {}) => {
  cerrarEdicion();
  if (historial && location.search) history.pushState(null, '', location.pathname);
  mostrarVista('panel');
  renderPanel();
  elPanel.scrollTop = 0;
};

// Mi cuenta: perfil y datos del negocio que se usan en las propuestas nuevas.
let perfil = null;
let cuentaEditada = false;
const campoCuentaNombre = $('#cuenta-nombre');
const elCuentaEstado = $('#cuenta-estado');
const botonGuardarCuenta = $('#cuenta-guardar');

const nombreVisible = () => texto(perfil?.displayName || AteneaDB?.auth.getUser()?.displayName).trim();

const cargarPerfil = async () => {
  try {
    perfil = await AteneaDB.perfil.obtener();
  } catch (e) {
    console.warn('No se pudo cargar el perfil:', e);
    perfil = perfil || {};
  }
  renderPanel();
  if (!elCuenta.hidden && !cuentaEditada) llenarCuenta();
};

const llenarCuenta = () => {
  const user = AteneaDB.auth.getUser();
  const conPassword = AteneaDB.auth.usaPassword();
  campoCuentaNombre.value = nombreVisible();
  $('#cuenta-email').textContent = user?.email || '';
  $('#cuenta-acceso').textContent = conPassword ? 'Con email y contraseña.' : 'Con tu cuenta de Google.';
  $('[data-accion="cambiar-password"]').hidden = !conPassword;
  // Si todavía no guardó los datos del negocio, se sugieren los de su última propuesta.
  const sugeridos = !perfil?.emisor && propuestas[0]?.payload;
  const emisor = perfil?.emisor || (sugeridos ? normalizar(propuestas[0].payload).emisor : {});
  $$('[data-emisor]').forEach(el => { el.value = texto(emisor[el.dataset.emisor]); });
  // Los logos viejos guardados dentro de la propuesta no van al perfil: solo los de Storage.
  logoCuenta = esLogoValido(texto(emisor.logo)) && !texto(emisor.logo).startsWith('data:') ? texto(emisor.logo) : '';
  pintarLogoCuenta();
  elCuentaEstado.textContent = sugeridos ? 'Completamos estos datos con los de tu última propuesta. Guardalos para usarlos siempre.' : '';
  cuentaEditada = false;
};

$('#cuenta-form').addEventListener('input', () => {
  cuentaEditada = true;
  elCuentaEstado.textContent = '';
});

$('#cuenta-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const displayName = campoCuentaNombre.value.trim();
  const emisor = { ...Object.fromEntries($$('[data-emisor]').map(el => [el.dataset.emisor, el.value.trim()])), logo: logoCuenta };
  botonGuardarCuenta.disabled = true;
  botonGuardarCuenta.textContent = 'Guardando…';
  try {
    await AteneaDB.perfil.guardar({ displayName, emisor });
    perfil = { ...perfil, displayName, emisor };
    cuentaEditada = false;
    elCuentaEstado.textContent = 'Cambios guardados.';
    if (menuUsuario) menuUsuario.textContent = displayName || AteneaDB.auth.getUser()?.email || '';
  } catch (e) {
    console.error('No se pudo guardar el perfil:', e);
    elCuentaEstado.textContent = 'No se pudieron guardar los cambios. Revisá tu conexión y probá de nuevo.';
  } finally {
    botonGuardarCuenta.disabled = false;
    botonGuardarCuenta.textContent = 'Guardar cambios';
  }
});

// Logo del negocio en Mi cuenta: se sube a Storage y se guarda con «Guardar cambios».
let logoCuenta = '';
const campoLogoCuenta = $('#cuenta-logo');

const pintarLogoCuenta = () => {
  const vista = $('#cuenta-logo-vista');
  vista.hidden = !logoCuenta;
  if (logoCuenta) vista.src = logoCuenta;
  else vista.removeAttribute('src');
  $('#cuenta-logo-quitar').hidden = !logoCuenta;
  $('#cuenta-logo-texto').textContent = logoCuenta ? 'Cambiar logo' : 'Subir logo';
};

campoLogoCuenta.addEventListener('change', async () => {
  const archivo = campoLogoCuenta.files[0];
  campoLogoCuenta.value = '';
  if (!archivo || !nube()) return;
  if (!archivo.type.startsWith('image/')) {
    avisar('El logo tiene que ser una imagen PNG, JPG, SVG o WebP.');
    return;
  }
  if (archivo.size > LOGO_MAX_ARCHIVO) {
    avisar('El logo pesa más de 5 MB. Usá una versión más liviana.');
    return;
  }
  $('#cuenta-logo-texto').textContent = 'Subiendo logo…';
  campoLogoCuenta.disabled = true;
  try {
    logoCuenta = await AteneaDB.logos.subir(await logoParaSubir(archivo));
    cuentaEditada = true;
    elCuentaEstado.textContent = 'Guardá los cambios para usar este logo en tus propuestas nuevas.';
  } catch (e) {
    console.error('No se pudo subir el logo:', e);
    avisar('No se pudo subir el logo. Revisá tu conexión y probá de nuevo.');
  } finally {
    campoLogoCuenta.disabled = false;
    pintarLogoCuenta();
  }
});

// Avatar de la barra: la foto de Google, o la inicial si entró con email.
const pintarAvatar = user => {
  const el = $('#barra-avatar');
  const inicial = texto(user.displayName || user.email).trim().charAt(0).toUpperCase();
  el.textContent = inicial;
  if (!/^https:\/\//.test(texto(user.photoURL))) return;
  const img = document.createElement('img');
  img.alt = '';
  img.referrerPolicy = 'no-referrer'; // Google rechaza las fotos pedidas con referer de otro sitio
  img.src = user.photoURL;
  img.addEventListener('error', () => { el.textContent = inicial; });
  el.replaceChildren(img);
};

const cambiarPassword = async () => {
  const email = AteneaDB.auth.getUser()?.email;
  try {
    await AteneaDB.auth.recuperarPassword(email);
    avisar(`Te mandamos un email a ${email} para crear una contraseña nueva.`, 6000);
  } catch (e) {
    console.error('No se pudo enviar el email de contraseña:', e);
    avisar('No se pudo enviar el email. Probá de nuevo en unos minutos.');
  }
};

const irACuenta = ({ historial = true } = {}) => {
  cerrarEdicion();
  if (historial && seccionEnUrl() !== 'cuenta') history.pushState(null, '', `${location.pathname}?seccion=cuenta`);
  mostrarVista('cuenta');
  if (!cuentaEditada) llenarCuenta();
  elCuenta.scrollTop = 0;
};

const mostrarEditor = (id, contenido, { historial = true } = {}) => {
  propuestaId = id;
  estado = contenido;
  seleccion = new Set();
  errorGuardado = '';
  avisoError = false;
  if (historial) history.pushState(null, '', `${location.pathname}?propuesta=${encodeURIComponent(id)}`);
  mostrarVista('editor');
  cambiarPestana(false);
  llenarFormulario();
  renderDocumento();
  actualizarAvisoPagos();
  document.title = `${estado.propuesta.titulo.trim() || 'Propuesta sin título'} | Dealit`;
  $('.editor').scrollTop = 0;
  editando = true;
  mostrarEstadoGuardado();
  actualizarAvisoAceptada();
  migrarLogo();
};

const abrirPropuesta = async (id, opciones) => {
  cerrarEdicion();
  let doc = propuestas.find(p => p.id === id);
  if (!doc) doc = await AteneaDB.proposals.obtener(id).catch(e => {
    console.error('No se pudo abrir la propuesta:', e);
    return null;
  });
  if (!doc) {
    avisar('No encontramos esa propuesta. Puede que se haya borrado.');
    history.replaceState(null, '', location.pathname);
    irAlPanel({ historial: false });
    return;
  }
  mostrarEditor(id, normalizar(doc.payload), opciones);
};

// Tus datos de contacto se repiten en cada propuesta: la nueva toma los de Mi cuenta y,
// lo que falte (como el logo), de la última propuesta editada.
const nuevaPropuesta = base => {
  cerrarEdicion();
  const nueva = base || vacio();
  if (!base) {
    const ultima = propuestas[0]?.payload ? normalizar(propuestas[0].payload).emisor : null;
    const guardados = { ...perfil?.emisor };
    if (!guardados.logo) delete guardados.logo; // sin logo en Mi cuenta, se usa el de la última
    if (ultima || perfil?.emisor) nueva.emisor = { ...nueva.emisor, ...ultima, ...guardados };
  }
  const creada = crearEnCuenta(nueva);
  if (creada) mostrarEditor(creada.id, nueva);
};

const duplicarPropuesta = id => {
  const original = propuestas.find(p => p.id === id);
  if (!original) return;
  const copia = normalizar(original.payload);
  copia.propuesta.titulo = `${copia.propuesta.titulo.trim() || 'Sin título'} (copia)`;
  if (crearEnCuenta(copia)) avisar('Propuesta duplicada.');
};

const borrarPropuesta = async id => {
  const p = propuestas.find(x => x.id === id);
  const titulo = texto(p?.title).trim();
  const ok = await confirmar({
    titulo: '¿Borrar la propuesta?',
    texto: `Se borra ${titulo ? `«${titulo}»` : 'esta propuesta'} de tu cuenta y no se puede recuperar.${p?.publico ? ' El link que compartiste deja de funcionar.' : ''}`,
    aceptar: 'Borrar'
  });
  if (!ok) return;
  registrarEscritura(AteneaDB.proposals.borrar(id), 'No se pudo borrar la propuesta.')
    .then(borrada => { if (borrada) avisar('Propuesta borrada.'); });
};

window.addEventListener('popstate', () => {
  if (esCliente || !nube()) return;
  const id = idEnUrl();
  if (id) {
    if (id !== propuestaId) abrirPropuesta(id, { historial: false });
  } else if (seccionEnUrl() === 'cuenta') irACuenta({ historial: false });
  else irAlPanel({ historial: false });
});

// Un clic común abre en esta pestaña; con Ctrl, Cmd o la rueda, el navegador abre una nueva.
const clicComun = ev => ev.button === 0 && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey && !ev.altKey;

const errorCliente = (titulo, mensaje) => {
  $('#documento').innerHTML = `
    <div class="doc-error">
      <div>
        <h1>${esc(titulo)}</h1>
        <p>${esc(mensaje)}</p>
      </div>
    </div>`;
};

const mostrarCliente = datos => {
  estado = normalizar(datos);
  const destinatario = estado.cliente.empresa.trim() || estado.cliente.nombre.trim();
  document.title = [estado.propuesta.titulo.trim() || 'Propuesta', destinatario ? `para ${destinatario}` : ''].filter(Boolean).join(' ');
  renderDocumento();
};

// Link largo (#p=…): la propuesta viaja comprimida dentro del propio link.
const iniciarCliente = async () => {
  esCliente = true;
  document.body.classList.add('modo-cliente');
  try {
    mostrarCliente(JSON.parse(await descomprimir(location.hash.slice(PREFIJO.length))));
  } catch {
    errorCliente('No pudimos abrir esta propuesta', 'El link llegó incompleto o se cortó al copiarlo. Pedile a quien te lo mandó que lo comparta de nuevo.');
  }
};

// Link corto (/p/<id>): la propuesta se lee de la cuenta de quien la mandó,
// siempre en su última versión, mientras el link esté activo.
const iniciarClienteCorto = async id => {
  esCliente = true;
  document.body.classList.add('modo-cliente');
  if (!id) {
    errorCliente('No pudimos abrir esta propuesta', 'El link llegó incompleto o se cortó al copiarlo. Pedile a quien te lo mandó que lo comparta de nuevo.');
    return;
  }
  if (!AteneaDB) {
    errorCliente('No pudimos abrir esta propuesta', 'Hubo un problema al conectar. Revisá tu conexión y recargá la página.');
    return;
  }
  try {
    const datos = await AteneaDB.proposals.obtenerPublica(id);
    if (datos) {
      compartida = { id, aceptacion: datos.aceptacion };
      // Aceptada: se muestra la versión que se aceptó, con los opcionales elegidos.
      if (datos.aceptacion) seleccion = new Set((datos.aceptacion.opcionales || []).map(o => o.id));
      mostrarCliente(datos.aceptacion?.contenido || datos.payload);
      registrarVisita(id);
    } else errorCliente('Esta propuesta ya no está disponible', 'Puede que el link se haya desactivado. Pedile a quien te la mandó que te comparta uno nuevo.');
  } catch (e) {
    console.error('No se pudo abrir la propuesta compartida:', e);
    errorCliente('No pudimos abrir esta propuesta', 'Hubo un problema al conectar. Revisá tu conexión y recargá la página.');
  }
};

// Sin Firebase: un solo editor que guarda en el navegador, como antes de las cuentas.
const iniciarSinCuenta = () => {
  document.body.classList.add('sin-cuenta');
  estado = cargarGuardado() || ejemplo();
  llenarFormulario();
  renderDocumento();
  actualizarAvisoPagos();
  editando = true;
  mostrarEstadoGuardado();
};

// Con cuenta: se entra al panel, o directo a la propuesta si la URL la indica.
const iniciarConCuenta = async () => {
  const migrada = migrarLocal();
  escucharPropuestas();
  cargarPerfil();
  // Si se registró desde el editor sin cuenta, sigue donde estaba: con su propuesta
  // abierta y, si quería compartirla o bajar el PDF, haciendo eso.
  let continuar = null;
  try {
    continuar = sessionStorage.getItem(`${CLAVE}:continuar`);
    sessionStorage.removeItem(`${CLAVE}:continuar`);
  } catch {}
  const id = idEnUrl();
  if (migrada && continuar) {
    mostrarEditor(migrada.id, migrada.contenido, { historial: false });
    history.replaceState(null, '', `${location.pathname}?propuesta=${encodeURIComponent(migrada.id)}`);
    if (continuar === 'compartir') abrirCompartir();
    else if (continuar === 'pdf') descargarPDF();
  } else if (id) await abrirPropuesta(id, { historial: false });
  else if (seccionEnUrl() === 'cuenta') irACuenta({ historial: false });
  else irAlPanel({ historial: false });
};

const authPantalla   = $('#auth-pantalla');
const authForm       = $('#auth-form');
const authGoogle     = $('#auth-google');
const authErrorG     = $('#auth-error-google');
const authError      = $('#auth-error');
const authSubmit     = $('#auth-submit');
const authSubmitText = authSubmit?.querySelector('.auth__submit-texto');
const authSpinner    = authSubmit?.querySelector('.auth__spinner');
const authNombre     = $('#auth-nombre');
const authEmail      = $('#auth-email');
const authPass       = $('#auth-pass');
const menuUsuario    = $('#menu-usuario');
const authOlvido     = $('#auth-olvido');
const authMensaje    = $('#auth-mensaje');
const elIngreso      = $('#auth-ingreso');
const elVerificar    = $('#auth-verificar');
const verificarError = $('#auth-verificar-error');
const verificarMensaje = $('#auth-verificar-mensaje');
let authModo = 'login';
let entrar = () => {};

// Sin sesión: editor de prueba que guarda en este navegador. Al registrarse, lo que
// armó pasa a su cuenta (migrarLocal) y sigue con lo que quería hacer.
let invitado = false;
let invitadoIniciado = false;
let invitadoEdito = false; // si no cambió nada, el ejemplo no se guarda en su cuenta
let guardadoParaRegistro = false;

const iniciarInvitado = () => {
  invitado = true;
  document.body.classList.add('invitado');
  document.body.classList.remove('auth-cargando', 'auth-activo');
  authPantalla.hidden = true;
  if (invitadoIniciado) return;
  invitadoIniciado = true;
  const pideIngresar = new URLSearchParams(location.search).has('ingresar');
  if (location.search) history.replaceState(null, '', location.pathname);
  const guardada = cargarGuardado();
  invitadoEdito = !!guardada;
  estado = guardada || ejemplo();
  seleccion = new Set();
  llenarFormulario();
  renderDocumento();
  actualizarAvisoPagos();
  editando = true;
  mostrarEstadoGuardado();
  if (pideIngresar) abrirRegistro('ingresar');
};

// Con la sesión ya iniciada, guardarAhora apuntaría a la cuenta: lo pendiente del
// visitante va al navegador, y de ahí migrarLocal lo pasa a su cuenta.
const guardarCambiosDeInvitado = () => {
  if (!hayCambiosSinEnviar()) return;
  clearTimeout(temporizadorGuardado);
  temporizadorGuardado = null;
  guardarLocal();
};

const MOTIVOS_REGISTRO = {
  compartir: 'Creá tu cuenta gratis para compartir tu propuesta. Lo que armaste se guarda en tu cuenta.',
  pdf: 'Creá tu cuenta gratis para descargar tu propuesta en PDF. Lo que armaste se guarda en tu cuenta.',
  guardar: 'Creá tu cuenta gratis para guardar tus propuestas y abrirlas desde cualquier dispositivo.'
};

const abrirRegistro = motivo => {
  if (MOTIVOS_REGISTRO[motivo]) {
    // Se guarda ya, aunque no haya editado: es la propuesta que quiere compartir.
    if (invitado) {
      guardadoParaRegistro = !invitadoEdito;
      guardarLocal();
    }
    try { sessionStorage.setItem(`${CLAVE}:continuar`, motivo); } catch {}
  }
  const elMotivo = $('#auth-motivo');
  elMotivo.textContent = MOTIVOS_REGISTRO[motivo] || '';
  elMotivo.hidden = !MOTIVOS_REGISTRO[motivo];
  $('#auth-cerrar').hidden = !invitado;
  authPantalla.hidden = false;
  authGoogle.focus();
};

const cerrarRegistro = () => {
  if (!invitado) return;
  authPantalla.hidden = true;
  try {
    sessionStorage.removeItem(`${CLAVE}:continuar`);
    // Si solo se guardó para el registro y al final no se registró, no queda nada guardado.
    if (guardadoParaRegistro && !invitadoEdito) localStorage.removeItem(CLAVE);
  } catch {}
  guardadoParaRegistro = false;
};
$('#auth-cerrar').addEventListener('click', cerrarRegistro);
$('.auth__fondo').addEventListener('click', cerrarRegistro);
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && !authPantalla.hidden) cerrarRegistro();
});

const mostrarMensaje = (el, texto) => {
  el.textContent = texto;
  el.hidden = false;
};

const mostrarErrorAuth = (el, msg) => {
  if (!el) return;
  const MENSAJES = {
    'auth/user-not-found':          'No hay cuenta con ese email.',
    'auth/wrong-password':          'Contraseña incorrecta.',
    'auth/invalid-credential':      'Email o contraseña incorrectos.',
    'auth/email-already-in-use':    'Ya existe una cuenta con ese email.',
    'auth/weak-password':           'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-email':           'El email no es válido.',
    'auth/too-many-requests':       'Demasiados intentos. Esperá un momento.',
    'auth/popup-closed-by-user':    '',
    'auth/cancelled-popup-request': ''
  };
  const texto = MENSAJES[msg?.code] ?? MENSAJES[msg?.message] ?? (typeof msg === 'string' ? msg : 'Ocurrió un error. Intentá de nuevo.');
  if (!texto) { el.hidden = true; return; }
  el.textContent = texto;
  el.hidden = false;
};

const setAuthCargando = (cargando) => {
  if (authSubmit) authSubmit.disabled = cargando;
  if (authGoogle) authGoogle.disabled = cargando;
  if (authSubmitText) authSubmitText.textContent = cargando ? 'Cargando...' : (authModo === 'login' ? 'Iniciar sesión' : 'Crear cuenta');
  if (authSpinner) authSpinner.hidden = !cargando;
};

if (authPantalla && AteneaDB) {
  authPantalla.querySelectorAll('[data-auth-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      authModo = tab.dataset.authTab === 'registro' ? 'registro' : 'login';
      authPantalla.querySelectorAll('[data-auth-tab]').forEach(t => t.classList.toggle('auth__tab--activo', t === tab));
      const campoNombre = authPantalla.querySelector('.auth__campo--nombre');
      if (campoNombre) campoNombre.hidden = authModo === 'login';
      if (authSubmitText) authSubmitText.textContent = authModo === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
      if (authPass) authPass.autocomplete = authModo === 'login' ? 'current-password' : 'new-password';
      if (authError) authError.hidden = true;
      authOlvido.hidden = authModo !== 'login';
      authMensaje.hidden = true;
    });
  });

  authPantalla.querySelectorAll('[data-auth-toggle-pass]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!authPass) return;
      const show = authPass.type === 'password';
      authPass.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  });

  authGoogle.addEventListener('click', async () => {
    setAuthCargando(true);
    if (authErrorG) authErrorG.hidden = true;
    try {
      await AteneaDB.auth.signInGoogle();
    } catch (e) {
      console.error('[APP] signInGoogle ERROR:', e.code, e.message);
      mostrarErrorAuth(authErrorG, e);
    } finally {
      setAuthCargando(false);
    }
  });

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmail?.value.trim();
    const pass  = authPass?.value;
    if (!email || !pass) return;
    setAuthCargando(true);
    if (authError) authError.hidden = true;
    try {
      if (authModo === 'registro') {
        await AteneaDB.auth.signUp(email, pass, authNombre?.value.trim());
      } else {
        await AteneaDB.auth.signIn(email, pass);
      }
    } catch (e) {
      mostrarErrorAuth(authError, e);
    } finally {
      setAuthCargando(false);
    }
  });

  // El mensaje es el mismo exista o no la cuenta, para no revelar qué emails están registrados.
  authOlvido.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    authError.hidden = true;
    authMensaje.hidden = true;
    if (!email) {
      mostrarErrorAuth(authError, 'Escribí tu email arriba y volvé a tocar «¿Olvidaste tu contraseña?».');
      authEmail.focus();
      return;
    }
    authOlvido.disabled = true;
    try {
      await AteneaDB.auth.recuperarPassword(email);
      mostrarMensaje(authMensaje, `Si hay una cuenta con ${email}, te mandamos un link para crear una contraseña nueva.`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') mostrarMensaje(authMensaje, `Si hay una cuenta con ${email}, te mandamos un link para crear una contraseña nueva.`);
      else mostrarErrorAuth(authError, e);
    } finally {
      authOlvido.disabled = false;
    }
  });

  $('#auth-verificar-listo').addEventListener('click', async ev => {
    const boton = ev.currentTarget;
    boton.disabled = true;
    verificarError.hidden = true;
    verificarMensaje.hidden = true;
    try {
      if (await AteneaDB.auth.comprobarVerificacion()) entrar(AteneaDB.auth.getUser());
      else mostrarErrorAuth(verificarError, 'Tu email todavía no figura como verificado. Tocá el link del email que te mandamos y probá de nuevo.');
    } catch (e) {
      mostrarErrorAuth(verificarError, e);
    } finally {
      boton.disabled = false;
    }
  });

  $('#auth-verificar-reenviar').addEventListener('click', async ev => {
    const boton = ev.currentTarget;
    boton.disabled = true;
    verificarError.hidden = true;
    try {
      await AteneaDB.auth.enviarVerificacion();
      mostrarMensaje(verificarMensaje, 'Te reenviamos el email. Puede tardar unos minutos en llegar.');
    } catch (e) {
      mostrarErrorAuth(verificarError, e.code === 'auth/too-many-requests'
        ? 'Ya te mandamos varios emails. Esperá unos minutos antes de pedir otro.'
        : e);
    } finally {
      boton.disabled = false;
    }
  });

  $('#auth-verificar-salir').addEventListener('click', async () => {
    await AteneaDB.auth.signOut();
    location.reload();
  });

  // Si verificó en otra pestaña (o en el celular), al volver entra solo.
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || elVerificar.hidden || !AteneaDB.auth.getUser()) return;
    try {
      if (await AteneaDB.auth.comprobarVerificacion()) entrar(AteneaDB.auth.getUser());
    } catch {}
  });
}

const dialogoEliminar = $('#dialogo-eliminar');
const eliminarConfirmacion = $('#eliminar-confirmacion');
const eliminarPass = $('#eliminar-pass');
const eliminarBoton = $('#eliminar-confirmar');
const eliminarError = $('#eliminar-error');

const actualizarBotonEliminar = () => {
  eliminarBoton.disabled = eliminarConfirmacion.value.trim().toUpperCase() !== 'ELIMINAR'
    || (AteneaDB.auth.usaPassword() && !eliminarPass.value);
};
eliminarConfirmacion.addEventListener('input', actualizarBotonEliminar);
eliminarPass.addEventListener('input', actualizarBotonEliminar);

const abrirEliminarCuenta = () => {
  const conPassword = AteneaDB.auth.usaPassword();
  $('#eliminar-form').reset();
  $('#eliminar-campo-pass').hidden = !conPassword;
  $('#eliminar-ayuda-google').hidden = conPassword;
  eliminarError.hidden = true;
  eliminarBoton.textContent = 'Eliminar cuenta';
  actualizarBotonEliminar();
  dialogoEliminar.showModal();
  eliminarConfirmacion.focus();
};

eliminarBoton.addEventListener('click', async () => {
  eliminarBoton.disabled = true;
  eliminarBoton.textContent = 'Eliminando…';
  eliminarError.hidden = true;
  try {
    await AteneaDB.auth.eliminarCuenta(eliminarPass.value);
    try {
      Object.keys(localStorage).filter(k => k.startsWith(CLAVE)).forEach(k => localStorage.removeItem(k));
      sessionStorage.setItem(`${CLAVE}:cuenta-eliminada`, '1');
    } catch {}
    location.replace('/');
  } catch (e) {
    console.error('No se pudo eliminar la cuenta:', e);
    const MENSAJES = {
      'auth/wrong-password': 'La contraseña no es correcta.',
      'auth/invalid-credential': 'La contraseña no es correcta.',
      'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de confirmar. Probá de nuevo.',
      'auth/cancelled-popup-request': 'Cerraste la ventana de Google antes de confirmar. Probá de nuevo.',
      'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permitila y probá de nuevo.',
      'auth/user-mismatch': 'Elegiste otra cuenta de Google. Confirmá con la cuenta con la que iniciaste sesión.',
      'auth/too-many-requests': 'Demasiados intentos. Esperá un momento.'
    };
    eliminarError.textContent = MENSAJES[e.code] || 'No se pudo eliminar la cuenta. Revisá tu conexión y probá de nuevo.';
    eliminarError.hidden = false;
    eliminarBoton.textContent = 'Eliminar cuenta';
    actualizarBotonEliminar();
  }
});

const cerrarSesion = async () => {
  if (!AteneaDB) return;
  if (hayCambiosSinEnviar()) guardarAhora();
  // Cerrar sesión borra la caché local: antes hay que asegurar que todo llegó a la cuenta.
  const sincronizado = await Promise.race([
    ultimaEscritura.then(() => !escriturasPendientes),
    new Promise(res => setTimeout(() => res(false), 4000))
  ]);
  if (!sincronizado && nube() && !await confirmar({
    titulo: 'Hay cambios sin sincronizar',
    texto: 'Los últimos cambios todavía no llegaron a tu cuenta, probablemente por falta de conexión. Si cerrás sesión ahora, se pierden.',
    aceptar: 'Cerrar sesión igual'
  })) return;
  await AteneaDB.auth.signOut();
  location.replace('/');
};

const esLinkCorto = location.pathname.startsWith('/p/');
const esClienteLink = location.hash.startsWith(PREFIJO) || esLinkCorto;

if (!AteneaDB || esClienteLink) document.body.classList.remove('auth-cargando');

if (esLinkCorto) {
  iniciarClienteCorto((location.pathname.match(RUTA_LINK) || [])[1]);
} else if (esClienteLink) {
  iniciarCliente();
} else if (AteneaDB) {
  let editorIniciado = false;

  const mostrarAuth = () => {
    document.body.classList.remove('auth-cargando');
    authPantalla.hidden = false;
    document.body.classList.add('auth-activo');
  };

  // Cuentas con email y contraseña: hasta verificar el email no entran a la app
  // (las reglas de Firestore y Storage tampoco les permiten escribir).
  const mostrarVerificacion = user => {
    if (invitado) guardarCambiosDeInvitado();
    $('#auth-cerrar').hidden = true;
    $('#auth-verificar-email').textContent = user.email;
    elIngreso.hidden = true;
    elVerificar.hidden = false;
    mostrarAuth();
  };

  entrar = async user => {
    elVerificar.hidden = true;
    elIngreso.hidden = false;
    authPantalla.hidden = true;
    document.body.classList.remove('auth-activo');
    if (invitado) {
      guardarCambiosDeInvitado();
      invitado = false;
      editando = false;
      document.body.classList.remove('invitado');
    }
    if (menuUsuario) menuUsuario.textContent = user.displayName || user.email;
    pintarAvatar(user);
      if (!editorIniciado) {
      editorIniciado = true;
      // El spinner sigue visible hasta saber qué mostrar, así no se ve un editor vacío.
      document.body.classList.add('auth-cargando');
      await iniciarConCuenta();
    }
    document.body.classList.remove('auth-cargando');
  };

  AteneaDB.auth.onAuthChange(async user => {
    if (!user) {
      // Sin sesión: se entra directo al editor para probar. La cuenta se pide al compartir.
      iniciarInvitado();
      try {
        if (sessionStorage.getItem(`${CLAVE}:cuenta-eliminada`)) {
          sessionStorage.removeItem(`${CLAVE}:cuenta-eliminada`);
          avisar('Tu cuenta y todos tus datos se eliminaron.', 6000);
        }
      } catch {}
      return;
    }
    // Al volver desde el link del email, el usuario en memoria puede estar desactualizado.
    if (!user.emailVerified) {
      const verificado = await AteneaDB.auth.comprobarVerificacion().catch(() => false);
      if (!verificado) {
        mostrarVerificacion(user);
        return;
      }
    }
    entrar(user);
  });
} else if (AteneaDBError) {
  authPantalla.hidden = false;
  document.body.classList.add('auth-activo');
  mostrarErrorAuth(authErrorG, AteneaDBError);
} else {
  authPantalla.hidden = true;
  document.body.classList.remove('auth-activo');
  iniciarSinCuenta();
}

window.addEventListener('hashchange', () => {
  if (location.hash.startsWith(PREFIJO) || esCliente) location.reload();
});