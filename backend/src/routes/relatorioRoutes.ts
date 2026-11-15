const express = require('express');
const relatorioController = require('../controllers/relatorioController');
const { iaLimiter } = require('../middlewares/rateLimiter');
const validateRequest = require('../middlewares/validateRequest');
const { analiseSchema, relatorioSchema } = require('../validators/relatorioSchemas');

const router = express.Router();

router.get('/', validateRequest(relatorioSchema), relatorioController.relatorio);  
router.post('/analise', iaLimiter, validateRequest(analiseSchema), relatorioController.analise);  

module.exports = router;
