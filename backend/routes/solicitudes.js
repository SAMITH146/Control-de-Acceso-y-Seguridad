// backend/routes/solicitudes.js
const express = require('express');
const router = express.Router();
const solicitudesController = require('../controllers/solicitudesController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Solicitudes de Desbloqueo (Escolta ➔ Admin)
router.post('/api/solicitudes-desbloqueo', authenticateToken, solicitudesController.crearSolicitud);
router.get('/api/solicitudes-desbloqueo/pendientes', authenticateToken, requireAdmin, solicitudesController.getSolicitudesPendientes);
router.put('/api/solicitudes-desbloqueo/:id/aprobar', authenticateToken, requireAdmin, solicitudesController.aprobarSolicitud);
router.put('/api/solicitudes-desbloqueo/:id/rechazar', authenticateToken, requireAdmin, solicitudesController.rechazarSolicitud);

// Solicitudes de Bloqueo / Veto (Escolta ➔ Admin)
router.post('/api/solicitudes-bloqueo', authenticateToken, solicitudesController.crearSolicitudBloqueo);
router.get('/api/solicitudes-bloqueo/pendientes', authenticateToken, requireAdmin, solicitudesController.getSolicitudesBloqueoPendientes);
router.put('/api/solicitudes-bloqueo/:id/aprobar', authenticateToken, requireAdmin, solicitudesController.aprobarSolicitudBloqueo);
router.put('/api/solicitudes-bloqueo/:id/rechazar', authenticateToken, requireAdmin, solicitudesController.rechazarSolicitudBloqueo);

module.exports = router;
