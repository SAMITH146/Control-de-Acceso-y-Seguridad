// backend/controllers/bitacoraController.js
const bitacoraService = require('../services/bitacoraService');

exports.getBitacora = async (req, res, next) => {
    try {
        const rows = await bitacoraService.getBitacora(req.query);
        res.json(rows);
    } catch (err) { next(err); }
};
