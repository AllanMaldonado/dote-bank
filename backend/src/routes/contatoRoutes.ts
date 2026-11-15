const express = require('express');
const contatoController = require('../controllers/contatoController');
const validarId = require('../middlewares/validarId');
const validateRequest = require('../middlewares/validateRequest');
const { atualizarContatoSchema, criarContatoSchema } = require('../validators/contatoSchemas');

const router = express.Router();

router.param('id', validarId);
router.get('/', contatoController.listar);
router.post('/', validateRequest(criarContatoSchema), contatoController.criar);
router.get('/:id', contatoController.obter);
router.put('/:id', validateRequest(atualizarContatoSchema), contatoController.atualizar);
router.delete('/:id', contatoController.excluir);

module.exports = router;
