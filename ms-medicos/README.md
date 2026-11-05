# ms-medicos

Microservicio encargado de gestionar la información de los médicos registrados en el sistema Medired.

| Información | Detalle |
|---|---|
| **Microservicio** | `ms-medicos` |
| **Responsable** | Sebastián Montaño Reyes |
| **Puerto** | 3003 |
| **Tecnología** | ASP.NET Core Web API (.NET 10) |
| **Base de datos** | MySQL |
| **Acceso a datos** | MySqlConnector (ADO.NET) |

## 1. Descripción del servicio

El microservicio `ms-medicos` administra los registros de médicos del sistema. Expone una API REST que permite consultar, registrar, actualizar y eliminar médicos.

Sus principales responsabilidades son:

- Registrar médicos con información personal y profesional.
- Consultar todos los médicos registrados.
- Consultar médicos mediante uno o varios identificadores.
- Obtener un médico específico por su ID.
- Evitar registros médicos duplicados.
- Validar que la sede corresponda a una ubicación permitida.
- Actualizar y eliminar registros existentes.

## 2. Arquitectura y estructura del proyecto

El microservicio utiliza una arquitectura por capas para separar las responsabilidades:

| Capa | Responsabilidad |
|---|---|
| **Controllers** | Recibe las solicitudes HTTP y devuelve las respuestas de la API. |
| **Services** | Implementa las reglas de negocio y validaciones. |
| **Repositories** | Gestiona las operaciones de consulta y modificación en MySQL. |
| **Models** | Contiene las entidades y los modelos de transferencia de datos. |
| **Infrastructure** | Contiene la configuración y fábrica de conexiones a MySQL. |
| **Exceptions** | Gestiona las excepciones personalizadas de la API. |

### Estructura de carpetas

```text
ms-medicos/
├── Controllers/
│   └── MedicosController.cs
├── DTOs/
│   ├── CrearMedicoRequest.cs
│   └── ActualizarMedicoRequest.cs
├── Exceptions/
│   └── ApiException.cs
├── Infrastructure/
│   └── Database/
│       ├── IMySqlConnectionFactory.cs
│       └── MySqlConnectionFactory.cs
├── Models/
│   ├── Medico.cs
│   └── Sede.cs
├── Repositories/
│   ├── IMedicosRepository.cs
│   └── MedicosRepository.cs
├── Services/
│   ├── IMedicosService.cs
│   └── MedicosService.cs
├── db/
│   └── schema.sql
├── appsettings.json
├── Program.cs
└── ms-medicos.csproj
```

## 3. Requisitos previos

Para ejecutar el microservicio se requiere:

- .NET SDK 10.0.
- MySQL Server 8.0 o compatible.
- Un cliente para administrar MySQL (MySQL Workbench, DBeaver o terminal).
- VSCodium o Visual Studio Code.
- Git.

### Instalación de dependencias

Desde la carpeta del microservicio ejecutar:

```bash
dotnet restore
```

Para compilar el proyecto:

```bash
dotnet build
```

## 4. Configuración de la base de datos

El microservicio utiliza MySQL para almacenar los registros de médicos.

### 4.1. Crear la base de datos

Ejecutar en MySQL:

```sql
CREATE DATABASE medicos_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Seleccionar la base de datos:

```sql
USE medicos_db;
```

### 4.2. Crear la tabla de médicos

El archivo `db/schema.sql` debe contener la estructura de la tabla:

```sql
CREATE TABLE medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    registro_medico VARCHAR(30) NOT NULL UNIQUE,
    especialidad VARCHAR(100) NOT NULL,
    sede VARCHAR(30) NOT NULL
);
```

### 4.3. Insertar datos de prueba

```sql
INSERT INTO medicos (
    nombre,
    registro_medico,
    especialidad,
    sede
)
VALUES
(
    'Carlos Ruiz',
    'RM-FICTICIO-001',
    'Medicina general',
    'Cali'
),
(
    'Mariana Torres',
    'RM-FICTICIO-002',
    'Pediatría',
    'Bogotá'
),
(
    'Andrés Mendoza',
    'RM-FICTICIO-003',
    'Cardiología',
    'Medellín'
);
```

**Importante:** Los valores de la columna `sede` deben coincidir con los valores definidos en el enum `Sede` de C#.

### 4.4. Configurar la conexión

En `appsettings.json` se debe configurar la cadena de conexión:

```json
{
  "ConnectionStrings": {
    "Medicos": "Server=localhost;Port=3306;Database=medicos_db;User ID=medicos_user;Password=TU_CLAVE;"
  }
}
```

La clave `Medicos` debe coincidir con la utilizada en `MySqlConnectionFactory`.

Por seguridad, se recomienda almacenar las credenciales mediante User Secrets durante el desarrollo:

```bash
dotnet user-secrets init
```

```bash
dotnet user-secrets set "ConnectionStrings:Medicos" "Server=localhost;Port=3306;Database=medicos_db;User ID=medicos_user;Password=TU_CLAVE;"
```

No se deben publicar contraseñas reales en el repositorio.

## 5. Modelo de dominio: Medico

El modelo `Medico` representa la información de un profesional de la salud registrado en el sistema.

### Atributos

| Atributo | Tipo | Descripción | Validaciones |
|---|---|---|---|
| `Id` | `int` | Identificador único del médico. | Autoincremental en MySQL. |
| `Nombre` | `string` | Nombre completo del médico. | Obligatorio, entre 2 y 100 caracteres. |
| `RegistroMedico` | `string` | Código de identificación profesional. | Obligatorio, máximo 30 caracteres y único. |
| `Especialidad` | `string` | Área médica de especialización. | Obligatoria, máximo 100 caracteres. |
| `Sede` | `enum Sede` | Ubicación física del médico. | Obligatoria. Solo admite Cali, Bogotá o Medellín. |

### Enum Sede

Las sedes permitidas son:

```csharp
public enum Sede
{
    Cali,
    Bogotá,
    Medellín
}
```

La API utiliza `JsonStringEnumConverter` para recibir y devolver los valores del enum como cadenas de texto.

Ejemplos válidos:

- `"Cali"`
- `"Bogotá"`
- `"Medellín"`

No se admiten sedes diferentes a las definidas en el enum.

## 6. Endpoints disponibles

La API utiliza la ruta base `/medicos`.

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/medicos` | Lista todos los médicos. |
| `GET` | `/medicos?ids=1,2,3` | Consulta médicos mediante varios IDs. |
| `GET` | `/medicos/{id}` | Obtiene un médico por su identificador. |
| `POST` | `/medicos` | Registra un nuevo médico. |
| `PUT` | `/medicos/{id}` | Actualiza la información de un médico. |
| `DELETE` | `/medicos/{id}` | Elimina un médico. |
| `GET` | `/health` | Comprueba el estado del servicio, si está habilitado en la configuración. |

### 6.1. Listar médicos

**Solicitud:**

```http
GET http://localhost:3003/medicos
```

**Respuesta esperada (200 OK):**

```json
[
  {
    "id": 1,
    "nombre": "Carlos Ruiz",
    "registro_medico": "RM-FICTICIO-001",
    "especialidad": "Medicina general",
    "sede": "Cali"
  },
  {
    "id": 2,
    "nombre": "Mariana Torres",
    "registro_medico": "RM-FICTICIO-002",
    "especialidad": "Pediatría",
    "sede": "Bogotá"
  }
]
```

### 6.2. Consultar por ID

**Solicitud:**

```http
GET http://localhost:3003/medicos/1
```

**Respuesta esperada (200 OK):**

```json
{
  "id": 1,
  "nombre": "Carlos Ruiz",
  "registro_medico": "RM-FICTICIO-001",
  "especialidad": "Medicina general",
  "sede": "Cali"
}
```

### 6.3. Consultar varios médicos por ID

**Solicitud:**

```http
GET http://localhost:3003/medicos?ids=1,2,3
```

Permite consultar varios médicos utilizando una lista de identificadores separados por comas.

### 6.4. Registrar un médico

**Solicitud:**

```http
POST http://localhost:3003/medicos
Content-Type: application/json
```

**Cuerpo de la solicitud:**

```json
{
  "nombre": "Juan Pérez",
  "registro_medico": "RM-FICTICIO-004",
  "especialidad": "Cardiología",
  "sede": "Bogotá"
}
```

**Respuesta esperada (201 Created):**

```json
{
  "id": 4,
  "nombre": "Juan Pérez",
  "registro_medico": "RM-FICTICIO-004",
  "especialidad": "Cardiología",
  "sede": "Bogotá"
}
```

### 6.5. Actualizar un médico

**Solicitud:**

```http
PUT http://localhost:3003/medicos/1
Content-Type: application/json
```

**Cuerpo de la solicitud (ejemplo):**

```json
{
  "nombre": "Carlos Ruiz",
  "especialidad": "Medicina interna",
  "sede": "Medellín"
}
```

Los atributos opcionales no enviados conservan su valor anterior.

### 6.6. Eliminar un médico

**Solicitud:**

```http
DELETE http://localhost:3003/medicos/1
```

Elimina el registro correspondiente al identificador indicado.

## 7. Respuestas HTTP y manejo de errores

El servicio utiliza respuestas HTTP convencionales para comunicar el resultado de las operaciones.

| Código | Estado | Descripción |
|---|---|---|
| `200` | OK | Consulta o modificación realizada correctamente. |
| `201` | Created | Médico registrado correctamente. |
| `204` | No Content | Eliminación realizada sin contenido de respuesta, si así lo configura el controlador. |
| `400` | Bad Request | Datos inválidos, ID no positivo o sede no permitida. |
| `404` | Not Found | No existe un médico con el identificador solicitado. |
| `409` | Conflict | El registro médico ya está asociado a otro médico. |
| `500` | Internal Server Error | Error interno no controlado. |

Los errores de negocio se gestionan mediante `ApiException` y el mecanismo centralizado de manejo de excepciones.

## 8. Uso con cURL

### Listar todos los médicos

```bash
curl http://localhost:3003/medicos
```

### Consultar por ID

```bash
curl http://localhost:3003/medicos/1
```

### Consultar varios IDs

```bash
curl "http://localhost:3003/medicos?ids=1,2,3"
```

### Registrar un médico

```bash
curl -X POST http://localhost:3003/medicos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "registro_medico": "RM-FICTICIO-004",
    "especialidad": "Cardiología",
    "sede": "Bogotá"
  }'
```

### Actualizar un médico

```bash
curl -X PUT http://localhost:3003/medicos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "especialidad": "Medicina interna",
    "sede": "Medellín"
  }'
```

### Eliminar un médico

```bash
curl -X DELETE http://localhost:3003/medicos/1
```

### Comprobar el estado del servicio

```bash
curl http://localhost:3003/health
```

## 9. Ejecución del microservicio

Desde la carpeta raíz de `ms-medicos`, ejecutar:

```bash
dotnet restore
dotnet build
dotnet run
```

El servicio estará disponible en:

```text
http://127.0.0.1:3003
```

Si Swagger está habilitado en el entorno de desarrollo, la documentación interactiva estará disponible en:

```text
http://127.0.0.1:3003/swagger
```

## 10. Consideraciones importantes

- El puerto de ejecución del microservicio es `3003`.
- La base de datos utilizada es `medicos_db`.
- La cadena de conexión debe identificarse como `Medicos`.
- El campo `registro_medico` debe ser único.
- Las sedes admitidas son exclusivamente `Cali`, `Bogotá` y `Medellín`.
- Los identificadores deben ser enteros positivos.
- Las consultas a MySQL utilizan parámetros para evitar la concatenación insegura de valores en las sentencias SQL.
- Las credenciales de acceso a la base de datos no deben almacenarse en el repositorio.
