const express = require('express');
const chavePixController = require('../controllers/chavePixController');
const validarId = require('../middlewares/validarId');
const validateRequest = require('../middlewares/validateRequest');
const { criarChaveSchema } = require('../validators/chavePixSchemas');

const router = express.Router();

router.param('id', validarId);
router.get('/', chavePixController.listar);
router.post('/', validateRequest(criarChaveSchema), chavePixController.criar);
router.get('/:id', chavePixController.obter);
router.put('/:id', chavePixController.atualizar);  
router.delete('/:id', chavePixController.excluir);

module.exports = router;
