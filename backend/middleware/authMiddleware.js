// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'la_perla_seguridad_jwt_secret_key_2026_safe';

/**
 * Middleware para autenticar peticiones mediante Token JWT
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.headers['x-auth-token'];

    if (!token) {
        return res.status(401).json({ error: 'Acceso no autorizado. Debe incluir un token de sesión válido (Bearer token).' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Sesión expirada o token inválido. Por favor inicia sesión nuevamente.' });
    }
};

/**
 * Middleware para restringir rutas exclusivamente a Administradores (id_rol = 1)
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.id_rol !== 1) {
        return res.status(403).json({ error: 'Acceso denegado. Esta acción requiere permisos de Administrador.' });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin
};
