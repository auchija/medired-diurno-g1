-- db/schema.sql

-- Permite almacenar correctamente tildes, ñ y caracteres especiales.
SET NAMES utf8mb4;

CREATE TABLE pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(18) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    eps VARCHAR(100) NOT NULL,
    telefono VARCHAR(15) NOT NULL
);

-- Datos iniciales de prueba.
INSERT INTO pacientes (
    nombre,
    documento,
    fecha_nacimiento,
    eps,
    telefono
) VALUES
(
    'Lucía Gómez',
    'DOC-FICTICIO-001',
    '1990-04-18',
    'Salud Ejemplo',
    '3000000001'
),
(
    'Mateo Rodríguez',
    'DOC-FICTICIO-002',
    '1985-09-23',
    'EPS Demostración',
    '3000000002'
),
(
    'Valentina Pérez',
    'DOC-FICTICIO-003',
    '2001-02-14',
    'Salud Ejemplo',
    '3000000003'
);
