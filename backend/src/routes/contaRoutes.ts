const { Router } = require('express');
const controller = require('../controllers/contaController');
const validateRequest = require('../middlewares/validateRequest');
const { atualizarPerfilSchema, trocarSenhaSchema } = require('../validators/contaSchemas');

const router = Router();

router.get('/', controller.resumo);
router.patch('/perfil', validateRequest(atualizarPerfilSchema), controller.atualizarPerfil);
router.put('/senha', validateRequest(trocarSenhaSchema), controller.trocarSenha);

module.exports = router;
