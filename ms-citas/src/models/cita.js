// =====================================================================
// CAPA DE MODELO (entidad)
// Define qué campos tiene una Cita y qué reglas deben cumplir.
// No sabe nada de HTTP ni de bases de datos.
//
// paciente_id y medico_id son REFERENCIAS: guardan solo el id del registro
// que vive en ms-pacientes y ms-medicos, nunca una copia de sus datos.
// =====================================================================

// Valores permitidos (listas cerradas)
const SEDES = ['Bogotá', 'Cali', 'Medellín'];
const ESTADOS = ['programada', 'atendida', 'cancelada'];

// Formato de fecha y hora: AAAA-MM-DDTHH:MM (ej. 2026-11-03T09:00)
const FECHA_HORA_VALIDA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// Un id válido es un número entero mayor que cero
function esIdValido(valor) {
  return Number.isInteger(valor) && valor > 0;
}

// Devuelve una lista de errores de validación (vacía si todo está bien)
function validarCita(datos) {
  const errores = [];
  if (!datos || typeof datos !== 'object') {
    return ['Se esperaba un objeto JSON con los datos de la cita'];
  }
  if (!esIdValido(datos.paciente_id)) {
    errores.push('paciente_id es obligatorio y debe ser un entero positivo');
  }
  if (!esIdValido(datos.medico_id)) {
    errores.push('medico_id es obligatorio y debe ser un entero positivo');
  }
  if (
    typeof datos.fecha_hora !== 'string' ||
    !FECHA_HORA_VALIDA.test(datos.fecha_hora) ||
    Number.isNaN(Date.parse(datos.fecha_hora))
  ) {
    errores.push('fecha_hora es obligatoria con formato AAAA-MM-DDTHH:MM (ej. 2026-11-03T09:00)');
  }
  if (!SEDES.includes(datos.sede)) {
    errores.push(`sede debe ser una de: ${SEDES.join(', ')}`);
  }
  if (datos.estado !== undefined && !ESTADOS.includes(datos.estado)) {
    errores.push(`estado debe ser uno de: ${ESTADOS.join(', ')}`);
  }
  return errores;
}

// Construye una cita "limpia" solo con los campos permitidos
function construirCita(datos) {
  return {
    paciente_id: datos.paciente_id,
    medico_id: datos.medico_id,
    fecha_hora: datos.fecha_hora,
    sede: datos.sede,
    estado: datos.estado === undefined ? 'programada' : datos.estado,
  };
}

module.exports = { validarCita, construirCita, SEDES, ESTADOS };