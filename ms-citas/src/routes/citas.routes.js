// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/citas.controller');

const router = Router();

router.get('/', controller.listar);      // listar todas las citas
router.get('/:id', controller.obtener);  // obtener una cita por id
router.post('/', controller.crear);      // crear (agendar) una cita

// Taller 2: agregar PUT /:id (actualizar) y DELETE /:id (eliminar)

module.exports = router;