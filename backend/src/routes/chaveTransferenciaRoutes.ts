const express = require('express');
const chaveTransferenciaController = require('../controllers/chaveTransferenciaController');
const validarId = require('../middlewares/validarId');
const validateRequest = require('../middlewares/validateRequest');
const { criarChaveSchema } = require('../validators/chaveTransferenciaSchemas');

const router = express.Router();

router.param('id', validarId);
router.get('/', chaveTransferenciaController.listar);
router.post('/', validateRequest(criarChaveSchema), chaveTransferenciaController.criar);
router.get('/:id', chaveTransferenciaController.obter);
router.put('/:id', chaveTransferenciaController.atualizar);
router.delete('/:id', chaveTransferenciaController.excluir);

module.exports = router;
