// =====================================================================
// CAPA DE PRESENTACIÓN (controlador)
// Traduce HTTP <-> servicio: lee la petición (params, body),
// llama al servicio y arma la respuesta (código de estado + JSON).
// =====================================================================
const service = require('../services/citas.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

// GET /citas
async function listar(req, res) {
  const citas = await service.listar();
  res.status(200).json(citas);
}

// GET /citas/:id
async function obtener(req, res) {
  const cita = await service.obtener(leerId(req));
  res.status(200).json(cita);
}

// POST /citas
async function crear(req, res) {
  const nueva = await service.crear(req.body);
  res.status(201).location(`${req.baseUrl}/${nueva.id}`).json(nueva);
}

module.exports = { listar, obtener, crear };