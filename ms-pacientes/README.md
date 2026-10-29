# ms-pacientes

Microservicio de pacientes (puerto 3002). Responsable: Sebastián Montaño Reyes

## Estructura del servicio

El microservicio `ms-pacientes` gestiona los registros de pacientes en el sistema. Proporciona endpoints RESTful para:

- **GET /pacientes** - Listar todos los pacientes
- **GET /pacientes/{id}** - Obtener un paciente por su ID
- **POST /pacientes** - Crear un nuevo paciente
- **GET /health** - Endpoint de salud

## Atributos del modelo Paciente

| Atributo | Tipo | Descripción | Validaciones |
|----------|------|-------------|--------------|
| Id | int | Identificador único autoincremental | - |
| Nombre | string (100 caracteres) | Nombre completo del paciente | Mínimo 2, máximo 100 caracteres, obligatorio |
| Documento | string (50 caracteres) | Número de documento de identidad (Cédula/TI) | Formato válido con dígito de verificación, único, obligatorio |
| FechaNacimiento | date | Fecha de nacimiento del paciente | Formato yyyy-MM-dd, obligatoria |
| EPS | string (100 caracteres) | Empresa Promotora de Salud | Máximo 100 caracteres, obligatorio |
| Telefono | string (20 caracteres) | Número de teléfono de contacto | Formato internacional (+57XXXXXXXXXX), obligatorio |

## Estructura de carpetas

```
├── Models/
│   └── Paciente.cs          # Entidad y DTOs
├── Controllers/
│   └── PacientesController.cs
├── Services/
│   └── PacientesService.cs
├── Repositories/
│   └── PacientesRepository.cs
├── Exceptions/
│   └── ApiException.cs    # Manejo de errores (compartido con ms-medicos)
└── DTOs/
    └── CrearPacienteDto.cs
```

## Respuestas HTTP

- **200 OK** - Éxito en operaciones GET
- **201 Created** - Paciente creado exitosamente
- **404 Not Found** - Paciente no encontrado por ID
- **409 Conflict** - Documento ya existe (duplicado)
- **400 Bad Request** - Datos inválidos o formato incorrecto
- **500 Internal Server Error** - Error interno del servidor

## Uso con curl

```bash
# Listar pacientes
curl http://localhost:3002/pacientes

# Obtener paciente por ID
curl http://localhost:3002/pacientes/1

# Crear nuevo paciente
curl -X POST http://localhost:3002/pacientes \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Maria Rodriguez",
    "documento": "1009876543",
    "fecha_nacimiento": "1990-05-15",
    "eps": "Empleados Públicos",
    "telefono": "+573001234567"
  }'

# Endpoint de salud
curl http://localhost:3002/health
```

## Formato del Documento

AAAA-MM-DD

    ✅ "2026-11-03" — formato válido
    ❌ "03-11-2026" — orden incorrecto
    ❌ "2026-11-03T00:00" — incluye una hora


