# ms-historias · MediRed IPS (Módulo 3)

Redes y Servicios Multimedia · UAO · Grupo 1, jornada diurna.

MediRed IPS es una clínica con sedes en Bogotá, Cali y Medellín. Su aplicación web está
construida con microservicios REST en Node.js + Express, organizados en capas. Este
microservicio gestiona las **historias clínicas** de los pacientes.

Responsable: Miguel Ángel Jiménez (chanclaxx) · Puerto: **3005**

Esta es la versión del Taller 1: datos en memoria y tres operaciones. En el Taller 2 se
completa el CRUD con persistencia en MySQL, y en el Taller 3 se integra con ms-pacientes
y ms-medicos.

## Integrantes

| Integrante | Usuario de GitHub | Microservicio a cargo |
|---|---|---|
| Alejandro González | auchija | ms-citas |
| Sebastián Montaño Reyes | SebasMontanoUAO | ms-pacientes, ms-medicos |
| Miguel Ángel Jiménez | chanclaxx | ms-historias |

## Microservicios

| Carpeta | Entidad | Responsable | Puerto | Depende de |
|---|---|---|---|---|
| ms-usuarios | Usuario | Docente | 3001 | — |
| ms-pacientes | Paciente | Sebastián Montaño Reyes | 3002 | — |
| ms-medicos | Médico | Sebastián Montaño Reyes | 3003 | — |
| ms-citas | Cita | Alejandro González | 3004 | ms-pacientes, ms-medicos |
| ms-historias | Historia clínica | Miguel Ángel Jiménez | 3005 | ms-pacientes, ms-medicos |

## Estructura del repositorio

- `ms-usuarios/`: plantilla entregada por la docente; nadie la modifica.
- `ms-pacientes/`, `ms-medicos/`, `ms-citas/`, `ms-historias/`: un microservicio por
  integrante; cada uno trabaja solo en su carpeta.
- `frontend/`: interfaz web (desde la semana 2).
- `deploy/`: archivos de despliegue en servidor1 y servidor2 (Taller 3).

## Cómo ejecutarlo

Requisitos: Node.js 22 o superior (`node -v`). Desde la carpeta `ms-historias`:

```
npm install                 # descarga Express en node_modules
copy .env.example .env      # en Windows (en Linux/Mac: cp .env.example .env)
npm run dev                 # inicia y se reinicia solo al guardar cambios
```

Prueben en el navegador: http://127.0.0.1:3005/health y http://127.0.0.1:3005/historias

## Entidad Historia clínica

| Atributo | Tipo | Obligatorio | Valores / formato | Referencia a |
|---|---|---|---|---|
| id | entero | Lo asigna el sistema | 1, 2, 3... | — |
| paciente_id | entero | Sí | Entero positivo | ms-pacientes |
| medico_id | entero | Sí | Entero positivo | ms-medicos |
| fecha | texto | Sí | `AAAA-MM-DD` (ej. `2025-02-10`) | — |
| motivo_consulta | texto | Sí | No vacío | — |
| diagnostico | texto | Sí | No vacío | — |
| tratamiento | texto | Sí | No vacío | — |

**Reglas de negocio:**
- No puede existir otra historia con el mismo `paciente_id` + `medico_id` + `fecha` → `409 Conflict`.
- La fecha no puede ser futura → `400 Bad Request`.

La historia guarda solo `paciente_id` y `medico_id`, nunca una copia del nombre del paciente
o del médico. En el Taller 3 esos datos se consultan por REST a ms-pacientes y ms-medicos.

## Capas

| Archivo | Capa | Responsabilidad |
|---|---|---|
| src/index.js | Arranque | Lee PORT y HOST y pone el servidor a escuchar |
| src/app.js | Configuración | Middlewares, /health, montaje de rutas, manejo de errores |
| src/routes/historias.routes.js | Presentación | Método HTTP + URI → función del controlador |
| src/controllers/historias.controller.js | Presentación | Lee la petición, llama al servicio, arma la respuesta |
| src/services/historias.service.js | Lógica de negocio | Reglas de fecha futura y duplicado; no conoce HTTP ni la base de datos |
| src/repositories/historias.repository.js | Acceso a datos | Guarda y consulta (en memoria en el Taller 1) |
| src/models/historia.js | Modelo | Atributos de la historia y su validación |
| src/utils/http-error.js | Utilidad | Error con código de estado HTTP |

## Endpoints (Taller 1)

| Método | URI | Respuesta |
|---|---|---|
| GET | /health | 200 `{"servicio":"ms-historias","estado":"ok"}` |
| GET | /historias | 200 arreglo de historias |
| GET | /historias/:id | 200 la historia · 404 si no existe · 400 si el id no es válido |
| POST | /historias | 201 la historia creada · 400 datos inválidos o fecha futura · 409 duplicado |

Ejemplo de cuerpo para `POST /historias`:

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

Si faltan datos o son inválidos, la respuesta es
`400 {"error": "Datos inválidos", "detalles": [...]}`.
