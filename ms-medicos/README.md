# ms-medicos

Microservicio de médicos (puerto 3003). Responsable: Sebastián Montaño Reyes

## Estructura del servicio

El microservicio `ms-medicos` gestiona los registros de médicos en el sistema. Proporciona endpoints RESTful para:

- **GET /medicos** - Listar todos los médicos
- **GET /medicos/{id}** - Obtener un médico por su ID
- **POST /medicos** - Crear un nuevo médico
- **GET /health** - Endpoint de salud

## Atributos del modelo Medico

| Atributo | Tipo | Descripción | Validaciones |
|----------|------|-------------|--------------|
| Id | int | Identificador único autoincremental | - |
| Nombre | string (100 caracteres) | Nombre completo del médico | Mínimo 2, máximo 100 caracteres, obligatorio |
| RegistroMedico | string (409 caracteres) | Código único del médico en el sistema (ej: MS-1234567) | Formato MS-{7dígitos}, único (código 409 si existe), obligatorio |
| Especialidad | string (100 caracteres) | Área médica de especialización | Máximo 100 caracteres, obligatorio |
| Sede | enum | Ubicación física del médico | Solo Cali, Bogotá o Medellín, obligatorio |

## Estructura de carpetas

```
├── Models/
│   └── Medico.cs          # Entidad y DTOs
├── Controllers/
│   └── MedicosController.cs
├── Services/
│   └── MedicosService.cs
├── Repositories/
│   └── MedicosRepository.cs
├── Exceptions/
│   └── ApiException.cs    # Manejo de errores (compartido con ms-pacientes)
└── DTOs/
    └── CrearMedicoDto.cs
```

## Respuestas HTTP

- **200 OK** - Éxito en operaciones GET
- **201 Created** - Médico creado exitosamente
- **404 Not Found** - Médico no encontrado por ID
- **409 Conflict** - Registro médico ya existe
- **400 Bad Request** - Datos inválidos o formato incorrecto
- **500 Internal Server Error** - Error interno del servidor

## Uso con curl

```bash
# Listar médicos
curl http://localhost:3003/medicos

# Obtener médico por ID
curl http://localhost:3003/medicos/1

# Crear nuevo médico
curl -X POST http://localhost:3003/medicos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "registro_medico": "MS-1234567",
    "especialidad": "Cardiología",
    "sede": "Cali"
  }'

# Endpoint de salud
curl http://localhost:3003/health
```

## Formato del Registro Médico

El registro médico debe seguir el formato `MS-{7 dígitos}`, por ejemplo:
- ✅ `MS-1234567`
- ❌ `ms-1234567` (aunque se normaliza a mayúsculas)
- ❌ `SOL-9876543` (formato incorrecto)

