const { Router } = require('express');
const controller = require('../controllers/notificacaoController');
const validarId = require('../middlewares/validarId');
const validateRequest = require('../middlewares/validateRequest');
const { listarSchema } = require('../validators/notificacaoSchemas');

const router = Router();

router.param('id', validarId);
router.get('/', validateRequest(listarSchema), controller.listar);  
router.patch('/lidas', controller.marcarTodasLidas);
router.patch('/:id/lida', controller.marcarLida);
router.delete('/:id', controller.excluir);

module.exports = router;
