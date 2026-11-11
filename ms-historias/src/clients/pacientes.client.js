// =====================================================================
// CLIENTE HTTP de ms-pacientes: la única parte de ms-historias que sabe
// cómo hablar con ms-pacientes (análogo al repositorio, pero por REST).
// =====================================================================
const HttpError = require('../utils/http-error');
const PACIENTES_URL = process.env.PACIENTES_URL;

// Hace la petición reenviando el token del usuario. null si no hubo respuesta.
async function pedir(ruta, token) {
  try {
    return await fetch(`${PACIENTES_URL}${ruta}`, {
      headers: { Authorization: token },        // el token de la petición original
      signal: AbortSignal.timeout(3000),         // no esperar más de 3 segundos
    });
  } catch (error) {
    return null;                                 // ms-pacientes caído o sin responder
  }
}

// VALIDACIÓN: ¿existe el paciente? Si ms-pacientes no responde → 503
async function existePaciente(id, token) {
  const respuesta = await pedir(`/pacientes/${id}`, token);
  if (!respuesta) throw new HttpError(503, 'ms-pacientes no está disponible');
  if (respuesta.status === 404) return false;
  if (!respuesta.ok) {
    throw new HttpError(502, `ms-pacientes respondió ${respuesta.status}`);
  }
  return true;
}

// COMPOSICIÓN: varios pacientes en UNA petición → Map id → paciente (null si no responde)
async function pacientesPorIds(ids, token) {
  if (ids.length === 0) return new Map();
  const respuesta = await pedir(`/pacientes?ids=${ids.join(',')}`, token);
  if (!respuesta || !respuesta.ok) return null;
  const pacientes = await respuesta.json();
  return new Map(pacientes.map((p) =>
    [p.id, { id: p.id, nombre: p.nombre }]));
}

module.exports = { existePaciente, pacientesPorIds };