// =====================================================================
// CAPA DE PRESENTACIÓN (controlador)
// Traduce HTTP <-> servicio: lee la petición (params, query, body),
// llama al servicio y arma la respuesta (código de estado + JSON).
// El header Authorization (token JWT, semana 2) se pasa al servicio para que
// lo reenvíe a ms-pacientes y ms-medicos cuando les consulta.
// =====================================================================
const service = require('../services/citas.service');
const { ESTADOS } = require('../models/cita');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

// Convierte un parámetro de consulta en entero positivo (o lanza 400)
function leerEnteroQuery(valor, nombre) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `${nombre} debe ser un entero positivo`);
  return n;
}

// GET /citas  ·  filtros opcionales: ?estado=programada  ?medico_id=1  ?paciente_id=2
async function listar(req, res) {
  const filtros = {};
  if (req.query.estado !== undefined) {
    if (!ESTADOS.includes(req.query.estado)) {
      throw new HttpError(400, `estado debe ser uno de: ${ESTADOS.join(', ')}`);
    }
    filtros.estado = req.query.estado;
  }
  if (req.query.medico_id !== undefined) filtros.medico_id = leerEnteroQuery(req.query.medico_id, 'medico_id');
  if (req.query.paciente_id !== undefined) filtros.paciente_id = leerEnteroQuery(req.query.paciente_id, 'paciente_id');

  const citas = await service.listar(filtros, req.headers.authorization);
  res.status(200).json(citas);
}

// GET /citas/:id
async function obtener(req, res) {
  const cita = await service.obtener(leerId(req), req.headers.authorization);
  res.status(200).json(cita);
}

// POST /citas
async function crear(req, res) {
  const nueva = await service.crear(req.body, req.headers.authorization);
  res.status(201).location(`${req.baseUrl}/${nueva.id}`).json(nueva);
}

// PUT /citas/:id  ·  reemplaza la cita completa (el cuerpo lleva todos los atributos, sin id)
async function actualizar(req, res) {
  const cita = await service.actualizar(leerId(req), req.body, req.headers.authorization);
  res.status(200).json(cita);
}

// DELETE /citas/:id  ·  204 No Content: éxito, sin cuerpo
async function eliminar(req, res) {
  await service.eliminar(leerId(req));
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };