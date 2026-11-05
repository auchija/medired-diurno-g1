// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================
const historias = [
  { id: 1, paciente_id: 1, medico_id: 1, fecha: '2025-02-10', motivo_consulta: 'Dolor de cabeza persistente', diagnostico: 'Migraña', tratamiento: 'Acetaminofén 500 mg cada 8 horas por 3 días' },
  { id: 2, paciente_id: 2, medico_id: 3, fecha: '2025-04-22', motivo_consulta: 'Tos y fiebre', diagnostico: 'Infección respiratoria aguda', tratamiento: 'Reposo, hidratación y control en 5 días' },
  { id: 3, paciente_id: 3, medico_id: 2, fecha: '2025-07-15', motivo_consulta: 'Control de presión arterial', diagnostico: 'Hipertensión arterial controlada', tratamiento: 'Continuar losartán 50 mg diarios' },
];
let siguienteId = 4;

async function findAll(filtros = {}) {
  let resultado = historias;
  if (filtros.paciente_id) {
    resultado = resultado.filter((h) => h.paciente_id === filtros.paciente_id);
  }
  if (filtros.medico_id) {
    resultado = resultado.filter((h) => h.medico_id === filtros.medico_id);
  }
  return resultado;
}


async function findById(id) {
  return historias.find((h) => h.id === id) || null;
}

async function findByPacienteMedicoFecha(paciente_id, medico_id, fecha) {
  return historias.find(
    (h) => h.paciente_id === paciente_id && h.medico_id === medico_id && h.fecha === fecha,
  ) || null;
}

async function create(historia) {
  const nueva = { id: siguienteId++, ...historia };
  historias.push(nueva);
  return nueva;
}

async function update(id, historia) {
  const i = historias.findIndex((h) => h.id === id);
  if (i === -1) return null;
  historias[i] = { id, ...historia };
  return historias[i];
}

async function remove(id) {
  const i = historias.findIndex((h) => h.id === id);
  if (i === -1) return false;
  historias.splice(i, 1);
  return true;
}

module.exports = { findAll, findById, findByPacienteMedicoFecha, create, update, remove };
