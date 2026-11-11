// =====================================================================
// INTERFAZ COMÚN: estructura (barra lateral y superior), mensajes y formularios en diálogo.
// Cada página interna tiene <aside id="lateral">, <header id="superior">, <div id="mensajes"> y <dialog id="dialogo">.
// =====================================================================

// Escapa texto antes de ponerlo en el HTML (evita inyectar etiquetas)
function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Estructura común de las pantallas internas: barra lateral (módulos) y barra superior
// (título, migas, búsqueda, fecha y usuario). Cada página tiene:
//   <aside id="lateral"></aside>  y  <header id="superior"></header>
function pintarEstructura(paginaActiva, titulo, migas = []) {
  const usuario = usuarioActual();
  const enlaces = [{ pagina: 'inicio.html', titulo: 'Panel', icono: 'panel' }, ...MODULOS]
    .map((m) => `<a href="${m.pagina}" class="${m.pagina === paginaActiva ? 'activo' : ''}">${icono(m.icono)}<span>${esc(m.titulo)}</span></a>`)
    .join('');
  const iniciales = usuario.nombre.split(' ').map((p) => p[0]).slice(0, 2).join('');

  document.getElementById('lateral').innerHTML = `
    <a class="logo" href="inicio.html"><span class="logo-icono">+</span><span><span class="logo-medi">Medi</span><span class="logo-red">Red</span></span></a>
    <nav class="navegacion">${enlaces}</nav>
    <div class="lateral-pie">
      <div class="avatar">${esc(iniciales)}</div>
      <div><b>${esc(usuario.nombre)}</b><small>${esc(usuario.cargo || NOMBRE_ROL[usuario.rol])}</small></div>
      <button class="boton-icono" id="cerrar-sesion" title="Cerrar sesión" aria-label="Cerrar sesión">${icono('salir')}</button>
    </div>`;

  const hoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('superior').innerHTML = `
    <div>
      <div class="migas">${['MediRed', ...migas].map(esc).join(' <span>/</span> ')}</div>
      <h1>${esc(titulo)}</h1>
    </div>
    <form class="busqueda" id="busqueda" role="search">
      ${icono('buscar', 18)}<input name="q" placeholder="Buscar paciente o médico en la agenda" aria-label="Buscar en la agenda">
    </form>
    <div class="superior-derecha">
      <span class="fecha">${icono('calendario', 16)} ${esc(hoy.charAt(0).toUpperCase() + hoy.slice(1))}</span>
      <span class="chip-rol">${icono('escudo', 14)} ${esc(NOMBRE_ROL[usuario.rol])}</span>
    </div>`;

  document.getElementById('cerrar-sesion').onclick = cerrarSesion;
  // La búsqueda lleva a la agenda filtrada por nombre de paciente o médico
  document.getElementById('busqueda').onsubmit = (evento) => {
    evento.preventDefault();
    const texto = evento.target.elements.q.value.trim();
    location.href = `citas.html${texto ? `?q=${encodeURIComponent(texto)}` : ''}`;
  };
}

function mostrarMensaje(texto, tipo = 'ok') {
  const aviso = document.createElement('div');
  aviso.className = `mensaje mensaje-${tipo}`;
  aviso.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  aviso.textContent = texto;
  document.getElementById('mensajes').appendChild(aviso);
  setTimeout(() => aviso.remove(), tipo === 'error' ? 6000 : 3000);
}

// Muestra un error con el formato de los microservicios ({ error, detalles })
function mostrarError(error) {
  const detalles = error.detalles && error.detalles.length ? `: ${error.detalles.join('; ')}` : '';
  mostrarMensaje(`${error.message}${detalles}`, 'error');
}

// Formulario en un cuadro de diálogo.
// campos: [{ nombre, etiqueta, tipo: 'text'|'number'|'date'|'datetime-local'|'select', opciones: [{valor, texto}], opcional }]
// Devuelve una promesa con los datos escritos, o null si se cancela.
function pedirDatos(titulo, campos, valores = {}, textoBoton = 'Guardar') {
  const dialogo = document.getElementById('dialogo');
  const filas = campos.map((c) => {
    const valor = valores[c.nombre] ?? '';
    const control = c.tipo === 'select'
      ? `<select name="${c.nombre}" ${c.opcional ? '' : 'required'}>
           <option value="">Seleccione…</option>
           ${c.opciones.map((o) => `<option value="${esc(o.valor)}" ${String(o.valor) === String(valor) ? 'selected' : ''}>${esc(o.texto)}</option>`).join('')}
         </select>`
      : `<input name="${c.nombre}" type="${c.tipo || 'text'}" value="${esc(valor)}" ${c.opcional ? '' : 'required'}>`;
    return `<label class="campo"><span>${esc(c.etiqueta)}</span>${control}</label>`;
  }).join('');

  dialogo.innerHTML = `
    <form method="dialog" class="formulario">
      <h2>${esc(titulo)}</h2>
      ${filas}
      <div class="acciones-form">
        <button type="button" class="boton boton-secundario" value="cancelar">Cancelar</button>
        <button type="submit" class="boton">${esc(textoBoton)}</button>
      </div>
    </form>`;

  return new Promise((resolver) => {
    const form = dialogo.querySelector('form');
    form.querySelector('[value="cancelar"]').onclick = () => { dialogo.close(); resolver(null); };
    form.onsubmit = (evento) => {
      evento.preventDefault();
      const datos = {};
      for (const c of campos) {
        const texto = form.elements[c.nombre].value.trim();
        if (c.opcional && texto === '') continue;
        datos[c.nombre] = texto;
      }
      dialogo.close();
      resolver(datos);
    };
    dialogo.oncancel = () => resolver(null);
    dialogo.showModal();
    (form.querySelector('input, select') || form.querySelector('[type=submit]')).focus();
  });
}

// Pregunta de confirmación (por ejemplo, antes de eliminar)
async function confirmar(texto, textoBoton = 'Sí, continuar') {
  return (await pedirDatos(texto, [], {}, textoBoton)) !== null;
}
