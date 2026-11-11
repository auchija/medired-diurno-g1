// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador
// y aplica la seguridad: todas exigen token; solo algunos roles escriben.
// Permisos de citas (tabla del Taller 1):
//   consultar (GET) → cualquier rol autenticado
//   crear, modificar y eliminar → administrador y admisiones
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/citas.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

router.use(verificarToken);                      // todas las rutas exigen token (401 sin él)

router.get('/', controller.listar);              // cualquier rol autenticado
router.get('/:id', controller.obtener);
router.post('/', requiereRol('administrador', 'admisiones'), controller.crear);
router.put('/:id', requiereRol('administrador', 'admisiones'), controller.actualizar);
router.delete('/:id', requiereRol('administrador', 'admisiones'), controller.eliminar);

module.exports = router;