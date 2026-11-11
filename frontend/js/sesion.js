// =====================================================================
// SESIÓN: quién inició sesión y con qué rol.
// Taller 2: inicio de sesión SIMULADO contra los usuarios de prueba de config.js.
// Taller 3: se reemplaza por POST /usuarios/login (ms-usuarios) y se guarda también el token.
// Se usa sessionStorage: la sesión se borra al cerrar la pestaña.
// =====================================================================

function usuarioActual() {
  try {
    return JSON.parse(sessionStorage.getItem('usuario'));
  } catch (error) {
    return null;
  }
}

// Devuelve el usuario si el correo y la contraseña coinciden; si no, lanza un error 401
function iniciarSesion(email, password) {
  const usuario = USUARIOS_DE_PRUEBA.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
  if (!usuario) throw new ErrorApi(401, 'Correo o contraseña incorrectos');
  const { password: _omitida, ...datos } = usuario;        // la contraseña nunca se guarda
  sessionStorage.setItem('usuario', JSON.stringify(datos));
  location.href = 'inicio.html';
}

function cerrarSesion() {
  sessionStorage.removeItem('usuario');
  location.href = 'index.html';
}

// Cada página la llama al cargar: sin sesión → vuelve al inicio de sesión
function exigirSesion() {
  const usuario = usuarioActual();
  if (!usuario) {
    location.href = 'index.html';
    return null;
  }
  return usuario;
}

// ¿El usuario actual puede crear, modificar y eliminar en este recurso?
// (El frontend solo oculta botones: el microservicio igual responde 403.)
function puedeEscribir(recurso) {
  const usuario = usuarioActual();
  return Boolean(usuario) && (PERMISOS_ESCRITURA[recurso] || []).includes(usuario.rol);
}
