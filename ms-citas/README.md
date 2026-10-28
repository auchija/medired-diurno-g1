# ms-citas · MediRed IPS (Módulo 3)

Redes y Servicios Multimedia · UAO · Microservicio de **citas médicas** de la aplicación
de MediRed IPS, con **Node.js + Express** organizado en capas. Construido a partir de la
plantilla ms-usuarios entregada por la docente.

Responsable: Alejandro González (auchija) · Puerto: **3004**

Esta es la versión del Taller 1: datos en memoria y tres operaciones. En el Taller 2 se
completa el CRUD con persistencia en MySQL, y en el Taller 3 se integra con ms-pacientes
y ms-medicos.

## Cómo ejecutarlo

Requisitos: Node.js LTS 22 o superior (`node -v`).

```
npm install                 # descarga Express en node_modules
copy .env.example .env      # en Windows (en Linux/Mac: cp .env.example .env)
npm run dev                 # inicia y se reinicia solo al guardar cambios
```

Prueben en el navegador: http://localhost:3004/health y http://localhost:3004/citas

## Entidad Cita

| Atributo | Tipo | Obligatorio | Valores / formato | Referencia a |
|---|---|---|---|---|
| id | entero | Lo asigna el sistema | 1, 2, 3... | — |
| paciente_id | entero | Sí | Entero positivo | ms-pacientes |
| medico_id | entero | Sí | Entero positivo | ms-medicos |
| fecha_hora | texto | Sí | `AAAA-MM-DDTHH:MM` (ej. `2026-11-03T09:00`) | — |
| sede | texto | Sí | `Bogotá`, `Cali` o `Medellín` | — |
| estado | texto | No | `programada` (por defecto), `atendida` o `cancelada` | — |

**Regla de negocio:** un médico no puede tener dos citas activas (no canceladas) a la misma
fecha y hora → `409 Conflict`.

La cita guarda solo `paciente_id` y `medico_id`, nunca una copia de los datos del paciente
o del médico. En el Taller 3 esos datos se consultan por REST a ms-pacientes y ms-medicos.

## Capas

| Archivo | Capa | Responsabilidad |
|---|---|---|
| src/index.js | Arranque | Lee PORT y HOST y pone el servidor a escuchar |
| src/app.js | Configuración | Middlewares, /health, montaje de rutas, manejo de errores |
| src/routes/citas.routes.js | Presentación | Método HTTP + URI → función del controlador |
| src/controllers/citas.controller.js | Presentación | Lee la petición, llama al servicio, arma la respuesta |
| src/services/citas.service.js | Lógica de negocio | Validaciones y regla de choque de horario; no conoce HTTP ni la base de datos |
| src/repositories/citas.repository.js | Acceso a datos | Guarda y consulta (en memoria en el Taller 1) |
| src/models/cita.js | Modelo | Atributos de la cita y su validación |
| src/utils/http-error.js | Utilidad | Error con código de estado HTTP |

## Endpoints (Taller 1)

| Método | URI | Respuesta |
|---|---|---|
| GET | /health | 200 `{"servicio":"ms-citas","estado":"ok"}` |
| GET | /citas | 200 arreglo de citas |
| GET | /citas/:id | 200 cita · 400 id inválido · 404 no existe |
| POST | /citas | 201 cita creada · 400 datos inválidos · 409 choque de horario |

Ejemplo de cuerpo para POST:
`{"paciente_id": 2, "medico_id": 3, "fecha_hora": "2026-11-05T08:00", "sede": "Cali"}`

Todos los datos son ficticios.

