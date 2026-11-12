// =====================================================================
// PACIENTES (responsable: Sebastián Montaño · ms-pacientes)
// Listar con filtros, crear, editar y eliminar pacientes.
// Contrato: { id, nombre, documento, fecha_nacimiento, eps, telefono }
// Los botones de escritura solo aparecen para administrador y admisiones.
// =====================================================================

// EPS base del formulario (se completan con las que ya existan en los datos)
const EPS_BASE = ['Salud Ejemplo', 'Sanitas', 'Nueva EPS', 'Sura', 'Coosalud', 'Salud Total', 'Compensar'];

const parametros = new URLSearchParams(location.search);
const filtros = { eps: '' };
let texto = parametros.get('q') || '';     // búsqueda por nombre (desde la barra superior)
let listaEps = [...EPS_BASE];

const usuario = exigirSesion();
if (usuario) iniciar();

async function iniciar() {
  pintarEstructura('pacientes.html', 'Pacientes', ['Pacientes']);
  const escribe = puedeEscribir('pacientes');

  // Botones y columna de acciones según el rol
  const nuevo = document.getElementById('nuevo');
  nuevo.hidden = !escribe;
  nuevo.innerHTML = `${icono('mas', 18)} Nuevo paciente`;
  nuevo.onclick = crearPaciente;
  document.getElementById('col-acciones').hidden = !escribe;
  if (!escribe) {
    const aviso = document.getElementById('aviso-rol');
    aviso.hidden = false;
    aviso.innerHTML = `${icono('escudo', 18)} Su perfil (${esc(NOMBRE_ROL[usuario.rol])}) permite consultar los pacientes. Para registrar, modificar o eliminar pacientes comuníquese con Admisiones.`;
  }
  const reiniciar = document.getElementById('reiniciar');
  reiniciar.hidden = usuario.rol !== 'administrador';
  reiniciar.onclick = async () => { await api.reiniciar('pacientes'); await cargarEps(); listar(); };

  // Filtro de texto
  const campoTexto = document.getElementById('filtro-texto');
  campoTexto.value = texto;
  campoTexto.oninput = () => { texto = campoTexto.value.trim(); listar(); };

  // Filtro de EPS (las opciones salen de los datos)
  await cargarEps();
  const selector = document.getElementById('filtro-eps');
  selector.onchange = () => { filtros.eps = selector.value; listar(); };

  // Delegación de eventos de la tabla (se registra una sola vez)
  document.getElementById('filas').onclick = (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;
    const id = Number(boton.dataset.id);
    if (boton.dataset.accion === 'editar') editarPaciente(id);
    if (boton.dataset.accion === 'eliminar') eliminarPaciente(id);
  };

  await listar();

  // Desde el panel: pacientes.html?nuevo=1 abre directamente el formulario
  if (escribe && parametros.get('nuevo') === '1') crearPaciente();
}

// Llena el selector de EPS con las presentes en los datos
async function cargarEps() {
  try {
    const todos = await api.listar('pacientes');
    const existentes = todos.map((p) => p.eps).filter(Boolean);
    listaEps = [...new Set([...EPS_BASE, ...existentes])].sort((a, b) => a.localeCompare(b, 'es'));
  } catch (error) {
    mostrarError(error);
  }
  const selector = document.getElementById('filtro-eps');
  selector.innerHTML = `<option value="">Todas las EPS</option>${listaEps.map((e) => `<option value="${esc(e)}">${esc(e)}</option>`).join('')}`;
  selector.value = filtros.eps;
}

// ---------- Listar (GET /pacientes?eps=…) ----------
async function listar() {
  const filas = document.getElementById('filas');
  try {
    const todos = await api.listar('pacientes', { eps: filtros.eps });
    const pacientes = todos
      .filter((p) => !texto || coincide(p, texto))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    const columnas = puedeEscribir('pacientes') ? 6 : 5;
    filas.innerHTML = pacientes.length
      ? pacientes.map(filaPaciente).join('')
      : `<tr><td colspan="${columnas}" class="vacia">No hay pacientes que coincidan con los filtros</td></tr>`;
    document.getElementById('conteo').textContent = `Mostrando ${pacientes.length} de ${todos.length} pacientes`;
  } catch (error) {
    mostrarError(error);
  }
}

function coincide(paciente, busqueda) {
  const campos = `${paciente.nombre || ''} ${paciente.documento || ''}`;
  return normalizar(campos).includes(normalizar(busqueda));
}

function filaPaciente(p) {
  const acciones = puedeEscribir('pacientes')
    ? `<td><div class="acciones-fila">
         <button class="accion-icono" data-accion="editar" data-id="${p.id}" title="Editar paciente" aria-label="Editar paciente ${p.id}">${icono('editar', 17)}</button>
         <button class="accion-icono peligro" data-accion="eliminar" data-id="${p.id}" title="Eliminar paciente" aria-label="Eliminar paciente ${p.id}">${icono('eliminar', 17)}</button>
       </div></td>`
    : '';
  return `<tr>
    <td><div class="persona"><span class="avatar suave">${iniciales(p.nombre)}</span><div>${esc(p.nombre)}<small>Paciente #${p.id}</small></div></div></td>
    <td>${esc(p.documento)}</td>
    <td>${formatearFecha(p.fecha_nacimiento)}<small>${edad(p.fecha_nacimiento)} años</small></td>
    <td>${esc(p.eps)}</td>
    <td>${esc(p.telefono)}</td>
    ${acciones}
  </tr>`;
}

// ---------- Formulario (crear y editar) ----------
function camposPaciente() {
  return [
    { nombre: 'nombre', etiqueta: 'Nombre completo' },
    { nombre: 'documento', etiqueta: 'Documento' },
    { nombre: 'fecha_nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date' },
    { nombre: 'eps', etiqueta: 'EPS', tipo: 'select', opciones: listaEps.map((e) => ({ valor: e, texto: e })) },
    { nombre: 'telefono', etiqueta: 'Teléfono' },
  ];
}

// Convierte lo escrito en el formulario al formato del contrato de ms-pacientes
function construirPaciente(datos) {
  return {
    nombre: (datos.nombre || '').trim(),
    documento: (datos.documento || '').trim(),
    fecha_nacimiento: (datos.fecha_nacimiento || '').slice(0, 10),   // AAAA-MM-DD
    eps: datos.eps,
    telefono: (datos.telefono || '').trim(),
  };
}

// Mismas reglas del modelo Paciente (todos los campos son obligatorios); ms-pacientes las vuelve a validar
async function validarPaciente(paciente, idActual = null) {
  const errores = [];
  if (!paciente.nombre) errores.push('El nombre es obligatorio');
  if (!paciente.documento) errores.push('El documento es obligatorio');
  if (!paciente.fecha_nacimiento) errores.push('La fecha de nacimiento es obligatoria');
  else if (new Date(`${paciente.fecha_nacimiento}T00:00`) > new Date()) errores.push('La fecha de nacimiento no puede ser futura');
  if (!paciente.eps) errores.push('La EPS es obligatoria');
  if (!paciente.telefono) errores.push('El teléfono es obligatorio');
  if (errores.length) throw new ErrorApi(400, 'Datos inválidos', errores);

  // Regla (supuesta): el documento no se repite entre pacientes
  const repetido = (await api.listar('pacientes')).find((p) => p.documento === paciente.documento && p.id !== idActual);
  if (repetido) throw new ErrorApi(409, `Ya existe un paciente con el documento ${paciente.documento}`);
}

async function crearPaciente() {
  const datos = await pedirDatos('Nuevo paciente', camposPaciente(), {}, 'Registrar paciente');
  if (!datos) return;
  try {
    const paciente = construirPaciente(datos);
    await validarPaciente(paciente);
    const nuevo = await api.crear('pacientes', paciente);
    mostrarMensaje(`Paciente ${nuevo.nombre} registrado`);
    await cargarEps();
    listar();
  } catch (error) {
    mostrarError(error);
  }
}

async function editarPaciente(id) {
  try {
    const actual = await api.obtener('pacientes', id);
    const datos = await pedirDatos('Editar paciente', camposPaciente(), actual, 'Guardar cambios');
    if (!datos) return;
    const paciente = construirPaciente(datos);
    await validarPaciente(paciente, id);
    await api.actualizar('pacientes', id, paciente);
    mostrarMensaje('Paciente actualizado');
    await cargarEps();
    listar();
  } catch (error) {
    mostrarError(error);
  }
}

// Regla (supuesta): no se elimina un paciente con citas programadas
async function eliminarPaciente(id) {
  try {
    const paciente = await api.obtener('pacientes', id);
    const pendientes = (await api.listar('citas')).filter((c) => c.paciente_id === id && c.estado === 'programada');
    if (pendientes.length) {
      throw new ErrorApi(409, `${paciente.nombre} tiene ${pendientes.length} cita(s) programada(s) y no puede eliminarse`);
    }
    if (!(await confirmar(`¿Eliminar al paciente ${paciente.nombre}?`, 'Eliminar'))) return;
    await api.eliminar('pacientes', id);
    mostrarMensaje('Paciente eliminado');
    await cargarEps();
    listar();
  } catch (error) {
    mostrarError(error);
  }
}

// ---------- Utilidades de formato ----------
// "1998-03-15" → "15 mar 1998"
function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(`${fecha.slice(0, 10)}T00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function edad(fecha) {
  if (!fecha) return '—';
  const nacimiento = new Date(`${fecha.slice(0, 10)}T00:00`);
  const hoy = new Date();
  let años = hoy.getFullYear() - nacimiento.getFullYear();
  const cumplio = hoy.getMonth() > nacimiento.getMonth()
    || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
  if (!cumplio) años--;
  return años;
}

function iniciales(nombre) {
  return esc(nombre.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join(''));
}

function normalizar(t) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
