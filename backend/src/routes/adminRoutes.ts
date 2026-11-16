const { Router } = require('express');
const controller = require('../controllers/adminController');
const relatorioController = require('../controllers/relatorioController');
const { iaLimiter } = require('../middlewares/rateLimiter');
const validarId = require('../middlewares/validarId');
const validateRequest = require('../middlewares/validateRequest');
const { atualizarClienteSchema, atualizarTaxasSchema, listarClientesSchema } = require('../validators/adminSchemas');
const { analiseSchema, relatorioSchema } = require('../validators/relatorioSchemas');
const { avancarRelogioSchema } = require('../validators/tempoSchemas');

const router = Router();

router.param('id', validarId);
router.get('/painel', controller.painel);
router.get('/clientes', validateRequest(listarClientesSchema), controller.listarClientes);  
router.get('/clientes/:id', controller.obterCliente);
router.put('/clientes/:id', validateRequest(atualizarClienteSchema), controller.atualizarCliente);
router.delete('/clientes/:id', controller.excluirCliente);
router.patch('/clientes/:id/aprovar', controller.aprovar);
router.patch('/clientes/:id/rejeitar', controller.rejeitar);
router.patch('/clientes/:id/bloquear', controller.bloquear);
router.patch('/clientes/:id/desbloquear', controller.desbloquear);
router.get('/clientes/:id/relatorio', validateRequest(relatorioSchema), relatorioController.relatorio);
router.post('/clientes/:id/relatorio/analise', iaLimiter, validateRequest(analiseSchema), relatorioController.analise);
router.get('/config', controller.obterConfig);
router.put('/config/taxas', validateRequest(atualizarTaxasSchema), controller.atualizarTaxas);
router.post('/relogio/sincronizar', controller.sincronizarRelogio);
router.post('/relogio/avancar', validateRequest(avancarRelogioSchema), controller.avancarRelogio);  

module.exports = router;
