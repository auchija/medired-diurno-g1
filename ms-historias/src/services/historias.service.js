// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/historias.repository');
const { validarHistoria, construirHistoria } = require('../models/historia');
const HttpError = require('../utils/http-error');
const pacientesClient = require('../clients/pacientes.client');
const medicosClient = require('../clients/medicos.client');


async function validarReferencias(historia, token) {
  if (!(await pacientesClient.existePaciente(historia.paciente_id, token))) {
    throw new HttpError(400, `No existe el paciente con id ${historia.paciente_id}`);
  }
  if (!(await medicosClient.existeMedico(historia.medico_id, token))) {
    throw new HttpError(400, `No existe el médico con id ${historia.medico_id}`);
  }
}


function hoy() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

async function componer(historias, token) {
  const idsPacientes = [...new Set(historias.map((h) => h.paciente_id))];
  const idsMedicos = [...new Set(historias.map((h) => h.medico_id))];

  // Las dos consultas se hacen al mismo tiempo
  const [pacientes, medicos] = await Promise.all([
    pacientesClient.pacientesPorIds(idsPacientes, token),
    medicosClient.medicosPorIds(idsMedicos, token),
  ]);

  // Degradación controlada: si un servicio no responde, su objeto sale en null con un aviso
  const avisos = [];
  if (!pacientes) avisos.push('ms-pacientes no disponible');
  if (!medicos) avisos.push('ms-medicos no disponible');

  return historias.map((h) => {
    const compuesta = {
      ...h,
      paciente: pacientes ? pacientes.get(h.paciente_id) || null : null,
      medico: medicos ? medicos.get(h.medico_id) || null : null,
    };
    if (avisos.length > 0) compuesta.aviso = avisos.join('; ');
    return compuesta;
  });
}

async function listar(filtros, token) {
  return componer(await repo.findAll(filtros), token);
}

async function obtener(id, token) {
  const historia = await repo.findById(id);
  if (!historia) throw new HttpError(404, `No existe la historia clínica con id ${id}`);
  const [compuesta] = await componer([historia], token);
  return compuesta;
}

// Regla de negocio (al crear y al actualizar): no se registran consultas que todavía no han ocurrido.
function aplicarReglas(historia) {
  if (historia.fecha > hoy()) {
    throw new HttpError(400, 'Datos inválidos', [`fecha no puede ser futura (hoy es ${hoy()})`]);
  }
}

async function crear(datos, token) {
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const historia = construirHistoria(datos);
   aplicarReglas(historia);
  await validarReferencias(historia, token);

  const nueva = await repo.create(historia);
  const [compuesta] = await componer([nueva], token);
  return compuesta;

}

async function actualizar(id, datos, token) {
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const historia = construirHistoria(datos);
  aplicarReglas(historia);
  await validarReferencias(historia, token);

  const actualizada = await repo.update(id, historia);
  if (!actualizada) throw new HttpError(404, `No existe la historia clínica con id ${id}`);
  const [compuesta] = await componer([actualizada], token);
  return compuesta;
}

async function eliminar(id) {
  const eliminada = await repo.remove(id);
  if (!eliminada) throw new HttpError(404, `No existe la historia clínica con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };