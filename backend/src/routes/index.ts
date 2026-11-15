const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize, exigirAtivo } = require('../middlewares/authorizeMiddleware');
const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');
const caixinhaRoutes = require('./caixinhaRoutes');
const contaRoutes = require('./contaRoutes');
const contatoRoutes = require('./contatoRoutes');
const notificacaoRoutes = require('./notificacaoRoutes');
const pixRoutes = require('./pixRoutes');
const relatorioRoutes = require('./relatorioRoutes');
const transacaoRoutes = require('./transacaoRoutes');

const router = Router();
const cliente = [authMiddleware, exigirAtivo, authorize('cliente')];

router.get('/saude', (req, res) => res.json({ ok: true }));
router.use('/auth', authRoutes);
router.use('/conta', cliente, contaRoutes);
router.use('/pix', cliente, pixRoutes);
router.use('/caixinhas', cliente, caixinhaRoutes);
router.use('/contatos', cliente, contatoRoutes);
router.use('/notificacoes', cliente, notificacaoRoutes);
router.use('/relatorio', cliente, relatorioRoutes);
router.use('/transacoes', authMiddleware, exigirAtivo, transacaoRoutes);
router.use('/admin', authMiddleware, authorize('admin'), adminRoutes);

module.exports = router;
