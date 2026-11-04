// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión en memoria (se pierden al reiniciar). En la parte de MySQL
// se reemplaza este archivo SIN tocar las otras capas: por eso todas
// las funciones son async y conservan su nombre y sus parámetros.
// =====================================================================

// Datos ficticios. Solo se guardan los ids del paciente y del médico.
const citas = [
  { id: 1, paciente_id: 1, medico_id: 1, fecha_hora: '2026-12-01T09:00', sede: 'Bogotá', estado: 'programada' },
  { id: 2, paciente_id: 2, medico_id: 2, fecha_hora: '2026-10-20T10:30', sede: 'Cali', estado: 'atendida' },
  { id: 3, paciente_id: 3, medico_id: 1, fecha_hora: '2026-12-02T14:00', sede: 'Medellín', estado: 'cancelada' },
];
let siguienteId = 4;

// Lista las citas aplicando los filtros que lleguen (todos opcionales)
async function findAll(filtros = {}) {
  return citas.filter(
    (c) =>
      (filtros.estado === undefined || c.estado === filtros.estado) &&
      (filtros.medico_id === undefined || c.medico_id === filtros.medico_id) &&
      (filtros.paciente_id === undefined || c.paciente_id === filtros.paciente_id)
  );
}

async function findById(id) {
  return citas.find((c) => c.id === id) || null;
}

// Busca una cita activa (no cancelada) del médico a esa fecha y hora.
// excluirId sirve al actualizar: la cita no debe chocar consigo misma.
async function findByMedicoYFecha(medicoId, fechaHora, excluirId = null) {
  return (
    citas.find(
      (c) =>
        c.medico_id === medicoId &&
        c.fecha_hora === fechaHora &&
        c.estado !== 'cancelada' &&
        c.id !== excluirId
    ) || null
  );
}

async function create(cita) {
  const nueva = { id: siguienteId++, ...cita };
  citas.push(nueva);
  return nueva;
}

// Reemplaza la cita completa (PUT). Devuelve la cita actualizada o null si no existe.
async function update(id, cita) {
  const i = citas.findIndex((c) => c.id === id);
  if (i === -1) return null;
  citas[i] = { id, ...cita };
  return citas[i];
}

// Elimina la cita. Devuelve true si la eliminó, false si no existía.
async function remove(id) {
  const i = citas.findIndex((c) => c.id === id);
  if (i === -1) return false;
  citas.splice(i, 1);
  return true;
}

module.exports = { findAll, findById, findByMedicoYFecha, create, update, remove };