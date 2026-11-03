// Copia texto al portapapeles. Si el navegador no deja usar la API moderna (por ejemplo,
// sin HTTPS), usa la forma anterior. Devuelve si se pudo copiar.
export const copiar = async contenido => {
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
