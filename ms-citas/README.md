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
4. Copiar `.env.example` como `.env` y poner la contraseña de `citas_user` en `DB_PASSWORD`.
5. `npm run dev`

Prueben en el navegador: http://localhost:3004/health y http://localhost:3004/citas

### Variables del .env

| Variable | Valor | Para qué |
|---|---|---|
| PORT | 3004 | Puerto del microservicio |
| HOST | 127.0.0.1 | Solo acepta conexiones del mismo equipo (el gateway) |
| DB_HOST / DB_PORT | localhost / 3306 | Servidor MySQL (en el Taller 3: servidor1) |
| DB_NAME | citas_db | Base de datos propia del microservicio |
| DB_USER / DB_PASSWORD | citas_user / ... | Usuario con permisos solo sobre citas_db |

## Representación

Así responde `GET /citas/1`:

```json
{ "id": 1, "paciente_id": 1, "medico_id": 1, "fecha_hora": "2026-12-01T09:00", "sede": "Bogotá", "estado": "programada" }
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

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores |
|---|---|---|---|---|---|
| Listar | GET | /citas | — | 200 arreglo | — |
| Filtrar | GET | /citas?estado=programada · ?medico_id=1 · ?paciente_id=2 | — | 200 arreglo filtrado | 400 filtro inválido |
| Obtener | GET | /citas/:id | — | 200 objeto | 400 id inválido · 404 |
| Crear | POST | /citas | JSON sin id | 201 objeto + cabecera Location | 400 · 409 |
| Actualizar | PUT | /citas/:id | JSON completo sin id | 200 objeto actualizado | 400 · 404 · 409 |
| Eliminar | DELETE | /citas/:id | — | 204 sin cuerpo | 400 · 404 |

No ofrece consulta por lotes (`?ids=`) porque ningún otro microservicio consulta citas.

Ejemplo para crear (`POST /citas`):

```json
{ "paciente_id": 2, "medico_id": 3, "fecha_hora": "2026-12-05T08:00", "sede": "Cali" }
```

Respuesta `201 Created` (cabecera `Location: /citas/4`):

```json
{ "id": 4, "paciente_id": 2, "medico_id": 3, "fecha_hora": "2026-12-05T08:00", "sede": "Cali", "estado": "programada" }
```

Ejemplo de listado filtrado (`GET /citas?estado=programada`):

```json
[
  { "id": 1, "paciente_id": 1, "medico_id": 1, "fecha_hora": "2026-12-01T09:00", "sede": "Bogotá", "estado": "programada" },
  { "id": 4, "paciente_id": 2, "medico_id": 3, "fecha_hora": "2026-12-05T08:00", "sede": "Cali", "estado": "programada" }
]
```

Errores: `{ "error": "mensaje", "detalles": ["..."] }` (detalles solo en errores de validación). Ejemplos:

```json
{ "error": "Datos inválidos", "detalles": ["paciente_id es obligatorio y debe ser un entero positivo"] }
{ "error": "El médico 1 ya tiene una cita el 2026-12-01T09:00 (cita 1)" }
```

## Relaciones

**Consulto a** (ms-citas guarda las referencias):

| Atributo | Microservicio consultado | Para validar (al crear y actualizar) | Para componer (al consultar) | Datos que usa |
|---|---|---|---|---|
| paciente_id | ms-pacientes | GET /pacientes/:id | GET /pacientes?ids=… | id, nombre |
| medico_id | ms-medicos | GET /medicos/:id | GET /medicos?ids=… | id, nombre, especialidad |

Al escribir: si el paciente o el médico no existe → 400; si el otro microservicio no responde → 503. Al leer: la respuesta incluye `paciente: {id, nombre}` y `medico: {id, nombre, especialidad}`; si el otro servicio no responde, el objeto sale en `null` con un aviso. Se implementa en la semana 2 del Taller 2.

**Me consultan:** ninguno.

Las columnas `paciente_id` y `medico_id` de la tabla `citas` son enteros **sin FOREIGN KEY**: las tablas relacionadas viven en otras bases de datos, de otros microservicios.

## Pruebas

Colección de Postman en `docs/ms-citas.postman_collection.json` (casos 1 a 13, sin el 3 porque no aplica, más la regla de fecha futura). Los datos de prueba son ficticios.
