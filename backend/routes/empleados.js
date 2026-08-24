// backend/routes/empleados.js
const express = require('express');
const router = express.Router();
const empleadosController = require('../controllers/empleadosController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/api/empleados', authenticateToken, empleadosController.getEmpleadosActivos);
router.get('/api/empleados/all', authenticateToken, empleadosController.getEmpleadosTodos);
router.get('/api/empleados/:id', authenticateToken, empleadosController.getEmpleadoById);
router.post('/api/empleados', authenticateToken, requireAdmin, empleadosController.createEmpleado);
router.put('/api/empleados/:id', authenticateToken, requireAdmin, empleadosController.updateEmpleado);

module.exports = router;
