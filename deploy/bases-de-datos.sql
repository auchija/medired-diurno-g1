-- Bases de datos y usuarios de MediRed en servidor1 (172.16.1.210).
-- Cada usuario solo puede conectarse desde servidor2 (172.16.1.211).
-- Las claves reales NO van en el repositorio: reemplace <clave> al ejecutar.

CREATE DATABASE usuarios_db;
CREATE USER 'usuarios_user'@'172.16.1.211' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON usuarios_db.* TO 'usuarios_user'@'172.16.1.211';

CREATE DATABASE pacientes_db;
CREATE USER 'pacientes_user'@'172.16.1.211' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON pacientes_db.* TO 'pacientes_user'@'172.16.1.211';

CREATE DATABASE medicos_db;
CREATE USER 'medicos_user'@'172.16.1.211' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON medicos_db.* TO 'medicos_user'@'172.16.1.211';

CREATE DATABASE citas_db;
CREATE USER 'citas_user'@'172.16.1.211' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON citas_db.* TO 'citas_user'@'172.16.1.211';

CREATE DATABASE historias_db;
CREATE USER 'historias_user'@'172.16.1.211' IDENTIFIED BY '<clave>';
GRANT ALL PRIVILEGES ON historias_db.* TO 'historias_user'@'172.16.1.211';