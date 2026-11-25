import { describe, expect, it } from 'vitest';
import { atributoEditar, selectorDeClave, claveDeCampo, clavesParaResaltar, clavesNavegables, claveVecina, primerCampoDe, esRespaldo } from '../src/editar-documento.js';
import { normalizarPropuesta, vacio, normalizarPortafolio, vacioPortafolio } from '../src/modelo.js';
import { generarPortafolioHTML, heroDePortada, iniciales, tituloSinCortes } from '../src/lib/render-portafolio.js';
import { generarPropuestaHTML } from '../src/lib/render.js';

const propuesta = (formato = 'propuesta') => normalizarPropuesta({
  ...vacio(),
  propuesta: { ...vacio().propuesta, titulo: 'Sitio web', fecha: '2026-11-17', validez: 15 },
  cliente: { ...vacio().cliente, nombre: 'Laura' },
  contexto: 'El sitio actual no vende.',
  servicios: [
    { id: 'a', nombre: 'Diseño', modalidad: 'unico', cantidad: 1, precio: 100, descripcion: 'Cinco páginas', entregables: '', opcional: false, imagen: '' },
    { id: 'b', nombre: '', modalidad: 'unico', cantidad: 1, precio: 0, descripcion: '', entregables: '', opcional: false, imagen: '' },
    { id: 'c', nombre: 'SEO', modalidad: 'mensual', cantidad: 1, precio: 50, descripcion: '', entregables: '', opcional: true, imagen: '' }
  ],
  opciones: { ...vacio().opciones, formato }
});

describe('claves del documento', () => {
  it('arma el selector del campo, del ítem, de la lista y del paso', () => {
    expect(selectorDeClave('propuesta.titulo')).toBe('[data-campo="propuesta.titulo"]');
    expect(selectorDeClave('servicios:3:nombre')).toBe('.lista[data-lista="servicios"] > [data-indice="3"] [data-item="nombre"]');
    expect(selectorDeClave('servicios:3')).toBe('.lista[data-lista="servicios"] > [data-indice="3"]');
    expect(selectorDeClave('lista:faqs')).toBe('.lista[data-lista="faqs"]');
    expect(selectorDeClave('paso:Inversión')).toBe('details.paso[data-corto="Inversión"]');
  });

  it('no arma selectores con claves rotas', () => {
    expect(selectorDeClave('')).toBeNull();
    expect(selectorDeClave(undefined)).toBeNull();
    expect(selectorDeClave('servicios:x:nombre')).toBeNull();
    expect(selectorDeClave('campo"]')).toBe('[data-campo="campo\\"]"]');
  });

  it('la clave de un campo del editor coincide con la del documento', () => {
    expect(claveDeCampo({ campo: 'contexto' })).toBe('contexto');
    expect(claveDeCampo({ lista: 'servicios', indice: '2', item: 'precio' })).toBe('servicios:2:precio');
    expect(claveDeCampo({ lista: 'servicios', indice: 0 })).toBe('servicios:0');
    expect(claveDeCampo({ lista: 'servicios' })).toBeNull();
    expect(claveDeCampo()).toBeNull();
  });

  it('si el campo no está dibujado, resalta el ítem que lo contiene', () => {
    expect(clavesParaResaltar('servicios:1:precio')).toEqual(['servicios:1:precio', 'servicios:1']);
    expect(clavesParaResaltar('propuesta.titulo')).toEqual(['propuesta.titulo']);
    expect(clavesParaResaltar(null)).toEqual([]);
  });

  it('el atributo escapa la clave y no aparece sin editable', () => {
    expect(atributoEditar(true)('a"b')).toBe(' data-editar="a&quot;b"');
    expect(atributoEditar(true)('')).toBe('');
    expect(atributoEditar(false)('propuesta.titulo')).toBe('');
  });
});

describe('modo foco', () => {
  const delDocumento = ['emisor.nombre', 'propuesta.titulo', 'paso:Cliente', 'lista:servicios', 'servicios:0', 'servicios:0:nombre', 'servicios:0:precio', 'emisor.nombre', 'paso:Inversión'];

  it('pasa por los campos en el orden del documento, sin repetir ni respaldos', () => {
    expect(clavesNavegables(delDocumento)).toEqual(['emisor.nombre', 'propuesta.titulo', 'servicios:0:nombre', 'servicios:0:precio']);
  });

  it('anterior y siguiente frenan en los extremos', () => {
    const claves = clavesNavegables(delDocumento);
    expect(claveVecina(claves, 'propuesta.titulo', 1)).toBe('servicios:0:nombre');
    expect(claveVecina(claves, 'propuesta.titulo', -1)).toBe('emisor.nombre');
    expect(claveVecina(claves, 'emisor.nombre', -1)).toBeNull();
    expect(claveVecina(claves, 'servicios:0:precio', 1)).toBeNull();
    expect(claveVecina(claves, 'otra.cosa', 1)).toBeNull();
  });

  it('tocar un ítem entero abre su primer campo', () => {
    const claves = clavesNavegables(delDocumento);
    expect(primerCampoDe(claves, 'servicios:0')).toBe('servicios:0:nombre');
    expect(primerCampoDe(claves, 'servicios:9')).toBe('servicios:9');
    expect(primerCampoDe(claves, 'propuesta.titulo')).toBe('propuesta.titulo');
  });
});

describe('render con editable', () => {
  for (const formato of ['propuesta', 'presupuesto']) {
    it(`el link y el PDF no llevan claves (${formato})`, () => {
      expect(generarPropuestaHTML(propuesta(formato))).not.toContain('data-editar');
      expect(generarPropuestaHTML(propuesta(formato), { web: false })).not.toContain('data-editar');
    });

    it(`en el editor, cada texto apunta a su campo con el índice real (${formato})`, () => {
      const html = generarPropuestaHTML(propuesta(formato), { editable: true });
      expect(html).toContain('data-editar="propuesta.titulo"');
      expect(html).toContain('data-editar="contexto"');
      expect(html).toContain('data-editar="servicios:0:nombre"');
      // El servicio vacío (índice 1) no se dibuja, pero el opcional conserva su índice 2.
      expect(html).not.toContain('data-editar="servicios:1');
      expect(html).toContain('data-editar="servicios:2:nombre"');
    });
  }
});

describe('portfolio', () => {
  const portfolio = (cambios = {}) => normalizarPortafolio({
    ...vacioPortafolio(),
    emisor: { ...vacioPortafolio().emisor, nombre: 'Estudio Norte', rol: 'Diseño web' },
    portafolio: { ...vacioPortafolio().portafolio, titulo: 'Marcas que crecen' },
    proyectos: [
      { id: 'a', titulo: '', descripcion: '' },
      { id: 'b', titulo: 'Tienda online', categoria: 'E-commerce', descripcion: 'Rediseño completo' }
    ],
    faqs: [{ id: 'f', pregunta: '¿Plazos?', respuesta: 'Seis semanas' }],
    ...cambios
  });

  it('las claves del portfolio apuntan a los campos de su editor', () => {
    expect(selectorDeClave('pf:portafolio.titulo')).toBe('[data-campo-pf="portafolio.titulo"]');
    expect(selectorDeClave('pf:proyectos:2:titulo')).toBe('.lista[data-lista-pf="proyectos"] > [data-indice-pf="2"] [data-item-pf="titulo"]');
    expect(selectorDeClave('pf:proyectos:2')).toBe('.lista[data-lista-pf="proyectos"] > [data-indice-pf="2"]');
    expect(selectorDeClave('pf:lista:galeria')).toBe('.lista[data-lista-pf="galeria"]');
    expect(selectorDeClave('pf:')).toBeNull();
    expect(claveDeCampo({ campo: 'portafolio.titulo', pf: true })).toBe('pf:portafolio.titulo');
    expect(claveDeCampo({ lista: 'proyectos', indice: '1', item: 'titulo', pf: true })).toBe('pf:proyectos:1:titulo');
  });

  it('el modo foco trata igual las claves del portfolio', () => {
    const claves = clavesNavegables(['pf:portafolio.titulo', 'pf:lista:proyectos', 'pf:proyectos:1', 'pf:proyectos:1:titulo', 'paso:Portada']);
    expect(claves).toEqual(['pf:portafolio.titulo', 'pf:proyectos:1:titulo']);
    expect(primerCampoDe(claves, 'pf:proyectos:1')).toBe('pf:proyectos:1:titulo');
    expect(clavesParaResaltar('pf:proyectos:1:tags')).toEqual(['pf:proyectos:1:tags', 'pf:proyectos:1']);
    expect(esRespaldo('pf:lista:faqs')).toBe(true);
    expect(esRespaldo('pf:faqs:0:respuesta')).toBe(false);
  });

  it('en el editor cada texto lleva su clave, con el índice real; el link, ninguna', () => {
    const html = generarPortafolioHTML(portfolio(), { editable: true });
    expect(html).toContain('data-editar="pf:portafolio.titulo"');
    expect(html).toContain('data-editar="emisor.nombre"');
    expect(html).not.toContain('data-editar="pf:proyectos:0');
    expect(html).toContain('data-editar="pf:proyectos:1:titulo"');
    expect(html).toContain('data-editar="pf:faqs:0:respuesta"');
    expect(generarPortafolioHTML(portfolio())).not.toContain('data-editar');
  });

  it('sin foto de portada se arma igual, con el monograma', () => {
    const html = generarPortafolioHTML(portfolio());
    expect(html).toContain('pf-hero--sin-foto');
    expect(html).toContain('pf-hero__monograma">EN<');
    expect(iniciales('', 'marcas que crecen')).toBe('MQ');
    expect(iniciales('', '')).toBe('P');
  });

  it('las palabras con guion de los títulos no se parten', () => {
    expect(tituloSinCortes('Tablero multi-depósito & e-commerce')).toBe('Tablero <span class="pf-junto">multi-depósito</span> &amp; <span class="pf-junto">e-commerce</span>');
    expect(tituloSinCortes('Sin guiones')).toBe('Sin guiones');
  });

  it('cada portada del estudio cae en una de las tres del portfolio', () => {
    expect(heroDePortada('dividida')).toBe('dividida');
    expect(heroDePortada('franja')).toBe('impacto');
    expect(heroDePortada('cualquiera')).toBe('bloque');
  });
});

describe('foto de portada del portfolio', () => {
  const conFoto = portafolio => normalizarPortafolio({
    ...vacioPortafolio(),
    portafolio: { ...vacioPortafolio().portafolio, imagenPortada: 'data:image/png;base64,AA', ...portafolio }
  }, { logoValido: () => true });

  it('valida las opciones y usa las de siempre si faltan o vienen mal', () => {
    const vieja = conFoto({});
    expect(vieja.portafolio).toMatchObject({ formaPortada: 'auto', ajustePortada: 'recortar', mascaraPortada: 'recta', tamanoPortada: 'mediana', encuadrePortada: 'centro', zoomPortada: 100 });
    const mala = conFoto({ formaPortada: 'rara', ajustePortada: 'x', zoomPortada: 999, encuadrePortada: 'diagonal' });
    expect(mala.portafolio).toMatchObject({ formaPortada: 'auto', ajustePortada: 'recortar', zoomPortada: 250, encuadrePortada: 'centro' });
  });

  it('el marco lleva forma, ajuste, máscara, encuadre y zoom; entera no hace zoom', () => {
    const html = generarPortafolioHTML(conFoto({ formaPortada: 'cuadrada', mascaraPortada: 'circulo', tamanoPortada: 'grande', encuadrePortada: 'arriba', zoomPortada: 150 }));
    expect(html).toContain('data-tamano="grande"');
    expect(html).toContain('data-forma="cuadrada"');
    expect(html).toContain('data-mascara="circulo"');
    expect(html).toContain('--pf-foto-pos:center top;--pf-foto-zoom:1.5');
    expect(generarPortafolioHTML(conFoto({ ajustePortada: 'entera', zoomPortada: 150 }))).toContain('--pf-foto-zoom:1');
  });
});
