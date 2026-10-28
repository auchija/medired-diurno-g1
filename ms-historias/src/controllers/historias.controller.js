// =====================================================================
// CAPA DE PRESENTACIÓN (controlador)
// Traduce HTTP <-> servicio: lee la petición (params, body),
// llama al servicio y arma la respuesta (código de estado + JSON).
// =====================================================================
const service = require('../services/historias.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

async function listar(req, res) {
  const historias = await service.listar();
  res.status(200).json(historias);
}

async function obtener(req, res) {
  const historia = await service.obtener(leerId(req));
  res.status(200).json(historia);
}

async function crear(req, res) {
  const nueva = await service.crear(req.body);
  res.status(201).location(`${req.baseUrl}/${nueva.id}`).json(nueva);
}

module.exports = { listar, obtener, crear };
