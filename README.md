# MediRed IPS · Aplicación web (Módulo 3)

Redes y Servicios Multimedia · UAO · Grupo 1, jornada diurna.

Aplicación web de MediRed IPS (clínica con sedes en Bogotá, Cali y Medellín) construida con
microservicios REST organizados en capas. Se despliega sobre el ambiente del Módulo 2:
servidor1 (DNS + MySQL) y servidor2 (Apache como API Gateway + microservicios).

## Integrantes

| Integrante | Usuario de GitHub | Microservicio a cargo | Roles semana 1 |
|---|---|---|---|
| Alejandro González | auchija | ms-citas | Integrador, Documentador |
| Sebastián Montaño Reyes | Sebastian-Montano | ms-pacientes, ms-medicos | Arquitecto |
| Miguel Ángel Jiménez | Chanclaxx | ms-historias | Coordinador, Relator |

## Microservicios

| Microservicio | Entidad | Responsable | Puerto | Referencia a |
|---|---|---|---|---|
| ms-usuarios | Usuario | Docente | 3001 | — |
| ms-pacientes | Paciente | Sebastián Montaño Reyes | 3002 | — |
| ms-medicos | Médico | Sebastián Montaño Reyes | 3003 | — |
| ms-citas | Cita | Alejandro González | 3004 | Pacientes, Médicos |
| ms-historias | Historia clínica | Miguel Ángel Jiménez | 3005 | Pacientes, Médicos |

## Estructura del repositorio

- `ms-usuarios/`: entregado por la docente, nadie lo modifica.
- `ms-<recurso>/`: un microservicio por integrante; cada uno trabaja solo en su carpeta.
- `frontend/`: interfaz web (desde la semana 2).
- `deploy/`: archivos de despliegue en servidor1 y servidor2 (Taller 3).

## Reglas del grupo

1. Hacer pull antes de empezar a trabajar.
2. Cada integrante modifica solo la carpeta de su microservicio.
3. Commits pequeños y frecuentes, con mensajes del tipo `ms-citas: agrega validación de fecha`.
4. El README principal y el `.gitignore` de la raíz los edita solo el integrador.
5. Nunca subir `node_modules` ni `.env`. Todos los datos son ficticios.
