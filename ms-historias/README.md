# ms-historias · Contrato de la API

Microservicio de **historias clínicas** de MediRed IPS. Responsable: Miguel Ángel Jiménez (chanclaxx). Puerto: **3005**.

## Cómo ejecutarlo

Requisitos: Node.js 22.9 o superior, MySQL 8, y **ms-usuarios (3001), ms-pacientes (3002) y ms-medicos (3003) corriendo**.

1. Crear la base de datos y su usuario (como root, con `mysql -u root -p`):

```sql
CREATE DATABASE historias_db;
CREATE USER 'historias_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
GRANT ALL PRIVILEGES ON historias_db.* TO 'historias_user'@'localhost';
```

2. Crear la tabla con los 3 registros iniciales: desde la carpeta `ms-historias`, `mysql -u historias_user -p historias_db` y luego `SOURCE db/schema.sql;`
3. `npm install`
4. Copiar `.env.example` como `.env` (`copy .env.example .env` en Windows) y ajustar la contraseña de la base de datos. `JWT_SECRET` debe ser **la misma de ms-usuarios**.
5. `npm run dev` → debe decir `ms-historias escuchando en http://127.0.0.1:3005`

### Variables del .env

| Variable | Valor | Para qué |
|---|---|---|
| PORT | 3005 | Puerto del microservicio |
| HOST | 127.0.0.1 | Solo acepta conexiones del mismo equipo (el gateway) |
| DB_HOST / DB_PORT | localhost / 3306 | Servidor MySQL (en el Taller 3: servidor1) |
| DB_NAME | historias_db | Base de datos propia del microservicio |
| DB_USER / DB_PASSWORD | historias_user / ... | Usuario con permisos solo sobre historias_db |
| JWT_SECRET | la del grupo | Verifica los tokens; **idéntica** en los 5 microservicios |
| PACIENTES_URL | http://127.0.0.1:3002 | Dirección de ms-pacientes |
| MEDICOS_URL | http://127.0.0.1:3003 | Dirección de ms-medicos |

## Representación

Los objetos `paciente` y `medico` **no se guardan** en esta base de datos: se piden a ms-pacientes y ms-medicos en cada consulta.

```json
{
  "id": 1,
  "paciente_id": 1,
  "medico_id": 1,
  "fecha": "2025-02-10",
  "motivo_consulta": "Dolor de cabeza persistente",
  "diagnostico": "Migraña",
  "tratamiento": "Acetaminofén 500 mg cada 8 horas por 3 días",
  "paciente": { "id": 1, "nombre": "Lucía Gómez" },
  "medico": { "id": 1, "nombre": "Carlos Ruiz", "especialidad": "Medicina general" }
}
```

Si ms-pacientes o ms-medicos no responden al consultar, el objeto correspondiente sale en `null` y la historia trae `"aviso": "ms-pacientes no disponible"` (o `ms-medicos`).

## Atributos

| Atributo | Tipo | ¿Obligatorio al crear? | Reglas |
|---|---|---|---|
| id | entero | No: lo asigna el servicio | Positivo y único |
| paciente_id | entero | Sí | Entero positivo; debe existir en ms-pacientes (400); si ms-pacientes no responde, 503 |
| medico_id | entero | Sí | Entero positivo; debe existir en ms-medicos (400); si ms-medicos no responde, 503 |
| fecha | texto | Sí | Formato `AAAA-MM-DD`, fecha real; **no puede ser futura** (400) |
| motivo_consulta | texto | Sí | No vacío |
| diagnostico | texto | Sí | No vacío |
| tratamiento | texto | Sí | No vacío |
| paciente / medico | objeto | No se envía | Lo agrega el servicio al responder (composición) |

**Regla de negocio** (se aplica al crear y al actualizar): la `fecha` no puede ser futura → **400**. Un paciente puede tener varias historias con el mismo médico el mismo día.

## Endpoints

Todas las peticiones llevan la cabecera `Authorization: Bearer <token>` (el token se obtiene en `POST /usuarios/login` de ms-usuarios). Ese mismo token se reenvía a ms-pacientes y ms-medicos.

| Operación | Método | URI | Quién | Respuesta exitosa | Errores |
|---|---|---|---|---|---|
| Listar | GET | /historias | administrador, admisiones, medico | 200 arreglo con `paciente` y `medico` | 401 |
| Filtrar | GET | /historias?paciente_id=1 · ?medico_id=2 | administrador, admisiones, medico | 200 arreglo filtrado | 400 · 401 |
| Obtener | GET | /historias/:id | administrador, admisiones, medico | 200 objeto con `paciente` y `medico` | 400 · 401 · 404 |
| Crear | POST | /historias | administrador, medico | 201 objeto + cabecera Location | 400 · 401 · 403 · 503 |
| Actualizar | PUT | /historias/:id | administrador, medico | 200 objeto actualizado | 400 · 401 · 403 · 404 · 503 |
| Eliminar | DELETE | /historias/:id | administrador, medico | 204 sin cuerpo | 400 · 401 · 403 · 404 |

- **401:** falta el token, es inválido o venció.
- **403:** el rol del token no tiene permiso para esa operación.
- **503:** ms-pacientes o ms-medicos no respondieron y no se pudo verificar la referencia; no se guarda nada.

Los dos filtros se pueden combinar: `/historias?paciente_id=1&medico_id=1`.

Ejemplo para crear o actualizar:

```json
{
  "paciente_id": 2,
  "medico_id": 1,
  "fecha": "2025-10-20",
  "motivo_consulta": "Dolor abdominal",
  "diagnostico": "Gastritis",
  "tratamiento": "Omeprazol 20 mg en ayunas por 14 días"
}
```

Errores: `{ "error": "mensaje", "detalles": ["..."] }` (detalles solo en errores de validación). Ejemplo:

```json
{ "error": "Datos inválidos", "detalles": ["diagnostico es obligatorio"] }
```

## Relaciones

La historia guarda solo `paciente_id` y `medico_id`, nunca una copia del nombre del paciente o del médico. Las columnas no tienen FOREIGN KEY porque esas tablas viven en otras bases de datos.

**Consulto a:**

| Atributo | Microservicio consultado | Para validar (al crear y actualizar) | Para componer (al consultar) | Datos que usa |
|---|---|---|---|---|
| paciente_id | ms-pacientes | GET /pacientes/:id | GET /pacientes?ids=… | id, nombre |
| medico_id | ms-medicos | GET /medicos/:id | GET /medicos?ids=… | id, nombre, especialidad |

- Si el paciente o el médico no existe → **400**.
- Si el otro servicio no responde → **503**.
- Al listar, si no se pueden obtener los datos relacionados, el objeto llega en `null` con un aviso.

El código de la relación está en `src/clients/pacientes.client.js` y `src/clients/medicos.client.js` (las peticiones a los otros microservicios) y en `src/services/historias.service.js` (`validarReferencias` y `componer`).

**Me consultan:** ninguno.

## CORS

CORS está activo (`app.use(cors())` en `src/app.js`), para que un frontend abierto en el navegador desde otra dirección pueda llamar a `http://localhost:3005`. En el Taller 3, detrás del gateway, ya no hace falta.

## Pruebas

Colección de Postman en `docs/ms-historias.postman_collection.json` (29 casos). Los casos 00 inician sesión y guardan los tokens; las variables `{{base}}` (este microservicio) y `{{usuarios}}` (ms-usuarios) están en la pestaña *Variables* de la colección. El caso 03 (consulta por lotes) no aplica porque ningún servicio consulta historias. Los casos 23 y 24 se corren con **ms-pacientes detenido**.
