// Links largos (#p=…): la propuesta viaja comprimida dentro del link.

const aBase64Url = bytes => {
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const desdeBase64Url = cadena => {
  let b64 = cadena.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binario = atob(b64);
  return Uint8Array.from(binario, ch => ch.charCodeAt(0));
};

export const comprimir = async contenido => {
  const datos = new TextEncoder().encode(contenido);
  if (typeof CompressionStream !== 'function') return `j${aBase64Url(datos)}`;
  const flujo = new Blob([datos]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return `z${aBase64Url(new Uint8Array(await new Response(flujo).arrayBuffer()))}`;
};

export const descomprimir = async codigo => {
  const tipo = codigo[0];
  const bytes = desdeBase64Url(codigo.slice(1));
  if (tipo === 'j') return new TextDecoder().decode(bytes);
  if (tipo === 'z') {
    const flujo = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(flujo).text();
  }
  throw new Error('Formato desconocido');
};
