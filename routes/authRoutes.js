const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateRegister, validateLogin } = require('../middlewares/validateMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');

// POST /api/v1/auth/register
router.post('/register', authLimiter, validateRegister, authController.register);

// POST /api/v1/auth/login
router.post('/login', authLimiter, validateLogin, authController.login);

// GET /api/v1/auth/me
router.get('/me', authenticate, authController.getProfile);

module.exports = router;
