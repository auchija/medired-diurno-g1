// =====================================================================
// CAPA DE PRESENTACIÓN (controlador)
// Traduce HTTP <-> servicio: lee la petición (params, body),
// llama al servicio y arma la respuesta (código de estado + JSON).
// =====================================================================
const service = require('../services/usuarios.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

// GET /usuarios
async function listar(req, res) {
  const usuarios = await service.listar();
  res.status(200).json(usuarios);
}

// GET /usuarios/:id
async function obtener(req, res) {
  const usuario = await service.obtener(leerId(req));
  res.status(200).json(usuario);
}

// POST /usuarios
async function crear(req, res) {
  const nuevo = await service.crear(req.body);
  res.status(201).location(`${req.baseUrl}/${nuevo.id}`).json(nuevo);
}

module.exports = { listar, obtener, crear };
