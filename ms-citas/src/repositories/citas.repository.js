// src/repositories/citas.repository.js — versión MySQL
// Única capa que sabe DÓNDE se guardan los datos. Las funciones conservan
// el mismo nombre, los mismos parámetros y el mismo tipo de resultado que
// la versión en memoria: por eso el servicio y el controlador no cambian.
const pool = require('../db');

// MySQL guarda la fecha como DATETIME ('2026-12-01 09:00:00').
// El contrato de la API usa 'AAAA-MM-DDTHH:MM'. Estas dos funciones traducen.
function aMySQL(fechaHora) {
  return fechaHora.replace('T', ' ') + ':00';      // '2026-12-01T09:00' → '2026-12-01 09:00:00'
}
function aCita(fila) {
  return { ...fila, fecha_hora: fila.fecha_hora.slice(0, 16).replace(' ', 'T') };
}

async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM citas';
  const condiciones = [];
  const valores = [];
  if (filtros.estado !== undefined) {
    condiciones.push('estado = ?');
    valores.push(filtros.estado);
  }
  if (filtros.medico_id !== undefined) {
    condiciones.push('medico_id = ?');
    valores.push(filtros.medico_id);
  }
  if (filtros.paciente_id !== undefined) {
    condiciones.push('paciente_id = ?');
    valores.push(filtros.paciente_id);
  }
  if (condiciones.length > 0) sql += ' WHERE ' + condiciones.join(' AND ');
  const [filas] = await pool.query(sql + ' ORDER BY id', valores);
  return filas.map(aCita);
}

async function findById(id) {
  // ? es un parámetro: el valor viaja aparte de la consulta (evita inyección SQL)
  const [filas] = await pool.query('SELECT * FROM citas WHERE id = ?', [id]);
  return filas.length > 0 ? aCita(filas[0]) : null;
}

// Busca una cita activa (no cancelada) del médico a esa fecha y hora.
// excluirId sirve al actualizar: la cita no debe chocar consigo misma.
async function findByMedicoYFecha(medicoId, fechaHora, excluirId = null) {
  const [filas] = await pool.query(
    `SELECT * FROM citas
      WHERE medico_id = ? AND fecha_hora = ? AND estado <> 'cancelada' AND id <> ?
      LIMIT 1`,
    [medicoId, aMySQL(fechaHora), excluirId ?? 0]);
  return filas.length > 0 ? aCita(filas[0]) : null;
}

async function create(cita) {
  const [resultado] = await pool.query(
    'INSERT INTO citas (paciente_id, medico_id, fecha_hora, sede, estado) VALUES (?, ?, ?, ?, ?)',
    [cita.paciente_id, cita.medico_id, aMySQL(cita.fecha_hora), cita.sede, cita.estado]);
  return findById(resultado.insertId);     // MySQL devuelve el id generado
}

// Reemplaza la cita completa (PUT). Devuelve la cita actualizada o null si no existe.
async function update(id, cita) {
  const [resultado] = await pool.query(
    'UPDATE citas SET paciente_id = ?, medico_id = ?, fecha_hora = ?, sede = ?, estado = ? WHERE id = ?',
    [cita.paciente_id, cita.medico_id, aMySQL(cita.fecha_hora), cita.sede, cita.estado, id]);
  if (resultado.affectedRows === 0) return null;
  return findById(id);
}

// Elimina la cita. Devuelve true si la eliminó, false si no existía.
async function remove(id) {
  const [resultado] = await pool.query('DELETE FROM citas WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}

module.exports = { findAll, findById, findByMedicoYFecha, create, update, remove };