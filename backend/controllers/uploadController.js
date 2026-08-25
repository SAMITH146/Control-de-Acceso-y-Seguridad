// =============================================================================
// CONTROLADOR: CARGUE MASIVO EXCEL
// =============================================================================
const uploadService = require('../services/uploadService');

exports.uploadAreas = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
        const result = await uploadService.cargarAreas(req.file.buffer);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.uploadEmpleados = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
        const result = await uploadService.cargarEmpleados(req.file.buffer);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.uploadUsuarios = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
        const result = await uploadService.cargarUsuarios(req.file.buffer);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
