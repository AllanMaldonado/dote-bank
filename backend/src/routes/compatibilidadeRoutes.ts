const { Router } = require('express');
const controller = require('../controllers/transferenciaController');
const transferenciaRoutes = require('./transferenciaRoutes');
const validateRequest = require('../middlewares/validateRequest');
const { transferirSchema } = require('../validators/transferenciaSchemas');

const router = Router();
router.post('/transferencias', validateRequest(transferirSchema), controller.enviar);
router.use(transferenciaRoutes);

module.exports = router;
