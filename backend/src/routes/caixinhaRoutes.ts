const express = require('express');
const caixinhaController = require('../controllers/caixinhaController');
const validarId = require('../middlewares/validarId');
const validateRequest = require('../middlewares/validateRequest');
const { atualizarCaixinhaSchema, criarCaixinhaSchema, valorCaixinhaSchema } = require('../validators/caixinhaSchemas');

const router = express.Router();

router.param('id', validarId);
router.get('/', caixinhaController.listar);
router.post('/', validateRequest(criarCaixinhaSchema), caixinhaController.criar);
router.get('/:id', caixinhaController.obter);
router.put('/:id', validateRequest(atualizarCaixinhaSchema), caixinhaController.atualizar);
router.delete('/:id', caixinhaController.excluir);
router.post('/:id/aplicar', validateRequest(valorCaixinhaSchema), caixinhaController.aplicar);
router.post('/:id/resgatar', validateRequest(valorCaixinhaSchema), caixinhaController.resgatar);

module.exports = router;
