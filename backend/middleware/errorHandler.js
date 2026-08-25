// =============================================================================
// MIDDLEWARE DE ERRORES GLOBAL — LA PERLA S.A.
// Centraliza el manejo de errores no capturados de Express.
// Uso: app.use(errorHandler) al final de app.js
// =============================================================================

/**
 * Middleware de errores de Express (4 argumentos: err, req, res, next)
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';

    // Log estructurado para debugging
    console.error(`[ERROR ${status}] ${req.method} ${req.path} — ${message}`);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
}

module.exports = errorHandler;
