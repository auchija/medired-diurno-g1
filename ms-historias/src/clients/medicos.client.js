// =====================================================================
// CLIENTE HTTP de ms-medicos: la única parte de ms-historias que sabe
// cómo hablar con ms-medicos (análogo al repositorio, pero por REST).
// =====================================================================
const HttpError = require('../utils/http-error');
const MEDICOS_URL = process.env.MEDICOS_URL;


async function pedir(ruta, token) {
  const inicio = Date.now();
  try {
    const respuesta = await fetch(`${MEDICOS_URL}${ruta}`, {
      headers: { Authorization: token },
      signal: AbortSignal.timeout(3000),
    });
    console.log(`   ↳ consulta a ms-medicos: GET ${ruta} → ${respuesta.status} (${Date.now() - inicio} ms)`);
    return respuesta;
  } catch (error) {
    console.log(`   ↳ consulta a ms-medicos: GET ${ruta} → sin respuesta (${Date.now() - inicio} ms)`);
    return null;
  }
}


async function existeMedico(id, token) {
  const respuesta = await pedir(`/medicos/${id}`, token);
  if (!respuesta) throw new HttpError(503, 'ms-medicos no está disponible');
  if (respuesta.status === 404) return false;
  if (!respuesta.ok) {
    throw new HttpError(502, `ms-medicos respondió ${respuesta.status}`);
  }
  return true;
}


async function medicosPorIds(ids, token) {
  if (ids.length === 0) return new Map();
  const respuesta = await pedir(`/medicos?ids=${ids.join(',')}`, token);
  if (!respuesta || !respuesta.ok) return null;
  const medicos = await respuesta.json();
  return new Map(medicos.map((m) =>
    [m.id, { id: m.id, nombre: m.nombre, especialidad: m.especialidad }]));
}

module.exports = { existeMedico, medicosPorIds };