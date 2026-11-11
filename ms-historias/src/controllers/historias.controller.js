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

function leerFiltro(req, nombre) {
  if (req.query[nombre] === undefined) return undefined;
  const valor = Number(req.query[nombre]);
  if (!Number.isInteger(valor) || valor <= 0) throw new HttpError(400, `${nombre} debe ser un entero positivo`);
  return valor;
}

async function listar(req, res) {
  const filtros = {
    paciente_id: leerFiltro(req, 'paciente_id'),
    medico_id: leerFiltro(req, 'medico_id'),
  };
  const historias = await service.listar(filtros, req.headers.authorization);
  res.status(200).json(historias);
}


async function obtener(req, res) {
 const historia = await service.obtener(leerId(req), req.headers.authorization);
  res.status(200).json(historia);
}

async function crear(req, res) {
  const nueva = await service.crear(req.body, req.headers.authorization);
  res.status(201).location(`${req.baseUrl}/${nueva.id}`).json(nueva);
}

async function actualizar(req, res) {
  const actualizada = await service.actualizar(leerId(req), req.body, req.headers.authorization);
  res.status(200).json(actualizada);
}

async function eliminar(req, res) {
  await service.eliminar(leerId(req));
  res.status(204).end();                  
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
