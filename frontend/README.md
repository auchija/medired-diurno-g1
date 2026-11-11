# frontend · MediRed IPS

Interfaz web de MediRed: una aplicación **multipágina en HTML, CSS y JavaScript** (sin framework), organizada en capas. En el Taller 2 usa **datos de ejemplo en archivos JSON** con la misma forma que los contratos; en el Taller 3, detrás del gateway Apache, esos datos se cambian por peticiones reales a los microservicios.

## Cómo abrirlo

Los archivos JSON se leen con `fetch`, y el navegador no lo permite abriendo el HTML con doble clic. Hay que servir la carpeta:

- **VS Code:** instalar la extensión **Live Server** → clic derecho sobre `frontend/index.html` → **Open with Live Server**.
- **O con Python:** dentro de `frontend/`, `python -m http.server 5500` y abrir http://localhost:5500

Se entra por `index.html`. El inicio de sesión es **simulado**: valida contra los usuarios de prueba de `config.js` (los mismos de ms-usuarios). Los botones de *Acceso de demostración* llenan el correo y la contraseña.

## Estructura y capas

```
frontend/
├── index.html            inicio de sesión (común)
├── inicio.html + js/inicio.js   panel principal según el rol (común)
├── css/medired.css       estilos comunes (común)
├── js/config.js          módulos, permisos por rol, usuarios de prueba, sedes (común)
├── js/sesion.js          usuario actual, cerrar sesión, puedeEscribir(recurso) (común)
├── js/api.js             ÚNICO acceso a datos: listar, obtener, crear, actualizar, eliminar (común)
├── js/ui.js              estructura (barra lateral y superior), mensajes, formularios, confirmar (común)
├── js/iconos.js          íconos SVG: icono('calendario') (común)
├── data/                 datos de ejemplo de cada entidad
├── img/hospital.jpg      foto de la portada (Unsplash, licencia libre)
├── citas.html + js/citas.js + data/citas.json              Alejandro
├── pacientes.html, medicos.html + js + data                Sebastián
└── historias.html + js/historias.js + data/historias.json  Miguel
```

| Capa | Archivos | Equivale en el backend a |
|---|---|---|
| Presentación | `*.html` + `css/medired.css` | las rutas |
| Lógica de cada pantalla | `js/<recurso>.js` | el controlador |
| Comunes | `config.js`, `sesion.js`, `ui.js` | utils y middlewares |
| Acceso a datos | `js/api.js` + `data/*.json` | el repositorio |

**Reglas del grupo:**
1. Los archivos **comunes** (marcados arriba) los mantiene el integrador. Si necesitan un cambio, se pide en el grupo.
2. Cada integrante crea **solo** los archivos de su entidad. Las páginas `pacientes.html`, `medicos.html` e `historias.html` son provisionales: su responsable las reemplaza.
3. **No se crean estilos propios:** se usan las clases de `medired.css`.
4. Las pantallas **nunca** leen `data/` directamente: siempre llaman a `api`.

## Guía para hacer las pantallas de una entidad

Tomen como ejemplo `citas.html` y `js/citas.js`.

**1. La página** (`<recurso>.html`): partir de la página provisional que ya existe (o de `citas.html`) y conservar su estructura:
```html
<div class="aplicacion">
  <aside class="lateral" id="lateral"></aside>
  <div class="principal">
    <header class="superior" id="superior"></header>
    <main class="contenido"> … su pantalla … </main>
    <footer class="pie-app">© 2026 MediRed IPS · Sistema de gestión clínica</footer>
  </div>
</div>
<div id="mensajes"></div>
<dialog id="dialogo"></dialog>
```
y cargar, en este orden: `config.js`, `iconos.js`, `api.js`, `sesion.js`, `ui.js` y su propio `js/<recurso>.js`.

**2. Al cargar** (`js/<recurso>.js`):
```js
const usuario = exigirSesion();                                  // sin sesión → inicio de sesión
pintarEstructura('pacientes.html', 'Pacientes', ['Pacientes']);  // barra lateral, título y migas
const escribe = puedeEscribir('pacientes');                      // ¿mostrar Nuevo / Editar / Eliminar?
```
Dentro de `main`, la pantalla va en un `section.panel` con una barra `div.herramientas` (filtros y botón *Nuevo*) y la tabla (ver `citas.html`).

**3. Datos** (siempre con `api`, el primer parámetro es el recurso):
```js
await api.listar('pacientes', { eps: 'Salud Ejemplo' });   // GET /pacientes?eps=…
await api.obtener('pacientes', 1);                          // GET /pacientes/1
await api.crear('pacientes', datos);                        // POST
await api.actualizar('pacientes', 1, datos);                // PUT
await api.eliminar('pacientes', 1);                         // DELETE
```
Los cambios se guardan en la sesión del navegador; `api.reiniciar('pacientes')` vuelve a los datos del archivo.

**4. Formularios y mensajes** (`ui.js`):
```js
const datos = await pedirDatos('Nuevo paciente', [
  { nombre: 'nombre', etiqueta: 'Nombre' },
  { nombre: 'fecha_nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date' },
  { nombre: 'eps', etiqueta: 'EPS', tipo: 'select', opciones: [{ valor: 'Salud Ejemplo', texto: 'Salud Ejemplo' }] },
]);                                        // null si cancela
if (await confirmar('¿Eliminar el paciente 3?', 'Sí, eliminar')) { … }
mostrarMensaje('Paciente creado');         // verde
mostrarError(error);                       // rojo, con los detalles
```
Al pintar datos en el HTML, siempre pasarlos por `esc(...)`.

**5. Datos de ejemplo** (`data/<recurso>.json`): un arreglo con la forma exacta del contrato, **incluidos los objetos relacionados** (por ejemplo `paciente: { id, nombre }`). Pacientes y médicos usan los ids 1, 2 y 3 acordados.

## Clases de medired.css

| Para | Clase |
|---|---|
| Contenedor blanco | `panel` (con `panel-cabecera` y `panel-cuerpo`) |
| Barra de filtros y botones | `herramientas` (y `empuje` para mandar lo siguiente a la derecha) |
| Filtros | `campo-busqueda`, `selector`, `segmentado` (botones; el elegido con `activo`) |
| Botones | `boton` (acción), `boton boton-secundario`, `boton boton-peligro`, `boton-enlace` |
| Acciones de una fila | `acciones-fila` > `accion-icono` (y `accion-icono peligro`) con `icono('editar')` / `icono('eliminar')` |
| Tabla | `tabla-contenedor` > `tabla`; `vacia` para "no hay datos"; `<small>` para un dato secundario; `pie-tabla` debajo |
| Persona con iniciales | `persona` > `avatar suave` |
| Estados | `estado estado-programada`, `estado-atendida`, `estado-cancelada` |
| Dato faltante (servicio caído) | `sin-dato` y `alerta-dato` |
| Indicadores | `indicadores` > `panel indicador` (`indicador-icono`, `numero`, `texto`) |
| Aviso informativo | `aviso` |

Íconos disponibles en `iconos.js`: panel, calendario, pacientes, medicos, historias, buscar, mas, editar, eliminar, sede, reloj, check, cancelar, flecha, escudo, alerta, salir.

**Paleta:** lila `#6D63C7` + verde turquesa `#1E7A76` (marca), índigo oscuro `#4B4396` (títulos), lavanda suave `#EDE9FB`, celeste `#C3E7F1`, fondo `#F4F9F9`. Fuentes: **Montserrat** (títulos) y **Poppins** (textos).

## Permisos (tabla del Taller 1)

Todos los roles consultan. Crean, modifican y eliminan: **citas** y **pacientes** → administrador y admisiones; **médicos** → administrador; **historias** → administrador y médico. Están en `PERMISOS_ESCRITURA` de `config.js`. El frontend solo oculta botones: el microservicio igual responde 403.
