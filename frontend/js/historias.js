// =====================================================================
// HISTORIAS CLÍNICAS (responsable: Miguel Ángel Jiménez · ms-historias)
// Listar con filtros, crear, editar y eliminar historias clínicas.
// Muestra los datos relacionados (paciente y médico) tal como los compone ms-historias.
// Los botones de escritura solo aparecen para administrador y médico.
// =====================================================================

const parametros = new URLSearchParams(location.search);
const filtros = { paciente_id: parametros.get('paciente_id') || '', medico_id: parametros.get('medico_id') || '' };
let texto = '';                                     // búsqueda por paciente, médico o diagnóstico
let pacientes = [];
let medicos = [];

const usuario = exigirSesion();
if (usuario) iniciar();

async function iniciar() {
  pintarEstructura('historias.html', 'Historias clínicas', ['Historias clínicas']);
  const escribe = puedeEscribir('historias');

  // Botones según el rol
  const nueva = document.getElementById('nueva');
  nueva.hidden = !escribe;
  nueva.innerHTML = `${icono('mas', 18)} Nueva historia`;
  nueva.onclick = crearHistoria;
  if (!escribe) {
    const aviso = document.getElementById('aviso-rol');
    aviso.hidden = false;
    aviso.innerHTML = `${icono('escudo', 18)} Su perfil (${esc(NOMBRE_ROL[usuario.rol])}) permite consultar las historias clínicas. Para registrar o modificar una atención comuníquese con el cuerpo médico.`;
  }
  const reiniciar = document.getElementById('reiniciar');
  reiniciar.hidden = usuario.rol !== 'administrador';
  reiniciar.onclick = () => { api.reiniciar('historias'); listar(); };

  // Filtro de texto
  const campoTexto = document.getElementById('filtro-texto');
  campoTexto.oninput = () => { texto = campoTexto.value.trim(); listar(); };

  try {
    // Listas para los filtros y los formularios (paciente y médico se eligen por nombre)
    [pacientes, medicos] = await Promise.all([api.listar('pacientes'), api.listar('medicos')]);
  } catch (error) {
    mostrarError(error);
  }
  pintarSelector('filtro-paciente', 'Todos los pacientes', pacientes.map((p) => ({ valor: p.id, texto: p.nombre })), 'paciente_id');
  pintarSelector('filtro-medico', 'Todos los médicos', medicos.map((m) => ({ valor: m.id, texto: `${m.nombre} · ${m.especialidad}` })), 'medico_id');
  await listar();

  // Desde el panel: historias.html?nueva=1 abre directamente el formulario
  if (escribe && parametros.get('nueva') === '1') crearHistoria();
}

// Selector de filtro (paciente o médico), igual que ?paciente_id= y ?medico_id= de ms-historias
function pintarSelector(id, textoTodos, opciones, filtro) {
  const selector = document.getElementById(id);
  selector.innerHTML = `<option value="">${textoTodos}</option>${opciones.map((o) =>
    `<option value="${o.valor}" ${String(o.valor) === filtros[filtro] ? 'selected' : ''}>${esc(o.texto)}</option>`).join('')}`;
  selector.onchange = () => { filtros[filtro] = selector.value; listar(); };
}

// ---------- Listar (GET /historias?paciente_id=…&medico_id=…) ----------
async function listar() {
  const filas = document.getElementById('filas');
  try {
    const todas = await api.listar('historias', filtros);
    const historias = todas
      .filter((h) => !texto || coincide(h, texto))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));    // la atención más reciente primero

    filas.innerHTML = historias.length
      ? historias.map(filaHistoria).join('')
      : `<tr><td colspan="6" class="vacia">No hay historias clínicas que coincidan con los filtros</td></tr>`;
    document.getElementById('conteo').textContent = `Mostrando ${historias.length} de ${todas.length} historias clínicas`;
  } catch (error) {
    mostrarError(error);
  }
  filas.onclick = (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;
    const id = Number(boton.dataset.id);
    if (boton.dataset.accion === 'editar') editarHistoria(id);
    if (boton.dataset.accion === 'eliminar') eliminarHistoria(id);
  };
}

function coincide(historia, busqueda) {
  const textos = `${historia.paciente?.nombre || ''} ${historia.medico?.nombre || ''} ${historia.medico?.especialidad || ''} ${historia.motivo_consulta} ${historia.diagnostico}`;
  return normalizar(textos).includes(normalizar(busqueda));
}

function filaHistoria(h) {
  // Si un microservicio no respondió, el objeto viene en null: se muestra el id y el aviso
  const paciente = h.paciente
    ? `<div class="persona"><span class="avatar suave">${iniciales(h.paciente.nombre)}</span><div>${esc(h.paciente.nombre)}<small>Paciente #${h.paciente.id}</small></div></div>`
    : `<span class="sin-dato">Paciente #${h.paciente_id}</span><small class="alerta-dato">${icono('alerta', 13)} ${esc(h.aviso || 'Datos no disponibles')}</small>`;
  const medico = h.medico
    ? `${esc(h.medico.nombre)}<small>${esc(h.medico.especialidad)}</small>`
    : `<span class="sin-dato">Médico #${h.medico_id}</span><small class="alerta-dato">${icono('alerta', 13)} ${esc(h.aviso || 'Datos no disponibles')}</small>`;
  const acciones = puedeEscribir('historias')
    ? `<td><div class="acciones-fila">
         <button class="accion-icono" data-accion="editar" data-id="${h.id}" title="Editar historia" aria-label="Editar historia ${h.id}">${icono('editar', 17)}</button>
         <button class="accion-icono peligro" data-accion="eliminar" data-id="${h.id}" title="Eliminar historia" aria-label="Eliminar historia ${h.id}">${icono('eliminar', 17)}</button>
       </div></td>`
    : '';
  return `<tr>
    <td class="fecha-celda"><b>${formatearFecha(h.fecha)}</b><small>Historia #${h.id}</small></td>
    <td>${paciente}</td>
    <td>${medico}</td>
    <td>${esc(h.motivo_consulta)}</td>
    <td>${esc(h.diagnostico)}<small>${esc(h.tratamiento)}</small></td>
    ${acciones}
  </tr>`;
}

// ---------- Formulario (crear y editar) ----------
function camposHistoria() {
  return [
    { nombre: 'paciente_id', etiqueta: 'Paciente', tipo: 'select', opciones: pacientes.map((p) => ({ valor: p.id, texto: `${p.nombre} · ${p.documento || ''}` })) },
    { nombre: 'medico_id', etiqueta: 'Médico', tipo: 'select', opciones: medicos.map((m) => ({ valor: m.id, texto: `${m.nombre} · ${m.especialidad}` })) },
    { nombre: 'fecha', etiqueta: 'Fecha de la atención', tipo: 'date' },
    { nombre: 'motivo_consulta', etiqueta: 'Motivo de consulta' },
    { nombre: 'diagnostico', etiqueta: 'Diagnóstico' },
    { nombre: 'tratamiento', etiqueta: 'Tratamiento' },
  ];
}

// Convierte lo escrito en el formulario al formato del contrato de ms-historias
function construirHistoria(datos) {
  const paciente = pacientes.find((p) => p.id === Number(datos.paciente_id));
  const medico = medicos.find((m) => m.id === Number(datos.medico_id));
  return {
    paciente_id: Number(datos.paciente_id),
    medico_id: Number(datos.medico_id),
    fecha: datos.fecha,                                  // AAAA-MM-DD
    motivo_consulta: datos.motivo_consulta,
    diagnostico: datos.diagnostico,
    tratamiento: datos.tratamiento,
    // Objetos compuestos, como los devuelve ms-historias
    paciente: paciente ? { id: paciente.id, nombre: paciente.nombre } : null,
    medico: medico ? { id: medico.id, nombre: medico.nombre, especialidad: medico.especialidad } : null,
  };
}

// La misma regla de negocio de ms-historias (el microservicio la vuelve a validar)
function validarReglas(historia) {
  if (historia.fecha > hoy()) {
    throw new ErrorApi(400, 'Datos inválidos', [`la fecha de la atención no puede ser futura (hoy es ${hoy()})`]);
  }
}

async function crearHistoria() {
  const datos = await pedirDatos('Nueva historia clínica', camposHistoria(), { fecha: hoy() }, 'Registrar historia');
  if (!datos) return;
  try {
    const historia = construirHistoria(datos);
    validarReglas(historia);
    const nueva = await api.crear('historias', historia);
    mostrarMensaje(`Historia clínica registrada para ${nueva.paciente?.nombre || 'el paciente'} el ${formatearFecha(nueva.fecha)}`);
    listar();
  } catch (error) {
    mostrarError(error);
  }
}

async function editarHistoria(id) {
  try {
    const actual = await api.obtener('historias', id);
    const datos = await pedirDatos('Editar historia clínica', camposHistoria(), actual, 'Guardar cambios');
    if (!datos) return;
    const historia = construirHistoria(datos);
    validarReglas(historia);
    await api.actualizar('historias', id, historia);
    mostrarMensaje('Historia clínica actualizada');
    listar();
  } catch (error) {
    mostrarError(error);
  }
}

async function eliminarHistoria(id) {
  try {
    const historia = await api.obtener('historias', id);
    if (!(await confirmar(`¿Eliminar la historia clínica de ${historia.paciente?.nombre || `el paciente #${historia.paciente_id}`} del ${formatearFecha(historia.fecha)}?`, 'Eliminar'))) return;
    await api.eliminar('historias', id);
    mostrarMensaje('Historia clínica eliminada');
    listar();
  } catch (error) {
    mostrarError(error);
  }
}

// ---------- Utilidades de formato ----------
// Fecha de hoy en formato AAAA-MM-DD, según la hora local (igual que ms-historias)
function hoy() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

// "2025-02-10" → "lun, 10 feb 2025"
function formatearFecha(fecha) {
  return new Date(`${fecha}T00:00`).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function iniciales(nombre) {
  return esc(nombre.split(' ').map((p) => p[0]).slice(0, 2).join(''));
}

function normalizar(t) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
