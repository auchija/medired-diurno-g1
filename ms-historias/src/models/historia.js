
// =====================================================================
// CAPA DE MODELO (entidad)
// Define qué campos tiene una Historia clínica y qué reglas deben cumplir.
// No sabe nada de HTTP ni de bases de datos.
//
// paciente_id y medico_id son ids de otros microservicios (ms-pacientes y
// ms-medicos). Aquí solo se guarda el número, nunca el nombre.
// =====================================================================

const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

function esEnteroPositivo(valor) {
  return Number.isInteger(valor) && valor > 0;
}

function esTextoNoVacio(valor) {
  return typeof valor === 'string' && valor.trim() !== '';
}

function esFechaValida(valor) {
  if (typeof valor !== 'string' || !FECHA_VALIDA.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}


function validarHistoria(datos) {
  const errores = [];
  if (!datos || typeof datos !== 'object') {
    return ['Se esperaba un objeto JSON con los datos de la historia clínica'];
  }
  if (!esEnteroPositivo(datos.paciente_id)) {
    errores.push('paciente_id es obligatorio y debe ser un entero positivo');
  }
  if (!esEnteroPositivo(datos.medico_id)) {
    errores.push('medico_id es obligatorio y debe ser un entero positivo');
  }
  if (!esFechaValida(datos.fecha)) {
    errores.push('fecha es obligatoria y debe tener el formato YYYY-MM-DD');
  }
  if (!esTextoNoVacio(datos.motivo_consulta)) {
    errores.push('motivo_consulta es obligatorio');
  }
  if (!esTextoNoVacio(datos.diagnostico)) {
    errores.push('diagnostico es obligatorio');
  }
  if (!esTextoNoVacio(datos.tratamiento)) {
    errores.push('tratamiento es obligatorio');
  }
  return errores;
}

function construirHistoria(datos) {
  return {
    paciente_id: datos.paciente_id,
    medico_id: datos.medico_id,
    fecha: datos.fecha,
    motivo_consulta: datos.motivo_consulta.trim(),
    diagnostico: datos.diagnostico.trim(),
    tratamiento: datos.tratamiento.trim(),
  };
}

module.exports = { validarHistoria, construirHistoria };