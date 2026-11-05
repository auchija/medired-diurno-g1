-- db/schema.sql
SET NAMES utf8mb4;            

CREATE TABLE historias (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id      INT          NOT NULL,   
  medico_id        INT          NOT NULL,   
  fecha            DATE         NOT NULL,
  motivo_consulta  VARCHAR(255) NOT NULL,
  diagnostico      TEXT         NOT NULL,
  tratamiento      TEXT         NOT NULL,
  UNIQUE (paciente_id, medico_id, fecha)    
);

INSERT INTO historias (paciente_id, medico_id, fecha, motivo_consulta, diagnostico, tratamiento) VALUES
  (1, 1, '2025-02-10', 'Dolor de cabeza persistente', 'Migraña', 'Acetaminofén 500 mg cada 8 horas por 3 días'),
  (2, 3, '2025-04-22', 'Tos y fiebre', 'Infección respiratoria aguda', 'Reposo, hidratación y control en 5 días'),
  (3, 2, '2025-07-15', 'Control de presión arterial', 'Hipertensión arterial controlada', 'Continuar losartán 50 mg diarios');
