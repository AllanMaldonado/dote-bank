const express = require('express');
const recorrenciaController = require('../controllers/recorrenciaController');
const validarId = require('../middlewares/validarId');
const validateRequest = require('../middlewares/validateRequest');
const {
  atualizarRecorrenciaSchema,
  criarRecorrenciaSchema,
  definirAtivaSchema,
} = require('../validators/recorrenciaSchemas');

const router = express.Router();

router.param('id', validarId);
router.get('/', recorrenciaController.listar);
router.post('/', validateRequest(criarRecorrenciaSchema), recorrenciaController.criar);
router.get('/:id', recorrenciaController.obter);
router.put('/:id', validateRequest(atualizarRecorrenciaSchema), recorrenciaController.atualizar);
router.patch('/:id/ativa', validateRequest(definirAtivaSchema), recorrenciaController.definirAtiva);  
router.delete('/:id', recorrenciaController.excluir);

module.exports = router;
