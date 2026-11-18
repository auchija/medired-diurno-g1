// =====================================================================
// CONFIGURACIÓN DEL FRONTEND (común a todas las pantallas)
// Roles, permisos, módulos del menú y dirección de la API.
// La mantiene el integrador: si cambia un permiso, se cambia solo aquí.
// =====================================================================

// Dirección de la API: el gateway Apache publica el frontend y la API en el mismo nombre
// (http://app.medired.com.co), por eso basta una ruta relativa, sin servidor ni puerto.
const API = '/api';

// Filtros que cada microservicio acepta en la URL (GET /recurso?atributo=valor).
// Los demás filtros de las pantallas se aplican en el navegador sobre la misma respuesta.
const FILTROS_API = {
  citas: ['estado', 'medico_id', 'paciente_id'],
  historias: ['paciente_id', 'medico_id'],
  pacientes: [],
  medicos: [],
};

// Módulos del sistema: un módulo por microservicio (y su responsable)
// (responsable: quién del grupo hace las pantallas; no se muestra en la interfaz)
const MODULOS = [
  { recurso: 'citas',     titulo: 'Agenda de citas',    pagina: 'citas.html',     icono: 'calendario', descripcion: 'Programación de citas en las tres sedes', responsable: 'Alejandro González' },
  { recurso: 'pacientes', titulo: 'Pacientes',          pagina: 'pacientes.html', icono: 'pacientes',  descripcion: 'Registro y datos de contacto',            responsable: 'Sebastián Montaño' },
  { recurso: 'medicos',   titulo: 'Médicos',            pagina: 'medicos.html',   icono: 'medicos',    descripcion: 'Cuerpo médico, especialidades y sedes',   responsable: 'Sebastián Montaño' },
  { recurso: 'historias', titulo: 'Historias clínicas', pagina: 'historias.html', icono: 'historias',  descripcion: 'Registros de atención por paciente',      responsable: 'Miguel Ángel Jiménez' },
];

// Permisos (tabla del Taller 1): todos los roles consultan;
// crear, modificar y eliminar solo los roles de esta lista.
const PERMISOS_ESCRITURA = {
  citas:     ['administrador', 'admisiones'],
  pacientes: ['administrador', 'admisiones'],
  medicos:   ['administrador'],
  historias: ['administrador', 'medico'],
};

// Página a la que llega cada rol al iniciar sesión (el panel muestra los accesos de ese rol)
const PAGINA_POR_ROL = { administrador: 'inicio.html', admisiones: 'inicio.html', medico: 'inicio.html' };

// Nombre visible de cada rol
const NOMBRE_ROL = { administrador: 'Administrador', admisiones: 'Admisiones', medico: 'Médico' };

// Datos fijos acordados por el grupo
const SEDES = ['Bogotá', 'Cali', 'Medellín'];

// Acciones destacadas de la portada de inicio, según el rol
// Accesos rápidos del panel, según el rol
const ACCIONES_POR_ROL = {
  administrador: [
    { texto: 'Agendar una cita', detalle: 'Nueva cita en cualquier sede', pagina: 'citas.html?nueva=1', icono: 'calendario' },
    { texto: 'Gestionar médicos', detalle: 'Altas, especialidades y sedes', pagina: 'medicos.html', icono: 'medicos' },
    { texto: 'Registrar paciente', detalle: 'Datos personales y EPS', pagina: 'pacientes.html', icono: 'pacientes' },
  ],
  admisiones: [
    { texto: 'Agendar una cita', detalle: 'Nueva cita en cualquier sede', pagina: 'citas.html?nueva=1', icono: 'calendario' },
    { texto: 'Registrar paciente', detalle: 'Datos personales y EPS', pagina: 'pacientes.html', icono: 'pacientes' },
    { texto: 'Consultar médicos', detalle: 'Especialidades disponibles', pagina: 'medicos.html', icono: 'medicos' },
  ],
  medico: [
    { texto: 'Ver la agenda', detalle: 'Citas programadas', pagina: 'citas.html?estado=programada', icono: 'calendario' },
    { texto: 'Historias clínicas', detalle: 'Registrar una atención', pagina: 'historias.html', icono: 'historias' },
    { texto: 'Consultar pacientes', detalle: 'Datos de contacto y EPS', pagina: 'pacientes.html', icono: 'pacientes' },
  ],
};
