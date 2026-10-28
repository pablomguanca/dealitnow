import { numero } from './formato.js';

let svgSecuencia = 0;

export const decoracionPortadaSVGBase = tipo => {
  switch (tipo) {
    case 'organica':
      return `
        <svg class="portada__svg portada__svg--organica" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="org-grad-a" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.22"/>
              <stop offset="55%" stop-color="currentColor" stop-opacity="0.08"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="org-grad-b" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.18"/>
              <stop offset="60%" stop-color="currentColor" stop-opacity="0.06"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </linearGradient>
            <radialGradient id="org-halo" cx="84%" cy="16%" r="46%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.2"/>
              <stop offset="60%" stop-color="currentColor" stop-opacity="0.05"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="800" height="1000" fill="url(#org-halo)"/>
          <path d="M510,-60 C680,-50 860,70 850,260 C840,450 690,520 575,435 C460,350 420,210 455,75 C475,-5 480,-60 510,-60 Z" fill="url(#org-grad-a)"/>
          <path d="M600,-20 C750,10 850,150 815,310 C780,470 630,545 535,455 C440,365 450,170 530,50 C560,5 575,-25 600,-20 Z" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.24"/>
          <path d="M645,40 C755,65 820,185 785,315 C750,445 625,490 560,415 C495,340 535,15 645,40 Z" fill="none" stroke="currentColor" stroke-width="0.8" stroke-dasharray="3 5" opacity="0.2"/>
          <path d="M-90,740 C40,650 240,700 310,830 C380,960 270,1070 100,1055 C-70,1040 -150,795 -90,740 Z" fill="url(#org-grad-b)"/>
          <path d="M-50,805 C75,715 235,765 285,895 C315,970 250,1040 140,1035" fill="none" stroke="currentColor" stroke-width="1.15" opacity="0.22"/>
          <path d="M655,295 C675,220 715,150 770,95" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" opacity="0.26"/>
          <path d="M675,245 C650,225 645,195 668,175 C692,188 692,220 675,245 Z" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.1" opacity="0.26"/>
          <path d="M702,195 C728,182 745,198 738,224 C714,225 702,210 702,195 Z" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.1" opacity="0.26"/>
          <path d="M722,152 C700,132 702,106 724,92 C742,108 738,135 722,152 Z" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.1" opacity="0.26"/>
          <path d="M35,965 C75,895 130,840 205,795" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.2"/>
          <path d="M78,910 C60,885 65,856 90,844 C108,862 100,892 78,910 Z" fill="currentColor" fill-opacity="0.09" stroke="currentColor" stroke-width="1" opacity="0.2"/>
          <path d="M128,858 C152,850 168,868 156,892 C134,890 124,874 128,858 Z" fill="currentColor" fill-opacity="0.09" stroke="currentColor" stroke-width="1" opacity="0.2"/>
          <circle cx="630" cy="160" r="3.5" fill="currentColor" opacity="0.3"/>
          <circle cx="585" cy="215" r="2" fill="currentColor" opacity="0.22"/>
          <circle cx="715" cy="275" r="2.5" fill="currentColor" opacity="0.24"/>
          <circle cx="195" cy="845" r="3" fill="currentColor" opacity="0.24"/>
          <circle cx="240" cy="790" r="1.8" fill="currentColor" opacity="0.18"/>
          <rect x="36" y="36" width="728" height="928" rx="4" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.18"/>
        </svg>`;
    case 'geometrica':
      return `
        <svg class="portada__svg portada__svg--geometrica" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="geo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0.03"/>
            </linearGradient>
            <linearGradient id="geo-grad-2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.16"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </linearGradient>
            <pattern id="geo-halftone" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="9" cy="9" r="1.4" fill="currentColor" opacity="0.22"/>
            </pattern>
          </defs>
          <circle cx="685" cy="165" r="195" fill="url(#geo-halftone)"/>
          <circle cx="695" cy="155" r="210" fill="none" stroke="currentColor" stroke-width="1" opacity="0.2"/>
          <circle cx="695" cy="155" r="165" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="10 8" opacity="0.24"/>
          <circle cx="695" cy="155" r="118" fill="url(#geo-grad-1)"/>
          <path d="M695,37 A118,118 0 0,1 813,155 L695,155 Z" fill="currentColor" opacity="0.12"/>
          <circle cx="695" cy="155" r="56" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.28"/>
          <circle cx="695" cy="155" r="14" fill="currentColor" opacity="0.26"/>
          <path d="M520,0 L800,280 M580,0 L800,220 M640,0 L800,160" stroke="currentColor" stroke-width="0.9" opacity="0.16"/>
          <path d="M0,780 L220,1000 L0,1000 Z" fill="url(#geo-grad-2)"/>
          <path d="M0,845 L155,1000" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.22"/>
          <path d="M40,960 A140,140 0 0,1 180,820" fill="none" stroke="currentColor" stroke-width="1.1" stroke-dasharray="4 6" opacity="0.24"/>
          <rect x="640" y="790" width="112" height="112" fill="none" stroke="currentColor" stroke-width="0.95" opacity="0.18"/>
          <path d="M640,902 A112,112 0 0,1 752,790" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.22"/>
          <rect x="44" y="44" width="712" height="912" fill="none" stroke="currentColor" stroke-width="1" opacity="0.22"/>
          <rect x="60" y="60" width="32" height="5" fill="currentColor" opacity="0.38"/>
          <rect x="98" y="60" width="10" height="5" fill="currentColor" opacity="0.22"/>
          <path d="M485,62 H499 M492,55 V69 M735,442 H749 M742,435 V449 M62,745 H76 M69,738 V752" stroke="currentColor" stroke-width="1.15" opacity="0.34"/>
        </svg>`;
    case 'aurora':
      return `
        <svg class="portada__svg portada__svg--aurora" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="aurora-a" cx="82%" cy="15%" r="52%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.32"/>
              <stop offset="45%" stop-color="currentColor" stop-opacity="0.12"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="aurora-b" cx="14%" cy="86%" r="48%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.24"/>
              <stop offset="55%" stop-color="currentColor" stop-opacity="0.07"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="aurora-c" cx="72%" cy="76%" r="36%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.16"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="800" height="1000" fill="url(#aurora-a)"/>
          <rect width="800" height="1000" fill="url(#aurora-b)"/>
          <rect width="800" height="1000" fill="url(#aurora-c)"/>
          <path d="M0,60 H800 M0,115 H800 M0,170 H800 M120,0 L55,200 M260,0 L220,200 M400,0 L400,200 M540,0 L580,200 M680,0 L745,200 M0,835 H800 M0,890 H800 M0,945 H800 M160,800 L75,1000 M300,800 L250,1000 M440,800 L440,1000 M580,800 L630,1000 M720,800 L805,1000" stroke="currentColor" stroke-width="0.75" opacity="0.15" fill="none"/>
          <ellipse cx="655" cy="175" rx="220" ry="115" transform="rotate(-18 655 175)" fill="none" stroke="currentColor" stroke-width="1.05" opacity="0.24"/>
          <ellipse cx="655" cy="175" rx="155" ry="76" transform="rotate(-18 655 175)" fill="none" stroke="currentColor" stroke-width="0.9" stroke-dasharray="5 7" opacity="0.22"/>
          <path d="M510,130 C590,85 690,110 755,190 C680,235 585,220 510,130 Z" fill="currentColor" opacity="0.07"/>
          <path d="M555,115 L635,85 L715,135 L685,215 L590,195 Z" fill="none" stroke="currentColor" stroke-width="0.95" opacity="0.24"/>
          <path d="M635,85 L685,215 M555,115 L715,135" fill="none" stroke="currentColor" stroke-width="0.85" stroke-dasharray="2 4" opacity="0.18"/>
          <circle cx="555" cy="115" r="3" fill="currentColor" opacity="0.4"/>
          <circle cx="635" cy="85" r="3.5" fill="currentColor" opacity="0.45"/>
          <circle cx="715" cy="135" r="4" fill="currentColor" opacity="0.48"/>
          <circle cx="685" cy="215" r="3" fill="currentColor" opacity="0.38"/>
          <circle cx="590" cy="195" r="2.5" fill="currentColor" opacity="0.32"/>
          <path d="M690,68 L694,82 L708,86 L694,90 L690,104 L686,90 L672,86 L686,82 Z" fill="currentColor" opacity="0.48"/>
          <path d="M530,220 L532.5,229 L541.5,231.5 L532.5,234 L530,243 L527.5,234 L518.5,231.5 L527.5,229 Z" fill="currentColor" opacity="0.34"/>
          <path d="M125,805 L128,815 L138,818 L128,821 L125,831 L122,821 L112,818 L122,815 Z" fill="currentColor" opacity="0.34"/>
          <rect x="38" y="38" width="724" height="924" rx="6" fill="none" stroke="currentColor" stroke-width="0.9" opacity="0.2"/>
        </svg>`;
    case 'trama':
      return `
        <svg class="portada__svg portada__svg--trama" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="trama-menor" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.1"/>
            </pattern>
            <pattern id="trama-mayor" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#trama-menor)"/>
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" stroke-width="0.85" opacity="0.18"/>
              <circle cx="0" cy="0" r="1.4" fill="currentColor" opacity="0.3"/>
            </pattern>
          </defs>
          <rect x="44" y="44" width="712" height="912" fill="url(#trama-mayor)"/>
          <g transform="translate(650, 175)" fill="none" stroke="currentColor">
            <circle cx="0" cy="0" r="92" stroke-width="1" opacity="0.26"/>
            <circle cx="0" cy="0" r="68" stroke-width="0.85" stroke-dasharray="3 4" opacity="0.24"/>
            <circle cx="0" cy="0" r="34" stroke-width="0.95" opacity="0.26"/>
            <circle cx="0" cy="0" r="3.2" fill="currentColor" stroke="none" opacity="0.4"/>
            <path d="M-108,0 H108 M0,-108 V108" stroke-width="0.8" opacity="0.22"/>
            <path d="M-65,-65 L65,65 M-65,65 L65,-65" stroke-width="0.65" stroke-dasharray="2 5" opacity="0.18"/>
            <path d="M0,-92 A92,92 0 0,1 92,0" stroke-width="2.1" opacity="0.36"/>
          </g>
          <path d="M540,44 V956" stroke="currentColor" stroke-width="0.85" stroke-dasharray="4 6" opacity="0.2"/>
          <path d="M44,265 H756" stroke="currentColor" stroke-width="0.85" stroke-dasharray="4 6" opacity="0.18"/>
          <path d="M756,740 A216,216 0 0,0 540,956" fill="none" stroke="currentColor" stroke-width="0.95" opacity="0.22"/>
          <rect x="44" y="44" width="712" height="912" fill="none" stroke="currentColor" stroke-width="1.15" opacity="0.28"/>
          <rect x="52" y="52" width="696" height="896" fill="none" stroke="currentColor" stroke-width="0.55" opacity="0.15"/>
          <path d="M32,44 H60 M44,32 V60 M740,44 H768 M756,32 V60 M32,956 H60 M44,940 V968 M740,956 H768 M756,940 V968" stroke="currentColor" stroke-width="1.6" opacity="0.42"/>
          <rect x="64" y="38" width="18" height="3" fill="currentColor" opacity="0.3"/>
          <rect x="86" y="38" width="6" height="3" fill="currentColor" opacity="0.3"/>
          <rect x="96" y="38" width="6" height="3" fill="currentColor" opacity="0.3"/>
          <rect x="690" y="959" width="24" height="3" fill="currentColor" opacity="0.3"/>
          <rect x="678" y="959" width="8" height="3" fill="currentColor" opacity="0.3"/>
        </svg>`;
    case 'ondas':
      return `
        <svg class="portada__svg portada__svg--ondas" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="onda-fill-top" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.18"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="onda-fill-bot" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.18"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </linearGradient>
            <radialGradient id="onda-flare" cx="82%" cy="16%" r="38%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.24"/>
              <stop offset="50%" stop-color="currentColor" stop-opacity="0.06"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="800" height="1000" fill="url(#onda-flare)"/>
          <path d="M0,150 C240,55 460,225 800,85 L800,0 L0,0 Z" fill="url(#onda-fill-top)"/>
          <g fill="none" stroke="currentColor">
            <path d="M-40,95 C210,10 450,190 840,55" stroke-width="1.5" opacity="0.32"/>
            <path d="M-40,122 C225,35 465,205 840,82" stroke-width="1.2" opacity="0.26"/>
            <path d="M-40,149 C240,60 480,220 840,109" stroke-width="1" opacity="0.2"/>
            <path d="M-40,176 C255,85 495,235 840,136" stroke-width="0.85" opacity="0.15"/>
            <path d="M-40,203 C270,110 510,250 840,163" stroke-width="0.7" opacity="0.11"/>
          </g>
          <path d="M0,845 C250,765 510,935 800,810 L800,1000 L0,1000 Z" fill="url(#onda-fill-bot)"/>
          <g fill="none" stroke="currentColor">
            <path d="M-40,785 C235,705 500,895 840,755" stroke-width="0.75" opacity="0.14"/>
            <path d="M-40,812 C245,730 510,910 840,782" stroke-width="0.95" opacity="0.2"/>
            <path d="M-40,839 C255,755 520,925 840,809" stroke-width="1.25" opacity="0.26"/>
            <path d="M-40,866 C265,780 530,940 840,836" stroke-width="1.6" opacity="0.34"/>
            <path d="M-40,893 C275,805 540,955 840,863" stroke-width="1.1" opacity="0.22"/>
            <path d="M-40,920 C285,830 550,970 840,890" stroke-width="0.8" opacity="0.15"/>
          </g>
          <g transform="translate(665, 160)" fill="none" stroke="currentColor">
            <circle cx="0" cy="0" r="64" stroke-width="0.95" opacity="0.24"/>
            <circle cx="0" cy="0" r="42" stroke-width="0.75" stroke-dasharray="3 5" opacity="0.2"/>
            <circle cx="0" cy="0" r="4" fill="currentColor" stroke="none" opacity="0.32"/>
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
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.18"/>
              <stop offset="55%" stop-color="currentColor" stop-opacity="0.05"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="marco-luz-pie" cx="18%" cy="88%" r="44%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.12"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="800" height="1000" fill="url(#marco-luz)"/>
          <rect width="800" height="1000" fill="url(#marco-luz-pie)"/>
          <g transform="translate(675, 145)" fill="none" stroke="currentColor">
            <circle cx="0" cy="0" r="78" stroke-width="0.85" opacity="0.22"/>
            <circle cx="0" cy="0" r="58" stroke-width="0.75" stroke-dasharray="2 5" opacity="0.2"/>
            <ellipse cx="0" cy="0" rx="78" ry="26" transform="rotate(30)" stroke-width="0.7" opacity="0.2"/>
            <ellipse cx="0" cy="0" rx="78" ry="26" transform="rotate(-30)" stroke-width="0.7" opacity="0.2"/>
            <ellipse cx="0" cy="0" rx="78" ry="26" transform="rotate(90)" stroke-width="0.7" opacity="0.2"/>
            <polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" fill="currentColor" stroke="none" opacity="0.34"/>
          </g>
          <rect x="36" y="36" width="728" height="928" fill="none" stroke="currentColor" stroke-width="1.15" opacity="0.3"/>
          <rect x="46" y="46" width="708" height="908" fill="none" stroke="currentColor" stroke-width="0.7" opacity="0.18"/>
          <path d="M36,76 L76,36 M724,36 L764,76 M36,924 L76,964 M724,964 L764,924" stroke="currentColor" stroke-width="1.1" opacity="0.32"/>
          <path d="M46,86 L86,46 M714,46 L754,86 M46,914 L86,954 M714,954 L754,914" stroke="currentColor" stroke-width="0.7" opacity="0.22"/>
          <g fill="currentColor" opacity="0.42">
            <polygon points="400,29 407,36 400,43 393,36"/>
            <polygon points="400,957 407,964 400,971 393,964"/>
            <polygon points="29,500 36,507 43,500 36,493"/>
            <polygon points="757,500 764,507 771,500 764,493"/>
          </g>
        </svg>`;
  }
};

export const decoracionPortadaSVG = (tipo, opacidadPct = 100, colorHex = '') => {
  const escala = Math.max(0, Math.min(2.5, numero(opacidadPct) / 100));
  const base = decoracionPortadaSVGBase(tipo);
  if (!base || escala <= 0) return '';
  const suf = ++svgSecuencia;
  const tinta = /^#[0-9A-Fa-f]{6}$/.test(String(colorHex || '').trim()) ? String(colorHex).trim() : 'currentColor';
  return base
    .replace(/\bid="([a-z0-9-]+)"/gi, (_, id) => `id="${id}-${suf}"`)
    .replace(/url\(#([a-z0-9-]+)\)/gi, (_, id) => `url(#${id}-${suf})`)
    .replace(/currentColor/g, tinta)
    .replace(/\b(stop-opacity|fill-opacity|opacity)="([\d.]+)"/g, (m, attr, val) => {
      const num = parseFloat(val);
      if (!Number.isFinite(num) || num === 0) return m;
      const nuevo = Math.min(0.96, Math.max(0, +(num * escala).toFixed(3)));
      return `${attr}="${nuevo}"`;
    });
};
