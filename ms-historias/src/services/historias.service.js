// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/historias.repository');
const { validarHistoria, construirHistoria } = require('../models/historia');
const HttpError = require('../utils/http-error');

function hoy() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

async function listar(filtros) {
  return repo.findAll(filtros);
}

async function obtener(id) {
  const historia = await repo.findById(id);
  if (!historia) throw new HttpError(404, `No existe la historia clínica con id ${id}`);
  return historia;
}

async function aplicarReglas(historia, idActual) {
  if (historia.fecha > hoy()) {
    throw new HttpError(400, 'Datos inválidos', [`fecha no puede ser futura (hoy es ${hoy()})`]);
  }
  const otra = await repo.findByPacienteMedicoFecha(historia.paciente_id, historia.medico_id, historia.fecha);
  if (otra && otra.id !== idActual) {
    throw new HttpError(
      409,
      `Ya existe una historia del paciente ${historia.paciente_id} con el médico ${historia.medico_id} en la fecha ${historia.fecha}`,
    );
  }
}

async function crear(datos) {
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const historia = construirHistoria(datos);
  await aplicarReglas(historia);

  return repo.create(historia);
}

async function actualizar(id, datos) {
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const historia = construirHistoria(datos);
  await aplicarReglas(historia, id);

  const actualizada = await repo.update(id, historia);
  if (!actualizada) throw new HttpError(404, `No existe la historia clínica con id ${id}`);
  return actualizada;
}

async function eliminar(id) {
  const eliminada = await repo.remove(id);
  if (!eliminada) throw new HttpError(404, `No existe la historia clínica con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };