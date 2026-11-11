// =====================================================================
// PANEL PRINCIPAL (común): resumen del día para el personal según su rol.
// Usa los datos a través de api, igual que las demás pantallas.
// =====================================================================

const usuario = exigirSesion();
if (usuario) iniciarPanel();

async function iniciarPanel() {
  pintarEstructura('inicio.html', 'Panel principal', ['Panel']);

  // Saludo según la hora
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  document.getElementById('saludo').textContent = `${saludo}, ${usuario.nombre}`;

  // Acción principal y accesos rápidos según el rol
  const acciones = ACCIONES_POR_ROL[usuario.rol] || [];
  if (acciones[0]) {
    document.getElementById('accion-principal').innerHTML =
      `<a class="boton" href="${acciones[0].pagina}">${icono(acciones[0].icono, 18)} ${esc(acciones[0].texto)}</a>`;
  }
  document.getElementById('accesos-rol').textContent = `Perfil ${NOMBRE_ROL[usuario.rol]}`;
  document.getElementById('accesos').innerHTML = acciones.map((a) => `
    <a class="acceso" href="${a.pagina}">
      <span class="indicador-icono">${icono(a.icono)}</span>
      <span><b>${esc(a.texto)}</b><small>${esc(a.detalle)}</small></span>
      <span class="flecha">${icono('flecha', 16)}</span>
    </a>`).join('');

  try {
    const [citas, pacientes] = await Promise.all([api.listar('citas'), api.listar('pacientes')]);
    const ahora = new Date();
    const programadas = citas.filter((c) => c.estado === 'programada');
    const proximas = programadas
      .filter((c) => new Date(c.fecha_hora) >= ahora)
      .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));

    document.getElementById('resumen').textContent = proximas.length
      ? `Hay ${proximas.length} citas programadas próximamente en la red. La siguiente es el ${formatearFecha(proximas[0].fecha_hora).dia} a las ${formatearFecha(proximas[0].fecha_hora).hora}.`
      : 'No hay citas programadas próximamente.';

    // Indicadores
    const indicadores = [
      [programadas.length, 'Citas programadas', 'calendario', 'azul'],
      [citas.filter((c) => c.estado === 'atendida').length, 'Citas atendidas', 'check', 'turquesa'],
      [citas.filter((c) => c.estado === 'cancelada').length, 'Citas canceladas', 'cancelar', 'rojo'],
      [pacientes.length, 'Pacientes registrados', 'pacientes', ''],
    ];
    document.getElementById('indicadores').innerHTML = indicadores.map(([n, texto, ico, color]) => `
      <div class="panel indicador">
        <span class="indicador-icono ${color}">${icono(ico, 22)}</span>
        <div><div class="numero">${n}</div><div class="texto">${texto}</div></div>
      </div>`).join('');

    // Próximas citas (máximo 5)
    document.getElementById('proximas').innerHTML = proximas.length
      ? proximas.slice(0, 5).map((c) => {
          const f = formatearFecha(c.fecha_hora);
          return `<tr>
            <td class="fecha-celda"><b>${f.dia}</b><small>${f.hora}</small></td>
            <td>${c.paciente ? esc(c.paciente.nombre) : `<span class="sin-dato">Paciente ${c.paciente_id}</span>`}</td>
            <td>${c.medico ? `${esc(c.medico.nombre)}<small>${esc(c.medico.especialidad)}</small>` : `<span class="sin-dato">Médico ${c.medico_id}</span>`}</td>
            <td>${esc(c.sede)}</td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="4" class="vacia">No hay citas próximas</td></tr>';

    // Citas programadas por sede
    const maximo = Math.max(1, ...SEDES.map((s) => programadas.filter((c) => c.sede === s).length));
    document.getElementById('sedes').innerHTML = SEDES.map((sede) => {
      const n = programadas.filter((c) => c.sede === sede).length;
      return `<div class="sede-fila">
        <div class="datos"><b>${esc(sede)}</b><span>${n} ${n === 1 ? 'cita' : 'citas'}</span></div>
        <div class="barra-progreso"><span style="width:${(n / maximo) * 100}%"></span></div>
      </div>`;
    }).join('');
  } catch (error) {
    mostrarError(error);
  }
}

// "2026-12-01T09:00" → { dia: '1 dic 2026', hora: '09:00' }
function formatearFecha(fechaHora) {
  const [fecha, hora] = fechaHora.split('T');
  const dia = new Date(`${fecha}T00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  return { dia, hora };
}
