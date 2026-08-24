// backend/routes/visitantes.js
const express = require('express');
const router = express.Router();
const visitantesController = require('../controllers/visitantesController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/api/visitantes/buscar', authenticateToken, visitantesController.buscarVisitante);
router.get('/api/visitantes', authenticateToken, visitantesController.getVisitantes);
router.get('/api/visitantes/:id', authenticateToken, visitantesController.getVisitanteById);
router.post('/api/visitantes', authenticateToken, visitantesController.createVisitante);
router.put('/api/visitantes/:id', authenticateToken, visitantesController.updateVisitante);

module.exports = router;
