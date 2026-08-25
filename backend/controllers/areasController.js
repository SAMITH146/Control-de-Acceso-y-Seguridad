// backend/controllers/areasController.js
const areasService = require('../services/areasService');

exports.getAreasActivas = async (req, res, next) => {
    try {
        const areas = await areasService.getActivas();
        res.json(areas);
    } catch (err) { next(err); }
};

exports.getAreasTodas = async (req, res, next) => {
    try {
        const areas = await areasService.getTodas();
        res.json(areas);
    } catch (err) { next(err); }
};

exports.getAreaById = async (req, res, next) => {
    try {
        const area = await areasService.getById(req.params.id);
        if (!area) return res.status(404).json({ error: 'Area no encontrada' });
        res.json(area);
    } catch (err) { next(err); }
};

exports.createArea = async (req, res, next) => {
    try {
        await areasService.crear(req.body);
        res.json({ mensaje: 'Area creada exitosamente' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ya existe un area con ese nombre' });
        next(err);
    }
};

exports.updateArea = async (req, res, next) => {
    try {
        await areasService.actualizar(req.params.id, req.body);
        res.json({ mensaje: 'Area actualizada exitosamente' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ya existe un area con ese nombre' });
        next(err);
    }
};
