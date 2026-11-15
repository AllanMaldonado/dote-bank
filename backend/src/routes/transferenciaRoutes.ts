const express = require('express');
const transferenciaController = require('../controllers/transferenciaController');
const validateRequest = require('../middlewares/validateRequest');
const { destinatarioSchema, transferirSchema } = require('../validators/transferenciaSchemas');
const chaveTransferenciaRoutes = require('./chaveTransferenciaRoutes');
const recorrenciaRoutes = require('./recorrenciaRoutes');

const router = express.Router();

router.get('/destinatario', validateRequest(destinatarioSchema), transferenciaController.destinatario);
router.post('/', validateRequest(transferirSchema), transferenciaController.enviar);
router.use('/chaves', chaveTransferenciaRoutes);
router.use('/agendamentos', recorrenciaRoutes);

module.exports = router;
