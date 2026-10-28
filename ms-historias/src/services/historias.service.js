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

async function listar() {
  return repo.findAll();
}

async function obtener(id) {
  const historia = await repo.findById(id);
  if (!historia) throw new HttpError(404, `No existe la historia clínica con id ${id}`);
  return historia;
}

async function crear(datos) {
  const errores = validarHistoria(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const historia = construirHistoria(datos);

  if (historia.fecha > hoy()) {
    throw new HttpError(400, 'Datos inválidos', [`fecha no puede ser futura (hoy es ${hoy()})`]);
  }

  const existente = await repo.findByPacienteMedicoFecha(historia.paciente_id, historia.medico_id, historia.fecha);
  if (existente) {
    throw new HttpError(
      409,
      `Ya existe una historia del paciente ${historia.paciente_id} con el médico ${historia.medico_id} en la fecha ${historia.fecha}`,
    );
  }

  return repo.create(historia);
}

module.exports = { listar, obtener, crear };
