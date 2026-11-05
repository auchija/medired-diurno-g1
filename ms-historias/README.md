# ms-historias · Contrato de la API

Microservicio de **historias clínicas** de MediRed IPS. Responsable: Miguel Ángel Jiménez (chanclaxx). Puerto: **3005**.

## Cómo ejecutarlo

Requisitos: Node.js 22.9 o superior y MySQL 8.

1. Crear la base de datos y su usuario (como root, con `mysql -u root -p`):

```sql
CREATE DATABASE historias_db;
CREATE USER 'historias_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
GRANT ALL PRIVILEGES ON historias_db.* TO 'historias_user'@'localhost';
```

2. Crear la tabla con los 3 registros iniciales: desde la carpeta `ms-historias`, `mysql -u historias_user -p historias_db` y luego `SOURCE db/schema.sql;`
3. `npm install`
4. Copiar `.env.example` como `.env` (`copy .env.example .env` en Windows) y poner la contraseña de la base de datos.
5. `npm run dev` → debe decir `ms-historias escuchando en http://127.0.0.1:3005`

### Variables del .env

| Variable | Valor | Para qué |
|---|---|---|
| PORT | 3005 | Puerto del microservicio |
| HOST | 127.0.0.1 | Solo acepta conexiones del mismo equipo (el gateway) |
| DB_HOST / DB_PORT | localhost / 3306 | Servidor MySQL (en el Taller 3: servidor1) |
| DB_NAME | historias_db | Base de datos propia del microservicio |
| DB_USER / DB_PASSWORD | historias_user / ... | Usuario con permisos solo sobre historias_db |

## Representación

```json
{
  "id": 1,
  "paciente_id": 1,
  "medico_id": 1,
  "fecha": "2025-02-10",
  "motivo_consulta": "Dolor de cabeza persistente",
  "diagnostico": "Migraña",
  "tratamiento": "Acetaminofén 500 mg cada 8 horas por 3 días"
}
```

## Atributos

| Atributo | Tipo | ¿Obligatorio al crear? | Reglas |
|---|---|---|---|
| id | entero | No: lo asigna el servicio | Positivo y único |
| paciente_id | entero | Sí | Entero positivo; referencia a ms-pacientes |
| medico_id | entero | Sí | Entero positivo; referencia a ms-medicos |
| fecha | texto | Sí | Formato `AAAA-MM-DD`, fecha real; **no puede ser futura** (400) |
| motivo_consulta | texto | Sí | No vacío |
| diagnostico | texto | Sí | No vacío |
| tratamiento | texto | Sí | No vacío |

**Regla de negocio** (se aplica al crear y al actualizar): la `fecha` no puede ser futura → **400**. Un paciente puede tener varias historias con el mismo médico el mismo día.

## Endpoints

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores |
|---|---|---|---|---|---|
| Listar | GET | /historias | — | 200 arreglo | — |
| Filtrar | GET | /historias?paciente_id=1 · ?medico_id=2 | — | 200 arreglo filtrado | 400 filtro inválido |
| Obtener | GET | /historias/:id | — | 200 objeto | 400 id inválido · 404 |
| Crear | POST | /historias | JSON sin id | 201 objeto + cabecera Location | 400 |
| Actualizar | PUT | /historias/:id | JSON completo sin id | 200 objeto actualizado | 400 · 404 |
| Eliminar | DELETE | /historias/:id | — | 204 sin cuerpo | 400 id inválido · 404 |

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

**Consulto a** (se implementa en la semana 2):

| Atributo | Microservicio consultado | Para validar (al crear y actualizar) | Para componer (al consultar) | Datos que usa |
|---|---|---|---|---|
| paciente_id | ms-pacientes | GET /pacientes/:id | GET /pacientes?ids=… | id, nombre |
| medico_id | ms-medicos | GET /medicos/:id | GET /medicos?ids=… | id, nombre, especialidad |

- Si el paciente o el médico no existe → **400**.
- Si el otro servicio no responde → **503**.
- Al listar, si no se pueden obtener los datos relacionados, el objeto llega en `null` con un aviso.

**Me consultan:** ninguno.

## Pruebas

Colección de Postman en `docs/ms-historias.postman_collection.json` (12 casos: del 1 al 13 sin el 3, porque la consulta por lotes no aplica, ya que ningún servicio consulta historias). El caso 9 viola la regla propia con una fecha futura (400).
