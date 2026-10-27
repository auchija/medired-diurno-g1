# ms-usuarios · Plantilla del Taller 1 (Módulo 3)

Redes y Servicios Multimedia · UAO · Microservicio de **usuarios** de la aplicación,
con **Node.js + Express** organizado en capas. Es el microservicio común de todos los grupos
y, en esta versión, la plantilla para construir el suyo: cópienla y adapten **todas** las capas
a su propia entidad.

Esta es la versión del Taller 1: datos en memoria y tres operaciones. La versión completa
(MySQL, contraseña cifrada, inicio de sesión y tokens JWT) se entrega en el Taller 3.

## Cómo ejecutarlo

Requisitos: Node.js LTS 22 o superior (`node -v`).

```
npm install                 # descarga Express en node_modules
copy .env.example .env      # en Windows (en Linux/Mac: cp .env.example .env)
npm run dev                 # inicia y se reinicia solo al guardar cambios
```

Prueben en el navegador: http://localhost:3001/health y http://localhost:3001/usuarios

## Capas

| Archivo | Capa | Responsabilidad |
|---|---|---|
| src/index.js | Arranque | Lee PORT y HOST y pone el servidor a escuchar |
| src/app.js | Configuración | Middlewares, /health, montaje de rutas, manejo de errores |
| src/routes/usuarios.routes.js | Presentación | Método HTTP + URI → función del controlador |
| src/controllers/usuarios.controller.js | Presentación | Lee la petición, llama al servicio, arma la respuesta |
| src/services/usuarios.service.js | Lógica de negocio | Validaciones y reglas (email único); no conoce HTTP ni la base de datos |
| src/repositories/usuarios.repository.js | Acceso a datos | Guarda y consulta (en memoria en el Taller 1) |
| src/models/usuario.js | Modelo | Atributos de la entidad y su validación |
| src/utils/http-error.js | Utilidad | Error con código de estado HTTP |

## Endpoints (Taller 1)

| Método | URI | Respuesta |
|---|---|---|
| GET | /health | 200 `{"servicio":"ms-usuarios","estado":"ok"}` |
| GET | /usuarios | 200 arreglo de usuarios |
| GET | /usuarios/:id | 200 usuario · 400 id inválido · 404 no existe |
| POST | /usuarios | 201 usuario creado · 400 datos inválidos · 409 email repetido |

Ejemplo de cuerpo para POST:
`{"nombre": "Marta Ríos", "email": "marta.rios@empresa.com", "rol": "despacho"}`

Los roles válidos se configuran en el archivo .env (`ROLES=administrador,despacho,flota`).
