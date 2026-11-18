// =====================================================================
// ACCESO A DATOS: el ÚNICO lugar del frontend que habla con la API.
// Todas las peticiones pasan por el gateway (/api/<recurso>) con el token del usuario.
// Las pantallas no saben de fetch ni de tokens: solo llaman a api.listar, api.crear, etc.
// =====================================================================

// Error con el mismo formato de los microservicios: { error, detalles }
class ErrorApi extends Error {
  constructor(status, mensaje, detalles = []) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

// Única función que hace peticiones: agrega el token y maneja los errores igual en toda la aplicación
async function peticion(ruta, opciones = {}) {
  const token = sessionStorage.getItem('token');
  let respuesta;
  try {
    respuesta = await fetch(`${API}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (error) {
    throw new ErrorApi(503, 'No se pudo conectar con el servidor');
  }

  // Sin sesión o token vencido: se borra la sesión y se vuelve al inicio de sesión
  if (respuesta.status === 401 && !ruta.startsWith('/usuarios/login')) {
    sessionStorage.clear();
    location.href = 'index.html';
    throw new ErrorApi(401, 'La sesión expiró. Inicie sesión de nuevo.');
  }
  if (respuesta.status === 204) return null;

  // Los microservicios responden JSON; si un servicio está detenido, Apache responde una página HTML (503)
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch (error) {
    datos = null;
  }
  if (!respuesta.ok) {
    const mensaje = datos?.error
      || (respuesta.status === 503 ? 'El servicio no está disponible en este momento' : `Error ${respuesta.status}`);
    throw new ErrorApi(respuesta.status, mensaje, datos?.detalles || []);
  }
  return datos;
}

// Arma la parte ?atributo=valor solo con los filtros que el microservicio acepta
function separarFiltros(recurso, filtros) {
  const enApi = new URLSearchParams();
  const enNavegador = {};
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor === '' || valor === undefined || valor === null) continue;
    if ((FILTROS_API[recurso] || []).includes(clave)) enApi.set(clave, valor);
    else enNavegador[clave] = valor;
  }
  const consulta = enApi.toString();
  return { consulta: consulta ? `?${consulta}` : '', enNavegador };
}

const api = {
  // GET /recurso?atributo=valor → lista
  async listar(recurso, filtros = {}) {
    const { consulta, enNavegador } = separarFiltros(recurso, filtros);
    const lista = await peticion(`/${recurso}${consulta}`);
    return lista.filter((item) =>
      Object.entries(enNavegador).every(([clave, valor]) => String(item[clave]) === String(valor)));
  },

  // GET /recurso/:id → objeto (404 si no existe)
  obtener(recurso, id) {
    return peticion(`/${recurso}/${id}`);
  },

  // POST /recurso → objeto creado
  crear(recurso, datos) {
    return peticion(`/${recurso}`, { method: 'POST', body: JSON.stringify(datos) });
  },

  // PUT /recurso/:id → objeto actualizado
  actualizar(recurso, id, datos) {
    return peticion(`/${recurso}/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
  },

  // DELETE /recurso/:id → nada (204)
  eliminar(recurso, id) {
    return peticion(`/${recurso}/${id}`, { method: 'DELETE' });
  },
};
