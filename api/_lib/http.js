// Utilidades HTTP compartidas por las funciones de /api.

export const responder = (res, estado, cuerpo) => {
  res.setHeader('Cache-Control', 'no-store');
  if (cuerpo === undefined) return res.status(estado).end();
  return res.status(estado).json(cuerpo);
};

// Acepta solo POST con JSON. Devuelve el cuerpo, o null si ya respondió con un error.
export const leerPost = (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    responder(res, 405, { error: 'metodo-no-permitido' });
    return null;
  }
  if (!String(req.headers?.['content-type'] || '').includes('application/json')) {
    responder(res, 415, { error: 'se-espera-json' });
    return null;
  }
  const cuerpo = req.body;
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    responder(res, 400, { error: 'cuerpo-invalido' });
    return null;
  }
  return cuerpo;
};

// Un error con estado HTTP para cortar una transacción y responder ese estado.
export class ErrorHttp extends Error {
  constructor(estado, codigo) {
    super(codigo);
    this.estado = estado;
    this.codigo = codigo;
  }
}

export const fallar = (res, e) => {
  if (e instanceof ErrorHttp) return responder(res, e.estado, { error: e.codigo });
  console.error(e);
  return responder(res, 500, { error: 'error-interno' });
};
