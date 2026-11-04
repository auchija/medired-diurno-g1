   -- db/schema.sql · ms-citas
   SET NAMES utf8mb4;            -- para que las tildes y la ñ se guarden bien

   CREATE TABLE citas (
     id           INT AUTO_INCREMENT PRIMARY KEY,
     paciente_id  INT          NOT NULL,   -- referencia a ms-pacientes (sin FOREIGN KEY: vive en otra base de datos)
     medico_id    INT          NOT NULL,   -- referencia a ms-medicos (sin FOREIGN KEY)
     fecha_hora   DATETIME     NOT NULL,
     sede         VARCHAR(20)  NOT NULL,
     estado       VARCHAR(20)  NOT NULL DEFAULT 'programada'
   ) DEFAULT CHARSET = utf8mb4;

   INSERT INTO citas (paciente_id, medico_id, fecha_hora, sede, estado) VALUES
     (1, 1, '2026-12-01 09:00:00', 'Bogotá',   'programada'),
     (2, 2, '2026-10-20 10:30:00', 'Cali',     'atendida'),
     (3, 1, '2026-12-02 14:00:00', 'Medellín', 'cancelada');