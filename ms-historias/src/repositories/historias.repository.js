
const pool = require('../db');


async function findAll(filtros = {}) {
  let sql = 'SELECT * FROM historias';
  const condiciones = [];
  const valores = [];
  if (filtros.paciente_id) {
    condiciones.push('paciente_id = ?');
    valores.push(filtros.paciente_id);
  }
  if (filtros.medico_id) {
    condiciones.push('medico_id = ?');
    valores.push(filtros.medico_id);
  }
  if (condiciones.length > 0) sql += ' WHERE ' + condiciones.join(' AND ');
  const [filas] = await pool.query(sql + ' ORDER BY id', valores);
  return filas;
}

async function findById(id) {
 
  const [filas] = await pool.query('SELECT * FROM historias WHERE id = ?', [id]);
  return filas.length > 0 ? filas[0] : null;
}


async function findByPacienteMedicoFecha(paciente_id, medico_id, fecha) {
  const [filas] = await pool.query(
    'SELECT * FROM historias WHERE paciente_id = ? AND medico_id = ? AND fecha = ?',
    [paciente_id, medico_id, fecha]);
  return filas.length > 0 ? filas[0] : null;
}

async function create(historia) {
  const [resultado] = await pool.query(
    'INSERT INTO historias (paciente_id, medico_id, fecha, motivo_consulta, diagnostico, tratamiento) VALUES (?, ?, ?, ?, ?, ?)',
    [historia.paciente_id, historia.medico_id, historia.fecha,
      historia.motivo_consulta, historia.diagnostico, historia.tratamiento]);
  return findById(resultado.insertId);     
}

async function update(id, historia) {
  const [resultado] = await pool.query(
    'UPDATE historias SET paciente_id = ?, medico_id = ?, fecha = ?, motivo_consulta = ?, diagnostico = ?, tratamiento = ? WHERE id = ?',
    [historia.paciente_id, historia.medico_id, historia.fecha,
      historia.motivo_consulta, historia.diagnostico, historia.tratamiento, id]);
  if (resultado.affectedRows === 0) return null;
  return findById(id);
}


async function remove(id) {
  const [resultado] = await pool.query('DELETE FROM historias WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}

module.exports = { findAll, findById, findByPacienteMedicoFecha, create, update, remove };
