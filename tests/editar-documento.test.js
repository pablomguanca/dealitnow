import { describe, expect, it } from 'vitest';
import { atributoEditar, selectorDeClave, claveDeCampo, clavesParaResaltar } from '../src/editar-documento.js';
import { normalizarPropuesta, vacio } from '../src/modelo.js';
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
