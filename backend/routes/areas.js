// backend/routes/areas.js
const express = require('express');
const router = express.Router();
const areasController = require('../controllers/areasController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/api/areas', authenticateToken, areasController.getAreasActivas);
router.get('/api/areas/all', authenticateToken, areasController.getAreasTodas);
router.get('/api/areas/:id', authenticateToken, areasController.getAreaById);
router.post('/api/areas', authenticateToken, requireAdmin, areasController.createArea);
router.put('/api/areas/:id', authenticateToken, requireAdmin, areasController.updateArea);

module.exports = router;
