// =====================================================================
// MÉDICOS (responsable: Sebastián Montaño · ms-medicos)
// Listar con filtros, crear, editar y eliminar médicos.
// Contrato: { id, nombre, registro_medico, especialidad, sede }
// Los botones de escritura solo aparecen para administrador.
// =====================================================================

// Especialidades base del formulario (se completan con las que ya existan en los datos)
const ESPECIALIDADES_BASE = ['Medicina general', 'Pediatría', 'Cardiología', 'Dermatología', 'Ginecología', 'Ortopedia', 'Neurología'];

const parametros = new URLSearchParams(location.search);
const filtros = { especialidad: '', sede: '' };
let texto = parametros.get('q') || '';     // búsqueda por nombre (desde la barra superior)
let especialidades = [...ESPECIALIDADES_BASE];

const usuario = exigirSesion();
if (usuario) iniciar();

async function iniciar() {
  pintarEstructura('medicos.html', 'Médicos', ['Médicos']);
  const escribe = puedeEscribir('medicos');

  // Botones y columna de acciones según el rol
  const nuevo = document.getElementById('nuevo');
  nuevo.hidden = !escribe;
  nuevo.innerHTML = `${icono('mas', 18)} Nuevo médico`;
  nuevo.onclick = crearMedico;
  document.getElementById('col-acciones').hidden = !escribe;
  if (!escribe) {
    const aviso = document.getElementById('aviso-rol');
    aviso.hidden = false;
    aviso.innerHTML = `${icono('escudo', 18)} Su perfil (${esc(NOMBRE_ROL[usuario.rol])}) permite consultar los médicos. Para registrar, modificar o eliminar médicos comuníquese con el administrador.`;
  }
  const reiniciar = document.getElementById('reiniciar');
  reiniciar.hidden = usuario.rol !== 'administrador';
  reiniciar.onclick = async () => { await api.reiniciar('medicos'); await cargarEspecialidades(); listar(); };

  // Filtro de texto
  const campoTexto = document.getElementById('filtro-texto');
  campoTexto.value = texto;
  campoTexto.oninput = () => { texto = campoTexto.value.trim(); listar(); };

  // Filtro de sede
  const sede = document.getElementById('filtro-sede');
  sede.innerHTML = `<option value="">Todas las sedes</option>${SEDES.map((s) => `<option>${s}</option>`).join('')}`;
  sede.onchange = () => { filtros.sede = sede.value; listar(); };

  // Filtro de especialidad (las opciones salen de los datos)
  await cargarEspecialidades();
  const selector = document.getElementById('filtro-especialidad');
  selector.onchange = () => { filtros.especialidad = selector.value; listar(); };

  // Delegación de eventos de la tabla (se registra una sola vez)
  document.getElementById('filas').onclick = (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;
    const id = Number(boton.dataset.id);
    if (boton.dataset.accion === 'editar') editarMedico(id);
    if (boton.dataset.accion === 'eliminar') eliminarMedico(id);
  };

  await listar();

  // Desde el panel: medicos.html?nuevo=1 abre directamente el formulario
  if (escribe && parametros.get('nuevo') === '1') crearMedico();
}

// Llena el selector de especialidad con las presentes en los datos
async function cargarEspecialidades() {
  try {
    const todos = await api.listar('medicos');
    const existentes = todos.map((m) => m.especialidad).filter(Boolean);
    especialidades = [...new Set([...ESPECIALIDADES_BASE, ...existentes])].sort((a, b) => a.localeCompare(b, 'es'));
  } catch (error) {
    mostrarError(error);
  }
  const selector = document.getElementById('filtro-especialidad');
  selector.innerHTML = `<option value="">Todas las especialidades</option>${especialidades.map((e) => `<option value="${esc(e)}">${esc(e)}</option>`).join('')}`;
  selector.value = filtros.especialidad;
}

// ---------- Listar (GET /medicos?sede=…) ----------
async function listar() {
  const filas = document.getElementById('filas');
  try {
    const todos = await api.listar('medicos', { sede: filtros.sede });
    const medicos = todos
      .filter((m) => !filtros.especialidad || m.especialidad === filtros.especialidad)
      .filter((m) => !texto || coincide(m, texto))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    const columnas = puedeEscribir('medicos') ? 5 : 4;
    filas.innerHTML = medicos.length
      ? medicos.map(filaMedico).join('')
      : `<tr><td colspan="${columnas}" class="vacia">No hay médicos que coincidan con los filtros</td></tr>`;
    document.getElementById('conteo').textContent = `Mostrando ${medicos.length} de ${todos.length} médicos`;
  } catch (error) {
    mostrarError(error);
  }
}

function coincide(medico, busqueda) {
  const campos = `${medico.nombre || ''} ${medico.registro_medico || ''} ${medico.especialidad || ''}`;
  return normalizar(campos).includes(normalizar(busqueda));
}

function filaMedico(m) {
  const acciones = puedeEscribir('medicos')
    ? `<td><div class="acciones-fila">
         <button class="accion-icono" data-accion="editar" data-id="${m.id}" title="Editar médico" aria-label="Editar médico ${m.id}">${icono('editar', 17)}</button>
         <button class="accion-icono peligro" data-accion="eliminar" data-id="${m.id}" title="Eliminar médico" aria-label="Eliminar médico ${m.id}">${icono('eliminar', 17)}</button>
       </div></td>`
    : '';
  return `<tr>
    <td><div class="persona"><span class="avatar suave">${iniciales(m.nombre)}</span><div>${esc(m.nombre)}<small>Médico #${m.id}</small></div></div></td>
    <td>${esc(m.registro_medico)}</td>
    <td>${esc(m.especialidad)}</td>
    <td>${esc(m.sede)}</td>
    ${acciones}
  </tr>`;
}

// ---------- Formulario (crear y editar) ----------
function camposMedico() {
  return [
    { nombre: 'nombre', etiqueta: 'Nombre completo' },
    { nombre: 'registro_medico', etiqueta: 'Registro médico' },
    { nombre: 'especialidad', etiqueta: 'Especialidad', tipo: 'select', opciones: especialidades.map((e) => ({ valor: e, texto: e })) },
    { nombre: 'sede', etiqueta: 'Sede', tipo: 'select', opciones: SEDES.map((s) => ({ valor: s, texto: s })) },
  ];
}

// Convierte lo escrito en el formulario al formato del contrato de ms-medicos
function construirMedico(datos) {
  return {
    nombre: (datos.nombre || '').trim(),
    registro_medico: (datos.registro_medico || '').trim(),
    especialidad: datos.especialidad,
    sede: datos.sede,
  };
}

// Mismas reglas del modelo Medico (Required / StringLength); ms-medicos las vuelve a validar
function validarMedico(medico) {
  const errores = [];
  if (!medico.nombre) errores.push('El nombre es obligatorio');
  if (!medico.registro_medico) errores.push('El registro médico es obligatorio');
  else if (medico.registro_medico.length > 100) errores.push('El registro médico debe tener máximo 100 caracteres');
  if (!medico.especialidad) errores.push('La especialidad es obligatoria');
  else if (medico.especialidad.length > 100) errores.push('La especialidad no puede exceder los 100 caracteres');
  if (!medico.sede) errores.push('La sede es obligatoria');
  if (errores.length) throw new ErrorApi(400, 'Datos inválidos', errores);
}

async function crearMedico() {
  const datos = await pedirDatos('Nuevo médico', camposMedico(), {}, 'Registrar médico');
  if (!datos) return;
  try {
    const medico = construirMedico(datos);
    validarMedico(medico);
    const nuevo = await api.crear('medicos', medico);
    mostrarMensaje(`Médico ${nuevo.nombre} registrado`);
    await cargarEspecialidades();
    listar();
  } catch (error) {
    mostrarError(error);
  }
}

async function editarMedico(id) {
  try {
    const actual = await api.obtener('medicos', id);
    const datos = await pedirDatos('Editar médico', camposMedico(), actual, 'Guardar cambios');
    if (!datos) return;
    const medico = construirMedico(datos);
    validarMedico(medico);
    await api.actualizar('medicos', id, medico);
    mostrarMensaje('Médico actualizado');
    await cargarEspecialidades();
    listar();
  } catch (error) {
    mostrarError(error);
  }
}

// Regla (supuesta): no se elimina un médico con citas programadas
async function eliminarMedico(id) {
  try {
    const medico = await api.obtener('medicos', id);
    const pendientes = (await api.listar('citas', { medico_id: id })).filter((c) => c.estado === 'programada');
    if (pendientes.length) {
      throw new ErrorApi(409, `${medico.nombre} tiene ${pendientes.length} cita(s) programada(s) y no puede eliminarse`);
    }
    if (!(await confirmar(`¿Eliminar al médico ${medico.nombre}?`, 'Eliminar'))) return;
    await api.eliminar('medicos', id);
    mostrarMensaje('Médico eliminado');
    await cargarEspecialidades();
    listar();
  } catch (error) {
    mostrarError(error);
  }
}

// ---------- Utilidades de formato ----------
function iniciales(nombre) {
  return esc(nombre.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join(''));
}

function normalizar(t) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}