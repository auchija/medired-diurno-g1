// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador.
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/historias.controller');

const router = Router();

router.get('/', controller.listar);            
router.get('/:id', controller.obtener);       
router.post('/', controller.crear);           
router.put('/:id', controller.actualizar);    
router.delete('/:id', controller.eliminar);   

 



module.exports = router;
