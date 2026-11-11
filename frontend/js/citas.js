// =====================================================================
// AGENDA DE CITAS (responsable: Alejandro González · ms-citas)
// Listar con filtros, crear, editar y eliminar citas.
// Muestra los datos relacionados (paciente y médico) tal como los compone ms-citas.
// Los botones de escritura solo aparecen para administrador y admisiones.
// =====================================================================

const ESTADOS = ['programada', 'atendida', 'cancelada'];
const parametros = new URLSearchParams(location.search);
const filtros = { estado: parametros.get('estado') || '', sede: '' };
let texto = parametros.get('q') || '';            // búsqueda por nombre (desde la barra superior)
let pacientes = [];
let medicos = [];

const usuario = exigirSesion();
if (usuario) iniciar();

async function iniciar() {
  pintarEstructura('citas.html', 'Agenda de citas', ['Agenda de citas']);
  const escribe = puedeEscribir('citas');

  // Botones según el rol
  const nueva = document.getElementById('nueva');
  nueva.hidden = !escribe;
  nueva.innerHTML = `${icono('mas', 18)} Nueva cita`;
  nueva.onclick = crearCita;
  if (!escribe) {
    const aviso = document.getElementById('aviso-rol');
    aviso.hidden = false;
    aviso.innerHTML = `${icono('escudo', 18)} Su perfil (${esc(NOMBRE_ROL[usuario.rol])}) permite consultar la agenda. Para agendar, modificar o cancelar citas comuníquese con Admisiones.`;
  }
  const reiniciar = document.getElementById('reiniciar');
  reiniciar.hidden = usuario.rol !== 'administrador';
  reiniciar.onclick = () => { api.reiniciar('citas'); listar(); };

  // Filtro de texto
  const campoTexto = document.getElementById('filtro-texto');
  campoTexto.value = texto;
  campoTexto.oninput = () => { texto = campoTexto.value.trim(); listar(); };

  // Filtro de sede
  const sede = document.getElementById('filtro-sede');
  sede.innerHTML = `<option value="">Todas las sedes</option>${SEDES.map((s) => `<option>${s}</option>`).join('')}`;
  sede.onchange = () => { filtros.sede = sede.value; listar(); };

  try {
    // Listas para los formularios (paciente y médico se eligen por nombre)
    [pacientes, medicos] = await Promise.all([api.listar('pacientes'), api.listar('medicos')]);
  } catch (error) {
    mostrarError(error);
  }
  await listar();

  // Desde el panel: citas.html?nueva=1 abre directamente el formulario
  if (escribe && parametros.get('nueva') === '1') crearCita();
}

// ---------- Listar (GET /citas?estado=…&sede=…) ----------
async function listar() {
  const filas = document.getElementById('filas');
  try {
    const todas = await api.listar('citas', { sede: filtros.sede });
    pintarFiltrosEstado(todas);

    const citas = todas
      .filter((c) => !filtros.estado || c.estado === filtros.estado)
      .filter((c) => !texto || coincide(c, texto))
      .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));

    filas.innerHTML = citas.length
      ? citas.map(filaCita).join('')
      : `<tr><td colspan="6" class="vacia">No hay citas que coincidan con los filtros</td></tr>`;
    document.getElementById('conteo').textContent = `Mostrando ${citas.length} de ${todas.length} citas`;
  } catch (error) {
    mostrarError(error);
  }
  filas.onclick = (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;
    const id = Number(boton.dataset.id);
    if (boton.dataset.accion === 'editar') editarCita(id);
    if (boton.dataset.accion === 'eliminar') eliminarCita(id);
  };
}

function coincide(cita, busqueda) {
  const nombres = `${cita.paciente?.nombre || ''} ${cita.medico?.nombre || ''} ${cita.medico?.especialidad || ''}`;
  return normalizar(nombres).includes(normalizar(busqueda));
}

// Filtro por estado (control segmentado con el número de citas de cada estado)
function pintarFiltrosEstado(citas) {
  const opciones = [{ valor: '', texto: 'Todas', n: citas.length },
    ...ESTADOS.map((e) => ({ valor: e, texto: capitalizar(e) + 's', n: citas.filter((c) => c.estado === e).length }))];
  const contenedor = document.getElementById('filtros-estado');
  contenedor.innerHTML = opciones.map((o) =>
    `<button class="${o.valor === filtros.estado ? 'activo' : ''}" data-estado="${o.valor}">${o.texto}<span class="cuenta">${o.n}</span></button>`).join('');
  contenedor.onclick = (evento) => {
    const boton = evento.target.closest('[data-estado]');
    if (!boton) return;
    filtros.estado = boton.dataset.estado;
    listar();
  };
}

function filaCita(c) {
  const f = formatearFecha(c.fecha_hora);
  // Si un microservicio no respondió, el objeto viene en null: se muestra el id y el aviso
  const paciente = c.paciente
    ? `<div class="persona"><span class="avatar suave">${iniciales(c.paciente.nombre)}</span><div>${esc(c.paciente.nombre)}<small>Paciente #${c.paciente.id}</small></div></div>`
    : `<span class="sin-dato">Paciente #${c.paciente_id}</span>`;
  const medico = c.medico
    ? `${esc(c.medico.nombre)}<small>${esc(c.medico.especialidad)}</small>`
    : `<span class="sin-dato">Médico #${c.medico_id}</span><small class="alerta-dato">${icono('alerta', 13)} ${esc(c.aviso || 'Datos no disponibles')}</small>`;
  const acciones = puedeEscribir('citas')
    ? `<td><div class="acciones-fila">
         <button class="accion-icono" data-accion="editar" data-id="${c.id}" title="Editar cita" aria-label="Editar cita ${c.id}">${icono('editar', 17)}</button>
         <button class="accion-icono peligro" data-accion="eliminar" data-id="${c.id}" title="Eliminar cita" aria-label="Eliminar cita ${c.id}">${icono('eliminar', 17)}</button>
       </div></td>`
    : '';
  return `<tr>
    <td class="fecha-celda"><b>${f.dia}</b><small>${f.hora}</small></td>
    <td>${paciente}</td>
    <td>${medico}</td>
    <td>${esc(c.sede)}</td>
    <td><span class="estado estado-${esc(c.estado)}">${capitalizar(c.estado)}</span></td>
    ${acciones}
  </tr>`;
}

// ---------- Formulario (crear y editar) ----------
function camposCita(conEstado) {
  const campos = [
    { nombre: 'paciente_id', etiqueta: 'Paciente', tipo: 'select', opciones: pacientes.map((p) => ({ valor: p.id, texto: `${p.nombre} · ${p.documento || ''}` })) },
    { nombre: 'medico_id', etiqueta: 'Médico', tipo: 'select', opciones: medicos.map((m) => ({ valor: m.id, texto: `${m.nombre} · ${m.especialidad}` })) },
    { nombre: 'fecha_hora', etiqueta: 'Fecha y hora', tipo: 'datetime-local' },
    { nombre: 'sede', etiqueta: 'Sede', tipo: 'select', opciones: SEDES.map((s) => ({ valor: s, texto: s })) },
  ];
  if (conEstado) campos.push({ nombre: 'estado', etiqueta: 'Estado', tipo: 'select', opciones: ESTADOS.map((e) => ({ valor: e, texto: capitalizar(e) })) });
  return campos;
}

// Convierte lo escrito en el formulario al formato del contrato de ms-citas
function construirCita(datos) {
  const paciente = pacientes.find((p) => p.id === Number(datos.paciente_id));
  const medico = medicos.find((m) => m.id === Number(datos.medico_id));
  return {
    paciente_id: Number(datos.paciente_id),
    medico_id: Number(datos.medico_id),
    fecha_hora: datos.fecha_hora.slice(0, 16),           // AAAA-MM-DDTHH:MM
    sede: datos.sede,
    estado: datos.estado || 'programada',
    // Objetos compuestos, como los devuelve ms-citas
    paciente: paciente ? { id: paciente.id, nombre: paciente.nombre } : null,
    medico: medico ? { id: medico.id, nombre: medico.nombre, especialidad: medico.especialidad } : null,
  };
}

// Las mismas reglas de negocio de ms-citas (el microservicio las vuelve a validar)
async function validarReglas(cita, idActual = null) {
  if (new Date(cita.fecha_hora) <= new Date()) {
    throw new ErrorApi(400, 'Datos inválidos', ['la fecha y hora de la cita debe ser futura']);
  }
  if (cita.estado !== 'cancelada') {
    const choque = (await api.listar('citas', { medico_id: cita.medico_id, fecha_hora: cita.fecha_hora }))
      .find((c) => c.id !== idActual && c.estado !== 'cancelada');
    if (choque) {
      const f = formatearFecha(cita.fecha_hora);
      throw new ErrorApi(409, `${cita.medico?.nombre || 'El médico'} ya tiene una cita el ${f.dia} a las ${f.hora}`);
    }
  }
}

async function crearCita() {
  const datos = await pedirDatos('Nueva cita', camposCita(false), {}, 'Agendar cita');
  if (!datos) return;
  try {
    const cita = construirCita(datos);
    await validarReglas(cita);
    const nueva = await api.crear('citas', cita);
    const f = formatearFecha(nueva.fecha_hora);
    mostrarMensaje(`Cita agendada para ${nueva.paciente?.nombre || 'el paciente'} el ${f.dia} a las ${f.hora}`);
    listar();
  } catch (error) {
    mostrarError(error);
  }
}

async function editarCita(id) {
  try {
    const actual = await api.obtener('citas', id);
    const datos = await pedirDatos('Editar cita', camposCita(true), actual, 'Guardar cambios');
    if (!datos) return;
    const cita = construirCita(datos);
    await validarReglas(cita, id);
    await api.actualizar('citas', id, cita);
    mostrarMensaje('Cita actualizada');
    listar();
  } catch (error) {
    mostrarError(error);
  }
}

async function eliminarCita(id) {
  try {
    const cita = await api.obtener('citas', id);
    const f = formatearFecha(cita.fecha_hora);
    if (!(await confirmar(`¿Eliminar la cita de ${cita.paciente?.nombre || `el paciente #${cita.paciente_id}`} del ${f.dia} a las ${f.hora}?`, 'Eliminar'))) return;
    await api.eliminar('citas', id);
    mostrarMensaje('Cita eliminada');
    listar();
  } catch (error) {
    mostrarError(error);
  }
}

// ---------- Utilidades de formato ----------
// "2026-12-01T09:00" → { dia: 'lun, 1 dic 2026', hora: '09:00' }
function formatearFecha(fechaHora) {
  const [fecha, hora] = fechaHora.split('T');
  const dia = new Date(`${fecha}T00:00`).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return { dia, hora };
}

function capitalizar(t) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function iniciales(nombre) {
  return esc(nombre.split(' ').map((p) => p[0]).slice(0, 2).join(''));
}

function normalizar(t) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
