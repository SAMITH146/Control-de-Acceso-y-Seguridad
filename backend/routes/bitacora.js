// backend/routes/bitacora.js
const express = require('express');
const router = express.Router();
const bitacoraController = require('../controllers/bitacoraController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/api/bitacora', authenticateToken, bitacoraController.getBitacora);

module.exports = router;
