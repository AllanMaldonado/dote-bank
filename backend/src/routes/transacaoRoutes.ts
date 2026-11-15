const { Router } = require('express');
const controller = require('../controllers/transacaoController');
const validarId = require('../middlewares/validarId');
const validateRequest = require('../middlewares/validateRequest');
const { extratoSchema } = require('../validators/transacaoSchemas');

const router = Router();

router.param('id', validarId);
router.get('/', validateRequest(extratoSchema), controller.extrato);  
router.get('/:id', controller.comprovante);

module.exports = router;
