import { describe, expect, it } from 'vitest';
import {
  DECORACIONES,
  ESTILOS_BLOQUES,
  PLANTILLAS,
  PLANTILLAS_PORTAFOLIO,
  ejemploPortafolio,
  normalizarPortafolio,
  resumenPortafolio,
  PORTADAS,
  TEMAS,
  calcularTotales,
  ejemplo,
  normalizarPropuesta,
  vacio
} from '../src/modelo.js';
import { LOGO_MAX_ARCHIVO, FOTO_MAX_ARCHIVO } from '../src/lib/imagenes.js';

const conServicios = (servicios, inversion = {}) => ({
  ...vacio(),
  servicios,
  inversion: { ...vacio().inversion, ...inversion }
});

describe('calcularTotales', () => {
  it('separa pagos únicos de mensuales', () => {
    const t = calcularTotales(conServicios([
      { id: 'a', modalidad: 'unico', cantidad: 2, precio: 100 },
      { id: 'b', modalidad: 'hora', cantidad: 3, precio: 10 },
      { id: 'c', modalidad: 'mensual', cantidad: 1, precio: 50 }
    ]));
    expect(t.inicial.total).toBe(230);
    expect(t.mensual.total).toBe(50);
  });

  it('suma los opcionales solo si el cliente los eligió', () => {
    const p = conServicios([
      { id: 'a', modalidad: 'unico', cantidad: 1, precio: 100 },
      { id: 'b', modalidad: 'unico', cantidad: 1, precio: 40, opcional: true }
    ]);
    expect(calcularTotales(p).inicial.total).toBe(100);
    expect(calcularTotales(p, new Set(['b'])).inicial.total).toBe(140);
  });

  it('aplica el descuento antes del impuesto', () => {
    const t = calcularTotales(conServicios([{ id: 'a', modalidad: 'unico', cantidad: 1, precio: 1000 }], { descuento: 10, impuesto: 21 }));
    expect(t.inicial.desc).toBe(100);
    expect(t.inicial.imp).toBeCloseTo(189);
    expect(t.inicial.total).toBeCloseTo(1089);
  });

  it('limita el descuento entre 0 y 100 %', () => {
    const p = conServicios([{ id: 'a', modalidad: 'unico', cantidad: 1, precio: 100 }], { descuento: 150 });
    expect(calcularTotales(p).inicial.total).toBe(0);
  });
});

describe('normalizarPropuesta', () => {
  it('completa una propuesta vacía o inválida con valores por defecto', () => {
    for (const entrada of [null, 'texto', 42, {}]) {
      const n = normalizarPropuesta(entrada);
      expect(n.servicios).toEqual([]);
      expect(n.tema.preset).toBe('elegante-oscuro');
      expect(n.tema.portada).toBe('editorial');
      expect(n.tema.decoracion).toBe('marco');
      expect(n.tema.estilo).toBe('editorial');
      expect(n.tema.escalaTituloPortada).toBe(100);
      expect(n.tema.escalaTitulos).toBe(100);
      expect(n.tema.escalaTexto).toBe(100);
      expect(n.tema.espaciadoSecciones).toBe(100);
      expect(n.tema.espaciadoInterno).toBe(100);
      expect(n.inversion.moneda).toBe('USD');
    }
  });

  it('corrige valores desconocidos y toma valores por defecto del preset', () => {
    const n = normalizarPropuesta({
      tema: { preset: 'no-existe', portada: 'invalida', decoracion: 'invalida', estilo: 'invalido' },
      servicios: [{ nombre: 5, modalidad: 'trimestral' }, null, 'basura']
    });
    expect(n.tema.preset).toBe('elegante-oscuro');
    expect(n.tema.portada).toBe('editorial');
    expect(n.tema.decoracion).toBe('marco');
    expect(n.tema.estilo).toBe('editorial');
    expect(n.servicios).toHaveLength(1);
    expect(n.servicios[0]).toMatchObject({ nombre: '5', modalidad: 'unico' });
    expect(n.servicios[0].id).toBeTruthy();

    const aurora = normalizarPropuesta({
      tema: {
        preset: 'aurora-tech',
        colorTexto: '#F8FAFC',
        colorSvg: '#38BDF8',
        colorFondo: '#FFFFFF',
        colorPortada: '#0F172A',
        opacidadSvg: 160,
        escalaTituloPortada: 125,
        escalaTitulos: 115,
        escalaTexto: 105,
        espaciadoSecciones: 130,
        espaciadoInterno: 90
      }
    });
    expect(aurora.tema.portada).toBe('impacto');
    expect(aurora.tema.decoracion).toBe('aurora');
    expect(aurora.tema.estilo).toBe('bento');
    expect(aurora.tema.colorTexto).toBe('#F8FAFC');
    expect(aurora.tema.colorSvg).toBe('#38BDF8');
    expect(aurora.tema.colorFondo).toBe('#FFFFFF');
    expect(aurora.tema.colorPortada).toBe('#0F172A');
    expect(aurora.tema.opacidadSvg).toBe(160);
    expect(aurora.tema.escalaTituloPortada).toBe(125);
    expect(aurora.tema.escalaTitulos).toBe(115);
    expect(aurora.tema.escalaTexto).toBe(105);
    expect(aurora.tema.espaciadoSecciones).toBe(130);
    expect(aurora.tema.espaciadoInterno).toBe(90);
  });

  it('descarta logos que no pasan la validación', () => {
    expect(normalizarPropuesta({ emisor: { logo: 'https://otro-sitio.example/pixel.png' } }).emisor.logo).toBe('');
    expect(normalizarPropuesta({ emisor: { logo: 'data:image/png;base64,AAAA' } }).emisor.logo).toBe('data:image/png;base64,AAAA');
    const deStorage = 'https://firebasestorage.googleapis.com/v0/b/x/o/logo.webp';
    const logoValido = l => l.startsWith('https://firebasestorage.googleapis.com/v0/b/x/o/');
    expect(normalizarPropuesta({ emisor: { logo: deStorage } }, { logoValido }).emisor.logo).toBe(deStorage);
  });

  it('es idempotente con la propuesta de ejemplo y con todas las plantillas por rubro', () => {
    const una = normalizarPropuesta(ejemplo());
    expect(normalizarPropuesta(una)).toEqual(una);
    for (const [id, tpl] of Object.entries(PLANTILLAS)) {
      const creada = normalizarPropuesta(tpl.crear());
      expect(normalizarPropuesta(creada), `plantilla ${id}`).toEqual(creada);
      expect(TEMAS[creada.tema.preset]).toBeTruthy();
      expect(PORTADAS[creada.tema.portada]).toBeTruthy();
      expect(DECORACIONES[creada.tema.decoracion]).toBeTruthy();
      expect(ESTILOS_BLOQUES[creada.tema.estilo]).toBeTruthy();
    }
  });
});

describe('normalizarPortafolio', () => {
  it('es idempotente con el portfolio de ejemplo y todas las plantillas de portfolio', () => {
    const base = normalizarPortafolio(ejemploPortafolio());
    expect(normalizarPortafolio(base)).toEqual(base);
    for (const [id, tpl] of Object.entries(PLANTILLAS_PORTAFOLIO)) {
      const creado = normalizarPortafolio(tpl.crear());
      expect(normalizarPortafolio(creado), `plantilla portafolio ${id}`).toEqual(creado);
      if (id === 'en-blanco') {
        expect(creado.proyectos).toHaveLength(0);
        expect(creado.tema.preset).toBe('lienzo-blanco');
      } else {
        expect(creado.proyectos.length).toBeGreaterThan(0);
      }
    }
  });

  it('permite vincular un resumen de portfolio dentro de una propuesta', () => {
    const pf = normalizarPortafolio(ejemploPortafolio());
    const res = resumenPortafolio(pf, 'pf123', true);
    const prop = normalizarPropuesta({
      ...ejemplo(),
      opciones: { firmas: true, credito: true, portafolioId: 'pf123', portafolio: res }
    });
    expect(prop.opciones.portafolioId).toBe('pf123');
    expect(prop.opciones.portafolio.proyectos.length).toBe(pf.proyectos.length);
    expect(normalizarPropuesta(prop)).toEqual(prop);
  });

  it('soporta fotos de perfil, portada hero, galería libre, galería por proyecto, testimonios y FAQs', () => {
    const imgData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
    const pf = normalizarPortafolio({
      ...ejemploPortafolio(),
      emisor: { ...ejemploPortafolio().emisor, foto: imgData, ubicacion: 'Buenos Aires', instagram: '@test' },
      portafolio: { ...ejemploPortafolio().portafolio, imagenPortada: imgData, opacidadPortada: 45 },
      proyectos: [
        { ...ejemploPortafolio().proyectos[0], imagen: imgData, galeria: [imgData, imgData], proporcion: 'vertical' }
      ],
      galeria: [{ id: 'g1', imagen: imgData, titulo: 'Foto 1', descripcion: 'Detalle', proporcion: 'cuadrada' }],
      testimonios: [{ id: 't1', texto: 'Excelente', autor: 'Juan', rol: 'CEO', avatar: imgData }],
      faqs: [{ id: 'f1', pregunta: '¿Plazos?', respuesta: '2 semanas' }]
    });
    expect(pf.emisor.foto).toBe(imgData);
    expect(pf.portafolio.imagenPortada).toBe(imgData);
    expect(pf.portafolio.opacidadPortada).toBe(45);
    expect(pf.proyectos[0].galeria).toHaveLength(2);
    expect(pf.proyectos[0].proporcion).toBe('vertical');
    expect(pf.galeria[0].proporcion).toBe('cuadrada');
    expect(normalizarPortafolio(pf)).toEqual(pf);

    const prop = normalizarPropuesta({
      ...ejemplo(),
      emisor: { ...ejemplo().emisor, foto: imgData },
      propuesta: { ...ejemplo().propuesta, imagenPortada: imgData, opacidadPortada: 50 },
      galeria: [{ id: 'g2', imagen: imgData, titulo: 'Ref', descripcion: '', proporcion: 'panoramica' }],
      testimonios: [{ id: 't2', texto: 'Muy bueno', autor: 'Ana', rol: 'Directora', avatar: imgData }],
      faqs: [{ id: 'f2', pregunta: '¿Garantía?', respuesta: '60 días' }]
    });
    expect(prop.emisor.foto).toBe(imgData);
    expect(prop.propuesta.imagenPortada).toBe(imgData);
    expect(prop.galeria).toHaveLength(1);
    expect(prop.testimonios).toHaveLength(1);
    expect(prop.faqs).toHaveLength(1);
    expect(normalizarPropuesta(prop)).toEqual(prop);
  });
});

import { decoracionPortadaSVG } from '../src/lib/decoraciones.js';
import { resolverColoresTema } from '../src/lib/tema.js';
import { generarPropuestaHTML, generarPortafolioHTML } from '../src/lib/render.js';
import { filtrosHTML, metricasHTML } from '../src/lib/paneles.js';

describe('módulos de render, tema, imágenes y decoraciones', () => {
  it('admite archivos de portada y galería mayores a 5 MB (hasta 50 MB)', () => {
    expect(LOGO_MAX_ARCHIVO).toBeGreaterThan(5 * 1024 * 1024);
    expect(FOTO_MAX_ARCHIVO).toBeGreaterThanOrEqual(50 * 1024 * 1024);
  });

  it('genera decoraciones SVG con color e intensidad personalizados y IDs únicos', () => {
    const svg1 = decoracionPortadaSVG('aurora', 150, '#FF5500');
    const svg2 = decoracionPortadaSVG('aurora', 80, '#00AAFF');
    expect(svg1).toContain('#FF5500');
    expect(svg2).toContain('#00AAFF');
    expect(svg1).not.toEqual(svg2);
    expect(decoracionPortadaSVG('ninguna', 100)).toBe('');
    expect(decoracionPortadaSVG('marco', 0)).toBe('');
  });

  it('resuelve colores del tema garantizando contraste, tema en blanco y escalas personalizadas', () => {
    const col = resolverColoresTema({ preset: 'elegante-oscuro', acento: '#C9A84C', opacidadSvg: 135 });
    expect(col.acento).toBe('#C9A84C');
    expect(col.opacidadSvg).toBe(135);
    expect(col.esClaro).toBe(false);

    const blanco = resolverColoresTema({
      preset: 'lienzo-blanco',
      escalaTituloPortada: 120,
      escalaTitulos: 110,
      escalaTexto: 105,
      espaciadoSecciones: 80,
      espaciadoInterno: 90
    });
    expect(blanco.esClaro).toBe(true);
    expect(blanco.portadaClara).toBe(true);
    expect(blanco.portadaBg).toBe('#FFFFFF');
    expect(blanco.fondoBase).toBe('#FFFFFF');
    expect(blanco.escalaTituloPortada).toBe(120);
    expect(blanco.escalaTitulos).toBe(110);
    expect(blanco.escalaTexto).toBe(105);
    expect(blanco.espaciadoSecciones).toBe(80);
    expect(blanco.espaciadoInterno).toBe(90);
  });

  it('genera el HTML de una propuesta y de un portfolio / landing page', () => {
    const htmlProp = generarPropuestaHTML(ejemplo(), { web: true });
    expect(htmlProp).toContain('portada');
    expect(htmlProp).toContain('barra-cliente');

    const htmlPf = generarPortafolioHTML(ejemploPortafolio(), { web: true });
    expect(htmlPf).toContain('portada');
    expect(htmlPf).toContain('sec-proyectos');
  });

  it('genera métricas y filtros del panel de propuestas', () => {
    expect(filtrosHTML([], 'todas')).toContain('Todas');
    expect(metricasHTML([])).toContain('Esperando respuesta');
  });
});
