// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/citas.controller');

const router = Router();

router.get('/', controller.listar);           // listar (con filtros opcionales)
router.get('/:id', controller.obtener);       // obtener una cita por id
router.post('/', controller.crear);           // crear (agendar) una cita
router.put('/:id', controller.actualizar);    // actualizar una cita completa
router.delete('/:id', controller.eliminar);   // eliminar una cita

module.exports = router;