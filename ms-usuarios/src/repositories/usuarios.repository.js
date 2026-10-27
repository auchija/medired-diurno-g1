// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================
const usuarios = [
  { id: 1, nombre: 'Administrador General', email: 'admin@empresa.com', rol: 'administrador', activo: true },
  { id: 2, nombre: 'Laura Gómez', email: 'laura.gomez@empresa.com', rol: 'administrador', activo: true },
  { id: 3, nombre: 'Andrés Castillo', email: 'andres.castillo@empresa.com', rol: 'administrador', activo: false },
];
let siguienteId = 4;

async function findAll() {
  return usuarios;
}

async function findById(id) {
  return usuarios.find((u) => u.id === id) || null;
}

async function findByEmail(email) {
  return usuarios.find((u) => u.email === email) || null;
}

async function create(usuario) {
  const nuevo = { id: siguienteId++, ...usuario };
  usuarios.push(nuevo);
  return nuevo;
}

module.exports = { findAll, findById, findByEmail, create };
