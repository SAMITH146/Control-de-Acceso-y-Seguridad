// =============================================================================
// RUTAS: UPLOAD EXCEL
// =============================================================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Configuración de multer en memoria (no guarda el archivo en disco, directo a buffer)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // límite de 5MB
});

router.post('/api/upload/areas', authenticateToken, requireAdmin, upload.single('excelFile'), uploadController.uploadAreas);
router.post('/api/upload/empleados', authenticateToken, requireAdmin, upload.single('excelFile'), uploadController.uploadEmpleados);
router.post('/api/upload/usuarios', authenticateToken, requireAdmin, upload.single('excelFile'), uploadController.uploadUsuarios);

module.exports = router;
