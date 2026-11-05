-- db/schema.sql

-- Permite almacenar correctamente tildes, ñ y caracteres especiales.
SET NAMES utf8mb4;


CREATE TABLE medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    registro_medico VARCHAR(30) NOT NULL UNIQUE,
    especialidad VARCHAR(100) NOT NULL,
    sede VARCHAR(30) NOT NULL
);

INSERT INTO medicos
    (nombre, registro_medico, especialidad, sede)
VALUES
    ('Carlos Ruiz', 'RM-FICTICIO-001', 'Medicina general', 'Cali'),
    ('Mariana Torres', 'RM-FICTICIO-002', 'Pediatría', 'Bogotá'),
    ('Andrés Mendoza', 'RM-FICTICIO-003', 'Cardiología', 'Medellín');
