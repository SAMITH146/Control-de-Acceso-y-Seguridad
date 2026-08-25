// backend/routes/usuarios.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/api/usuarios', authenticateToken, requireAdmin, usuariosController.getUsuarios);
router.get('/api/usuarios/:id', authenticateToken, requireAdmin, usuariosController.getUsuarioById);
router.post('/api/usuarios', authenticateToken, requireAdmin, usuariosController.createUsuario);
router.put('/api/usuarios/:id', authenticateToken, requireAdmin, usuariosController.updateUsuario);
router.put('/api/usuarios/:id/toggle-estado', authenticateToken, requireAdmin, usuariosController.toggleEstadoUsuario);

module.exports = router;
