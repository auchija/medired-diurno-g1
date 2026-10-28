// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/citas.repository');
const { validarCita, construirCita } = require('../models/cita');
const HttpError = require('../utils/http-error');

async function listar() {
  return repo.findAll();
}

async function obtener(id) {
  const cita = await repo.findById(id);
  if (!cita) throw new HttpError(404, `No existe la cita con id ${id}`);
  return cita;
}

async function crear(datos) {
  const errores = validarCita(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const cita = construirCita(datos);

  // Regla de negocio: un médico no puede tener dos citas activas
  // (no canceladas) a la misma fecha y hora. 409 = Conflict.
  const choque = await repo.findByMedicoYFecha(cita.medico_id, cita.fecha_hora);
  if (choque) {
    throw new HttpError(
      409,
      `El médico ${cita.medico_id} ya tiene una cita el ${cita.fecha_hora} (cita ${choque.id})`
    );
  }

  // Taller 3: validar por REST que paciente_id exista en ms-pacientes y
  // medico_id en ms-medicos (400 si no existe, 503 si el servicio no responde).
  return repo.create(cita);
}

module.exports = { listar, obtener, crear };