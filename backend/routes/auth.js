// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/api/login', authController.login);
router.get('/api/verify-token', authenticateToken, authController.verificarToken);
router.post('/api/usuarios/cambiar-primer-password', authController.cambiarPrimerPassword);
router.put('/api/usuarios/cambiar-password', authenticateToken, authController.cambiarPassword);

module.exports = router;
