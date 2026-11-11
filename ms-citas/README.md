# ms-citas · Contrato de la API

Microservicio de **citas médicas** de MediRed IPS. Responsable: Alejandro González (auchija). Puerto: **3004**.

Gestiona las citas entre un paciente y un médico en una de las sedes de la clínica. Guarda solo los ids del paciente y del médico; sus datos viven en ms-pacientes y ms-medicos.

## Cómo ejecutarlo

Requisitos: Node.js 22.9 o superior y MySQL 8.

1. Crear la base de datos y su usuario (como root, en MySQL Workbench o en la consola):

```sql
CREATE DATABASE citas_db;
CREATE USER 'citas_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
GRANT ALL PRIVILEGES ON citas_db.* TO 'citas_user'@'localhost';
```

2. Crear la tabla y las citas iniciales: en la consola `mysql -u citas_user -p citas_db` y luego `SOURCE db/schema.sql;`. En Workbench: abrir `db/schema.sql`, seleccionar `citas_db` (doble clic en el panel *Schemas*) y ejecutarlo.
3. `npm install`
4. Copiar `.env.example` como `.env`: poner la contraseña de `citas_user` en `DB_PASSWORD` y la clave del grupo en `JWT_SECRET` (se comparte por el chat privado del grupo, nunca en el repositorio).
5. `npm run dev`

Para que funcionen la seguridad y las relaciones deben estar corriendo también, cada uno en su terminal: **ms-usuarios** (3001, para obtener el token), **ms-pacientes** (3002) y **ms-medicos** (3003).

Prueben en el navegador: http://localhost:3004/health (pública). Las rutas `/citas` exigen token: se prueban con Postman.

### Variables del .env

| Variable | Valor | Para qué |
|---|---|---|
| PORT | 3004 | Puerto del microservicio |
| HOST | 127.0.0.1 | Solo acepta conexiones del mismo equipo (el gateway) |
| DB_HOST / DB_PORT | localhost / 3306 | Servidor MySQL (en el Taller 3: servidor1) |
| DB_NAME | citas_db | Base de datos propia del microservicio |
| DB_USER / DB_PASSWORD | citas_user / ... | Usuario con permisos solo sobre citas_db |
| PACIENTES_URL | http://127.0.0.1:3002 | Dirección de ms-pacientes (relación) |
| MEDICOS_URL | http://127.0.0.1:3003 | Dirección de ms-medicos (relación) |
| JWT_SECRET | la clave del grupo | Verifica la firma de los tokens; la misma en todos los microservicios |

## Representación

Así responde `GET /citas/1` (con los objetos relacionados, pedidos a ms-pacientes y ms-medicos):

```json
{ "id": 1, "paciente_id": 1, "medico_id": 3, "fecha_hora": "2026-12-01T11:00", "sede": "Bogotá", "estado": "programada",
  "paciente": { "id": 1, "nombre": "Lucía Gómez" },
  "medico": { "id": 3, "nombre": "Andrés Mendoza", "especialidad": "Cardiología" } }
```

## Atributos

| Atributo | Tipo | ¿Obligatorio al crear? | Reglas |
|---|---|---|---|
| id | entero | No: lo asigna el servicio | Positivo y único |
| paciente_id | entero | Sí | Entero positivo; referencia a ms-pacientes |
| medico_id | entero | Sí | Entero positivo; referencia a ms-medicos |
| fecha_hora | texto | Sí | Formato `AAAA-MM-DDTHH:MM`; debe ser **futura** (400) |
| sede | texto | Sí | `Bogotá`, `Cali` o `Medellín` |
| estado | texto | No (por defecto `programada`) | `programada`, `atendida` o `cancelada` |

**Reglas de negocio** (en la capa de servicio, al crear y al actualizar):

- **409 · Choque de horario:** un médico no puede tener dos citas activas (no canceladas) a la misma `fecha_hora`. Al actualizar, la cita no choca consigo misma.
- **400 · Fecha futura:** no se agendan citas en el pasado.

## Endpoints

| Operación | Método | URI | Quién | Cuerpo | Respuesta exitosa | Errores |
|---|---|---|---|---|---|---|
| Salud | GET | /health | Público | — | 200 | — |
| Listar | GET | /citas | Cualquier rol autenticado | — | 200 arreglo (compuesto) | 401 |
| Filtrar | GET | /citas?estado=programada · ?medico_id=1 · ?paciente_id=2 | Cualquier rol autenticado | — | 200 arreglo filtrado | 400 filtro inválido · 401 |
| Obtener | GET | /citas/:id | Cualquier rol autenticado | — | 200 objeto (compuesto) | 400 id inválido · 401 · 404 |
| Crear | POST | /citas | administrador, admisiones | JSON sin id | 201 objeto + cabecera Location | 400 · 401 · 403 · 409 · 503 |
| Actualizar | PUT | /citas/:id | administrador, admisiones | JSON completo sin id | 200 objeto actualizado | 400 · 401 · 403 · 404 · 409 · 503 |
| Eliminar | DELETE | /citas/:id | administrador, admisiones | — | 204 sin cuerpo | 400 · 401 · 403 · 404 |

No ofrece consulta por lotes (`?ids=`) porque ningún otro microservicio consulta citas.

Ejemplo para crear (`POST /citas`):

```json
{ "paciente_id": 2, "medico_id": 3, "fecha_hora": "2026-12-05T08:00", "sede": "Cali" }
```

Respuesta `201 Created` (cabecera `Location: /citas/4`):

```json
{ "id": 4, "paciente_id": 2, "medico_id": 3, "fecha_hora": "2026-12-05T08:00", "sede": "Cali", "estado": "programada",
  "paciente": { "id": 2, "nombre": "Mateo Rodríguez" },
  "medico": { "id": 3, "nombre": "Andrés Mendoza", "especialidad": "Cardiología" } }
```

Ejemplo de listado con ms-medicos caído (degradación controlada, `GET /citas?estado=programada`):

```json
[
  { "id": 1, "paciente_id": 1, "medico_id": 3, "fecha_hora": "2026-12-01T11:00", "sede": "Bogotá", "estado": "programada",
    "paciente": { "id": 1, "nombre": "Lucía Gómez" }, "medico": null, "aviso": "ms-medicos no disponible" }
]
```

Errores: `{ "error": "mensaje", "detalles": ["..."] }` (detalles solo en errores de validación). Ejemplos:

```json
{ "error": "Datos inválidos", "detalles": ["paciente_id es obligatorio y debe ser un entero positivo"] }
{ "error": "El médico 1 ya tiene una cita el 2026-12-01T09:00 (cita 1)" }
{ "error": "No existe el paciente con id 999" }
{ "error": "ms-medicos no está disponible" }
{ "error": "Falta el token de acceso (cabecera Authorization: Bearer <token>)" }
{ "error": "El rol medico no tiene permiso para esta operación" }
```

## Seguridad

Todas las rutas de `/citas` exigen un token JWT en la cabecera `Authorization: Bearer <token>`, obtenido con `POST /usuarios/login` en ms-usuarios. El token se verifica con `JWT_SECRET`, sin consultar a ms-usuarios (middleware `src/middlewares/auth.js`, copiado sin cambios de ms-usuarios).

- **401:** falta el token, es inválido (firma alterada) o venció.
- **403:** el rol del token no tiene permiso. Consultan todos los roles autenticados; crean, modifican y eliminan solo **administrador** y **admisiones** (tabla de permisos del Taller 1).

## Relaciones

**Consulto a** (ms-citas guarda las referencias):

| Atributo | Microservicio consultado | Para validar (al crear y actualizar) | Para componer (al consultar) | Datos que usa |
|---|---|---|---|---|
| paciente_id | ms-pacientes | GET /pacientes/:id | GET /pacientes?ids=… | id, nombre |
| medico_id | ms-medicos | GET /medicos/:id | GET /medicos?ids=… | id, nombre, especialidad |

Al escribir: si el paciente o el médico no existe → 400; si el otro microservicio no responde → 503. Al leer: la respuesta incluye `paciente: {id, nombre}` y `medico: {id, nombre, especialidad}`; si el otro servicio no responde, el objeto sale en `null` con un `aviso`. Se hace **una sola** petición `?ids=` a cada servicio por listado, con un tiempo máximo de espera de 3 segundos, y se **reenvía el token** del usuario.

El código de la relación está en `src/clients/pacientes.client.js` y `src/clients/medicos.client.js` (las peticiones a los otros microservicios) y en `src/services/citas.service.js` (`validarReferencias` y `componer`).

**Me consultan:** ninguno.

Las columnas `paciente_id` y `medico_id` de la tabla `citas` son enteros **sin FOREIGN KEY**: las tablas relacionadas viven en otras bases de datos, de otros microservicios.

## Pruebas

Colección de Postman en `docs/ms-citas.postman_collection.json`: casos 1 a 24 del taller (el 3 no aplica) más la regla de fecha futura.

- Primero se ejecutan los `00`: login del administrador, creación de los usuarios de prueba (medico y admisiones) y sus logins. Los tokens quedan guardados solos en las variables de la colección.
- Variables: `{{base}}` (ms-citas) y `{{usuarios}}` (ms-usuarios), en la pestaña *Variables* de la colección.
- Los casos 23 y 24 se ejecutan con **ms-medicos detenido**.

Usuarios de prueba (ficticios): `medico@medired.com` / `Medico2026*` y `admisiones@medired.com` / `Admisiones2026*`.
