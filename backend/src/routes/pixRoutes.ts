const express = require('express');
const pixController = require('../controllers/pixController');
const validateRequest = require('../middlewares/validateRequest');
const { destinatarioSchema, transferirSchema } = require('../validators/pixSchemas');
const chavePixRoutes = require('./chavePixRoutes');
const recorrenciaRoutes = require('./recorrenciaRoutes');

const router = express.Router();

router.get('/destinatario', validateRequest(destinatarioSchema), pixController.destinatario);
router.post('/transferencias', validateRequest(transferirSchema), pixController.enviar);
router.use('/chaves', chavePixRoutes);
router.use('/agendamentos', recorrenciaRoutes);

module.exports = router;
