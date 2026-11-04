// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/citas.repository');
const { validarCita, construirCita } = require('../models/cita');
const HttpError = require('../utils/http-error');

async function listar(filtros) {
  return repo.findAll(filtros);
}

async function obtener(id) {
  const cita = await repo.findById(id);
  if (!cita) throw new HttpError(404, `No existe la cita con id ${id}`);
  return cita;
}

// Reglas de negocio comunes a crear y actualizar.
// excluirId: al actualizar, la cita no debe chocar consigo misma.
async function aplicarReglas(cita, excluirId = null) {
  // Regla 400: la cita debe ser en el futuro (no se agenda en el pasado)
  if (new Date(cita.fecha_hora) <= new Date()) {
    throw new HttpError(400, 'Datos inválidos', [
      `fecha_hora debe ser futura (se recibió ${cita.fecha_hora})`,
    ]);
  }
  // Regla 409: un médico no puede tener dos citas activas (no canceladas)
  // a la misma fecha y hora. Si la cita llega cancelada, no ocupa el horario.
  if (cita.estado !== 'cancelada') {
    const choque = await repo.findByMedicoYFecha(cita.medico_id, cita.fecha_hora, excluirId);
    if (choque) {
      throw new HttpError(
        409,
        `El médico ${cita.medico_id} ya tiene una cita el ${cita.fecha_hora} (cita ${choque.id})`
      );
    }
  }
}

async function crear(datos) {
  const errores = validarCita(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const cita = construirCita(datos);
  await aplicarReglas(cita);

  // Semana 2: validar por REST que paciente_id exista en ms-pacientes y
  // medico_id en ms-medicos (400 si no existe, 503 si el servicio no responde).
  return repo.create(cita);
}

async function actualizar(id, datos) {
  const errores = validarCita(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  if (!(await repo.findById(id))) throw new HttpError(404, `No existe la cita con id ${id}`);

  const cita = construirCita(datos);
  await aplicarReglas(cita, id);
  return repo.update(id, cita);
}

async function eliminar(id) {
  const eliminada = await repo.remove(id);
  if (!eliminada) throw new HttpError(404, `No existe la cita con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };