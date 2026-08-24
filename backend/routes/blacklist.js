// backend/routes/blacklist.js
const express = require('express');
const router = express.Router();
const blacklistController = require('../controllers/blacklistController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/api/lista-negra', authenticateToken, blacklistController.getListaNegra);
router.post('/api/lista-negra/bloquear', authenticateToken, blacklistController.bloquearVisitante);
router.put('/api/lista-negra/desbloquear/:id', authenticateToken, blacklistController.desbloquearVisitante);
router.delete('/api/lista-negra/:id', authenticateToken, requireAdmin, blacklistController.eliminarSancion);

module.exports = router;
