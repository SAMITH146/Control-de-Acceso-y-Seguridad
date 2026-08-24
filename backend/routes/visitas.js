// backend/routes/visitas.js
const express = require('express');
const router = express.Router();
const visitasController = require('../controllers/visitasController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/api/visitas/registrar', authenticateToken, visitasController.registrarIngreso);
router.get('/api/visitas/activas', authenticateToken, visitasController.getVisitasActivas);
router.put('/api/visitas/salida/:id', authenticateToken, visitasController.registrarSalida);

module.exports = router;
