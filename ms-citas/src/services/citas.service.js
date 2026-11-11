// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// Para pacientes y médicos usa los clientes REST (src/clients).
// =====================================================================
const repo = require('../repositories/citas.repository');
const { validarCita, construirCita } = require('../models/cita');
const HttpError = require('../utils/http-error');
const pacientesClient = require('../clients/pacientes.client');
const medicosClient = require('../clients/medicos.client');

// Relación: el paciente y el médico referenciados deben existir en sus microservicios
async function validarReferencias(cita, token) {
  if (!(await pacientesClient.existePaciente(cita.paciente_id, token))) {
    throw new HttpError(400, `No existe el paciente con id ${cita.paciente_id}`);
  }
  if (!(await medicosClient.existeMedico(cita.medico_id, token))) {
    throw new HttpError(400, `No existe el médico con id ${cita.medico_id}`);
  }
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

// Agrega a cada cita su objeto paciente y su objeto médico,
// con UNA sola consulta a ms-pacientes y UNA sola a ms-medicos
async function componer(citas, token) {
  const idsPacientes = [...new Set(citas.map((c) => c.paciente_id))];
  const idsMedicos = [...new Set(citas.map((c) => c.medico_id))];

  // Las dos consultas se hacen al mismo tiempo
  const [pacientes, medicos] = await Promise.all([
    pacientesClient.pacientesPorIds(idsPacientes, token),
    medicosClient.medicosPorIds(idsMedicos, token),
  ]);

  // Degradación controlada: si un servicio no responde, su objeto sale en null con un aviso
  const avisos = [];
  if (!pacientes) avisos.push('ms-pacientes no disponible');
  if (!medicos) avisos.push('ms-medicos no disponible');

  return citas.map((c) => {
    const compuesta = {
      ...c,
      paciente: pacientes ? pacientes.get(c.paciente_id) || null : null,
      medico: medicos ? medicos.get(c.medico_id) || null : null,
    };
    if (avisos.length > 0) compuesta.aviso = avisos.join('; ');
    return compuesta;
  });
}

async function listar(filtros, token) {
  return componer(await repo.findAll(filtros), token);
}

async function obtener(id, token) {
  const cita = await repo.findById(id);
  if (!cita) throw new HttpError(404, `No existe la cita con id ${id}`);
  const [compuesta] = await componer([cita], token);
  return compuesta;
}

async function crear(datos, token) {
  const errores = validarCita(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const cita = construirCita(datos);
  await aplicarReglas(cita);
  await validarReferencias(cita, token);
  const nueva = await repo.create(cita);
  const [compuesta] = await componer([nueva], token);
  return compuesta;
}

async function actualizar(id, datos, token) {
  const errores = validarCita(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  if (!(await repo.findById(id))) throw new HttpError(404, `No existe la cita con id ${id}`);

  const cita = construirCita(datos);
  await aplicarReglas(cita, id);
  await validarReferencias(cita, token);
  const actualizada = await repo.update(id, cita);
  const [compuesta] = await componer([actualizada], token);
  return compuesta;
}

async function eliminar(id) {
  const eliminada = await repo.remove(id);
  if (!eliminada) throw new HttpError(404, `No existe la cita con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };