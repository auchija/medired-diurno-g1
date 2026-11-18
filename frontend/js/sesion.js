// =====================================================================
// SESIÓN: quién inició sesión y con qué rol.
// El inicio de sesión lo valida ms-usuarios (POST /api/usuarios/login), que entrega un token JWT.
// El token y los datos del usuario (nombre y rol) se guardan en sessionStorage:
// la sesión se borra al cerrar la pestaña.
// =====================================================================

function usuarioActual() {
  try {
    return JSON.parse(sessionStorage.getItem('usuario'));
  } catch (error) {
    return null;
  }
}

// Envía el correo y la contraseña a ms-usuarios; si son correctos guarda el token y lleva a la página del rol
async function iniciarSesion(email, password) {
  let respuesta;
  try {
    respuesta = await peticion('/usuarios/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
  } catch (error) {
    if (error.status === 401) throw new ErrorApi(401, 'Correo o contraseña incorrectos');
    throw error;
  }
  const { token, usuario } = respuesta;
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('usuario', JSON.stringify(usuario));   // id, nombre, email y rol (nunca la contraseña)
  location.href = PAGINA_POR_ROL[usuario.rol] || 'inicio.html';
}

// Cerrar sesión: borra el token y los datos del usuario, y vuelve al inicio de sesión
function cerrarSesion() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');
  location.href = 'index.html';
}

// Cada página la llama al cargar: sin sesión → vuelve al inicio de sesión
function exigirSesion() {
  const usuario = usuarioActual();
  if (!usuario || !sessionStorage.getItem('token')) {
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
