const { Router } = require('express');
const controller = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const validateRequest = require('../middlewares/validateRequest');
const { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } = require('../validators/authSchemas');

const router = Router();

router.post('/register', authLimiter, validateRequest(registerSchema), controller.register);
router.post('/login', authLimiter, validateRequest(loginSchema), controller.login);
router.post('/logout', authMiddleware, controller.logout);
router.get('/me', authMiddleware, controller.me);
router.post('/forgot-password', authLimiter, validateRequest(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authLimiter, validateRequest(resetPasswordSchema), controller.resetPassword);

module.exports = router;
