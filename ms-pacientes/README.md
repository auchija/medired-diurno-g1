# ms-pacientes

Microservicio REST encargado de gestionar la información de los pacientes del sistema.

| Información        | Detalle                           |
| ------------------ | --------------------------------- |
| Entidad gestionada | Pacientes                         |
| Responsable        | Sebastián Montaño Reyes           |
| Puerto             | 3002                              |
| Tecnología         | ASP.NET Core Web API              |
| Lenguaje           | C#                                |
| Base de datos      | MySQL                             |
| Acceso a datos     | MySqlConnector (ADO.NET)          |
| Arquitectura       | Controller - Service - Repository |

## 1. Descripción

El microservicio `ms-pacientes` administra los registros de pacientes del sistema. Permite consultar, registrar y gestionar su información personal y de contacto.

La implementación utiliza una arquitectura por capas:

- **Controllers:** reciben las solicitudes HTTP y devuelven las respuestas correspondientes.
- **Services:** contienen las reglas de negocio, validaciones y manejo de excepciones.
- **Repositories:** gestionan las operaciones de persistencia y consultas a MySQL.
- **Models:** representan las entidades y los objetos de transferencia de datos (DTO).

La comunicación con la base de datos se realiza mediante `MySqlConnector`, utilizando una fábrica de conexiones (`IMySqlConnectionFactory`).

## 2. Requisitos previos

Para ejecutar el microservicio se necesita:

- .NET SDK 10.0.
- MySQL Server 8.0 o compatible.
- Un cliente de MySQL, como MySQL Workbench o MySQL CLI.
- Git para obtener el código fuente.

## 3. Instalación y ejecución

### 3.1. Obtener el proyecto

Clonar el repositorio y acceder a la carpeta del microservicio:

```bash
git clone URL_DEL_REPOSITORIO
cd ms-pacientes
```

### 3.2. Restaurar dependencias

Restaurar los paquetes NuGet del proyecto:

```bash
dotnet restore
```

El proyecto utiliza el paquete `MySqlConnector` para establecer conexiones con MySQL.

Si todavía no está instalado:

```bash
dotnet add package MySqlConnector
```

### 3.3. Configurar la conexión a MySQL

La configuración se encuentra en `appsettings.json`.

Ejemplo:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Host": "127.0.0.1",
  "Port": 3002,
  "ConnectionStrings": {
    "Pacientes": "Server=localhost;Port=3306;Database=pacientes_db;User ID=pacientes_user;Password=TU_CLAVE;"
  }
}
```

Reemplazar `TU_CLAVE` por la contraseña configurada para el usuario de MySQL.

**Importante:** no publicar contraseñas reales ni credenciales en el repositorio. Para entornos de desarrollo se recomienda utilizar .NET User Secrets:

```bash
dotnet user-secrets init

dotnet user-secrets set "ConnectionStrings:Pacientes" "Server=localhost;Port=3306;Database=pacientes_db;User ID=pacientes_user;Password=TU_CLAVE;"
```

### 3.4. Crear la base de datos

El proyecto incluye el archivo `db/schema.sql`, que contiene la estructura de la tabla `pacientes` y los registros iniciales de prueba.

Primero, crear la base de datos y el usuario:

```sql
CREATE DATABASE pacientes_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE USER 'pacientes_user'@'localhost'
IDENTIFIED BY 'TU_CLAVE';

GRANT SELECT, INSERT, UPDATE, DELETE
ON pacientes_db.*
TO 'pacientes_user'@'localhost';

FLUSH PRIVILEGES;
```

Después, ejecutar el archivo `schema.sql`:

Desde MySQL CLI:

```bash
mysql -u pacientes_user -p pacientes_db < db/schema.sql
```

También se puede importar desde MySQL Workbench seleccionando la base de datos `pacientes_db` y ejecutando el contenido del archivo.

**Nota:** si el archivo `schema.sql` contiene instrucciones `CREATE DATABASE` o `USE`, verificar que coincidan con el nombre de la base de datos configurado.

### 3.5. Ejecutar el microservicio

Desde la carpeta del proyecto:

```bash
dotnet run
```

El servicio estará disponible en:

```text
http://localhost:3002
```

Para verificar que está funcionando, consultar:

```bash
curl http://localhost:3002/health
```

Si el endpoint de salud está habilitado en la implementación.

## 4. Representación y atributos

### 4.1. Representación JSON

Ejemplo de un registro de paciente:

```json
{
  "id": 1,
  "nombre": "María Rodríguez",
  "documento": "1009876543",
  "fecha_nacimiento": "1990-05-15",
  "eps": "Empleados Públicos",
  "telefono": "3001234567"
}
```

### 4.2. Tabla de atributos

| Atributo         | Tipo         | Obligatorio                   | Reglas y restricciones                                                    |
| ---------------- | ------------ | ----------------------------- | ------------------------------------------------------------------------- |
| id               | int          | Sí (generado automáticamente) | Identificador único. Clave primaria autoincremental.                      |
| nombre           | string (100) | Sí                            | Entre 2 y 100 caracteres. Se eliminan espacios al inicio y al final.      |
| documento        | string (18)  | Sí                            | Entre 9 y 18 caracteres. Debe ser único.                                  |
| fecha_nacimiento | date         | Sí                            | Fecha válida en formato `yyyy-MM-dd`.                                     |
| eps              | string (100) | Sí                            | Máximo 100 caracteres.                                                    |
| telefono         | string (15)  | Sí                            | Entre 9 y 15 caracteres y debe cumplir la validación de teléfono del DTO. |

**Restricciones de persistencia:**

- Todos los atributos, excepto el identificador autoincremental, son `NOT NULL`.
- El documento tiene una restricción `UNIQUE`.
- La tabla utiliza `id` como clave primaria.

### 4.3. Formato de fecha

La fecha de nacimiento utiliza el formato ISO 8601:

```text
2026-11-03
```

Ejemplos:

- Correcto: `"1990-05-15"`
- Incorrecto: `"15-05-1990"`
- Incorrecto: `"1990-05-15T00:00:00"`

## 5. Endpoints

La API utiliza la ruta base:

```text
http://localhost:3002/pacientes
```

### 5.1. Tabla de endpoints

| Método | Endpoint             | Parámetros         | Descripción                                        | Respuesta esperada             |
| ------ | -------------------- | ------------------ | -------------------------------------------------- | ------------------------------ |
| GET    | `/pacientes`         | Ninguno            | Lista todos los pacientes.                         | 200 OK                         |
| GET    | `/pacientes?ids=1,3` | `ids` (query)      | Filtra pacientes por una lista de identificadores. | 200 OK                         |
| GET    | `/pacientes/{id}`    | `id` (path)        | Consulta un paciente por su identificador.         | 200 OK / 404 Not Found         |
| POST   | `/pacientes`         | JSON               | Registra un nuevo paciente.                        | 201 Created                    |
| PUT    | `/pacientes/{id}`    | `id` (path) y JSON | Actualiza un paciente existente.                   | 200 OK / 404 Not Found         |
| DELETE | `/pacientes/{id}`    | `id` (path)        | Elimina un paciente.                               | 204 No Content / 404 Not Found |

**Nota:** los endpoints PUT y DELETE corresponden a las operaciones previstas para completar el CRUD. Deben habilitarse en el controlador antes de considerarlos disponibles.

### 5.2. Ejemplo: listar pacientes

**Petición:**

```bash
curl http://localhost:3002/pacientes
```

**Respuesta (200 OK):**

```json
[
  {
    "id": 1,
    "nombre": "Lucía Gómez",
    "documento": "DOC-FICTICIO-001",
    "fecha_nacimiento": "1990-04-18",
    "eps": "Salud Ejemplo",
    "telefono": "3000000001"
  },
  {
    "id": 2,
    "nombre": "Mateo Rodríguez",
    "documento": "DOC-FICTICIO-002",
    "fecha_nacimiento": "1985-09-23",
    "eps": "EPS Demostración",
    "telefono": "3000000002"
  }
]
```

También se pueden consultar identificadores específicos:

```bash
curl "http://localhost:3002/pacientes?ids=1,3"
```

### 5.3. Ejemplo: crear paciente

**Petición:**

```bash
curl -X POST http://localhost:3002/pacientes \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María Rodríguez",
    "documento": "1009876543",
    "fecha_nacimiento": "1990-05-15",
    "eps": "Empleados Públicos",
    "telefono": "3001234567"
  }'
```

**Respuesta (201 Created):**

```json
{
  "id": 4,
  "nombre": "María Rodríguez",
  "documento": "1009876543",
  "fecha_nacimiento": "1990-05-15",
  "eps": "Empleados Públicos",
  "telefono": "3001234567"
}
```

La respuesta incluye el identificador generado automáticamente por MySQL.

## 6. Respuestas HTTP y manejo de errores

| Código HTTP               | Descripción                                                      |
| ------------------------- | ---------------------------------------------------------------- |
| 200 OK                    | Consulta o actualización realizada correctamente.                |
| 201 Created               | Paciente registrado correctamente.                               |
| 204 No Content            | Paciente eliminado correctamente, sin contenido de respuesta.    |
| 400 Bad Request           | Datos inválidos, parámetros incorrectos o errores de validación. |
| 404 Not Found             | No existe un paciente con el identificador solicitado.           |
| 409 Conflict              | Ya existe un paciente registrado con el mismo documento.         |
| 500 Internal Server Error | Error interno no controlado.                                     |

Las excepciones de la aplicación se gestionan mediante el mecanismo centralizado de manejo de errores del microservicio.

## 7. Estructura del proyecto

```text
ms-pacientes/
│
├── Controllers/
│   └── PacientesController.cs
│
├── Models/
│   ├── Paciente.cs
│   └── CrearPacienteRequest.cs
│
├── Services/
│   ├── IPacientesService.cs
│   └── PacientesService.cs
│
├── Repositories/
│   ├── IPacientesRepository.cs
│   └── PacientesRepository.cs
│
├── Infrastructure/
│   └── Database/
│       ├── IMySqlConnectionFactory.cs
│       └── MySqlConnectionFactory.cs
│
├── Exceptions/
│   └── ApiException.cs
│
├── db/
│   └── schema.sql
│
├── appsettings.json
├── Program.cs
└── ms-pacientes.csproj
```

*La estructura puede variar según la organización definitiva del proyecto.*

## 8. Persistencia de datos

El repositorio `PacientesRepository` implementa las operaciones de acceso a datos mediante consultas SQL parametrizadas.

Operaciones implementadas:

- `FindAllAsync()`: obtiene todos los pacientes.
- `FindByIdsAsync(ids)`: consulta pacientes por varios identificadores.
- `FindByIdAsync(id)`: consulta un paciente por su identificador.
- `FindByDocumentAsync(documento)`: consulta por documento.
- `CreateAsync(paciente)`: registra un paciente.
- `UpdateAsync(id, paciente)`: actualiza un paciente.
- `RemoveAsync(id)`: elimina un paciente.

La fábrica `IMySqlConnectionFactory` centraliza la creación de conexiones y permite mantener desacoplado el repositorio de la configuración de conexión.

---

**Responsable del microservicio:** Sebastián Montaño Reyes
**Puerto de ejecución:** 3002
**Entidad gestionada:** Pacientes
