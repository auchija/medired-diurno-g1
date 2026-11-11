// =====================================================================
// CONFIGURACIÓN DEL FRONTEND (común a todas las pantallas)
// Roles, permisos, módulos del menú y usuarios del inicio de sesión simulado.
// La mantiene el integrador: si cambia un permiso, se cambia solo aquí.
// =====================================================================

// De dónde salen los datos. Taller 2: archivos de ejemplo en data/.
// Taller 3: '/api' (el gateway Apache), y api.js hará peticiones reales.
const FUENTE_DATOS = 'data';

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

// Usuarios del inicio de sesión simulado: los mismos usuarios de prueba (ficticios) de ms-usuarios.
// En el Taller 3 el inicio de sesión lo valida ms-usuarios (POST /usuarios/login) y esta lista desaparece.
const USUARIOS_DE_PRUEBA = [
  { id: 1, nombre: 'Administrador General', email: 'admin@empresa.com',      password: 'Admin2026*',      rol: 'administrador', cargo: 'Administración del sistema' },
  { id: 3, nombre: 'Usuario Admisiones',    email: 'admisiones@medired.com', password: 'Admisiones2026*', rol: 'admisiones',    cargo: 'Admisiones y citas' },
  { id: 2, nombre: 'Usuario Médico',        email: 'medico@medired.com',     password: 'Medico2026*',     rol: 'medico',        cargo: 'Cuerpo médico' },
];

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
