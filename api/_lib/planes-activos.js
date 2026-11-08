// Interruptor de los planes. Mientras PLANES_ACTIVOS no valga «1», el límite del plan
// Gratis no se aplica y no se ofrece Pro, salvo para los emails de PLANES_PRUEBA
// (separados por coma), que sirven para probar en producción sin afectar a nadie.
export const planesActivosPara = (email, entorno = process.env) => {
  if (entorno.PLANES_ACTIVOS === '1') return true;
  const prueba = String(entorno.PLANES_PRUEBA || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  return !!email && prueba.includes(String(email).toLowerCase());
};
