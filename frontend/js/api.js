// =====================================================================
// ACCESO A DATOS: el ÚNICO lugar del frontend que obtiene y guarda datos.
// Las pantallas nunca leen los archivos directamente: siempre llaman a api.
//
// Taller 2: los datos salen de los archivos de ejemplo data/<recurso>.json
//           y los cambios se guardan en la sesión del navegador.
// Taller 3: se reemplaza el interior de estas funciones por fetch a
//           '/api/<recurso>' con el token; las pantallas no cambian.
// =====================================================================

// Error con el mismo formato de los microservicios: { error, detalles }
class ErrorApi extends Error {
  constructor(status, mensaje, detalles = []) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

// Carga la lista de un recurso: primero lo guardado en la sesión, si no, el archivo de ejemplo
async function cargar(recurso) {
  const guardado = sessionStorage.getItem(`datos:${recurso}`);
  if (guardado) return JSON.parse(guardado);
  const respuesta = await fetch(`${FUENTE_DATOS}/${recurso}.json`);
  if (!respuesta.ok) throw new ErrorApi(503, `No se pudieron cargar los datos de ${recurso}`);
  return respuesta.json();
}

function guardar(recurso, lista) {
  sessionStorage.setItem(`datos:${recurso}`, JSON.stringify(lista));
}

const api = {
  // GET /recurso?atributo=valor  → lista (filtra por igualdad)
  async listar(recurso, filtros = {}) {
    const lista = await cargar(recurso);
    return lista.filter((item) =>
      Object.entries(filtros).every(([clave, valor]) => valor === '' || String(item[clave]) === String(valor)));
  },

  // GET /recurso/:id → objeto o 404
  async obtener(recurso, id) {
    const item = (await cargar(recurso)).find((x) => x.id === Number(id));
    if (!item) throw new ErrorApi(404, `No existe ${recurso} con id ${id}`);
    return item;
  },

  // POST /recurso → objeto creado (con id nuevo)
  async crear(recurso, datos) {
    const lista = await cargar(recurso);
    const nuevo = { id: Math.max(0, ...lista.map((x) => x.id)) + 1, ...datos };
    lista.push(nuevo);
    guardar(recurso, lista);
    return nuevo;
  },

  // PUT /recurso/:id → objeto actualizado o 404
  async actualizar(recurso, id, datos) {
    const lista = await cargar(recurso);
    const i = lista.findIndex((x) => x.id === Number(id));
    if (i === -1) throw new ErrorApi(404, `No existe ${recurso} con id ${id}`);
    lista[i] = { ...datos, id: Number(id) };
    guardar(recurso, lista);
    return lista[i];
  },

  // DELETE /recurso/:id → nada o 404
  async eliminar(recurso, id) {
    const lista = await cargar(recurso);
    const restantes = lista.filter((x) => x.id !== Number(id));
    if (restantes.length === lista.length) throw new ErrorApi(404, `No existe ${recurso} con id ${id}`);
    guardar(recurso, restantes);
  },

  // Solo para las pruebas: vuelve a los datos del archivo de ejemplo
  reiniciar(recurso) {
    sessionStorage.removeItem(`datos:${recurso}`);
  },
};
